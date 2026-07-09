"""
LearningHUB — Student routes
"""

from datetime import datetime
from collections import defaultdict
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


# ── GET /api/student/analytics ──────────────────────────────────────
@student_bp.route("/analytics", methods=["GET"])
@role_required("student")
def analytics():
    """Chart data for the student analytics dashboard."""
    student_id = int(get_jwt_identity())
    courses = (
        Course.query
        .filter_by(is_published=True)
        .order_by(Course.created_at.desc())
        .all()
    )
    items = [_course_item(student_id, c) for c in courses]

    completed = sum(1 for i in items if i["completed"])
    in_progress = sum(1 for i in items if not i["completed"] and i["progress"] > 0)
    not_started = len(items) - completed - in_progress
    total = len(items)

    course_progress = [
        {
            "title": i["course"]["title"][:28] + ("…" if len(i["course"]["title"]) > 28 else ""),
            "progress": i["progress"],
            "completed": i["completed"],
        }
        for i in items
    ]

    activity_buckets = defaultdict(int)
    for i in items:
        if i.get("completedAt"):
            dt = datetime.fromisoformat(i["completedAt"])
            activity_buckets[(dt.year, dt.month)] += 1

    activity_by_month = [
        {"month": label, "completions": activity_buckets.get((y, m), 0)}
        for label, y, m in _last_six_months()
    ]

    return jsonify({
        "progressOverview": [
            {"name": "Completed", "value": completed},
            {"name": "In Progress", "value": in_progress},
            {"name": "Not Started", "value": not_started},
        ],
        "courseProgress": course_progress,
        "activityByMonth": activity_by_month,
        "completionRate": round((completed / total * 100) if total else 0, 1),
        "totalCourses": total,
        "completedCourses": completed,
    }), 200


def _last_six_months():
    now = datetime.utcnow()
    months = []
    year, month = now.year, now.month
    for _ in range(6):
        label = datetime(year, month, 1).strftime("%b %Y")
        months.append((label, year, month))
        month -= 1
        if month == 0:
            month = 12
            year -= 1
    return list(reversed(months))
