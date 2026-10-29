from flask import Blueprint, jsonify, session , request
from app.models import Student, Team, JoinRequest, Challenge, hash_code, Membership, Invite, Review
import re
import random
from datetime import datetime, timedelta, timezone
from app import db
from app.courses import VALID_COURSES

EMAIL_PATTERN = re.compile(r"^[a-z0-9._%+-]{1,64}@ufl\.edu$")

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
VALID_ROLES = {"lead", "frontend", "backend", "design", "docs", "testing"}
VALID_WORK_MODES = {"online", "in_person"}

SLOT_KEY_PATTERN = re.compile(r"^(mon|tue|wed|thu|fri|sat|sun)-(morning|afternoon|early_evening|late_evening|night)$")
USERNAME_PATTERN = re.compile(r"^[a-z0-9_]{3,20}$")

DAY_ORDER = {"mon": 0, "tue": 1, "wed": 2, "thu": 3, "fri": 4, "sat": 5, "sun": 6}
BLOCK_ORDER = {"morning": 0, "afternoon": 1, "early_evening": 2, "late_evening": 3, "night": 4}
BLOCK_HOURS = {
    "morning": 4,
    "afternoon": 5,
    "early_evening": 3,
    "late_evening": 3,
    "night": 2,
}

MIN_TEAM_SIZE = 2
MAX_TEAM_SIZE = 8
MAX_PROJECTS = 10

main = Blueprint("main", __name__)

def hours_per_week(slots):
    return sum(BLOCK_HOURS[slot.split("-", 1)[1]] for slot in slots)

def clean_text(s: str) -> str:
    # trims and collapses inner runs of spaces, per the spec
    return re.sub(r"\s+", " ", (s or "").strip())

def slot_sort_key(slot: str):
    day, block = slot.split("-", 1)
    return (DAY_ORDER[day], BLOCK_ORDER[block])

def current_student():
    student_id = session.get("student_id")
    if not student_id:
        return None
    return Student.query.get(student_id)

# a team as non-members see it (team posts, invites): no emails, only the time everyone shares
def team_summary(t):
    members = Student.query.filter(Student.id.in_(t.member_ids)).all()
    # keep join order (owner first)
    order = {sid: i for i, sid in enumerate(t.member_ids)}
    members.sort(key=lambda m: order.get(m.id, 0))
    covered_roles = {r for m in members for r in m.roles}
    roles_needed = [r for r in t.required_roles if r not in covered_roles]

    if members:
        shared = set(members[0].availability)
        for m in members[1:]:
            shared &= set(m.availability)
    else:
        shared = set()

    return {
        "id": t.id,
        "project": t.project,
        "course": t.course,
        "members": [{"id": m.id, "name": m.name, "roles": m.roles} for m in members],
        "rolesNeeded": roles_needed,
        "goal": t.goal,
        "pace": t.pace,
        "availability": sorted(shared, key=slot_sort_key),
        "size": t.size,
        "postedAt": t.created_at,
    }

# call after adding a member, before commit: a full team's pending invites get canceled
def cancel_invites_if_full(team_id):
    team = Team.query.get(team_id)
    if Membership.query.filter_by(team_id=team_id).count() < team.size:
        return
    for i in Invite.query.filter_by(project_id=team_id, status="pending").all():
        i.status = "canceled"

@main.route("/api/me", methods=["GET"])
def get_me():
    student = current_student()
    if not student:
        return jsonify({"error": "not_signed_in"}), 401

    my_team_ids = {m.team_id for m in Membership.query.filter_by(student_id=student.id).all()}
    teammate_ids = set()
    if my_team_ids:
        memberships = Membership.query.filter(Membership.team_id.in_(my_team_ids)).all()
        teammate_ids = {m.student_id for m in memberships if m.student_id != student.id}

    already_reviewed = {r.reviewee_id for r in Review.query.filter_by(reviewer_id=student.id).all()}
    reviewable_ids = list(teammate_ids - already_reviewed)

    data = student.to_dict(include_email=True)
    data["reviewableIds"] = reviewable_ids
    return jsonify(data)

