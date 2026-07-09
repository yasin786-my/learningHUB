"""
LearningHUB — Student routes
"""

from datetime import datetime
from flask import Blueprint, jsonify
from flask_jwt_extended import get_jwt_identity

from app import db
from app.models import Course, Enrollment
from app.utils.decorators import role_required

student_bp = Blueprint("student", __name__)


def _course_item(student_id: int, course: Course) -> dict:
    """Build a course response with this student's progress (if any)."""
    enrollment = Enrollment.query.filter_by(
        student_id=student_id, course_id=course.id
    ).first()
    return {
        "id": enrollment.id if enrollment else None,
        "courseId": course.id,
        "completed": enrollment.completed if enrollment else False,
        "progress": enrollment.progress if enrollment else 0,
        "enrolledAt": enrollment.enrolled_at.isoformat() if enrollment and enrollment.enrolled_at else None,
        "completedAt": enrollment.completed_at.isoformat() if enrollment and enrollment.completed_at else None,
        "course": course.to_dict(),
    }


def _get_or_create_enrollment(student_id: int, course_id: int):
    course = Course.query.filter_by(id=course_id, is_published=True).first()
    if not course:
        return None

    enrollment = Enrollment.query.filter_by(
        student_id=student_id, course_id=course_id
    ).first()
    if not enrollment:
        enrollment = Enrollment(student_id=student_id, course_id=course_id)
        db.session.add(enrollment)
        db.session.commit()
    return enrollment


# ── GET /api/student/courses ────────────────────────────────────
@student_bp.route("/courses", methods=["GET"])
@role_required("student")
def my_courses():
    """Return all published courses — every student has access."""
    student_id = int(get_jwt_identity())
    courses = (
        Course.query
        .filter_by(is_published=True)
        .order_by(Course.created_at.desc())
        .all()
    )
    return jsonify([_course_item(student_id, c) for c in courses]), 200


# ── GET /api/student/courses/<id> ─────────────────────────────────
@student_bp.route("/courses/<int:course_id>", methods=["GET"])
@role_required("student")
def get_course(course_id):
    """Return a single published course with the student's progress."""
    student_id = int(get_jwt_identity())
    course = Course.query.filter_by(id=course_id, is_published=True).first()
    if not course:
        return jsonify({"error": "Course not found"}), 404
    return jsonify(_course_item(student_id, course)), 200


# ── PUT /api/student/courses/<id>/complete ───────────────────────
@student_bp.route("/courses/<int:course_id>/complete", methods=["PUT"])
@role_required("student")
def mark_complete(course_id):
    """Toggle completion status for a course."""
    student_id = int(get_jwt_identity())
    enrollment = _get_or_create_enrollment(student_id, course_id)
    if not enrollment:
        return jsonify({"error": "Course not found"}), 404

    enrollment.completed = not enrollment.completed
    enrollment.progress = 100 if enrollment.completed else 0
    enrollment.completed_at = datetime.utcnow() if enrollment.completed else None

    db.session.commit()
    return jsonify(_course_item(student_id, enrollment.course)), 200
