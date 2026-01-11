# Church Management System - Technical Specification

**Status:** Ready for Review
**Created:** 2026-01-11
**Last Updated:** 2026-01-11
**Owner:** Development Team

---

## Overview

A full-stack church management system designed for medium-sized churches (200-1000 members). The system provides member management, attendance tracking, sermon media hosting, and community engagement features through a React frontend and Python FastAPI backend, deployed on AWS serverless infrastructure.

The platform consists of two main interfaces: a public-facing website for members and visitors, and a protected admin dashboard for church leadership. Authentication uses custom JWT tokens with role-based access control. The architecture follows a single-church deployment model optimized for cost-efficiency (~$25-50/month on AWS).

---

## Out Of Scope

1. **Multi-Church SaaS Features**: No tenant isolation, subdomain routing, or church-level configuration. This is a single-church deployment. Multi-tenancy can be added in a future phase if needed.

2. **Payment Processing (Phase 4 Deferred)**: Online donations, tithe payments, and financial reporting are deferred until payment providers are selected and configured. The database schema will include placeholder tables for future implementation.

3. **Mobile Native Apps**: No iOS/Android native applications. The web application will be PWA-ready for mobile installation but native apps are out of scope.

4. **Advanced Communication Tools**: Bulk SMS, email campaigns, and automated messaging workflows are not included in the MVP. Basic email notifications (password reset, welcome email) are included.

5. **Live Streaming Integration**: Sermon uploads support pre-recorded audio/video only. Live streaming integration (YouTube Live, Facebook Live) is not included.

6. **Advanced Reporting & Analytics**: Basic dashboards with counts and simple charts are included. Advanced analytics, custom report builders, and data export tools are deferred.

---

## Technology Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18+ | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| Tailwind CSS | Styling |
| shadcn/ui | Component library |
| React Router v6 | Routing |
| React Hook Form + Zod | Form handling & validation |
| TanStack Query | Server state management |
| Zustand | Client state management |
| React Player | Media playback |

### Backend
| Technology | Purpose |
|------------|---------|
| Python 3.11+ | Runtime |
| FastAPI | API framework |
| SQLAlchemy 2.0 | ORM |
| Alembic | Database migrations |
| Pydantic v2 | Validation & serialization |
| python-jose | JWT handling |
| passlib + bcrypt | Password hashing |
| boto3 | AWS SDK |
| Mangum | Lambda adapter |

### Infrastructure (AWS)
| Service | Purpose | Est. Cost |
|---------|---------|-----------|
| S3 | Frontend hosting + media storage | ~$2/mo |
| CloudFront | CDN for frontend and media | ~$5/mo |
| API Gateway | REST API endpoint | ~$3/mo |
| Lambda | Backend compute | Free tier |
| RDS PostgreSQL | Database (t3.micro) | ~$15/mo |
| SES | Transactional email | ~$1/mo |
| Secrets Manager | Credentials storage | ~$1/mo |
| **Total** | | **~$25-30/mo** |

---

## Database Schema

### Core Tables

