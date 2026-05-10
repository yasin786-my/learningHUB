# LearningHUB — Modern Learning Management System

A beautiful, production-ready, open-source learning management system built with React, Flask, and MySQL. Features an elegant dark UI with glassmorphism effects, full role-based access control (Admin, Teacher, Student), and YouTube-based course management.

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

## 📋 Project Structure

```
learninghub/
├── learninghub-backend/          # Flask REST API
│   ├── app/
│   │   ├── __init__.py           # Flask app factory
│   │   ├── models.py             # SQLAlchemy models (User, Course, Enrollment)
│   │   ├── routes/
│   │   │   ├── auth.py           # Authentication (login, register, me)
│   │   │   ├── admin.py          # Admin endpoints (user management)
│   │   │   ├── teacher.py        # Teacher endpoints (courses, students)
│   │   │   └── student.py        # Student endpoints (enrolled courses)
│   │   └── utils/
│   │       └── decorators.py     # Role-based access decorators
│   ├── requirements.txt          # Python dependencies
│   ├── run.py                    # Flask dev server entry point
│   ├── schema.sql                # MySQL database schema
│   └── .env.example              # Environment variables template
│
└── learninghub-frontend/          # React + Vite web app
    ├── src/
    │   ├── App.jsx               # Main router component
    │   ├── main.jsx              # React entry point
    │   ├── index.css             # Global styles (Tailwind + custom)
    │   ├── api/
    │   │   └── axios.js          # Configured HTTP client with JWT auth
    │   ├── components/
    │   │   └── common/
    │   │       ├── Navbar.jsx    # Top navigation
    │   │       ├── Modal.jsx     # Reusable modal overlay
    │   │       ├── GlassCard.jsx # Glassmorphic card wrapper
    │   │       ├── TiltedCard.jsx # 3D tilted card for courses
    │   │       ├── StatsCard.jsx # Statistics display card
    │   │       └── FloatingOrbs.jsx # Animated background orbs
    │   ├── context/
    │   │   └── AuthContext.jsx   # Global auth state management
    │   ├── pages/
    │   │   ├── Login.jsx         # Login page
    │   │   ├── Register.jsx      # Admin registration page
    │   │   ├── AdminDashboard.jsx # Admin control panel
    │   │   ├── TeacherDashboard.jsx # Teacher management hub
    │   │   ├── StudentDashboard.jsx # Student course list
    │   │   └── VideoPlayer.jsx   # YouTube video player page
    │   └── routes/
    │       └── ProtectedRoute.jsx # Route protection component
    ├── index.html                # HTML entry point
    ├── package.json              # Node.js dependencies
    ├── tailwind.config.js        # Tailwind CSS configuration
    ├── vite.config.js            # Vite bundler configuration
    ├── postcss.config.js         # PostCSS plugins
    └── .env.example              # Environment variables template
```

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
   source venv/bin/activate  # On Windows: venv\Scripts\activate
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

## 🎨 Design System

### Colors
- **Primary (Sapphire)** — `#3b50e0` (teacher accent, interactive elements)
- **Secondary (Emerald)** — `#10b981` (student accent, success states)
- **Background** — `#0a0e27` (dark-950)
- **Text** — `#e2e8f0` (light gray)

### Components
- **GlassCard** — Glassmorphic containers with optional color variants
- **TiltedCard** — 3D perspective cards with mouse tracking
- **StatsCard** — Icon + value + label stats display
- **Modal** — Backdrop blur overlay with smooth animations
- **Navbar** — Sticky navigation with user info
- **FloatingOrbs** — Ambient animated background elements

### Typography
- **Font Family** — Inter (system font stack)
- **Display Font** — Inter Bold (headings)
- **Sizes** — Mobile-first, scale up responsively

## 🛠️ Tech Stack Details