@main.route("/api/students", methods=["GET"])
def get_students():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    my_teams = Team.query.join(Membership).filter(Membership.student_id == me.id).all()
    teammate_ids = {sid for t in my_teams for sid in t.member_ids}

    search = (request.args.get("q") or "").strip()
    if search:
        escaped = search.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
        query = Student.query.filter(
            Student.name.ilike(f"%{escaped}%", escape="\\") | Student.username.ilike(f"%{escaped}%", escape="\\")
        )
    else:
        query = Student.query.filter(
            (Student.looking_for_team == True) | (Student.id.in_(teammate_ids))
        )

    students = query.all()
    return jsonify([s.to_dict(include_email=False) for s in students if s.id != me.id])

@main.route("/api/projects", methods=["GET"])
def get_projects():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401
    my_teams = Team.query.join(Membership).filter(Membership.student_id == me.id).order_by(Membership.joined_at).all()
    return jsonify([t.to_dict() for t in my_teams])

@main.route("/api/team-posts", methods=["GET"])
def get_team_posts():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    my_team_ids = {t.id for t in Team.query.join(Membership).filter(Membership.student_id == me.id).all()}
    all_teams = Team.query.filter(~Team.id.in_(my_team_ids)).all() if my_team_ids else Team.query.all()

    search = (request.args.get("q") or "").strip().lower()
    if search:
        normalized_search = search.replace(" ", "")
        all_teams = [
            t for t in all_teams
            if search in t.project.lower() or normalized_search == t.course.lower()
        ]

    posts = []
    for t in all_teams:
        if len(t.member_ids) >= t.size:
            continue
        posts.append(team_summary(t))
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
    name = (data.get("name") or "").strip()
    code = f"{random.randint(0, 999999):06d}"
    challenge = Challenge(
        email=email,
        name=name or None,
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
        student = Student(email=challenge.email, name=challenge.name or "", email_verified=True)
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

    if "roles" in data:
        roles = data["roles"]
        if not isinstance(roles, list) or not all(r in VALID_ROLES for r in roles):
            errors["roles"] = f"Each role must be one of: {', '.join(sorted(VALID_ROLES))}."
        else:
            me.roles = roles

    if "skills" in data:
        skills = data["skills"]
        if not isinstance(skills, list):
            errors["skills"] = "Skills must be a list."
        elif len(skills) > 12:
            errors["skills"] = "At most 12 skills allowed."
        elif not all(isinstance(s, str) and 1 <= len(s.strip()) <= 30 for s in skills):
            errors["skills"] = "Each skill must be 1-30 characters."
        else:
            me.skills = [s.strip() for s in skills]

    if "workMode" in data:
        work_mode = data["workMode"]
        if not isinstance(work_mode, list) or not all(w in VALID_WORK_MODES for w in work_mode):
            errors["workMode"] = f"Each value must be one of: {', '.join(sorted(VALID_WORK_MODES))}."
        else:
            me.work_mode = work_mode

    if "pastWork" in data:
        past_work = data["pastWork"]
        if not isinstance(past_work, list) or len(past_work) > 5:
            errors["pastWork"] = "At most 5 past work items allowed."
        else:
            valid = True
            for item in past_work:
                if not isinstance(item, dict):
                    valid = False
                    break
                title = item.get("title", "")
                role = item.get("role", "")
                url = item.get("url")
                if not (1 <= len(str(title).strip()) <= 80):
                    valid = False
                    break
                if not (0 <= len(str(role).strip()) <= 80):
                    valid = False
                    break
                if url is not None and len(str(url)) > 300:
                    valid = False
                    break
            if not valid:
                errors["pastWork"] = "Each item needs a title (1-80 chars), an optional role (max 80 chars), and an optional url (max 300 chars)."
            else:
                me.past_work = past_work

    if "availability" in data:
        availability = data["availability"]
        if not isinstance(availability, list) or not all(isinstance(a, str) for a in availability):
            errors["availability"] = "Availability must be a list of time block keys."
        else:
            invalid = [a for a in availability if not SLOT_KEY_PATTERN.match(a)]
            if invalid:
                return jsonify({
                    "error": "invalid_time_block",
                    "message": f"Unknown time block: {invalid[0]}",
                    "invalid": invalid,
                }), 400
            me.availability = sorted(set(availability), key=slot_sort_key)

    if "lookingForTeam" in data:
        val = data["lookingForTeam"]
        if not isinstance(val, bool):
            errors["lookingForTeam"] = "Must be true or false."
        else:
            me.looking_for_team = val

    if "username" in data:
        raw = data["username"]
        if raw is None or raw == "":
            me.username = None
        else:
            username = raw.strip().lower()
            if not USERNAME_PATTERN.match(username):
                errors["username"] = "3-20 characters, letters, numbers, and underscores only."
            elif username == me.email.split("@")[0].lower():
                errors["username"] = "Choose a username that isn't your email."
            else:
                existing = Student.query.filter(Student.username == username, Student.id != me.id).first()
                if existing:
                    return jsonify({
                        "error": "username_taken",
                        "message": "That username is taken.",
                        "fields": {"username": "That username is taken."},
                    }), 409
                me.username = username

    if errors:
        return jsonify({"error": "validation", "fields": errors}), 400

    db.session.commit()
    return jsonify(me.to_dict(include_email=True)), 200

@main.route("/api/projects", methods=["POST"])
def create_project():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    data = request.get_json() or {}
    errors = {}

    course = clean_text(data.get("course", ""))
    project = clean_text(data.get("project", ""))
    size = data.get("size")
    required_roles = data.get("requiredRoles", [])
    goal = data.get("goal")
    pace = data.get("pace")

    course = course.upper()  # normalize before checking/storing
    if course not in VALID_COURSES:
        errors["course"] = "Must be a recognized course code."
    if not (2 <= len(project) <= 60):
        errors["project"] = "Project name must be 2-60 characters."
    if not isinstance(size, int) or not (MIN_TEAM_SIZE <= size <= MAX_TEAM_SIZE):
        errors["size"] = f"Size must be a number between {MIN_TEAM_SIZE} and {MAX_TEAM_SIZE}."
    if not isinstance(required_roles, list) or len(required_roles) == 0 or not all(r in VALID_ROLES for r in required_roles):
        errors["requiredRoles"] = f"At least one role, each one of: {', '.join(sorted(VALID_ROLES))}."
    if goal not in VALID_GOALS:
        errors["goal"] = f"Must be one of: {', '.join(sorted(VALID_GOALS))}."
    if pace not in VALID_PACES:
        errors["pace"] = f"Must be one of: {', '.join(sorted(VALID_PACES))}."

    if errors:
        return jsonify({"error": "validation", "fields": errors}), 400

    my_team_count = Membership.query.filter_by(student_id=me.id).count()
    if my_team_count >= MAX_PROJECTS:
        return jsonify({"error": "project_limit"}), 409

    my_teams = Team.query.join(Membership).filter(Membership.student_id == me.id).all()
    for t in my_teams:
        if t.project.lower() == project.lower() and t.course.lower() == course.lower():
            return jsonify({
                "error": "duplicate_name",
                "message": f'You already have "{project}" in {course}.',
                "fields": {"project": "You already have a project with this name in this course."},
            }), 409

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    team = Team(
        project=project,
        course=course,
        size=size,
        owner_id=me.id,
        required_roles=required_roles,
        goal=goal,
        pace=pace,
        created_at=now.isoformat() + "Z",
    )
    db.session.add(team)
    db.session.flush()  # generates team.id before we use it below

    membership = Membership(team_id=team.id, student_id=me.id, joined_at=now.isoformat() + "Z")
    db.session.add(membership)
    db.session.commit()

    return jsonify(team.to_dict()), 201

@main.route("/api/projects/<project_id>/invites", methods=["POST"])
def create_invite(project_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    team = Team.query.get(project_id)
    if not team or me.id not in team.member_ids:
        return jsonify({"error": "not_found"}), 404

    data = request.get_json() or {}
    student_id = data.get("studentId")
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "not_found"}), 404

    if student_id in team.member_ids:
        return jsonify({"error": "already_member"}), 409

    if len(team.member_ids) >= team.size:
        return jsonify({"error": "team_full"}), 409

    existing_invite = Invite.query.filter_by(project_id=project_id, student_id=student_id, status="pending").first()
    if existing_invite:
        return jsonify({"error": "already_invited"}), 409

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    invite = Invite(project_id=project_id, student_id=student_id, status="pending", created_at=now.isoformat() + "Z")
    db.session.add(invite)
    db.session.commit()

    return jsonify(invite.to_dict()), 201