```sql
-- Users table (authentication)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',  -- admin, pastor, leader, member
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP
);

-- Members table (profiles)
CREATE TABLE members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,

    -- Personal Info
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),

    -- Address
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Kenya',

    -- Church Info
    member_status VARCHAR(50) DEFAULT 'active',  -- active, inactive, visitor
    join_date DATE,
    baptism_date DATE,
    photo_url VARCHAR(500),
    notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Family relationships
CREATE TABLE family_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    related_member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    relationship_type VARCHAR(50) NOT NULL,  -- spouse, child, parent, sibling
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(member_id, related_member_id)
);

-- Cell groups (small groups)
CREATE TABLE cells (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES members(id),
    assistant_leader_id UUID REFERENCES members(id),
    meeting_day VARCHAR(20),
    meeting_time TIME,
    meeting_location TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cell memberships
CREATE TABLE cell_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(cell_id, member_id)
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,  -- service, cell_meeting, conference, special, other
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP,
    location VARCHAR(255),
    capacity INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),  -- RRULE format
    parent_event_id UUID REFERENCES events(id),  -- for recurring instances
    is_public BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_method VARCHAR(20) DEFAULT 'manual',  -- manual, qr_code, self
    checked_in_by UUID REFERENCES users(id),
    notes TEXT,
    UNIQUE(event_id, member_id)
);

-- Sermons
CREATE TABLE sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    speaker_id UUID REFERENCES members(id),
    speaker_name VARCHAR(200),  -- fallback if speaker not a member
    series_id UUID REFERENCES sermon_series(id),
    sermon_date DATE NOT NULL,
    scripture_reference VARCHAR(255),
    duration_seconds INTEGER,

    -- Media
    audio_url VARCHAR(500),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    notes_url VARCHAR(500),  -- PDF or document

    -- Metadata
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sermon series
CREATE TABLE sermon_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    thumbnail_url VARCHAR(500),
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prayer requests
CREATE TABLE prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    author_name VARCHAR(200),  -- for anonymous or non-member submissions
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'active',  -- active, answered, archived
    prayer_count INTEGER DEFAULT 0,
    answered_at TIMESTAMP,
    answer_testimony TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Prayer interactions (who prayed)
CREATE TABLE prayer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    prayed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prayer_request_id, member_id)
);

-- Testimonies
CREATE TABLE testimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    author_name VARCHAR(200),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),  -- healing, provision, salvation, deliverance, other
    media_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, rejected
    is_featured BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Placeholder tables for Phase 4 (Finance)
CREATE TABLE donation_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,  -- tithe, offering, missions, building_fund, etc.
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    donor_name VARCHAR(200),
    category_id UUID REFERENCES donation_categories(id),
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KES',
    payment_method VARCHAR(50),  -- cash, mpesa, bank_transfer, card
    transaction_reference VARCHAR(255),
    donation_date DATE NOT NULL,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_members_user_id ON members(user_id);
CREATE INDEX idx_members_status ON members(member_status);
CREATE INDEX idx_members_name ON members(last_name, first_name);
CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);
CREATE INDEX idx_events_datetime ON events(start_datetime);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_sermons_date ON sermons(sermon_date);
CREATE INDEX idx_sermons_published ON sermons(is_published);
CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX idx_testimonies_status ON testimonies(status);
```

---

## API Structure

### Base URL
```
Production: https://api.yourchurch.com/api/v1
Development: http://localhost:8000/api/v1
```

### Authentication Endpoints
```
POST   /auth/register          # Register new user
POST   /auth/login             # Login, returns JWT tokens
POST   /auth/refresh           # Refresh access token
POST   /auth/logout            # Invalidate refresh token
POST   /auth/forgot-password   # Request password reset
POST   /auth/reset-password    # Reset password with token
GET    /auth/me                # Get current user profile
```

### Member Endpoints
```
GET    /members                # List members (paginated, filterable)
POST   /members                # Create member
GET    /members/{id}           # Get member by ID
PUT    /members/{id}           # Update member
DELETE /members/{id}           # Delete member (soft delete)
GET    /members/{id}/family    # Get family relationships
POST   /members/{id}/family    # Add family relationship
DELETE /members/{id}/family/{rel_id}  # Remove relationship
POST   /members/{id}/photo     # Upload member photo
GET    /members/directory      # Public member directory
```

### Cell Group Endpoints
```
GET    /cells                  # List cell groups
POST   /cells                  # Create cell group
GET    /cells/{id}             # Get cell group
PUT    /cells/{id}             # Update cell group
DELETE /cells/{id}             # Delete cell group
GET    /cells/{id}/members     # List cell members
POST   /cells/{id}/members     # Add member to cell
DELETE /cells/{id}/members/{member_id}  # Remove from cell
```

### Event Endpoints
```
GET    /events                 # List events (filterable by date, type)
POST   /events                 # Create event
GET    /events/{id}            # Get event details
PUT    /events/{id}            # Update event
DELETE /events/{id}            # Delete event
GET    /events/upcoming        # Get upcoming public events
POST   /events/{id}/attendance # Record attendance
GET    /events/{id}/attendance # Get attendance list
```

### Sermon Endpoints
```
GET    /sermons                # List sermons (paginated)
POST   /sermons                # Create sermon
GET    /sermons/{id}           # Get sermon details
PUT    /sermons/{id}           # Update sermon
DELETE /sermons/{id}           # Delete sermon
POST   /sermons/{id}/upload    # Get presigned URL for media upload
GET    /sermons/series         # List sermon series
POST   /sermons/series         # Create series
GET    /sermons/series/{id}    # Get series with sermons
```

