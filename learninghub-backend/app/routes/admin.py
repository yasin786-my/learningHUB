"""
LearningHUB — Admin routes
"""

import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
import bcrypt

from app import db
from app.models import User, Course, Enrollment
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__)


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _youtube_thumbnail(url: str) -> str:
    patterns = [
        r"(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return f"https://img.youtube.com/vi/{m.group(1)}/hqdefault.jpg"
    return ""


# ── GET /api/admin/overview ───────────────────────────────────────
@admin_bp.route("/overview", methods=["GET"])
@role_required("admin")
def overview():
    """System-wide statistics for the admin dashboard."""
    total_users    = User.query.count()
    total_students = User.query.filter_by(role="student").count()
    total_courses  = Course.query.count()
    total_enroll   = Enrollment.query.count()
    completed      = Enrollment.query.filter_by(completed=True).count()

    return jsonify({
        "totalUsers":       total_users,
        "totalStudents":    total_students,
        "totalCourses":     total_courses,
        "totalEnrollments": total_enroll,
        "completedCourses": completed,
    }), 200


# ── GET /api/admin/users ─────────────────────────────────────────
@admin_bp.route("/users", methods=["GET"])
@role_required("admin")
def list_users():
    role = request.args.get("role")
    query = User.query
    if role:
        query = query.filter_by(role=role)
    users = query.order_by(User.created_at.desc()).all()
    return jsonify([u.to_dict(include_email=True) for u in users]), 200


# ── PUT /api/admin/users/<id> ────────────────────────────────────
@admin_bp.route("/users/<int:user_id>", methods=["PUT"])
@role_required("admin")
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json(silent=True) or {}

    if "fullName" in data:
        user.full_name = data["fullName"]
    if "email" in data:
        user.email = data["email"].strip().lower()
    if "isActive" in data:
        user.is_active = bool(data["isActive"])
    if "password" in data and data["password"]:
        user.password = _hash_password(data["password"])

    db.session.commit()
    return jsonify(user.to_dict(include_email=True)), 200


# ── DELETE /api/admin/users/<id> ─────────────────────────────────
@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@role_required("admin")
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404

    if user.role == "admin":
        return jsonify({"error": "Cannot delete admin accounts"}), 403

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200


# ── GET /api/admin/courses ────────────────────────────────────────
@admin_bp.route("/courses", methods=["GET"])
@role_required("admin")
def list_courses():
    courses = Course.query.order_by(Course.created_at.desc()).all()
    return jsonify([c.to_dict() for c in courses]), 200


# ── POST /api/admin/courses ───────────────────────────────────────
@admin_bp.route("/courses", methods=["POST"])
@role_required("admin")
def create_course():
    admin_id = int(get_jwt_identity())
    data = request.get_json(silent=True) or {}

    title       = (data.get("title") or "").strip()
    description = (data.get("description") or "").strip()
    youtube_url = (data.get("youtubeUrl") or "").strip()

    if not title or not youtube_url:
        return jsonify({"error": "title and youtubeUrl are required"}), 400

    course = Course(
        title=title,
        description=description,
        youtube_url=youtube_url,
        thumbnail_url=_youtube_thumbnail(youtube_url),
        teacher_id=admin_id,
    )
    db.session.add(course)
    db.session.commit()

    return jsonify(course.to_dict()), 201


# ── PUT /api/admin/courses/<id> ───────────────────────────────────
@admin_bp.route("/courses/<int:course_id>", methods=["PUT"])
@role_required("admin")
def update_course(course_id):
    course = Course.query.get(course_id)
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


# ── DELETE /api/admin/courses/<id> ────────────────────────────────
@admin_bp.route("/courses/<int:course_id>", methods=["DELETE"])
@role_required("admin")
def delete_course(course_id):
    course = Course.query.get(course_id)
    if not course:
        return jsonify({"error": "Course not found"}), 404

    db.session.delete(course)
    db.session.commit()
    return jsonify({"message": "Course deleted"}), 200
