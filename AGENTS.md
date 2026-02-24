# AGENTS.md

## Cursor Cloud specific instructions

### Architecture

Church Management System — full-stack app with two services:

| Service | Stack | Port | Dev command |
|---------|-------|------|-------------|
| Backend | FastAPI + SQLAlchemy + PostgreSQL | 8000 | `cd backend && source venv/bin/activate && uvicorn app.main:app --reload` |
| Frontend | React 19 + Vite + TypeScript + Tailwind | 5173 | `cd frontend && npm run dev` |

Vite proxies `/api` requests to the backend (see `frontend/vite.config.ts`).

### Prerequisites

- **PostgreSQL** must be running with a `church_db` database and user `postgres`/`postgres`.
- Start PostgreSQL: `sudo service postgresql start`
- The backend `.env` file (copied from `.env.example`) contains the `DATABASE_URL`.

### Backend

- Python venv lives at `backend/venv/`. Activate with `source backend/venv/bin/activate`.
- The DB URL scheme is `postgresql://` which requires **psycopg2-binary** (not listed in `requirements.txt` but needed at runtime). The update script installs it.
- Run migrations: `cd backend && source venv/bin/activate && alembic upgrade head`
- Lint: `ruff check .` (from backend dir, venv activated)
- Tests: `python -m pytest tests/ -v` — uses SQLite in-memory, no PostgreSQL needed.
- 3 pre-existing test failures in `test_*_unauthenticated` tests (assert 403 but get 401). These are not caused by environment issues.

### Frontend

- Uses **npm** (has `package-lock.json`).
- Lint: `npx eslint .` (3 pre-existing warnings about react-hook-form incompatible library, 0 errors)
- Type-check: `npx tsc -b`
- Build: `npm run build` (runs `tsc -b && vite build`)

### First user

The first registered user automatically becomes admin. See README.md "Default Credentials".