### Prayer Request Endpoints
```
GET    /prayer-requests        # List prayer requests (public)
POST   /prayer-requests        # Submit prayer request
GET    /prayer-requests/{id}   # Get prayer request
PUT    /prayer-requests/{id}   # Update prayer request
DELETE /prayer-requests/{id}   # Delete prayer request
POST   /prayer-requests/{id}/pray     # Record prayer
PUT    /prayer-requests/{id}/answered # Mark as answered
GET    /prayer-requests/my     # Get my prayer requests
```

### Testimony Endpoints
```
GET    /testimonies            # List approved testimonies
POST   /testimonies            # Submit testimony
GET    /testimonies/{id}       # Get testimony
PUT    /testimonies/{id}       # Update testimony
DELETE /testimonies/{id}       # Delete testimony
GET    /testimonies/pending    # Admin: list pending testimonies
PUT    /testimonies/{id}/approve  # Admin: approve/reject
GET    /testimonies/my         # Get my testimonies
```

### Dashboard Endpoints
```
GET    /dashboard/stats        # Get dashboard statistics
GET    /dashboard/recent-members    # Recent member registrations
GET    /dashboard/upcoming-events   # Upcoming events
GET    /dashboard/attendance-summary # Attendance trends
```

---

## Functional Requirements by Phase

### Phase 1: Foundation (MVP Core)

**FR1: User Authentication**
- FR1.1: Users can register with email and password
- FR1.2: Users can login and receive JWT access + refresh tokens
- FR1.3: Access tokens expire in 15 minutes, refresh tokens in 7 days
- FR1.4: Users can logout (invalidate refresh token)
- FR1.5: Users can request password reset via email
- FR1.6: Role-based access control: admin, pastor, leader, member
- **Success Criteria**: All auth endpoints return correct responses; tokens are validated correctly; unauthorized access is blocked

**FR2: Member Profiles**
- FR2.1: Create member with required fields (first name, last name) and optional fields
- FR2.2: Upload and display member profile photos (stored in S3)
- FR2.3: Edit member profiles with validation
- FR2.4: View member directory with search by name, filter by status
- FR2.5: Soft delete members (mark inactive, preserve data)
- **Success Criteria**: CRUD operations work correctly; photos upload to S3; search returns accurate results

**FR3: Family Relationships**
- FR3.1: Link members as family (spouse, child, parent, sibling)
- FR3.2: Bidirectional relationships (if A is spouse of B, B is spouse of A)
- FR3.3: View family members on member profile
- FR3.4: Remove family relationships
- **Success Criteria**: Relationships are bidirectional; family tree displays correctly on profile

**FR4: Admin Dashboard**
- FR4.1: Protected admin routes requiring authentication
- FR4.2: Dashboard overview showing: total members, new this month, active cells, upcoming events
- FR4.3: Responsive sidebar navigation
- FR4.4: Quick access to recent members and upcoming events
- **Success Criteria**: Dashboard loads with accurate stats; navigation works; mobile responsive

**FR5: Public Website Shell**
- FR5.1: Landing page with church info and featured content
- FR5.2: Upcoming events listing (public events only)
- FR5.3: Login and registration pages
- FR5.4: Responsive design for mobile devices
- **Success Criteria**: Public pages load without auth; mobile responsive; links work correctly

---

### Phase 2: Attendance & Cell Groups

**FR6: Cell Group Management**
- FR6.1: Create, edit, delete cell groups
- FR6.2: Assign leader and assistant leader
- FR6.3: Set meeting schedule (day, time, location)
- FR6.4: Add/remove members from cells
- FR6.5: View cell roster with member details
- **Success Criteria**: CRUD works; members can belong to one cell; leaders can view their cell

**FR7: Event Management**
- FR7.1: Create events with type, date/time, location, capacity
- FR7.2: Support recurring events (weekly services)
- FR7.3: Edit and cancel events
- FR7.4: Public events visible on website
- FR7.5: Calendar view in admin dashboard
- **Success Criteria**: Events display on calendar; recurring events generate instances; public/private separation works

**FR8: Attendance Tracking**
- FR8.1: Manual attendance check-in by admin/leader
- FR8.2: Self check-in by members (for enabled events)
- FR8.3: QR code generation for quick check-in
- FR8.4: View attendance list per event
- FR8.5: Attendance reports by member, by event, by date range
- **Success Criteria**: Check-in records attendance; reports show accurate data; QR codes work

---

### Phase 3: Content & Community

