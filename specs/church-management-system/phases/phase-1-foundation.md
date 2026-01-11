# Phase 1: Foundation

**Status:** Ready for Implementation
**Estimated Effort:** 2-3 weeks
**Dependencies:** None (starting point)

---

## Overview

Phase 1 establishes the core infrastructure for the Church Management System, including user authentication, member management with family relationships, and the admin dashboard shell. This phase creates the foundation that all subsequent phases build upon.

---

## Functional Requirements

### FR1: User Authentication

**FR1.1: User Registration**
- Registration form with: email, password, confirm password, first name, last name
- Password requirements: minimum 8 characters, 1 uppercase, 1 lowercase, 1 number
- Email uniqueness validation
- Send welcome email after registration
- **Success Criteria**: User can register; duplicate email rejected; welcome email sent

**FR1.2: User Login**
- Login with email and password
- Return access token (15 min) and refresh token (7 days)
- Store access token in memory, refresh token in httpOnly cookie
- **Success Criteria**: Valid credentials return tokens; invalid credentials return 401

**FR1.3: Token Refresh**
- Refresh access token using refresh token
- Rotate refresh token on use (old token invalidated)
- **Success Criteria**: New access token returned; old refresh token rejected after rotation

**FR1.4: Logout**
- Invalidate refresh token server-side
- Clear tokens from client
- **Success Criteria**: Refresh token no longer works after logout

**FR1.5: Password Reset**
- Request password reset via email
- Send reset link with time-limited token (1 hour)
- Reset password with valid token
- **Success Criteria**: Reset email received; password changed with valid token; expired token rejected

**FR1.6: Role-Based Access Control**
- Roles: admin, pastor, leader, member
- Protect admin routes from unauthorized roles
- First registered user is admin
- **Success Criteria**: Non-admin users cannot access admin endpoints

---

### FR2: Member Profiles

**FR2.1: Create Member**
- Required fields: first_name, last_name
- Optional fields: email, phone, date_of_birth, gender, address, join_date, baptism_date, notes
- Auto-link to user account if email matches
- **Success Criteria**: Member created with required fields; optional fields stored correctly

**FR2.2: Member Photo Upload**
- Upload photo via presigned S3 URL
- Accept: JPG, PNG (max 5MB)
- Resize to 400x400 on client before upload
- **Success Criteria**: Photo uploads to S3; URL saved to member record; displays in UI

**FR2.3: Edit Member**
- Update any member field
- Validation on email format, phone format
- Track updated_at timestamp
- **Success Criteria**: Fields update correctly; validation errors returned for invalid data

**FR2.4: Member Directory**
- List members with pagination (20 per page)
- Search by name (first or last)
- Filter by status (active, inactive, visitor)
- Sort by name or join date
- **Success Criteria**: Pagination works; search returns matches; filters apply correctly

**FR2.5: Delete Member (Soft Delete)**
- Set member_status to 'inactive'
- Preserve all member data
- Option to reactivate
- **Success Criteria**: Member hidden from active directory; can be reactivated

---

### FR3: Family Relationships

**FR3.1: Create Relationship**
- Link two members with relationship type
- Types: spouse, child, parent, sibling
- Automatic reciprocal relationship:
  - spouse ↔ spouse
  - child ↔ parent
  - sibling ↔ sibling
- **Success Criteria**: Both directions created; relationship displays on both profiles

**FR3.2: View Family**
- Show family members on profile page
- Group by relationship type
- Click to navigate to family member profile
- **Success Criteria**: All family members shown; navigation works

**FR3.3: Remove Relationship**
- Remove relationship removes both directions
- Confirm before removal
- **Success Criteria**: Both directions removed; confirmation required

---

### FR4: Admin Dashboard

**FR4.1: Dashboard Layout**
- Protected route requiring authentication
- Sidebar navigation (collapsible on mobile)
- Header with user menu (profile, logout)
- Main content area
- **Success Criteria**: Layout renders; sidebar collapses on mobile; logout works

**FR4.2: Dashboard Overview**
- Stats cards showing:
  - Total members
  - New members this month
  - Active cells (placeholder for Phase 2)
  - Upcoming events (placeholder for Phase 2)
- Recent members list (last 10)
- **Success Criteria**: Stats are accurate; recent members list populates

**FR4.3: Navigation**
- Navigation items:
  - Dashboard (home)
  - Members
  - Cells (placeholder)
  - Events (placeholder)
  - Sermons (placeholder)
  - Prayer Requests (placeholder)
  - Testimonies (placeholder)
  - Settings (placeholder)
- Active state on current page
- **Success Criteria**: Navigation links work; active state displays

