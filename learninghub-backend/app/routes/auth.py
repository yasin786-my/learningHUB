"""
LearningHUB — Authentication routes (login / register / me)
"""

import hashlib
import hmac
import os
import re
import secrets
import smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
import bcrypt

from app import db
from app.models import PendingRegistration, User

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


OTP_EXPIRY_MINUTES = 10
OTP_RESEND_SECONDS = 60
OTP_MAX_ATTEMPTS = 5


def _otp_hash(email: str, code: str) -> str:
    secret = os.getenv("SECRET_KEY", "dev-secret")
    return hashlib.sha256(f"{email}:{code}:{secret}".encode("utf-8")).hexdigest()


def _send_registration_otp(email: str, code: str) -> None:
    sender = os.getenv("SMTP_SENDER", "").strip()
    app_password = os.getenv("SMTP_APP_PASSWORD", "").strip()
    if not sender or not app_password:
        raise RuntimeError("Email service is not configured")

    message = EmailMessage()
    message["Subject"] = "Your LearningHUB verification code"
    message["From"] = sender
    message["To"] = email
    message.set_content(
        f"Your LearningHUB verification code is: {code}\n\n"
        f"This code expires in {OTP_EXPIRY_MINUTES} minutes. If you did not start registration, you can ignore this email."
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465, timeout=20) as smtp:
        smtp.login(sender, app_password)
        smtp.send_message(message)


def _new_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _username_for_email(email: str) -> str:
    base = re.sub(r"[^a-z0-9_]", "", email.split("@", 1)[0].lower())[:60] or "student"
    candidate = base
    suffix = 1
    while User.query.filter_by(username=candidate).first():
        candidate = f"{base[:75 - len(str(suffix))]}{suffix}"
        suffix += 1
    return candidate


# ── POST /api/auth/register — student self-registration ───────────
@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    full_name = (data.get("fullName") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password", "")

    if not full_name or not email or not password:
        return jsonify({"error": "Name, email and password are required"}), 400

    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    if not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        return jsonify({"error": "Enter a valid email address"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"error": "An account with this email already exists"}), 409

    code = _new_otp()
    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        pending = PendingRegistration(email=email, full_name=full_name, password_hash="", otp_hash="", expires_at=datetime.utcnow())
        db.session.add(pending)

    pending.full_name = full_name
    pending.password_hash = _hash_password(password)
    pending.otp_hash = _otp_hash(email, code)
    pending.expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    pending.last_sent_at = datetime.utcnow()
    pending.attempts = 0
    db.session.commit()

    try:
        _send_registration_otp(email, code)
    except (OSError, smtplib.SMTPException, RuntimeError):
        return jsonify({"error": "Unable to send the verification email. Please try again later."}), 503

    return jsonify({"message": "Verification code sent", "email": email}), 200


@auth_bp.route("/register/resend", methods=["POST"])
def resend_registration_code():
    email = (request.get_json(silent=True) or {}).get("email", "").strip().lower()
    pending = PendingRegistration.query.filter_by(email=email).first()
    if not pending:
        return jsonify({"error": "Start registration again to receive a code"}), 404

    seconds_since_send = (datetime.utcnow() - pending.last_sent_at).total_seconds()
    if seconds_since_send < OTP_RESEND_SECONDS:
        return jsonify({"error": f"Please wait {int(OTP_RESEND_SECONDS - seconds_since_send) + 1} seconds before resending"}), 429

    code = _new_otp()
    pending.otp_hash = _otp_hash(email, code)
    pending.expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
    pending.last_sent_at = datetime.utcnow()
    pending.attempts = 0
    db.session.commit()

    try:
        _send_registration_otp(email, code)
    except (OSError, smtplib.SMTPException, RuntimeError):
        return jsonify({"error": "Unable to resend the verification email. Please try again later."}), 503

    return jsonify({"message": "A new verification code has been sent"}), 200


@auth_bp.route("/register/verify", methods=["POST"])
def verify_registration():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    code = str(data.get("code") or "").strip()
    pending = PendingRegistration.query.filter_by(email=email).first()

    if not pending or pending.expires_at < datetime.utcnow():
        return jsonify({"error": "This verification code has expired. Please register again."}), 400
    if not re.fullmatch(r"\d{6}", code):
        return jsonify({"error": "Enter the 6-digit verification code"}), 400
    if pending.attempts >= OTP_MAX_ATTEMPTS:
        return jsonify({"error": "Too many incorrect attempts. Request a new code."}), 429

    pending.attempts += 1
    if not hmac.compare_digest(pending.otp_hash, _otp_hash(email, code)):
        db.session.commit()
        return jsonify({"error": "Incorrect verification code"}), 400

    if User.query.filter_by(email=email).first():
        db.session.delete(pending)
        db.session.commit()
        return jsonify({"error": "An account with this email already exists"}), 409

    user = User(
        username=_username_for_email(email),
        email=email,
        password=pending.password_hash,
        role="student",
        full_name=pending.full_name,
    )
    db.session.add(user)
    db.session.delete(pending)
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
