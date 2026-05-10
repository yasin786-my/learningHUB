"""
LearningHUB — SQLAlchemy Models
"""

from datetime import datetime
from app import db


class User(db.Model):
    __tablename__ = "users"

    id         = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username   = db.Column(db.String(80),  nullable=False, unique=True)
    email      = db.Column(db.String(120), nullable=False, unique=True)
    password   = db.Column(db.String(255), nullable=False)
    role       = db.Column(db.Enum("admin", "teacher", "student"), nullable=False, default="student")
    full_name  = db.Column(db.String(150))
    avatar_url = db.Column(db.String(500))
    created_by = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="SET NULL"))
    is_active  = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    courses     = db.relationship("Course", backref="teacher", lazy=True)
    enrollments = db.relationship("Enrollment", backref="student", lazy=True)

    def to_dict(self, include_email=False):
        data = {
            "id":        self.id,
            "username":  self.username,
            "role":      self.role,
            "fullName":  self.full_name,
            "avatarUrl": self.avatar_url,
            "isActive":  self.is_active,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
        }
        if include_email:
            data["email"] = self.email
        return data


class Course(db.Model):
    __tablename__ = "courses"

    id            = db.Column(db.Integer, primary_key=True, autoincrement=True)
    title         = db.Column(db.String(200), nullable=False)
    description   = db.Column(db.Text)
    youtube_url   = db.Column(db.String(500), nullable=False)
    thumbnail_url = db.Column(db.String(500))
    teacher_id    = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_published  = db.Column(db.Boolean, nullable=False, default=True)
    created_at    = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    updated_at    = db.Column(db.DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)

    enrollments = db.relationship("Enrollment", backref="course", lazy=True)

    def to_dict(self):
        return {
            "id":           self.id,
            "title":        self.title,
            "description":  self.description,
            "youtubeUrl":   self.youtube_url,
            "thumbnailUrl": self.thumbnail_url,
            "teacherId":    self.teacher_id,
            "teacherName":  self.teacher.full_name if self.teacher else None,
            "isPublished":  self.is_published,
            "createdAt":    self.created_at.isoformat() if self.created_at else None,
        }


class Enrollment(db.Model):
    __tablename__ = "enrollments"

    id           = db.Column(db.Integer, primary_key=True, autoincrement=True)
    student_id   = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    course_id    = db.Column(db.Integer, db.ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    completed    = db.Column(db.Boolean, nullable=False, default=False)
    progress     = db.Column(db.Integer, nullable=False, default=0)
    enrolled_at  = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime)

    __table_args__ = (
        db.UniqueConstraint("student_id", "course_id", name="uq_enrollment"),
    )

    def to_dict(self):
        return {
            "id":          self.id,
            "studentId":   self.student_id,
            "courseId":     self.course_id,
            "completed":   self.completed,
            "progress":    self.progress,
            "enrolledAt":  self.enrolled_at.isoformat() if self.enrolled_at else None,
            "completedAt": self.completed_at.isoformat() if self.completed_at else None,
            "course":      self.course.to_dict() if self.course else None,
            "student":     self.student.to_dict() if self.student else None,
        }
