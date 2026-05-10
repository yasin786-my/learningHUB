"""
LearningHUB — Admin routes
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
import bcrypt

from app import db
from app.models import User, Course, Enrollment
from app.utils.decorators import role_required

admin_bp = Blueprint("admin", __name__)


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


# ── GET /api/admin/overview ───────────────────────────────────────
@admin_bp.route("/overview", methods=["GET"])
@role_required("admin")
def overview():
    """System-wide statistics for the admin dashboard."""
    total_users    = User.query.count()
    total_teachers = User.query.filter_by(role="teacher").count()
    total_students = User.query.filter_by(role="student").count()
    total_courses  = Course.query.count()
    total_enroll   = Enrollment.query.count()
    completed      = Enrollment.query.filter_by(completed=True).count()

    return jsonify({
        "totalUsers":       total_users,
        "totalTeachers":    total_teachers,
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


# ── POST /api/admin/users  — create a teacher ────────────────────
@admin_bp.route("/users", methods=["POST"])
@role_required("admin")
def create_teacher():
    data = request.get_json(silent=True) or {}

    username  = (data.get("username") or "").strip()
    email     = (data.get("email") or "").strip().lower()
    password  = data.get("password", "")
    full_name = (data.get("fullName") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already taken"}), 409

    user = User(
        username=username,
        email=email,
        password=_hash_password(password),
        role="teacher",
        full_name=full_name or username,
        created_by=int(get_jwt_identity()),
    )
    db.session.add(user)
    db.session.commit()

    return jsonify(user.to_dict(include_email=True)), 201


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

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "User deleted"}), 200