@main.route("/api/projects/<project_id>/invites", methods=["GET"])
def get_project_invites(project_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    team = Team.query.get(project_id)
    if not team or me.id not in team.member_ids:
        return jsonify({"error": "not_found"}), 404

    invites = Invite.query.filter_by(project_id=project_id, status="pending").order_by(Invite.created_at.desc()).all()
    result = []
    for i in invites:
        student = Student.query.get(i.student_id)
        if not student:
            continue
        result.append({**i.to_dict(), "student": student.to_dict(include_email=False)})
    return jsonify(result)

@main.route("/api/projects/<project_id>/invites/<invite_id>", methods=["DELETE"])
def cancel_invite(project_id, invite_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    # any member can invite, so any member can cancel
    team = Team.query.get(project_id)
    if not team or me.id not in team.member_ids:
        return jsonify({"error": "not_found"}), 404

    invite = Invite.query.get(invite_id)
    if not invite or invite.project_id != project_id or invite.status != "pending":
        return jsonify({"error": "not_found"}), 404

    invite.status = "canceled"
    db.session.commit()
    return "", 204

@main.route("/api/projects/<project_id>/members/<student_id>", methods=["DELETE"])
def remove_member(project_id, student_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    team = Team.query.get(project_id)
    if not team or me.id not in team.member_ids:
        return jsonify({"error": "not_found"}), 404

    if team.owner_id != me.id:
        return jsonify({"error": "not_owner"}), 403

    if student_id == team.owner_id:
        return jsonify({"error": "cannot_remove_owner"}), 400

    membership = Membership.query.filter_by(team_id=project_id, student_id=student_id).first()
    if not membership:
        return jsonify({"error": "not_found"}), 404

    db.session.delete(membership)
    db.session.commit()

    return "", 204

@main.route("/api/invites/mine", methods=["GET"])
def my_invites():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    invites = Invite.query.filter_by(student_id=me.id, status="pending").order_by(Invite.created_at.desc()).all()
    result = []
    for i in invites:
        team = Team.query.get(i.project_id)
        if not team:
            continue  # project was deleted
        result.append({**i.to_dict(), "team": team_summary(team)})
    return jsonify(result)

@main.route("/api/invites/<invite_id>", methods=["POST"])
def respond_to_invite(invite_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    invite = Invite.query.get(invite_id)
    if not invite or invite.student_id != me.id or invite.status != "pending":
        return jsonify({"error": "not_found"}), 404

    data = request.get_json() or {}
    decision = data.get("decision")
    if decision not in ("accept", "decline"):
        return jsonify({"error": "validation", "fields": {"decision": "Must be accept or decline."}}), 400

    if decision == "decline":
        invite.status = "declined"
        db.session.commit()
        return jsonify(invite.to_dict()), 200

    team = Team.query.get(invite.project_id)
    if not team:
        return jsonify({"error": "not_found"}), 404

    if me.id in team.member_ids:
        invite.status = "accepted"
        db.session.commit()
        return jsonify(invite.to_dict()), 200

    if len(team.member_ids) >= team.size:
        return jsonify({"error": "team_full"}), 409

    my_team_count = Membership.query.filter_by(student_id=me.id).count()
    if my_team_count >= MAX_PROJECTS:
        return jsonify({"error": "project_limit"}), 409

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.add(Membership(team_id=team.id, student_id=me.id, joined_at=now.isoformat() + "Z"))
    invite.status = "accepted"
    # a pending join request to the same team is settled too
    for r in JoinRequest.query.filter_by(post_id=team.id, student_id=me.id, status="pending").all():
        r.status = "accepted"
    cancel_invites_if_full(team.id)
    db.session.commit()

    return jsonify(invite.to_dict()), 200

@main.route("/api/students/<student_id>/contact", methods=["GET"])
def get_contact(student_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "not_found"}), 404

    my_team_ids = {m.team_id for m in Membership.query.filter_by(student_id=me.id).all()}
    their_team_ids = {m.team_id for m in Membership.query.filter_by(student_id=student_id).all()}
    shared_team_ids = my_team_ids & their_team_ids

    if not shared_team_ids:
        return jsonify({"error": "contact_locked"}), 403

    return jsonify({
        "studentId": student.id,
        "email": student.email,
        "sharedProjectIds": list(shared_team_ids),
    }), 200

@main.route("/api/team-posts/<project_id>/requests", methods=["POST"])
def request_to_join(project_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    team = Team.query.get(project_id)
    if not team:
        return jsonify({"error": "not_found"}), 404

    if me.id in team.member_ids:
        return jsonify({"error": "already_member"}), 409

    existing = JoinRequest.query.filter_by(post_id=project_id, student_id=me.id, status="pending").first()
    if existing:
        return jsonify({"error": "already_requested"}), 409

    if len(team.member_ids) >= team.size:
        return jsonify({"error": "team_full"}), 409

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    join_request = JoinRequest(post_id=project_id, student_id=me.id, status="pending", created_at=now.isoformat() + "Z")
    db.session.add(join_request)
    db.session.commit()

    return jsonify(join_request.to_dict()), 201

@main.route("/api/team-posts/<project_id>/requests/mine", methods=["DELETE"])
def cancel_join_request(project_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    join_request = JoinRequest.query.filter_by(post_id=project_id, student_id=me.id, status="pending").first()
    if not join_request:
        return jsonify({"error": "not_found"}), 404

    db.session.delete(join_request)
    db.session.commit()

    return "", 204

@main.route("/api/projects/<project_id>/requests", methods=["GET"])
def get_project_requests(project_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    team = Team.query.get(project_id)
    if not team:
        return jsonify({"error": "not_found"}), 404

    if team.owner_id != me.id:
        return jsonify({"error": "not_owner"}), 403

    requests_ = JoinRequest.query.filter_by(post_id=project_id, status="pending").order_by(JoinRequest.created_at.desc()).all()
    result = []
    for r in requests_:
        student = Student.query.get(r.student_id)
        if not student:
            continue
        result.append({**r.to_dict(), "student": student.to_dict(include_email=False)})
    return jsonify(result)

@main.route("/api/projects/<project_id>/requests/<request_id>", methods=["POST"])
def respond_to_request(project_id, request_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    team = Team.query.get(project_id)
    if not team:
        return jsonify({"error": "not_found"}), 404

    if team.owner_id != me.id:
        return jsonify({"error": "not_owner"}), 403

    join_request = JoinRequest.query.get(request_id)
    if not join_request or join_request.post_id != project_id or join_request.status != "pending":
        return jsonify({"error": "not_found"}), 404

    data = request.get_json() or {}
    decision = data.get("decision")
    if decision not in ("accept", "decline"):
        return jsonify({"error": "validation", "fields": {"decision": "Must be accept or decline."}}), 400

    if decision == "decline":
        join_request.status = "declined"
        db.session.commit()
        return jsonify(join_request.to_dict()), 200

    if join_request.student_id in team.member_ids:
        join_request.status = "accepted"
        db.session.commit()
        return jsonify(join_request.to_dict()), 200

    if len(team.member_ids) >= team.size:
        return jsonify({"error": "team_full"}), 409

    now = datetime.now(timezone.utc).replace(tzinfo=None)
    db.session.add(Membership(team_id=project_id, student_id=join_request.student_id, joined_at=now.isoformat() + "Z"))
    join_request.status = "accepted"
    for i in Invite.query.filter_by(project_id=project_id, student_id=join_request.student_id, status="pending").all():
        i.status = "accepted"
    cancel_invites_if_full(project_id)
    db.session.commit()

    return jsonify(join_request.to_dict()), 200

@main.route("/api/me/availability", methods=["PUT"])
def update_availability():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    data = request.get_json() or {}
    availability = data.get("availability")

    if not isinstance(availability, list) or not all(isinstance(a, str) for a in availability):
        return jsonify({"error": "not_a_list"}), 400

    invalid = [a for a in availability if not SLOT_KEY_PATTERN.match(a)]
    if invalid:
        return jsonify({
            "error": "invalid_time_block",
            "message": f"Unknown time block: {invalid[0]}",
            "invalid": invalid,
        }), 400

    cleaned = sorted(set(availability), key=slot_sort_key)
    me.availability = cleaned
    db.session.commit()

    return jsonify({
        "availability": cleaned,
        "hoursPerWeek": hours_per_week(cleaned),
    }), 200

@main.route("/api/courses", methods=["GET"])
def get_courses():
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401
    return jsonify(sorted(VALID_COURSES))

@main.route("/api/students/<student_id>/reviews", methods=["POST"])
def create_review(student_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    if student_id == me.id:
        return jsonify({"error": "cannot_review_self", "message": "You can't review yourself."}), 400

    reviewee = Student.query.get(student_id)
    if not reviewee:
        return jsonify({"error": "not_found"}), 404

    my_team_ids = {m.team_id for m in Membership.query.filter_by(student_id=me.id).all()}
    their_team_ids = {m.team_id for m in Membership.query.filter_by(student_id=student_id).all()}
    if not (my_team_ids & their_team_ids):
        return jsonify({
            "error": "never_shared_team",
            "message": "You can only review someone you currently share a team with.",
        }), 403

    existing = Review.query.filter_by(reviewer_id=me.id, reviewee_id=student_id).first()
    if existing:
        return jsonify({"error": "already_reviewed", "message": "You've already reviewed this person."}), 409

    data = request.get_json() or {}
    errors = {}
    values = {}
    for field in ["roleAccurate", "skillsAccurate", "paceAccurate", "goalAccurate"]:
        val = data.get(field)
        if not isinstance(val, bool):
            errors[field] = "Must be true or false."
        else:
            values[field] = val

    note = clean_text(data.get("note") or "")
    if len(note) > 300:
        errors["note"] = "Must be 300 characters or fewer."

    if errors:
        return jsonify({"error": "validation", "fields": errors}), 400

    review = Review(
        reviewer_id=me.id,
        reviewee_id=student_id,
        role_accurate=values["roleAccurate"],
        skills_accurate=values["skillsAccurate"],
        pace_accurate=values["paceAccurate"],
        goal_accurate=values["goalAccurate"],
        note=note or None,
    )
    db.session.add(review)
    db.session.commit()
    return jsonify(review.to_dict()), 201


@main.route("/api/students/<student_id>/reviews", methods=["GET"])
def get_reviews(student_id):
    me = current_student()
    if not me:
        return jsonify({"error": "not_signed_in"}), 401

    reviews = Review.query.filter_by(reviewee_id=student_id).order_by(Review.created_at.desc()).all()
    return jsonify([r.to_dict() for r in reviews])