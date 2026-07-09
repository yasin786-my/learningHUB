# LearningHUB — Production Deployment Guide

Deploy the full stack on free tiers:

| Layer    | Service  | Role                          |
|----------|----------|-------------------------------|
| Frontend | Vercel   | React + Vite SPA              |
| Backend  | Render   | Flask API (Gunicorn)          |
| Database | Supabase | PostgreSQL                    |

**Deploy order:** Supabase → Render (backend) → Vercel (frontend)

---

## Prerequisites

- GitHub repo with this project pushed
- Free accounts on [Supabase](https://supabase.com), [Render](https://render.com), and [Vercel](https://vercel.com)
- A strong admin password for the initial seeded account

---

## 1. Supabase (Database)

### Create the project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Choose a name, database password, and region
3. Wait for the project to finish provisioning

### Get the connection string

1. Open **Project Settings** → **Database**
2. Under **Connection string**, select **URI**
3. Choose **Session pooler** (recommended for Render free tier)
4. Copy the URI — it looks like:

   ```
   postgresql://postgres.[project-ref]:[YOUR-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
   ```

5. Replace `[YOUR-PASSWORD]` with your database password

> **Note:** Tables are created automatically on first backend startup via SQLAlchemy (`db.create_all()`). You do not need to run `schema.sql` manually unless you prefer manual setup.

### Supabase environment variables

Supabase does not need application env vars. You only copy `DATABASE_URL` into Render (next step).

---

## 2. Render (Backend)

### Option A — Blueprint (recommended)

1. Go to [dashboard.render.com](https://dashboard.render.com) → **New** → **Blueprint**
2. Connect your GitHub repo
3. Render reads `render.yaml` at the repo root and creates the web service

### Option B — Manual web service

1. **New** → **Web Service** → connect your repo
2. Configure:

   | Setting          | Value                                      |
   |------------------|--------------------------------------------|
   | Root Directory   | `learninghub-backend`                      |
   | Runtime          | Python                                     |
   | Build Command    | `pip install -r requirements.txt`          |
   | Start Command    | `gunicorn "run:app" --bind 0.0.0.0:$PORT --workers 2 --timeout 120` |
   | Health Check Path| `/api/health`                              |

### Render environment variables

In the Render service → **Environment**, add:

| Variable           | Value                                                                 |
|--------------------|-----------------------------------------------------------------------|
| `DATABASE_URL`     | Supabase Session pooler URI (from step 1)                             |
| `SECRET_KEY`       | Long random string (or let `render.yaml` auto-generate)               |
| `JWT_SECRET_KEY`   | Long random string (or let `render.yaml` auto-generate)               |
| `ADMIN_EMAIL`      | Email for the initial admin account                                   |
| `ADMIN_PASSWORD`   | Strong password for the initial admin                                 |
| `ADMIN_USERNAME`   | `admin` (optional — defaults to the part before `@` in `ADMIN_EMAIL`) |
| `ADMIN_FULL_NAME`  | `System Admin` (optional)                                             |
| `CORS_ORIGINS`     | Your Vercel URL, e.g. `https://your-app.vercel.app`                   |

> Set `CORS_ORIGINS` after you know your Vercel URL. You can update it later if the frontend URL changes.

### Deploy and verify

1. Click **Deploy** (or push to the connected branch)
2. When the deploy finishes, open:

   ```
   https://your-service.onrender.com/api/health
   ```

   Expected response:

   ```json
   { "status": "ok", "service": "LearningHUB API" }
   ```

3. On first successful startup, the backend seeds the admin user if no admin exists in the database.

> **Free tier note:** Render free services spin down after inactivity. The first request after idle may take 30–60 seconds.

---

## 3. Vercel (Frontend)

### Import the project

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → **Add New** → **Project**
2. Import your GitHub repo
3. Configure:

   | Setting            | Value                    |
   |--------------------|--------------------------|
   | Root Directory     | `learninghub-frontend`   |
   | Framework Preset   | Vite                     |
   | Build Command      | `npm run build` (default)|
   | Output Directory   | `dist` (default)         |

### Vercel environment variables

| Variable        | Value                                              |
|-----------------|----------------------------------------------------|
| `VITE_API_URL`  | `https://your-service.onrender.com/api`            |

Use your actual Render backend URL. **No trailing slash.**

### SPA routing

`learninghub-frontend/vercel.json` rewrites all routes to `index.html` so client-side routing works (no 404 on refresh).

### Deploy and verify

1. Deploy the project
2. Open your Vercel URL → you should land on `/login`
3. Sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` from Render

---

## 4. Final checklist

- [ ] Supabase project created; `DATABASE_URL` copied
- [ ] Render backend deployed; `/api/health` returns OK
- [ ] `ADMIN_EMAIL` and `ADMIN_PASSWORD` set on Render
- [ ] Vercel frontend deployed with `VITE_API_URL` pointing to Render
- [ ] `CORS_ORIGINS` on Render includes your Vercel URL
- [ ] Admin login works at `/login`
- [ ] Admin can create teachers from the dashboard

---

## Environment variable reference

### Render (backend)

```env
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
SECRET_KEY=your-random-secret
JWT_SECRET_KEY=your-jwt-secret
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=your-strong-password
ADMIN_USERNAME=admin
ADMIN_FULL_NAME=System Admin
CORS_ORIGINS=https://your-app.vercel.app
```

### Vercel (frontend)

```env
VITE_API_URL=https://your-service.onrender.com/api
```

### Local development

Copy examples and adjust:

```bash
# Backend
cp learninghub-backend/.env.example learninghub-backend/.env

# Frontend
cp learninghub-frontend/.env.example learninghub-frontend/.env
```

For local dev without Supabase, leave `DATABASE_URL` unset and use the `MYSQL_*` variables in `learninghub-backend/.env`.

---

## Troubleshooting

### Backend fails to start on Render

- Confirm `DATABASE_URL` uses `postgresql://` (not `postgres://`) — the app normalizes this automatically
- For Supabase, prefer the **Session pooler** URI (port `6543`)
- Check Render logs for connection or import errors

### CORS errors in the browser

- Ensure `CORS_ORIGINS` on Render exactly matches your Vercel URL (including `https://`)
- No trailing slash on the origin
- Redeploy the backend after changing `CORS_ORIGINS`

### Cannot log in as admin

- Confirm `ADMIN_EMAIL` and `ADMIN_PASSWORD` were set **before** the first deploy
- If the database already has users but no admin, set env vars and clear the `users` table in Supabase, then redeploy
- Check Render logs for `Seeded initial admin account for ...`

### 404 on page refresh (Vercel)

- Confirm `vercel.json` exists in `learninghub-frontend/`
- Redeploy the frontend after adding or changing `vercel.json`

### Slow first API request

- Normal on Render free tier — the service wakes from sleep. Subsequent requests are faster.

---

## Architecture overview

```
Browser (Vercel)
    │
    │  HTTPS  VITE_API_URL → /api/*
    ▼
Render (Gunicorn → Flask)
    │
    │  DATABASE_URL (SSL)
    ▼
Supabase PostgreSQL
```

**Auth flow:** Public registration is disabled. The initial admin is seeded from env vars on startup. Teachers and students are created by authenticated admin/teacher API routes.
