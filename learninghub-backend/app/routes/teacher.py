"""
LearningHUB — Teacher routes
"""

import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
import bcrypt

from app import db
from app.models import User, Course, Enrollment
from app.utils.decorators import role_required

teacher_bp = Blueprint("teacher", __name__)


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _youtube_thumbnail(url: str) -> str:
    """Extract a high-quality thumbnail URL from a YouTube link."""
    patterns = [
        r"(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return f"https://img.youtube.com/vi/{m.group(1)}/hqdefault.jpg"
    return ""


# ── GET /api/teacher/students ────────────────────────────────────
@teacher_bp.route("/students", methods=["GET"])
@role_required("teacher")
def list_students():
    teacher_id = int(get_jwt_identity())
    students = User.query.filter_by(role="student", created_by=teacher_id).order_by(User.created_at.desc()).all()
    return jsonify([s.to_dict(include_email=True) for s in students]), 200


# ── POST /api/teacher/students ───────────────────────────────────
@teacher_bp.route("/students", methods=["POST"])
@role_required("teacher")
def create_student():
    teacher_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    username  = (data.get("username") or "").strip()
    email     = (data.get("email") or "").strip().lower()
    password  = data.get("password", "")
    full_name = (data.get("fullName") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already taken"}), 409

    student = User(
        username=username,
        email=email,
        password=_hash_password(password),
        role="student",
        full_name=full_name or username,
        created_by=teacher_id,
    )
    db.session.add(student)
    db.session.commit()

    return jsonify(student.to_dict(include_email=True)), 201


# ── GET /api/teacher/courses ────────────────────────────────────
@teacher_bp.route("/courses", methods=["GET"])
@role_required("teacher")
def list_courses():
    teacher_id = int(get_jwt_identity())
    courses = Course.query.filter_by(teacher_id=teacher_id).order_by(Course.created_at.desc()).all()
    return jsonify([c.to_dict() for c in courses]), 200


# ── POST /api/teacher/courses ───────────────────────────────────
@teacher_bp.route("/courses", methods=["POST"])
@role_required("teacher")
def create_course():
    teacher_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    title       = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    youtube_url = (data.get("youtubeUrl") or "").strip()

    if not title or not youtube_url:
        return jsonify({"error": "title and youtubeUrl are required"}), 400

    thumbnail = _youtube_thumbnail(youtube_url)

    course = Course(
        title=title,
        description=description,
        youtube_url=youtube_url,
        thumbnail_url=thumbnail,
        teacher_id=teacher_id,
    )
    db.session.add(course)
    db.session.commit()

    return jsonify(course.to_dict()), 201


# ── PUT /api/teacher/courses/<id> ────────────────────────────────
@teacher_bp.route("/courses/<int:course_id>", methods=["PUT"])
@role_required("teacher")
def update_course(course_id):
    teacher_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, teacher_id=teacher_id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    data = request.get_json(silent=True) or {}
    if "title" in data:
        course.title = data["title"]
    if "description" in data:
        course.description = data["description"]
    if "youtubeUrl" in data:
        course.youtube_url = data["youtubeUrl"]
        course.thumbnail_url = _youtube_thumbnail(data["youtubeUrl"])
    if "isPublished" in data:
        course.is_published = bool(data["isPublished"])

    db.session.commit()
    return jsonify(course.to_dict()), 200


# ── DELETE /api/teacher/courses/<id> ─────────────────────────────
@teacher_bp.route("/courses/<int:course_id>", methods=["DELETE"])
@role_required("teacher")
def delete_course(course_id):
    teacher_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, teacher_id=teacher_id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted"}), 200


# ── POST /api/teacher/assign ────────────────────────────────────
@teacher_bp.route("/assign", methods=["POST"])
@role_required("teacher")
def assign_course():
    """Assign a course to one or more students."""
    teacher_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    course_id   = data.get("courseId")
    student_ids = data.get("studentIds", [])

    if not course_id or not student_ids:
        return jsonify({"error": "courseId and studentIds are required"}), 400

    # Verify course belongs to teacher
    course = Course.query.filter_by(id=course_id, teacher_id=teacher_id).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404

    created = 0
    for sid in student_ids:
        student = User.query.filter_by(id=sid, role="student", created_by=teacher_id).first()
        if not student:
            continue
        exists = Enrollment.query.filter_by(student_id=sid, course_id=course_id).first()
        if exists:
            continue
        db.session.add(Enrollment(student_id=sid, course_id=course_id))
        created += 1

    db.session.commit()
    return jsonify({"message": f"{created} enrollment(s) created"}), 201


# ── GET /api/teacher/enrollments ─────────────────────────────────
@teacher_bp.route("/enrollments", methods=["GET"])
@role_required("teacher")
def list_enrollments():
    teacher_id = int(get_jwt_identity())
    course_ids = [c.id for c in Course.query.filter_by(teacher_id=teacher_id).all()]
    if not course_ids:
        return jsonify([]), 200

    enrollments = Enrollment.query.filter(Enrollment.course_id.in_(course_ids)).all()
    return jsonify([e.to_dict() for e in enrollments]), 200
