"""
LearningHUB — Authentication routes (login / register / me)
"""

import re
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
import bcrypt

from app import db
from app.models import User

auth_bp = Blueprint("auth", __name__)


# ── Helpers ────────────────────────────────────────────────────────
def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _check_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _extract_youtube_id(url: str):
    """Return the YouTube video ID from common URL formats."""
    patterns = [
        r"(?:v=|\/embed\/|\/v\/|youtu\.be\/|\/shorts\/)([a-zA-Z0-9_-]{11})",
    ]
    for p in patterns:
        m = re.search(p, url)
        if m:
            return m.group(1)
    return None


# ── POST /api/auth/register ───────────────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    username  = (data.get("username") or "").strip()
    email     = (data.get("email") or "").strip().lower()
    password  = data.get("password", "")
    full_name = (data.get("fullName") or "").strip()

    if not username or not email or not password:
        return jsonify({"error": "username, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if User.query.filter((User.username == username) | (User.email == email)).first():
        return jsonify({"error": "Username or email already taken"}), 409

    user = User(
        username=username,
        email=email,
        password=_hash_password(password),
        role="admin",  # first user via register is admin; teachers/students created by admin/teacher
        full_name=full_name or username,
    )
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict(include_email=True)}), 201


# ── POST /api/auth/login ──────────────────────────────────────────
@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    identifier = (data.get("username") or data.get("email") or "").strip()
    password   = data.get("password", "")

    if not identifier or not password:
        return jsonify({"error": "Username/email and password are required"}), 400

    user = User.query.filter(
        (User.username == identifier) | (User.email == identifier)
    ).first()

    if not user or not _check_password(password, user.password):
        return jsonify({"error": "Invalid credentials"}), 401

    if not user.is_active:
        return jsonify({"error": "Account is deactivated"}), 403

    token = create_access_token(identity=str(user.id))
    return jsonify({"token": token, "user": user.to_dict(include_email=True)}), 200


# ── GET /api/auth/me ──────────────────────────────────────────────
@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    user = User.query.get(int(get_jwt_identity()))
    if not user:
        return jsonify({"error": "User not found"}), 404
    return jsonify({"user": user.to_dict(include_email=True)}), 200
