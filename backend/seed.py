from app import create_app, db
from app.models import Student

app = create_app()

with app.app_context():
    existing = Student.query.filter_by(email="you@ufl.edu").first()
    if existing:
        print("Test student already exists:", existing.id)
    else:
        student = Student(
            email="you@ufl.edu",
            name="Test Student",
            email_verified=True,
            major="Computer Science",
            year="Senior",
            roles=["backend"],
            looking_for_team=True,
        )
        db.session.add(student)
        db.session.commit()
        print("Created test student:", student.id)