**FR9: Sermon Management**
- FR9.1: Create sermons with title, speaker, date, scripture
- FR9.2: Upload audio files (MP3, up to 200MB)
- FR9.3: Upload video files (MP4, up to 2GB)
- FR9.4: Organize sermons into series
- FR9.5: Publish/unpublish sermons
- FR9.6: Public sermon listing with search and filters
- FR9.7: Audio/video player on sermon detail page
- **Success Criteria**: Media uploads to S3; streaming works via CloudFront; search returns results

**FR10: Prayer Requests**
- FR10.1: Submit prayer requests (members and guests)
- FR10.2: Option for anonymous submissions
- FR10.3: Public prayer wall showing approved requests
- FR10.4: "I Prayed" button with counter
- FR10.5: Mark prayer as answered with testimony
- FR10.6: Admin moderation queue
- **Success Criteria**: Submissions work; prayer count increments; answered status updates

**FR11: Testimonies**
- FR11.1: Submit testimonies with title and content
- FR11.2: Categorize testimonies (healing, provision, etc.)
- FR11.3: Optional media attachment
- FR11.4: Admin approval workflow
- FR11.5: Public testimony listing
- FR11.6: Featured testimonies on homepage
- **Success Criteria**: Submissions require approval; approved testimonies display publicly; featured shows on home

---

### Phase 4: Finance (Deferred)

**FR12: Donation Recording** (Manual entry only until payment integration)
- FR12.1: Record donations with amount, category, donor, date
- FR12.2: Donation categories (tithe, offering, missions, etc.)
- FR12.3: View donation history by member
- FR12.4: Basic financial reports (monthly totals by category)
- **Success Criteria**: Donations record correctly; reports calculate accurately

---

## Technical Design

### Project Structure

```
church-management/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui components
│   │   │   ├── forms/           # Form components
│   │   │   ├── layouts/         # Layout components
│   │   │   └── shared/          # Shared components
│   │   ├── pages/
│   │   │   ├── public/          # Public website pages
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Events.tsx
│   │   │   │   ├── Sermons.tsx
│   │   │   │   └── PrayerWall.tsx
│   │   │   ├── auth/            # Auth pages
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Register.tsx
│   │   │   │   └── ForgotPassword.tsx
│   │   │   └── admin/           # Admin dashboard pages
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Members/
│   │   │       ├── Cells/
│   │   │       ├── Events/
│   │   │       ├── Sermons/
│   │   │       ├── PrayerRequests/
│   │   │       └── Testimonies/
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API service functions
│   │   ├── store/               # Zustand stores
│   │   ├── types/               # TypeScript types
│   │   ├── utils/               # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/
│   │   │       │   ├── auth.py
│   │   │       │   ├── members.py
│   │   │       │   ├── cells.py
│   │   │       │   ├── events.py
│   │   │       │   ├── attendance.py
│   │   │       │   ├── sermons.py
│   │   │       │   ├── prayer_requests.py
│   │   │       │   ├── testimonies.py
│   │   │       │   └── dashboard.py
│   │   │       ├── router.py
│   │   │       └── deps.py
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   ├── security.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── member.py
│   │   │   ├── cell.py
│   │   │   ├── event.py
│   │   │   ├── sermon.py
│   │   │   ├── prayer_request.py
│   │   │   ├── testimony.py
│   │   │   └── donation.py
│   │   ├── schemas/
│   │   │   ├── user.py
│   │   │   ├── member.py
│   │   │   ├── cell.py
│   │   │   ├── event.py
│   │   │   ├── sermon.py
│   │   │   ├── prayer_request.py
│   │   │   └── testimony.py
│   │   ├── services/
│   │   │   ├── auth.py
│   │   │   ├── member.py
│   │   │   ├── cell.py
│   │   │   ├── event.py
│   │   │   ├── sermon.py
│   │   │   ├── prayer_request.py
│   │   │   ├── testimony.py
│   │   │   └── s3.py
│   │   └── main.py
│   ├── alembic/
│   │   ├── versions/
│   │   └── env.py
│   ├── tests/
│   ├── requirements.txt
│   ├── alembic.ini
│   └── lambda_handler.py
│
├── infrastructure/
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       ├── outputs.tf
│       ├── s3.tf
│       ├── lambda.tf
│       ├── api_gateway.tf
│       ├── rds.tf
│       └── cloudfront.tf
│
├── specs/
│   └── church-management-system/
│
├── .github/
│   └── workflows/
│       ├── frontend-ci.yml
│       └── backend-ci.yml
│
├── docker-compose.yml
├── .env.example
└── README.md
```

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────>│  API Gateway│────>│   Lambda    │
│   (React)   │     │             │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │  1. POST /auth/login                  │
       │     {email, password}                 │
       │──────────────────────────────────────>│
       │                                       │
       │  2. Validate credentials              │
       │     Generate JWT tokens               │
       │                                       │
       │  3. Response:                         │
       │     {access_token, refresh_token}     │
       │<──────────────────────────────────────│
       │                                       │
       │  4. Store tokens (memory + httpOnly)  │
       │                                       │
       │  5. Subsequent requests:              │
       │     Authorization: Bearer <token>     │
       │──────────────────────────────────────>│
       │                                       │
       │  6. Validate token, extract user      │
       │     Process request                   │
       │<──────────────────────────────────────│