### Backend
- **Framework:** Flask 3.1.1
- **Authentication:** Flask-JWT-Extended 4.7.1
- **Database ORM:** Flask-SQLAlchemy 3.1.1
- **CORS:** Flask-CORS 5.0.1
- **Password Hashing:** bcrypt 4.3.0
- **Database Driver:** PyMySQL 1.1.1

### Frontend
- **Framework:** React 18.3.1
- **Router:** React Router v6 6.28.0
- **Styling:** Tailwind CSS 3.4.16
- **Animations:** Framer Motion 11.15.0
- **HTTP Client:** Axios 1.7.9
- **Icons:** React Icons 5.4.0
- **Notifications:** React Hot Toast 2.5.1
- **Bundler:** Vite 6.0.3

## 📱 Responsive Breakpoints

- **Mobile** — 0px and up (base)
- **Tablet** — 768px and up (`md:`)
- **Desktop** — 1024px and up (`lg:`)

All pages are fully responsive and tested on mobile devices.

## 🔒 Security Features

- **JWT Authentication** — Stateless, expiring tokens (24 hours)
- **Password Hashing** — bcrypt with salt rounds
- **Role-Based Access Control** — Server-side verification on every request
- **CORS Protection** — Configurable allowed origins
- **SQL Injection Prevention** — SQLAlchemy ORM parameterized queries
- **XSS Prevention** — React auto-escaping, CSP headers recommended

## 📦 Deployment

### Backend (Production)
```bash
# Use production server (Gunicorn)
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 run:app

# Use environment variables for sensitive data
export FLASK_ENV=production
export SECRET_KEY=your-strong-secret-key
export JWT_SECRET_KEY=your-strong-jwt-key
```

### Frontend (Production)
```bash
# Build optimized bundle
npm run build

# Serve with any static server (Nginx, Vercel, etc.)
npm run preview  # Local preview of production build
```

### Using Docker (Optional)
```bash
# Build backend image
docker build -t learninghub-backend ./learninghub-backend

# Build frontend image
docker build -t learninghub-frontend ./learninghub-frontend

# Run with docker-compose (create docker-compose.yml)
docker-compose up
```

## 🧪 Testing

### Backend
```bash
# Activate virtual environment
source venv/bin/activate

# Run tests (add pytest to requirements.txt first)
pytest tests/
```

### Frontend
```bash
# Run tests
npm run test

# Test coverage
npm run test:coverage
```

## 🐛 Troubleshooting

### Backend Issues
- **Port 5000 already in use:** `lsof -ti:5000 | xargs kill` (Mac/Linux) or use `PORT=5001 python run.py`
- **Database connection error:** Verify MySQL is running and credentials in `.env` are correct
- **CORS errors:** Check `CORS_ORIGINS` in `.env` matches your frontend URL

### Frontend Issues
- **API calls fail:** Ensure backend is running and `VITE_API_URL` in `.env` is correct
- **Styles not loading:** Clear browser cache and rebuild: `rm -rf node_modules && npm install`
- **Port 5173 already in use:** `npm run dev -- --port 5174`

## 📝 Environment Variables

### Backend (.env)
```
FLASK_ENV=development
SECRET_KEY=dev-secret-key
JWT_SECRET_KEY=jwt-dev-secret-key
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_DB=learninghub
CORS_ORIGINS=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Code Style
- **Backend:** PEP 8 (Python)
- **Frontend:** ESLint + Prettier (JavaScript)

## 📄 License

This project is open-source and available under the **MIT License** — see `LICENSE` file for details.

## 🙏 Acknowledgments

- **ReactBits** — Inspiration for tilted cards and 3D effects
- **Tailwind CSS** — Utility-first CSS framework
- **Framer Motion** — Animation library
- **Flask** — Python web framework
- **YouTube Embedded Player** — Video integration

## 📞 Support

- **Issues** — Open an issue on GitHub for bugs
- **Discussions** — Use GitHub Discussions for questions
- **Email** — amohamedyasin7786@gmail.com

---

**LearningHUB** — Built with ❤️ for modern education. Happy learning! 🚀
