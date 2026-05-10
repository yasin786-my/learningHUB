"""
LearningHUB — Utility decorators for role-based access control
"""

from functools import wraps
from flask import jsonify
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from app.models import User


def role_required(*allowed_roles):
    """
    Decorator that restricts access to users whose role is in `allowed_roles`.
    Must be placed *after* @jwt_required() or used standalone (it calls verify_jwt).
    """
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            user_id = get_jwt_identity()
            user = User.query.get(user_id)

            if user is None:
                return jsonify({"error": "User not found"}), 404

            if not user.is_active:
                return jsonify({"error": "Account is deactivated"}), 403

            if user.role not in allowed_roles:
                return jsonify({"error": "Insufficient permissions"}), 403

            return fn(*args, **kwargs)
        return wrapper
    return decorator
