# Church Management System

A full-stack church management system with member management, attendance tracking, and community features.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: FastAPI + SQLAlchemy + PostgreSQL
- **Authentication**: JWT with refresh token rotation

## Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+

## Quick Start

### 1. Database Setup

Create the PostgreSQL database:

```bash
# Connect to PostgreSQL and create the database
psql -U postgres
CREATE DATABASE church_db;
\q
```

Or using pgAdmin, create a new database named `church_db`.

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Update .env file with your database credentials if needed
# DATABASE_URL=postgresql://postgres:your_password@localhost:5432/church_db

# Run database migrations
alembic upgrade head

# Start the backend server
uvicorn app.main:app --reload
```

The API will be available at http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs
- Health Check: http://localhost:8000/health

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will be available at http://localhost:5173

## Project Structure

```
church-management/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # API endpoints
│   │   ├── core/           # Core config, security, database
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   ├── alembic/            # Database migrations
│   └── tests/              # Backend tests
├── frontend/
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── store/          # Zustand stores
│   │   └── types/          # TypeScript types
│   └── public/             # Static assets
└── specs/                  # Project specifications
```

## Features (Phase 1)

### Authentication
- User registration with email verification
- JWT-based authentication with refresh tokens
- Password reset via email
- Role-based access control (admin, pastor, leader, member)

### Member Management
- Create, read, update, delete members
- Member directory with search and filters
- Member photo upload (S3 integration)
- Family relationship tracking

### Dashboard
- Overview statistics
- Recent members list
- Quick navigation

### Public Website
- Landing page
- Service times
- Navigation to events, sermons, prayer wall (Phase 2+)

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `GET /api/v1/auth/me` - Get current user

### Members
- `GET /api/v1/members` - List members
- `POST /api/v1/members` - Create member
- `GET /api/v1/members/{id}` - Get member
- `PUT /api/v1/members/{id}` - Update member
- `DELETE /api/v1/members/{id}` - Delete member (soft delete)
- `GET /api/v1/members/{id}/family` - Get family relationships
- `POST /api/v1/members/{id}/family` - Add family relationship
- `DELETE /api/v1/members/{id}/family/{rel_id}` - Remove relationship
- `POST /api/v1/members/{id}/photo` - Get photo upload URL

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/dashboard/recent-members` - Get recent members

## Default Credentials

The first user to register automatically becomes an admin.

## License

Private - All rights reserved
