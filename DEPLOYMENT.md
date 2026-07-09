# LearningHUB — Deployment Guide

This guide walks you through deploying LearningHUB to production using free-tier hosting.

## Stack overview

| Component | Platform | Technology |
|-----------|----------|------------|
| Frontend | [Vercel](https://vercel.com) | React 18, Vite, Tailwind CSS |
| Backend | [Render](https://render.com) | Flask 3, Gunicorn, JWT |
| Database | [Supabase](https://supabase.com) | PostgreSQL |

```
┌─────────────┐     HTTPS      ┌──────────────┐     DATABASE_URL     ┌──────────────┐
│   Vercel    │ ─────────────► │    Render    │ ───────────────────► │   Supabase   │
│  (React)    │  /api/* calls  │   (Flask)    │      PostgreSQL      │  (Database)  │
└─────────────┘                └──────────────┘                      └──────────────┘
```

## How the app works in production

- **Admin** — Created automatically on first backend startup from `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Manages users and creates YouTube courses. All published courses are visible to every student.
- **Student** — Self-registers at `/register` with username, email, and password. Browses all published courses and tracks their own progress.

There is no public admin registration and no teacher role.

---

## Before you start

You will need:

- This repository pushed to GitHub
- Free accounts on Supabase, Render, and Vercel
- A strong password for the seeded admin account

**Deploy in this order:** Supabase → Render → Vercel

---

## Step 1 — Set up Supabase (database)

### 1.1 Create a project

1. Open the [Supabase Dashboard](https://supabase.com/dashboard)
2. Click **New project**
3. Set a project name, database password, and region
4. Wait until provisioning completes

### 1.2 Copy the connection string

1. Go to **Project Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Choose **Session pooler** (best for Render free tier)
4. Copy the URI and replace `[YOUR-PASSWORD]` with your database password

Example format:

```
postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

Save this value — you will paste it into Render as `DATABASE_URL`.

### 1.3 Schema

You do **not** need to run `schema.sql` manually. On first startup the Flask backend calls `db.create_all()` and creates all tables automatically.

---

## Step 2 — Deploy the backend on Render

### 2.1 Create the service

**Option A — Blueprint (recommended)**

1. Open [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Blueprint**
3. Connect your GitHub repository
4. Render reads `render.yaml` from the repo root and provisions the service

**Option B — Manual setup**

1. Click **New** → **Web Service**
2. Connect your GitHub repository
3. Use these settings:

| Field | Value |
|-------|-------|
| Root Directory | `learninghub-backend` |
| Runtime | Python |
| Build Command | `pip install -r requirements.txt` |
| Start Command | `gunicorn "run:app" --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
| Health Check Path | `/api/health` |

The entry point is `run.py`, which exposes `app = create_app()` for Gunicorn.

### 2.2 Set environment variables

In your Render service, go to **Environment** and add:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Supabase Session pooler URI from Step 1 |
| `SECRET_KEY` | Yes | Random secret for Flask sessions |
| `JWT_SECRET_KEY` | Yes | Random secret for JWT tokens |
| `ADMIN_EMAIL` | Yes | Email for the seeded admin account |
| `ADMIN_PASSWORD` | Yes | Password for the seeded admin account |
| `ADMIN_USERNAME` | No | Defaults to the part before `@` in `ADMIN_EMAIL` |
| `ADMIN_FULL_NAME` | No | Defaults to `System Admin` |
| `CORS_ORIGINS` | Yes | Your Vercel frontend URL (set after Step 3) |

`render.yaml` auto-generates `SECRET_KEY` and `JWT_SECRET_KEY` if you use the Blueprint. You must still add `DATABASE_URL`, admin credentials, and `CORS_ORIGINS` manually.

**Copy-paste template for Render:**

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SECRET_KEY=generate-a-long-random-string
JWT_SECRET_KEY=generate-another-long-random-string
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-admin-password
ADMIN_USERNAME=admin
ADMIN_FULL_NAME=System Admin
CORS_ORIGINS=https://your-app.vercel.app
```

### 2.3 Deploy and verify

1. Trigger a deploy (push to your connected branch or click **Manual Deploy**)
2. Open `https://your-service.onrender.com/api/health`
3. Confirm the response:

```json
{ "status": "ok", "service": "LearningHUB API" }
```

4. Check Render logs for: `Seeded initial admin account for admin@yourdomain.com`

> **Free tier:** Render spins down idle services. The first request after sleep can take 30–60 seconds.

---

## Step 3 — Deploy the frontend on Vercel

### 3.1 Import the project

1. Open [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:

| Field | Value |
|-------|-------|
| Root Directory | `learninghub-frontend` |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

### 3.2 Set environment variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-service.onrender.com/api` |

Use your actual Render URL. **No trailing slash.**

```env
VITE_API_URL=https://your-service.onrender.com/api
```

### 3.3 SPA routing

The file `learninghub-frontend/vercel.json` is already configured:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This prevents 404 errors when refreshing routes like `/login`, `/register`, or `/student`.

### 3.4 Deploy and connect CORS

1. Deploy the frontend
2. Copy your Vercel URL (e.g. `https://learninghub.vercel.app`)
3. Go back to Render → **Environment** → set `CORS_ORIGINS` to that URL
4. Redeploy the backend so CORS takes effect

---

## Step 4 — Verify everything works

### Admin flow

1. Open `https://your-app.vercel.app/login`
2. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. You should land on the Admin Dashboard
4. Go to **Courses** → add a YouTube course
5. The course is immediately available to all students

### Student flow

1. Open `https://your-app.vercel.app/register`
2. Create a student account (username, email, password)
3. You should land on the Student Dashboard with all published courses visible
4. Open any course to watch and mark progress

### Checklist

- [ ] Supabase project created; `DATABASE_URL` saved
- [ ] Render backend live; `/api/health` returns OK
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` set before first deploy
- [ ] Admin login works at `/login`
- [ ] Student registration works at `/register`
- [ ] Vercel deployed with correct `VITE_API_URL`
- [ ] `CORS_ORIGINS` on Render matches Vercel URL exactly
- [ ] Admin can create courses
- [ ] Student sees all published courses after login

---

## Environment variables — quick reference

### Render (backend)

| Variable | Example |
|----------|---------|
| `DATABASE_URL` | `postgresql://postgres.xxx:pass@...pooler.supabase.com:6543/postgres` |
| `SECRET_KEY` | `8f3a9c2e...` |
| `JWT_SECRET_KEY` | `b7d1e4f0...` |
| `ADMIN_EMAIL` | `admin@school.edu` |
| `ADMIN_PASSWORD` | `SecurePass123!` |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_FULL_NAME` | `System Admin` |
| `CORS_ORIGINS` | `https://learninghub.vercel.app` |

### Vercel (frontend)

| Variable | Example |
|----------|---------|
| `VITE_API_URL` | `https://learninghub-backend.onrender.com/api` |

### Supabase

No application env vars needed. Only copy the database URI into Render.

---

## Local development

### Backend

```bash
cd learninghub-backend
cp .env.example .env
pip install -r requirements.txt
python run.py
```

API runs at `http://localhost:5000`.

**Database options:**

- **Supabase locally** — set `DATABASE_URL` in `.env`
- **Local MySQL** — leave `DATABASE_URL` unset and configure `MYSQL_*` variables instead

### Frontend

```bash
cd learninghub-frontend
cp .env.example .env
npm install
npm run dev
```

App runs at `http://localhost:5173`.

Default `.env` values:

```env
# Backend (.env)
CORS_ORIGINS=http://localhost:5173
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-strong-password

# Frontend (.env)
VITE_API_URL=http://localhost:5000/api
```

---

## Troubleshooting

### Backend won't start on Render

| Symptom | Fix |
|---------|-----|
| Database connection error | Use the Supabase **Session pooler** URI (port `6543`) |
| `postgres://` vs `postgresql://` | The app normalizes this automatically — either works |
| Import / dependency errors | Check Render build logs; confirm `requirements.txt` installs cleanly |
| SSL errors with Supabase | Ensure the hostname contains `supabase` or add `?sslmode=require` to the URI |

### CORS errors in the browser

- `CORS_ORIGINS` must exactly match your Vercel URL: `https://your-app.vercel.app`
- No trailing slash
- Redeploy the backend after changing `CORS_ORIGINS`

### Admin login fails

- Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` **before** the first deploy
- Check Render logs for `Seeded initial admin account for ...`
- If the database has users but no admin, clear the `users` table in Supabase SQL Editor and redeploy

### Student registration fails

- Confirm the backend is running (`/api/health`)
- Check that `VITE_API_URL` on Vercel points to the correct Render URL
- Username and email must be unique; password must be at least 6 characters

### 404 on page refresh (Vercel)

- Confirm `learninghub-frontend/vercel.json` exists
- Redeploy the frontend

### Slow API responses

- Normal on Render free tier after idle — the service is waking up
- Subsequent requests are faster

### Existing database with old `teacher` role

If you migrated from an older version that used a teacher role, delete or update any `teacher` rows in the `users` table before redeploying. The current schema only supports `admin` and `student`.

---

## Project files reference

| File | Purpose |
|------|---------|
| `render.yaml` | Render Blueprint — Python service, Gunicorn, health check |
| `learninghub-backend/run.py` | Flask entry point (`run:app`) |
| `learninghub-backend/requirements.txt` | Python deps including `psycopg2-binary` and `gunicorn` |
| `learninghub-backend/.env.example` | Backend env var template |
| `learninghub-frontend/vercel.json` | SPA rewrite rules for client-side routing |
| `learninghub-frontend/.env.example` | Frontend env var template |

---

## API endpoints (production)

| Endpoint | Access | Purpose |
|----------|--------|---------|
| `GET /api/health` | Public | Health check |
| `POST /api/auth/register` | Public | Student self-registration |
| `POST /api/auth/login` | Public | Login (admin or student) |
| `GET /api/auth/me` | Authenticated | Current user profile |
| `GET /api/admin/*` | Admin only | Users and courses |
| `GET /api/student/*` | Student only | All published courses, progress |
