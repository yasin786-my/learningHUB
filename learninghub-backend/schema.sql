-- ============================================
-- LearningHUB Database Schema
-- ============================================

CREATE DATABASE IF NOT EXISTS learninghub
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE learninghub;

-- ============================================
-- Users table — stores all roles
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(80)  NOT NULL UNIQUE,
  email       VARCHAR(120) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  role        ENUM('admin','student') NOT NULL DEFAULT 'student',
  full_name   VARCHAR(150) DEFAULT NULL,
  avatar_url  VARCHAR(500) DEFAULT NULL,
  created_by  INT          DEFAULT NULL,
  is_active   BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_role       (role),
  INDEX idx_created_by (created_by),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================
-- Courses table — YouTube-link-based courses
-- ============================================
CREATE TABLE IF NOT EXISTS courses (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  title         VARCHAR(200) NOT NULL,
  description   TEXT,
  youtube_url   VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500) DEFAULT NULL,
  teacher_id    INT          NOT NULL,              -- admin who created the course
  is_published  BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_teacher (teacher_id),
  CONSTRAINT fk_teacher FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Enrollments — many-to-many between students & courses
-- ============================================
CREATE TABLE IF NOT EXISTS enrollments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  student_id  INT     NOT NULL,
  course_id   INT     NOT NULL,
  completed   BOOLEAN NOT NULL DEFAULT FALSE,
  progress    INT     NOT NULL DEFAULT 0,          -- 0-100 percentage
  enrolled_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME DEFAULT NULL,

  UNIQUE KEY uq_enrollment (student_id, course_id),
  INDEX idx_student (student_id),
  INDEX idx_course  (course_id),
  CONSTRAINT fk_enrollment_student FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_enrollment_course  FOREIGN KEY (course_id)  REFERENCES courses(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
-- Seed an admin account  (password: admin123)
-- The hash below is bcrypt for "admin123"
-- ============================================
-- NOTE: Admin is seeded from ADMIN_EMAIL / ADMIN_PASSWORD on first startup.
-- Students self-register via POST /api/auth/register.
