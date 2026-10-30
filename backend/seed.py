from datetime import datetime, timezone, timedelta
from app import create_app, db
from app.models import Student, Team, Membership

app = create_app()


def now_iso(offset_minutes=0):
    return (datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=offset_minutes)).isoformat() + "Z"


STUDENTS = [
    dict(
        email="priya.demo@ufl.edu", name="Priya Raman", major="Computer Science", year="Junior",
        roles=["backend", "lead"], skills=["Python", "Flask", "PostgreSQL"],
        availability=["mon-early_evening", "wed-afternoon", "thu-afternoon"],
        weekly_hours="6-10", response_time="same_day", channel="discord", work_mode=["online"],
        goal="strong_grade", pace="steady", looking_for_team=True, username="priya_builds",
    ),
    dict(
        email="daniel.demo@ufl.edu", name="Daniel Kim", major="Computer Science", year="Senior",
        roles=["frontend"], skills=["React", "TypeScript", "Figma"],
        availability=["tue-afternoon", "thu-afternoon", "sun-afternoon"],
        weekly_hours="1-5", response_time="next_day", channel="text", work_mode=["online", "in_person"],
        goal="portfolio", pace="early", looking_for_team=True, username="dkim_dev",
    ),
    dict(
        email="aisha.demo@ufl.edu", name="Aisha Bello", major="Computer Engineering", year="Sophomore",
        roles=["design", "frontend"], skills=["Figma", "CSS"],
        availability=["mon-morning", "wed-morning", "fri-morning"],
        weekly_hours="6-10", response_time="within_1h", channel="slack", work_mode=["online"],
        goal="pass", pace="steady", looking_for_team=True, username="aisha_designs",
    ),
    dict(
        email="marcus.demo@ufl.edu", name="Marcus Webb", major="Computer Science", year="Junior",
        roles=["testing", "docs"], skills=["pytest", "Jira"],
        availability=["sat-afternoon", "sun-morning"],
        weekly_hours="1-5", response_time="few_hours", channel="email", work_mode=["in_person"],
        goal="pass", pace="deadline", looking_for_team=True, username="marcusw",
    ),
    dict(
        email="sofia.demo@ufl.edu", name="Sofia Alvarez", major="Computer Science", year="Senior",
        roles=["backend"], skills=["Java", "Spring", "SQL"],
        availability=["mon-afternoon", "tue-early_evening", "thu-morning"],
        weekly_hours="11-15", response_time="same_day", channel="discord", work_mode=["online"],
        goal="strong_grade", pace="early", looking_for_team=False, username="sofia_a",
    ),
    dict(
        email="omar.demo@ufl.edu", name="Omar Haddad", major="Computer Engineering", year="Freshman",
        roles=["frontend", "backend"], skills=["JavaScript", "Node"],
        availability=["wed-afternoon", "fri-afternoon"],
        weekly_hours="1-5", response_time="next_day", channel="text", work_mode=["online"],
        goal="pass", pace="steady", looking_for_team=True, username=None,
    ),
]

# (owner_email, member_email) pairs per team: first is owner, rest already joined
TEAMS = [
    dict(
        project="Course Planner API", course="CEN3031", size=4, required_roles=["frontend", "design"],
        goal="strong_grade", pace="steady", owner_email="priya.demo@ufl.edu", member_emails=["daniel.demo@ufl.edu"],
    ),
    dict(
        project="Campus Ride Share", course="CIS4914", size=4, required_roles=["backend", "testing"],
        goal="portfolio", pace="early", owner_email="marcus.demo@ufl.edu", member_emails=[],
    ),
]


def get_or_create_student(data):
    existing = Student.query.filter_by(email=data["email"]).first()
    if existing:
        print(f"Student already exists: {data['email']} -> {existing.id}")
        return existing
    student = Student(
        email=data["email"], name=data["name"], email_verified=True,
        major=data["major"], year=data["year"], roles=data["roles"], skills=data["skills"],
        availability=data["availability"], weekly_hours=data["weekly_hours"],
        response_time=data["response_time"], channel=data["channel"], work_mode=data["work_mode"],
        goal=data["goal"], pace=data["pace"], looking_for_team=data["looking_for_team"],
        username=data["username"],
    )
    db.session.add(student)
    db.session.commit()
    print(f"Created student: {data['email']} -> {student.id}")
    return student


def get_or_create_team(data, students_by_email):
    existing = Team.query.filter_by(project=data["project"]).first()
    if existing:
        print(f"Team already exists: {data['project']} -> {existing.id}")
        return existing

    owner = students_by_email[data["owner_email"]]
    team = Team(
        project=data["project"], course=data["course"], size=data["size"],
        owner_id=owner.id, required_roles=data["required_roles"],
        goal=data["goal"], pace=data["pace"], created_at=now_iso(),
    )
    db.session.add(team)
    db.session.commit()

    owner_membership = Membership(team_id=team.id, student_id=owner.id, joined_at=now_iso())
    db.session.add(owner_membership)
    for offset, email in enumerate(data["member_emails"], start=1):
        member = students_by_email[email]
        db.session.add(Membership(team_id=team.id, student_id=member.id, joined_at=now_iso(offset)))
    db.session.commit()
    print(f"Created team: {data['project']} -> {team.id}")
    return team


with app.app_context():
    students_by_email = {}
    for s in STUDENTS:
        student = get_or_create_student(s)
        students_by_email[s["email"]] = student

    for t in TEAMS:
        get_or_create_team(t, students_by_email)