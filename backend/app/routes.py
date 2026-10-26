from flask import Blueprint, jsonify, session
from app.models import Student, Team, JoinRequest
import re
import random
from datetime import datetime, timedelta, timezone
from flask import request
from app.models import Challenge, hash_code
from app import db

EMAIL_PATTERN = re.compile(r"^[a-z0-9._%+-]{1,64}@ufl\.edu$")

main = Blueprint("main", __name__)
VALID_YEARS = {"Freshman", "Sophomore", "Junior", "Senior", "Graduate"}
VALID_MAJORS = {
    "Computer Science",
    "Computer Engineering",
    "Computer Science Minor",
    "Computer Engineering Minor"
}
VALID_WEEKLY_HOURS = {"1-5", "6-10", "11-15", "15+"}
VALID_RESPONSE_TIMES = {"within_1h", "few_hours", "same_day", "next_day"}
VALID_CHANNELS = {"email", "discord", "slack", "text"}
VALID_GOALS = {"pass", "strong_grade", "portfolio"}
VALID_PACES = {"early", "steady", "deadline"}

def current_student():
    student_id = session.get("student_id")
    if not student_id:
        return None
    return Student.query.get(student_id)

@main.route("/api/me", methods=["GET"])
def get_me():
    student = current_student()
    if not student:
        return jsonify({"error": "not_signed_in"}), 401
    return jsonify(student.to_dict(include_email=True))

@main.route("/api/students", methods=["GET"])
def get_students():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    # students looking for a team, plus anyone sharing a project with me
    my_teams = Team.query.filter(Team.member_ids.contains(me.id)).all()
    teammate_ids = {sid for t in my_teams for sid in t.member_ids}

    students = Student.query.filter(
        (Student.looking_for_team == True) | (Student.id.in_(teammate_ids))
    ).all()
    # never include email here
    return jsonify([s.to_dict(include_email=False) for s in students if s.id != me.id])

@main.route("/api/projects", methods=["GET"])
def get_projects():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401
    my_teams = Team.query.filter(Team.member_ids.contains(me.id)).all()
    return jsonify([t.to_dict() for t in my_teams])

@main.route("/api/team-posts", methods=["GET"])
def get_team_posts():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    open_teams = Team.query.all()
    posts = []
    for t in open_teams:
        if me.id in t.member_ids:
            continue  # never show a team you're already in
        if len(t.member_ids) >= t.size:
            continue  # no open spots

        members = Student.query.filter(Student.id.in_(t.member_ids)).all()
        covered_roles = {r for m in members for r in m.roles}
        roles_needed = [r for r in t.required_roles if r not in covered_roles]

        # shared availability: blocks every current member is free
        if members:
            shared = set(members[0].availability)
            for m in members[1:]:
                shared &= set(m.availability)
        else:
            shared = set()

        posts.append({
            "id": t.id,
            "project": t.project,
            "course": t.course,
            "members": [{"id": m.id, "name": m.name, "roles": m.roles} for m in members],
            "rolesNeeded": roles_needed,
            "goal": t.goal,
            "pace": t.pace,
            "availability": list(shared),
            "size": t.size,
            "postedAt": t.created_at,
        })
    return jsonify(posts)

@main.route("/api/requests/mine", methods=["GET"])
def get_my_requests():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401
    requests_ = JoinRequest.query.filter_by(student_id=me.id).all()
    return jsonify([r.to_dict() for r in requests_])

@main.route("/api/auth/email-code", methods=["POST"])
def request_email_code():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()

    if not email:
        return jsonify({"error": "invalid_email", "message": "Email is required."}), 422
    if not EMAIL_PATTERN.match(email):
        return jsonify({"error": "not_ufl_email", "message": "Use your @ufl.edu email."}), 422

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # rate limit: at most 1 code per 30s, 5 per hour, for this email
    recent = Challenge.query.filter(
        Challenge.email == email,
        Challenge.expires_at > now - timedelta(minutes=10)  # roughly "recent" challenges
    ).order_by(Challenge.expires_at.desc()).all()

    last = recent[0] if recent else None
    if last and last.resend_after > now:
        seconds_left = int((last.resend_after - now).total_seconds())
        return jsonify({"error": "rate_limited", "message": "Please wait before requesting another code.", "retryAfter": seconds_left}), 429

    hour_ago = now - timedelta(hours=1)
    recent_hour_count = Challenge.query.filter(Challenge.email == email, Challenge.expires_at > hour_ago).count()
    if recent_hour_count >= 5:
        return jsonify({"error": "rate_limited", "message": "Too many requests. Try again later.", "retryAfter": 3600}), 429

    # generate and store the code
    code = f"{random.randint(0, 999999):06d}"
    challenge = Challenge(
        email=email,
        code_hash=hash_code(code),
        attempts_left=5,
        expires_at=now + timedelta(minutes=10),
        resend_after=now + timedelta(seconds=30),
    )
    db.session.add(challenge)
    db.session.commit()

    response = {
        "challengeId": challenge.id,
        "email": email,
        "expiresAt": challenge.expires_at.isoformat() + "Z",
        "resendAfter": challenge.resend_after.isoformat() + "Z",
    }

    # DEMO ONLY: show the code since we have no real email sending yet.
    # This must never run once real email is wired up.
    response["demoCode"] = code

    return jsonify(response), 200