```

### Media Upload Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   Lambda    │     │     S3      │     │ CloudFront  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │ 1. Request upload │                   │                   │
       │   POST /sermons/  │                   │                   │
       │   {id}/upload     │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │ 2. Generate       │                   │                   │
       │    presigned URL  │                   │                   │
       │                   │                   │                   │
       │ 3. Return URL     │                   │                   │
       │<──────────────────│                   │                   │
       │                   │                   │                   │
       │ 4. Upload file directly to S3         │                   │
       │──────────────────────────────────────>│                   │
       │                   │                   │                   │
       │ 5. Confirm upload │                   │                   │
       │──────────────────>│                   │                   │
       │                   │                   │                   │
       │                   │ 6. Update record  │                   │
       │                   │    with S3 URL    │                   │
       │                   │                   │                   │
       │ 7. Streaming via CloudFront           │                   │
       │───────────────────────────────────────────────────────────>
       │                   │                   │                   │
```

### Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **admin** | Full access to all features and settings |
| **pastor** | Manage members, cells, events, sermons, approve content |
| **leader** | Manage assigned cell, record attendance, view reports |
| **member** | View directory, self check-in, submit prayer/testimony |

---

## Success Criteria

### Automated Verification
- [ ] `npm run build` completes without errors (frontend)
- [ ] `npm run lint` passes with no errors (frontend)
- [ ] `npm run test` passes all unit tests (frontend)
- [ ] `pytest` passes all tests (backend)
- [ ] `mypy app/` passes type checking (backend)
- [ ] `ruff check app/` passes linting (backend)
- [ ] All API endpoints return correct status codes
- [ ] JWT authentication blocks unauthorized access
- [ ] Database migrations run successfully

### Manual Verification
- [ ] User can register, login, and logout
- [ ] Password reset email is received and works
- [ ] Member CRUD operations work in admin dashboard
- [ ] Member photos upload and display correctly
- [ ] Family relationships link correctly
- [ ] Dashboard shows accurate statistics
- [ ] Public pages load without authentication
- [ ] Mobile responsive design works on phone/tablet
- [ ] Cell group management works
- [ ] Event creation and attendance tracking works
- [ ] Sermon upload and playback works
- [ ] Prayer request submission and prayer wall works
- [ ] Testimony submission and approval workflow works

---

## Security Considerations

1. **Authentication**
   - Passwords hashed with bcrypt (cost factor 12)
   - JWT tokens with short expiry (15 min access, 7 day refresh)
   - Refresh token rotation on use
   - Rate limiting on auth endpoints (5 attempts/minute)

2. **Authorization**
   - Role-based access control on all endpoints
   - Resource ownership validation (users can only edit their own data)
   - Admin-only endpoints protected

3. **Data Protection**
   - HTTPS everywhere (CloudFront SSL)
   - Database encryption at rest (RDS)
   - S3 bucket private, accessed via presigned URLs
   - Secrets in AWS Secrets Manager

4. **Input Validation**
   - Pydantic validation on all inputs
   - SQL injection prevention via ORM
   - XSS prevention (React default escaping)

5. **CORS**
   - Strict origin allowlist
   - Credentials included only for same-origin

---

## Deployment Strategy

### Development
```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

### Production (AWS)
1. Push to `main` branch triggers GitHub Actions
2. Frontend: Build and deploy to S3, invalidate CloudFront
3. Backend: Build Docker image, push to ECR, update Lambda
4. Database: Run Alembic migrations via separate Lambda

### Environment Variables
```
# Backend
DATABASE_URL=postgresql://user:pass@host:5432/church_db
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
AWS_REGION=us-east-1
S3_BUCKET_NAME=church-media-bucket
FRONTEND_URL=https://yourchurch.com

# Frontend
VITE_API_URL=https://api.yourchurch.com/api/v1
```
