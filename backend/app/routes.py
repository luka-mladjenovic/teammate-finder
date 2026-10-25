from flask import Blueprint, jsonify, session
from app.models import Student, Team, JoinRequest

main = Blueprint("main", __name__)

# Step 1 only: no real sign-in yet, so we read whatever student id is in the
# session cookie. Use this to log in by hand while testing:
#   POST /api/dev/signin  {"studentId": "<id>"}
# This route disappears once Step 2 builds real auth.

def current_student():
    student_id = session.get("student_id")
    if not student_id:
        return None
    return Student.query.get(student_id)

@main.route("/api/dev/signin", methods=["POST"])
def dev_signin():
    from flask import request
    student_id = request.get_json().get("studentId")
    student = Student.query.get(student_id)
    if not student:
        return jsonify({"error": "not_found", "message": "No student with that id"}), 404
    session["student_id"] = student_id
    return jsonify(student.to_dict(include_email=True))

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