@main.route("/api/auth/verify", methods=["POST"])
def verify_email_code():
    data = request.get_json() or {}
    challenge_id = data.get("challengeId")
    code = (data.get("code") or "").strip()

    challenge = Challenge.query.get(challenge_id)
    if not challenge:
        return jsonify({"error": "challenge_not_found"}), 404

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    if challenge.used or now > challenge.expires_at:
        return jsonify({"error": "code_expired"}), 410

    if challenge.attempts_left <= 0:
        return jsonify({"error": "too_many_attempts"}), 429

    if hash_code(code) != challenge.code_hash:
        challenge.attempts_left -= 1
        db.session.commit()
        return jsonify({"error": "invalid_code", "attemptsLeft": challenge.attempts_left}), 400

    # code is correct: mark challenge used so it can't be replayed
    challenge.used = True

    student = Student.query.filter_by(email=challenge.email).first()
    is_new_account = student is None
    if is_new_account:
        student = Student(email=challenge.email, email_verified=True)
        db.session.add(student)
    else:
        student.email_verified = True

    db.session.commit()

    session["student_id"] = student.id

    return jsonify({
        "me": student.to_dict(include_email=True),
        "isNewAccount": is_new_account,
    }), 200

@main.route("/api/auth/signout", methods=["POST"])
def signout():
    session.pop("student_id", None)
    return "", 204

@main.route("/api/me", methods=["PUT"])
def update_me():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    data = request.get_json() or {}
    errors = {}

    if "name" in data:
        name = (data["name"] or "").strip()
        if not name:
            errors["name"] = "Name cannot be empty."
        else:
            me.name = name

        if "major" in data:
            major = data["major"]
            if major not in VALID_MAJORS:
                errors["major"] = f"Major must be one of: {', '.join(sorted(VALID_MAJORS))}."
            else:
                me.major = major

    if "year" in data:
        year = data["year"]
        if year not in VALID_YEARS:
            errors["year"] = f"Year must be one of: {', '.join(sorted(VALID_YEARS))}."
        else:
            me.year = year

    if "weeklyHours" in data:
        val = data["weeklyHours"]
        if val not in VALID_WEEKLY_HOURS:
            errors["weeklyHours"] = f"Must be one of: {', '.join(sorted(VALID_WEEKLY_HOURS))}."
        else:
            me.weekly_hours = val

    if "responseTime" in data:
        val = data["responseTime"]
        if val not in VALID_RESPONSE_TIMES:
            errors["responseTime"] = f"Must be one of: {', '.join(sorted(VALID_RESPONSE_TIMES))}."
        else:
            me.response_time = val

    if "channel" in data:
        val = data["channel"]
        if val not in VALID_CHANNELS:
            errors["channel"] = f"Must be one of: {', '.join(sorted(VALID_CHANNELS))}."
        else:
            me.channel = val

    if "goal" in data:
        val = data["goal"]
        if val not in VALID_GOALS:
            errors["goal"] = f"Must be one of: {', '.join(sorted(VALID_GOALS))}."
        else:
            me.goal = val

    if "pace" in data:
        val = data["pace"]
        if val not in VALID_PACES:
            errors["pace"] = f"Must be one of: {', '.join(sorted(VALID_PACES))}."
        else:
            me.pace = val

    if errors:
        return jsonify({"error": "validation_failed", "fields": errors}), 422

    db.session.commit()
    return jsonify(me.to_dict(include_email=True)), 200