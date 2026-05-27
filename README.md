<p align="center">
  <img src="https://img.shields.io/badge/LearningHUB-LMS-6366F1?style=for-the-badge&logo=book&logoColor=white" alt="LearningHUB" />
</p>

<h1 align="center">📚 LearningHUB — Modern Learning Management System</h1>

<p align="center">
  <strong>A beautiful, production-ready, open-source learning management system built with React, Flask, and MySQL.</strong>
</p>

<p align="center">
  <strong>Features elegant dark UI with glassmorphism effects, full role-based access control (Admin, Teacher, Student), and YouTube-based course management.</strong>
</p>

---

## 🎨 Features

### Core Functionality
- **Authentication & Authorization** — JWT-based login, secure password hashing with bcrypt
- **Three User Roles** — Admin (system management), Teacher (course creation & student management), Student (course enrollment & progress tracking)
- **Role-Based Access Control (RBAC)** — Protected routes and API endpoints
- **YouTube Course Integration** — Teachers paste YouTube links (no heavy video uploads)
- **Course Assignment** — Teachers assign courses to multiple students at once
- **Progress Tracking** — Students mark courses as complete, track progress

### Design Highlights
- **Dark Theme** — Premium dark UI with sapphire blue and emerald green accents
- **Glassmorphism** — Modern frosted glass effect on cards and modals
- **Floating Animations** — Subtle ambient orbs and smooth transitions
- **Mobile-First** — Fully responsive on mobile, tablet, and desktop
- **Tilted Cards** — 3D perspective effect on course cards (ReactBits-style)
- **Glassmorphic Modals** — Beautiful forms with backdrop blur

---

## 📋 Project Structure
```
learninghub/
├── learninghub-backend/ # Flask REST API
│   ├── app/
│   │   ├── __init__.py # Flask app factory
│   │   ├── models.py # SQLAlchemy models (User, Course, Enrollment)
│   │   ├── routes/
│   │   │   ├── auth.py # Authentication (login, register, me)
│   │   │   ├── admin.py # Admin endpoints (user management)
│   │   │   ├── teacher.py # Teacher endpoints (courses, students)
│   │   │   └── student.py # Student endpoints (enrolled courses)
│   │   └── utils/
│   │       └── decorators.py # Role-based access decorators
│   ├── requirements.txt # Python dependencies
│   ├── run.py # Flask dev server entry point
│   ├── schema.sql # MySQL database schema
│   └── .env.example # Environment variables template
│
└── learninghub-frontend/ # React + Vite web app
    ├── src/
    │   ├── App.jsx # Main router component
    │   ├── main.jsx # React entry point
    │   ├── index.css # Global styles (Tailwind + custom)
    │   ├── api/
    │   │   └── axios.js # Configured HTTP client with JWT auth
    │   ├── components/
    │   │   └── common/
    │   │       ├── Navbar.jsx # Top navigation
    │   │       ├── Modal.jsx # Reusable modal overlay
    │   │       ├── GlassCard.jsx # Glassmorphic card wrapper
    │   │       ├── TiltedCard.jsx # 3D tilted card for courses
    │   │       ├── StatsCard.jsx # Statistics display card
    │   │       └── FloatingOrbs.jsx # Animated background orbs
    │   ├── context/
    │   │   └── AuthContext.jsx # Global auth state management
    │   ├── pages/
    │   │   ├── Login.jsx # Login page
    │   │   ├── Register.jsx # Admin registration page
    │   │   ├── AdminDashboard.jsx # Admin control panel
    │   │   ├── TeacherDashboard.jsx # Teacher management hub
    │   │   ├── StudentDashboard.jsx # Student course list
    │   │   └── VideoPlayer.jsx # YouTube video player page
    │   └── routes/
    │       └── ProtectedRoute.jsx # Route protection component
    ├── index.html # HTML entry point
    ├── package.json # Node.js dependencies
    ├── tailwind.config.js # Tailwind CSS configuration
    ├── vite.config.js # Vite bundler configuration
    ├── postcss.config.js # PostCSS plugins
    └── .env.example # Environment variables template
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** (for frontend)
- **Python 3.9+** (for backend)
- **MySQL 8.0+** (for database)
- **Git** (for version control)

### Backend Setup
1. **Clone and navigate:**
   ```bash
   cd learninghub-backend
   ```
2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate # On Windows: venv\Scripts\activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Set up database:**
   ```bash
   # Create database using schema
   mysql -u root -p < schema.sql
   
   # Or create manually via MySQL CLI
   mysql -u root -p
   > CREATE DATABASE learninghub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   > USE learninghub;
   > (paste contents of schema.sql)
   ```
5. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```
6. **Run development server:**
   ```bash
   python run.py
   ```
   Backend will be available at `http://localhost:5000`

### Frontend Setup
1. **Navigate to frontend:**
   ```bash
   cd learninghub-frontend
   ```
2. **Install dependencies:**
   ```bash
   npm install
   ```
3. **Configure environment:**
   ```bash
   cp .env.example .env
   # Default API URL is already set to http://localhost:5000/api
   ```
4. **Start development server:**
   ```bash
   npm run dev
   ```
   Frontend will be available at `http://localhost:5173`

### Initial Setup & Test Accounts
1. **Register first admin account:**
   - Navigate to `http://localhost:5173/register`
   - Create admin account (first registered user becomes admin)
   - Login to admin dashboard
2. **Create teacher account:**
   - Go to Admin Dashboard → Users → "Add Teacher"
   - Fill in teacher details
   - Login as teacher to create students and courses
3. **Sample test data:**
   ```
   Admin: username=admin, password=admin123
   Teacher: username=teacher, password=teacher123
   Student: username=student, password=student123
   ```

---

## 🔐 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` — Create admin account
- `POST /login` — Login (returns JWT token)
- `GET /me` — Get current user info

### Admin (`/api/admin`) — requires admin role
- `GET /overview` — System statistics
- `GET /users?role=teacher` — List users by role
- `POST /users` — Create teacher account
- `PUT /users/:id` — Update user
- `DELETE /users/:id` — Delete user

### Teacher (`/api/teacher`) — requires teacher role
- `GET /students` — List my students
- `POST /students` — Create student account
- `GET /courses` — List my courses
- `POST /courses` — Create YouTube course
- `PUT /courses/:id` — Update course
- `DELETE /courses/:id` — Delete course
- `POST /assign` — Assign course(s) to student(s)
- `GET /enrollments` — List all enrollments of my courses

### Student (`/api/student`) — requires student role
- `GET /courses` — List my enrolled courses
- `PUT /courses/:id/complete` — Mark course as complete/incomplete

---

## 🛠️ Tech Stack Details

**Backend:**
- Flask 3.1.1, Flask-SQLAlchemy, Flask-JWT-Extended, Flask-CORS, PyMySQL, bcrypt

**Frontend:**
- React 18, React Router v6, Tailwind CSS, Framer Motion, Axios, Vite

---

## 📄 License
This project is open-source and available under the [**MIT License**](LICENSE).

---

**LearningHUB** — Built with ❤️ for modern education. Happy learning! 🚀
