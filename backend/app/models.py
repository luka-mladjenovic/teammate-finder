from app import db
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta, timezone

def hash_code(code: str) -> str:
    return hashlib.sha256(code.encode()).hexdigest()

def gen_id():
    return str(uuid.uuid4())

class Challenge(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    email = db.Column(db.String, nullable=False)
    code_hash = db.Column(db.String, nullable=False)
    attempts_left = db.Column(db.Integer, default=5)
    expires_at = db.Column(db.DateTime, nullable=False)
    resend_after = db.Column(db.DateTime, nullable=False)
    used = db.Column(db.Boolean, default=False)
    name = db.Column(db.String, nullable=True)

class Student(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    name = db.Column(db.String, default="")
    email = db.Column(db.String, unique=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False)
    major = db.Column(db.String, default="Computer Science")
    year = db.Column(db.String, default="Freshman")
    roles = db.Column(db.JSON, default=list)
    skills = db.Column(db.JSON, default=list)
    availability = db.Column(db.JSON, default=list)  # list of "day-block" strings
    weekly_hours = db.Column(db.String, default="1-5")
    response_time = db.Column(db.String, default="same_day")
    channel = db.Column(db.String, default="email")
    work_mode = db.Column(db.JSON, default=list)
    goal = db.Column(db.String, default="pass")
    pace = db.Column(db.String, default="steady")
    past_work = db.Column(db.JSON, default=list)  # [{title, url?, role}]
    looking_for_team = db.Column(db.Boolean, default=True)
    username = db.Column(db.String, unique=True, nullable=True)

    def to_dict(self, include_email=False):
        data = {
            "id": self.id,
            "name": self.name,
            "emailVerified": self.email_verified,
            "major": self.major,
            "year": self.year,
            "roles": self.roles,
            "skills": self.skills,
            "availability": self.availability,
            "weeklyHours": self.weekly_hours,
            "responseTime": self.response_time,
            "channel": self.channel,
            "workMode": self.work_mode,
            "goal": self.goal,
            "pace": self.pace,
            "pastWork": self.past_work,
            # newest first; Review.to_dict never includes the reviewer (reviews are anonymous)
            "reviews": [r.to_dict() for r in Review.query.filter_by(reviewee_id=self.id).order_by(Review.created_at.desc()).all()],
            "lookingForTeam": self.looking_for_team,
            "username": self.username
        }
        if include_email:
            data["email"] = self.email
        return data

class Team(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    project = db.Column(db.String, nullable=False)
    course = db.Column(db.String, nullable=False)
    size = db.Column(db.Integer, nullable=False)
    owner_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    required_roles = db.Column(db.JSON, default=list)
    goal = db.Column(db.String, nullable=False)
    pace = db.Column(db.String, nullable=False)
    created_at = db.Column(db.String, nullable=False)
    memberships = db.relationship("Membership", order_by="Membership.joined_at", cascade="all, delete-orphan")

    @property
    def member_ids(self):
        return [m.student_id for m in self.memberships]
    
    def to_dict(self):
        return {
            "id": self.id,
            "project": self.project,
            "course": self.course,
            "size": self.size,
            "ownerId": self.owner_id,
            "memberIds": self.member_ids,
            "requiredRoles": self.required_roles,
            "goal": self.goal,
            "pace": self.pace,
            "createdAt": self.created_at,
        }

class Invite(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    project_id = db.Column(db.String, db.ForeignKey("team.id"), nullable=False)
    student_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    status = db.Column(db.String, default="pending")  # pending | accepted | declined | canceled
    created_at = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "projectId": self.project_id,
            "studentId": self.student_id,
            "status": self.status,
            "createdAt": self.created_at,
        }

class JoinRequest(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    post_id = db.Column(db.String, nullable=False)  # a Team's id
    student_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    status = db.Column(db.String, default="pending")
    created_at = db.Column(db.String, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "postId": self.post_id,
            "studentId": self.student_id,
            "status": self.status,
            "createdAt": self.created_at,
        }

class Membership(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    team_id = db.Column(db.String, db.ForeignKey("team.id"), nullable=False)
    student_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    joined_at = db.Column(db.String, nullable=False)  # ISO string, so we can order by it

    __table_args__ = (db.UniqueConstraint("team_id", "student_id"),)

class Review(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    reviewer_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    reviewee_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    role_accurate = db.Column(db.Boolean, nullable=False)
    skills_accurate = db.Column(db.Boolean, nullable=False)
    pace_accurate = db.Column(db.Boolean, nullable=False)
    goal_accurate = db.Column(db.Boolean, nullable=False)
    note = db.Column(db.String, nullable=True)
    created_at = db.Column(
        db.DateTime, default=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )

    __table_args__ = (
        db.UniqueConstraint("reviewer_id", "reviewee_id", name="one_review_per_pair"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "revieweeId": self.reviewee_id,
            "roleAccurate": self.role_accurate,
            "skillsAccurate": self.skills_accurate,
            "paceAccurate": self.pace_accurate,
            "goalAccurate": self.goal_accurate,
            "note": self.note,
            "createdAt": self.created_at.isoformat() + "Z",
        }