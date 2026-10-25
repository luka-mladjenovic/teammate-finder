from app import create_app, db
from app.models import Student

app = create_app()

with app.app_context():
    for email, name in [
        ("you@ufl.edu", "Test Student"),
        ("existing@ufl.edu", "Existing Student"),
    ]:
        existing = Student.query.filter_by(email=email).first()
        if existing:
            print(f"Already exists: {email} -> {existing.id}")
        else:
            student = Student(
                email=email,
                name=name,
                email_verified=True,
                major="Computer Science",
                year="Senior",
                roles=["backend"],
                looking_for_team=True,
            )
            db.session.add(student)
            db.session.commit()
            print(f"Created: {email} -> {student.id}")