---

### FR5: Public Website Shell

**FR5.1: Landing Page**
- Hero section with church name and tagline
- Service times section
- Featured content area (placeholder)
- Footer with contact info
- **Success Criteria**: Page loads; sections display; responsive design

**FR5.2: Navigation**
- Header with: Home, Events, Sermons, Prayer Wall, Login
- Mobile hamburger menu
- Login/Register buttons (or user menu if logged in)
- **Success Criteria**: Navigation works; mobile menu toggles; login state reflected

**FR5.3: Auth Pages**
- Login page with form
- Registration page with form
- Forgot password page
- Reset password page
- **Success Criteria**: Forms submit correctly; validation messages display

---

## Technical Tasks

### Backend Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Project setup | FastAPI project with folder structure | P0 |
| Database setup | SQLAlchemy, Alembic, PostgreSQL connection | P0 |
| User model | Users table with auth fields | P0 |
| Auth service | JWT generation, validation, password hashing | P0 |
| Auth endpoints | Register, login, refresh, logout, password reset | P0 |
| Member model | Members table with all fields | P0 |
| Member CRUD endpoints | Create, read, update, delete, list | P0 |
| Family relationships | Model and endpoints | P0 |
| Photo upload | S3 presigned URL generation | P1 |
| Dashboard stats | Endpoint for dashboard data | P1 |
| Email service | SES integration for transactional emails | P1 |
| Unit tests | Auth and member tests | P1 |

### Frontend Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Project setup | Vite + React + TypeScript + Tailwind | P0 |
| Router setup | React Router with public/protected routes | P0 |
| Auth context | Token storage, auth state, logout | P0 |
| API service | Axios with interceptors, token refresh | P0 |
| Login page | Form with validation | P0 |
| Register page | Form with validation | P0 |
| Admin layout | Sidebar, header, main area | P0 |
| Dashboard page | Stats cards, recent members | P0 |
| Member list page | Table with search, filter, pagination | P0 |
| Member form | Create/edit member form | P0 |
| Member detail page | Profile view with family | P0 |
| Photo upload | Client-side resize and upload | P1 |
| Public layout | Header, footer, nav | P1 |
| Landing page | Hero, sections | P1 |
| Password reset flow | Forgot/reset pages | P1 |

### Infrastructure Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Local Docker setup | docker-compose for PostgreSQL | P0 |
| AWS account setup | IAM, credentials | P1 |
| S3 bucket | Media storage bucket | P1 |
| RDS PostgreSQL | Database instance | P1 |
| Lambda deployment | Package and deploy backend | P2 |
| CloudFront + S3 | Frontend hosting | P2 |
| API Gateway | Connect to Lambda | P2 |

---

## API Endpoints for Phase 1

```
# Authentication
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me

# Members
GET    /api/v1/members
POST   /api/v1/members
GET    /api/v1/members/{id}
PUT    /api/v1/members/{id}
DELETE /api/v1/members/{id}
POST   /api/v1/members/{id}/photo

# Family
GET    /api/v1/members/{id}/family
POST   /api/v1/members/{id}/family
DELETE /api/v1/members/{id}/family/{relationship_id}

# Dashboard
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/recent-members
```

---

## Database Migrations for Phase 1

**Migration 001: Create users table**
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Migration 002: Create members table**
```sql
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',
    member_status VARCHAR(50) DEFAULT 'active',
    join_date DATE,
    baptism_date DATE,
    photo_url VARCHAR(500),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_status ON members(member_status);
CREATE INDEX idx_members_name ON members(last_name, first_name);
```

**Migration 003: Create family_relationships table**
```sql
CREATE TABLE family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    related_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, related_member_id)
);
```

---

## Success Criteria

### Automated
- [ ] Backend tests pass (`pytest`)
- [ ] Frontend tests pass (`npm run test`)
- [ ] Linting passes (backend and frontend)
- [ ] TypeScript compiles without errors
- [ ] All migrations run successfully
- [ ] API returns correct status codes

### Manual Testing
- [ ] Register new user
- [ ] Login with valid credentials
- [ ] Login rejected with invalid credentials
- [ ] Token refresh works
- [ ] Logout invalidates session
- [ ] Password reset email received
- [ ] Password reset works
- [ ] Create member
- [ ] Edit member
- [ ] Upload member photo
- [ ] Search members by name
- [ ] Filter members by status
- [ ] Add family relationship
- [ ] View family on profile
- [ ] Remove family relationship
- [ ] Dashboard shows correct stats
- [ ] Admin navigation works
- [ ] Public pages accessible without login
- [ ] Mobile responsive layout works
