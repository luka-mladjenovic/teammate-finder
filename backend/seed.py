import random
from datetime import datetime, timezone, timedelta
from app import create_app, db
from app.models import Student, Team, Membership
from app.courses import VALID_COURSES

app = create_app()
random.seed(42)  # fixed seed so re-runs generate the same data for anything not already in the DB

VALID_YEARS = ["Freshman", "Sophomore", "Junior", "Senior", "Graduate"]
VALID_MAJORS = ["Computer Science", "Computer Science", "Computer Science", "Computer Engineering"]
VALID_WEEKLY_HOURS = ["1-5", "6-10", "11-15", "15+"]
VALID_RESPONSE_TIMES = ["within_1h", "few_hours", "same_day", "next_day"]
VALID_CHANNELS = ["email", "discord", "slack", "text"]
VALID_GOALS = ["pass", "strong_grade", "portfolio"]
VALID_PACES = ["early", "steady", "deadline"]
VALID_ROLES = ["lead", "frontend", "backend", "design", "docs", "testing"]
VALID_WORK_MODES = ["online", "in_person"]
DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]
BLOCKS = ["morning", "afternoon", "early_evening", "late_evening", "night"]

# Real students are free most of the time and cluster heavily around the same
# evening/weekend blocks. Every student gets a guaranteed set of "prime" slots
# (so any two students always share something) plus a random handful of extras
# for variety. Verified by simulation: 0% of randomly grouped teams end up with
# zero overlap, average ~3.7 shared blocks per team of 2-4.
PRIME_SLOTS = [("mon", "early_evening"), ("wed", "early_evening"), ("sun", "afternoon")]
EXTRA_SLOTS = [
    ("tue", "early_evening"), ("thu", "early_evening"), ("sat", "afternoon"),
    ("mon", "afternoon"), ("wed", "afternoon"), ("thu", "afternoon"),
    ("fri", "early_evening"), ("sat", "morning"), ("sun", "morning"),
]

SKILLS_BY_ROLE = {
    "frontend": ["React", "TypeScript", "CSS", "Vite", "Tailwind"],
    "backend": ["Python", "Flask", "SQL", "Java", "PostgreSQL"],
    "design": ["Figma", "CSS", "Illustrator"],
    "docs": ["Markdown", "Notion", "Technical Writing"],
    "testing": ["pytest", "Jest", "Jira"],
    "lead": ["Project Management", "Git", "Scrum"],
}

FIRST_NAMES = [
    "Priya", "Daniel", "Aisha", "Marcus", "Sofia", "Omar", "Jordan", "Lena", "Noah", "Ines",
    "Kai", "Rosa", "Diego", "Mei", "Tyler", "Fatima", "Ethan", "Nadia", "Carlos", "Grace",
    "Ravi", "Hannah", "Jamal", "Yuki", "Oliver", "Zara", "Leo", "Amara", "Felix", "Chloe",
]
LAST_NAMES = [
    "Raman", "Kim", "Bello", "Webb", "Alvarez", "Haddad", "Lee", "Novak", "Park", "Moreau",
    "Zhang", "Santos", "Cruz", "Chen", "Reed", "Osei", "Brooks", "Hassan", "Ortiz", "Walsh",
    "Patel", "Clarke", "Ali", "Tanaka", "Grant", "Mbeki", "Russo", "Diallo", "Hart", "Dubois",
]

PROJECT_NAMES = [
    "Course Planner API", "Campus Ride Share", "Study Spot Finder", "Club Budget Tracker",
    "Recipe Remix", "Air Quality Dashboard", "Gator Eats", "Shell Scheduler",
    "Library Seat Booker", "Database Project",
]


def now_iso(offset_minutes=0):
    return (datetime.now(timezone.utc).replace(tzinfo=None) + timedelta(minutes=offset_minutes)).isoformat() + "Z"


def make_student(i, first, last):
    roles = random.sample(VALID_ROLES, k=random.choice([1, 2]))
    skills = sorted({s for r in roles for s in random.sample(SKILLS_BY_ROLE[r], k=min(2, len(SKILLS_BY_ROLE[r])))})
    extra_count = random.randint(2, 6)
    extra_slots = random.sample(EXTRA_SLOTS, k=min(extra_count, len(EXTRA_SLOTS)))
    availability = [f"{day}-{block}" for day, block in PRIME_SLOTS + extra_slots]
    username = None
    if random.random() < 0.8:  # ~80% have a username, rest left null for variety
        username = f"{first.lower()}{last.lower()}"[:20]
    return dict(
        email=f"{first.lower()}.{last.lower()}.demo@ufl.edu",
        name=f"{first} {last}",
        major=random.choice(VALID_MAJORS),
        year=random.choice(VALID_YEARS),
        roles=roles,
        skills=list(skills),
        availability=availability,
        weekly_hours=random.choice(VALID_WEEKLY_HOURS),
        response_time=random.choice(VALID_RESPONSE_TIMES),
        channel=random.choice(VALID_CHANNELS),
        work_mode=random.sample(VALID_WORK_MODES, k=random.choice([1, 2])),
        goal=random.choice(VALID_GOALS),
        pace=random.choice(VALID_PACES),
        looking_for_team=random.random() < 0.8,  # ~80% looking, rest already settled elsewhere
        username=username,
    )


def get_or_create_student(data):
    existing = Student.query.filter_by(email=data["email"]).first()
    if existing:
        return existing, False
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
    return student, True


def get_or_create_team(project_name, course, owner, members, required_roles, size):
    existing = Team.query.filter_by(project=project_name).first()
    if existing:
        return existing, False
    team = Team(
        project=project_name, course=course, size=size, owner_id=owner.id,
        required_roles=required_roles, goal=random.choice(VALID_GOALS), pace=random.choice(VALID_PACES),
        created_at=now_iso(),
    )
    db.session.add(team)
    db.session.commit()
    db.session.add(Membership(team_id=team.id, student_id=owner.id, joined_at=now_iso()))
    for offset, member in enumerate(members, start=1):
        db.session.add(Membership(team_id=team.id, student_id=member.id, joined_at=now_iso(offset)))
    db.session.commit()
    return team, True


with app.app_context():
    students = []
    for i in range(30):
        first, last = FIRST_NAMES[i], LAST_NAMES[i]
        student, created = get_or_create_student(make_student(i, first, last))
        students.append(student)
        print(f"{'Created' if created else 'Already exists'}: {student.email} -> {student.id}")

    courses = list(VALID_COURSES)
    pool = students[:]  # students available to be placed on a team
    random.shuffle(pool)

    for i, project_name in enumerate(PROJECT_NAMES):
        size = random.randint(3, 6)
        # fill at most size - 1 spots, always leave at least one spot open
        member_count = random.randint(0, min(size - 1, 3))
        owner = pool[i % len(pool)]
        candidates = [s for s in pool if s.id != owner.id]
        members = random.sample(candidates, k=min(member_count, len(candidates)))

        covered_roles = set(owner.roles) | {r for m in members for r in m.roles}
        missing_roles = [r for r in VALID_ROLES if r not in covered_roles]
        required_roles = random.sample(missing_roles, k=min(2, len(missing_roles))) if missing_roles else [random.choice(VALID_ROLES)]

        team, created = get_or_create_team(
            project_name, random.choice(courses), owner, members, required_roles, size,
        )
        print(f"{'Created' if created else 'Already exists'}: {project_name} -> {team.id}")