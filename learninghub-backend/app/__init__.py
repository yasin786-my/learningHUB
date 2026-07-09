"""
LearningHUB — Application Factory
"""

from flask import Flask, current_app
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import bcrypt
import os

load_dotenv()

db  = SQLAlchemy()
jwt = JWTManager()


def _get_database_uri() -> str:
    """Prefer DATABASE_URL (Supabase/Render PostgreSQL); fall back to local MySQL."""
    database_url = os.getenv("DATABASE_URL")
    if database_url:
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql://", 1)
        if "sslmode=" not in database_url and "supabase" in database_url:
            sep = "&" if "?" in database_url else "?"
            database_url = f"{database_url}{sep}sslmode=require"
        return database_url

    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_pass = os.getenv("MYSQL_PASSWORD", "")
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db   = os.getenv("MYSQL_DB", "learninghub")

    return (
        f"mysql+pymysql://{mysql_user}:{mysql_pass}"
        f"@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"
    )


def _seed_admin_user() -> None:
    """Create the initial admin from env vars if no admin exists yet."""
    from app.models import User

    if User.query.filter_by(role="admin").first():
        return

    admin_email = (os.getenv("ADMIN_EMAIL") or "").strip().lower()
    admin_password = os.getenv("ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        current_app.logger.warning(
            "No admin user found and ADMIN_EMAIL/ADMIN_PASSWORD are not set — skipping seed"
        )
        return

    admin_username = (os.getenv("ADMIN_USERNAME") or admin_email.split("@")[0]).strip()
    admin_full_name = (os.getenv("ADMIN_FULL_NAME") or "System Admin").strip()

    hashed = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    admin = User(
        username=admin_username,
        email=admin_email,
        password=hashed,
        role="admin",
        full_name=admin_full_name,
    )
    db.session.add(admin)
    db.session.commit()
    current_app.logger.info("Seeded initial admin account for %s", admin_email)


def create_app():
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────────
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours
    app.config["SQLALCHEMY_DATABASE_URI"] = _get_database_uri()
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    # ── Extensions ─────────────────────────────────────────────────
    db.init_app(app)
    jwt.init_app(app)

    cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    CORS(app, resources={r"/api/*": {"origins": cors_origins.split(",")}},
         supports_credentials=True)

    # ── Blueprints ─────────────────────────────────────────────────
    from app.routes.auth    import auth_bp
    from app.routes.admin   import admin_bp
    from app.routes.student import student_bp

    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(admin_bp,   url_prefix="/api/admin")
    app.register_blueprint(student_bp, url_prefix="/api/student")

    # ── Health check ───────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "LearningHUB API"}

    # ── Startup: tables + admin seed ───────────────────────────────
    with app.app_context():
        db.create_all()
        _seed_admin_user()

    return app
