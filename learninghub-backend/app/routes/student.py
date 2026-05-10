"""
LearningHUB — Student routes
"""

from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Enrollment
from app.utils.decorators import role_required

student_bp = Blueprint("student", __name__)


# ── GET /api/student/courses ────────────────────────────────────
@student_bp.route("/courses", methods=["GET"])
@role_required("student")
def my_courses():
    """Return all courses assigned to the authenticated student."""
    student_id = int(get_jwt_identity())
    enrollments = (
        Enrollment.query
        .filter_by(student_id=student_id)
        .order_by(Enrollment.enrolled_at.desc())
        .all()
    )
    return jsonify([e.to_dict() for e in enrollments]), 200


# ── PUT /api/student/courses/<id>/complete ───────────────────────
@student_bp.route("/courses/<int:enrollment_id>/complete", methods=["PUT"])
@role_required("student")
def mark_complete(enrollment_id):
    """Toggle completion status on an enrollment."""
    student_id = int(get_jwt_identity())
    enrollment = Enrollment.query.filter_by(id=enrollment_id, student_id=student_id).first()

    if not enrollment:
        return jsonify({"error": "Enrollment not found"}), 404

    enrollment.completed = not enrollment.completed
    enrollment.progress = 100 if enrollment.completed else 0
    enrollment.completed_at = datetime.utcnow() if enrollment.completed else None

    db.session.commit()
    return jsonify(enrollment.to_dict()), 200
