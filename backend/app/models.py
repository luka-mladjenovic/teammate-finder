from app import db
import uuid
import secrets
import hashlib
from datetime import datetime, timedelta

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

class Student(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    name = db.Column(db.String, default="")
    email = db.Column(db.String, unique=True, nullable=False)
    email_verified = db.Column(db.Boolean, default=False)
    major = db.Column(db.String, default="")
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
            "reviews": [],  # reviews aren't built yet (Step 5 / later)
            "lookingForTeam": self.looking_for_team,
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
    status = db.Column(db.String, default="pending")  # pending | accepted | declined
    created_at = db.Column(db.String, nullable=False)

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
            "status": self.status,
            "createdAt": self.created_at,
        }

class Membership(db.Model):
    id = db.Column(db.String, primary_key=True, default=gen_id)
    team_id = db.Column(db.String, db.ForeignKey("team.id"), nullable=False)
    student_id = db.Column(db.String, db.ForeignKey("student.id"), nullable=False)
    joined_at = db.Column(db.String, nullable=False)  # ISO string, so we can order by it

    __table_args__ = (db.UniqueConstraint("team_id", "student_id"),)