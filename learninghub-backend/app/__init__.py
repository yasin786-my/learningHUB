"""
LearningHUB — Application Factory
"""

from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv
import os

load_dotenv()

db  = SQLAlchemy()
jwt = JWTManager()


def create_app():
    app = Flask(__name__)

    # ── Configuration ──────────────────────────────────────────────
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "jwt-dev-secret")
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = 86400  # 24 hours

    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_pass = os.getenv("MYSQL_PASSWORD", "")
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    mysql_db   = os.getenv("MYSQL_DB", "learninghub")

    app.config["SQLALCHEMY_DATABASE_URI"] = (
        f"mysql+pymysql://{mysql_user}:{mysql_pass}"
        f"@{mysql_host}:{mysql_port}/{mysql_db}?charset=utf8mb4"
    )
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
    from app.routes.teacher import teacher_bp
    from app.routes.student import student_bp

    app.register_blueprint(auth_bp,    url_prefix="/api/auth")
    app.register_blueprint(admin_bp,   url_prefix="/api/admin")
    app.register_blueprint(teacher_bp, url_prefix="/api/teacher")
    app.register_blueprint(student_bp, url_prefix="/api/student")

    # ── Health check ───────────────────────────────────────────────
    @app.route("/api/health")
    def health():
        return {"status": "ok", "service": "LearningHUB API"}

    return app
