# Church Management System - Implementation Guide

## Project Overview

A full-stack church management system with a React frontend and Python FastAPI backend, deployed on AWS serverless infrastructure.

---

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Zustand or React Query
- **UI Library**: Tailwind CSS + shadcn/ui
- **Routing**: React Router v6
- **Forms**: React Hook Form + Zod validation
- **Media Player**: React Player (for sermons)

### Backend
- **Framework**: Python FastAPI
- **ORM**: SQLAlchemy with Alembic migrations
- **Authentication**: JWT with OAuth2
- **Validation**: Pydantic v2
- **File Handling**: boto3 for S3

### AWS Serverless Architecture (Cost-Optimized)
- **API**: API Gateway + Lambda (via Mangum adapter)
- **Database**: Aurora Serverless v2 (PostgreSQL) or RDS PostgreSQL (t3.micro for dev)
- **File Storage**: S3 (for media files)
- **CDN**: CloudFront (for frontend + media delivery)
- **Auth**: Cognito (optional) or custom JWT
- **Email**: SES (for notifications)
- **Hosting**: S3 static hosting for React app

---

## Database Schema Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│     Members     │────<│   Attendance    │>────│     Events      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        │               ┌─────────────────┐             │
        └──────────────>│   Donations     │<────────────┘
                        └─────────────────┘
        │
        │               ┌─────────────────┐
        ├──────────────>│ PrayerRequests  │
        │               └─────────────────┘
        │
        │               ┌─────────────────┐
        ├──────────────>│  Testimonies    │
        │               └─────────────────┘
        │
        │               ┌─────────────────┐
        └──────────────>│     Cells       │ (Small Groups)
                        └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│     Sermons     │────<│  SermonMedia    │
└─────────────────┘     └─────────────────┘

┌─────────────────┐
│  Transactions   │ (Financial Records)
└─────────────────┘
```

---

## Phased Implementation Plan

---

## Phase 1: Foundation & Core Infrastructure
**Focus**: Project setup, authentication, and member management

### 1.1 Project Structure Setup

```
church-management/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/           # Reusable UI components
│   │   │   ├── forms/        # Form components
│   │   │   └── layouts/      # Page layouts
│   │   ├── pages/
│   │   │   ├── public/       # Public website pages
│   │   │   └── admin/        # Admin dashboard pages
│   │   ├── hooks/            # Custom React hooks
│   │   ├── services/         # API service functions
│   │   ├── store/            # State management
│   │   ├── types/            # TypeScript types
│   │   └── utils/            # Utility functions
│   ├── package.json
│   └── vite.config.ts
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── v1/
│   │   │       ├── endpoints/    # Route handlers
│   │   │       └── deps.py       # Dependencies
│   │   ├── core/
│   │   │   ├── config.py         # Settings
│   │   │   ├── security.py       # Auth utilities
│   │   │   └── database.py       # DB connection
│   │   ├── models/               # SQLAlchemy models
│   │   ├── schemas/              # Pydantic schemas
│   │   ├── services/             # Business logic
│   │   └── main.py               # FastAPI app
│   ├── alembic/                  # DB migrations
│   ├── tests/
│   ├── requirements.txt
│   └── lambda_handler.py         # AWS Lambda entry
│
├── infrastructure/
│   ├── terraform/                # IaC for AWS
│   └── scripts/                  # Deployment scripts
│
└── docs/
```

### 1.2 Backend Tasks

| Task | Description |
|------|-------------|
| Setup FastAPI project | Initialize with proper structure, CORS, middleware |
| Database models | Create SQLAlchemy models for Users, Members, Roles |
| Authentication | JWT-based auth with login/register/refresh endpoints |
| Member CRUD | Full member management API endpoints |
| Role-based access | Admin, Pastor, Member, Guest roles |
| API documentation | Auto-generated OpenAPI/Swagger docs |

### 1.3 Frontend Tasks

| Task | Description |
|------|-------------|
| React + Vite setup | TypeScript, Tailwind, ESLint, Prettier |
| Routing structure | Public routes vs protected admin routes |
| Auth context | Login, logout, token management |
| Member registration | Public registration form |
| Admin member list | DataTable with search, filter, pagination |
| Member profile | View/edit member details |

### 1.4 AWS Infrastructure

| Resource | Purpose | Cost Estimate |
|----------|---------|---------------|
| S3 Bucket | Frontend hosting | ~$1/month |
| CloudFront | CDN for frontend | ~$1/month |
| API Gateway | REST API endpoint | Pay per request |
| Lambda | Backend compute | Free tier: 1M requests |
| RDS PostgreSQL | Database (t3.micro) | ~$15/month |
| Secrets Manager | Store credentials | ~$0.40/secret |

### 1.5 Deliverables
- [ ] User authentication (register, login, password reset)
- [ ] Member digital profiles with photo upload
- [ ] Admin dashboard shell with navigation
- [ ] Member directory with search
- [ ] Role-based access control
- [ ] Basic public website landing page

---

## Phase 2: Attendance & Cell Groups
**Focus**: Tracking attendance for services, events, and cell groups

### 2.1 Backend Tasks

| Task | Description |
|------|-------------|
| Cell Group models | Cells, CellMembers, CellMeetings |
| Event models | Events, EventTypes, EventAttendance |
| Service models | Services, ServiceAttendance |
| Attendance API | Check-in, bulk import, reports |
| QR Code generation | Unique codes for quick check-in |

### 2.2 Frontend Tasks

| Task | Description |
|------|-------------|
| Cell group management | Create, edit, assign members to cells |
| Event calendar | Calendar view with event creation |
| Attendance check-in | Manual + QR code scanning |
| Attendance reports | Charts showing trends |
| Cell leader dashboard | View cell attendance |

### 2.3 Database Tables

```sql
-- Cell Groups
CREATE TABLE cells (
    id UUID PRIMARY KEY,
    name VARCHAR(100),
    description TEXT,
    leader_id UUID REFERENCES members(id),
    meeting_day VARCHAR(20),
    meeting_time TIME,
    location TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY,
    title VARCHAR(200),
    description TEXT,
    event_type VARCHAR(50),  -- service, conference, cell_meeting, etc.
    start_datetime TIMESTAMP,
    end_datetime TIMESTAMP,
    location TEXT,
    capacity INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule TEXT
);

-- Attendance
CREATE TABLE attendance (
    id UUID PRIMARY KEY,
    member_id UUID REFERENCES members(id),
    event_id UUID REFERENCES events(id),
    checked_in_at TIMESTAMP,
    check_in_method VARCHAR(20),  -- manual, qr_code, self
    notes TEXT
);
```

### 2.4 Deliverables
- [ ] Cell group CRUD with member assignment
- [ ] Cell leader portal
- [ ] Event creation and management
- [ ] Service scheduling (recurring events)
- [ ] Attendance check-in (manual + QR)
- [ ] Attendance reports and analytics

---

## Phase 3: Financial Management
**Focus**: Tithes, offerings, donations, and reporting

### 3.1 Backend Tasks

| Task | Description |
|------|-------------|
| Donation models | Donations, DonationTypes, Pledges |
| Payment integration | Stripe/PayPal/M-Pesa integration |
| Transaction logging | All financial records |
| Reporting API | Income summaries, donor reports |
| Receipt generation | PDF receipts for tax purposes |

### 3.2 Frontend Tasks

| Task | Description |
|------|-------------|
| Online giving page | Public donation form |
| Giving portal | Member giving history |
| Admin financial dashboard | Overview, charts, summaries |
| Donation entry | Manual entry for cash/check |
| Financial reports | Exportable PDF/Excel reports |
| Pledge tracking | View/manage pledges |

### 3.3 Payment Gateway Integration

```python
# Example: Stripe integration structure
class PaymentService:
    async def create_donation(self, amount: Decimal, donor_id: UUID, type: str):
        # Create Stripe PaymentIntent
        # Record transaction
        # Send receipt email
        pass

    async def process_recurring(self, subscription_id: str):
        # Handle recurring donations
        pass
```

### 3.4 Financial Reports

| Report | Description |
|--------|-------------|
| Income Summary | Total by category (tithe, offering, etc.) |
| Donor Statement | Individual giving history for tax |
| Monthly/Annual Report | Trends and comparisons |
| Budget vs Actual | Track against budget |
| Pledge Fulfillment | Pledges vs actual giving |

### 3.5 Deliverables
- [ ] Online donation form (Stripe/PayPal)
- [ ] Mobile money integration (M-Pesa if needed)
- [ ] Donation categories (tithe, offering, missions, etc.)
- [ ] Recurring donations setup
- [ ] Donor statements and tax receipts
- [ ] Financial dashboard with charts
- [ ] Basic accounting ledger

---

## Phase 4: Sermon & Media Management
**Focus**: Audio/video sermon uploads and streaming

### 4.1 Backend Tasks

| Task | Description |
|------|-------------|
| Sermon models | Sermons, Series, Speakers |
| Media upload API | Pre-signed S3 URLs for upload |
| Transcoding trigger | Lambda for video processing |
| Media streaming | CloudFront signed URLs |
| Search & filtering | By speaker, series, date, topic |

### 4.2 Frontend Tasks

| Task | Description |
|------|-------------|
| Sermon library | Browse all sermons |
| Sermon player | Audio/video player component |
| Sermon upload | Admin media upload interface |
| Series management | Group sermons into series |
| Sermon notes | Attach notes/outlines |

### 4.3 AWS Media Architecture

```
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Upload  │────>│ S3 Raw   │────>│ Lambda       │
│  (Admin) │     │ Bucket   │     │ Transcoder   │
└──────────┘     └──────────┘     └──────────────┘
                                         │
                                         v
┌──────────┐     ┌──────────┐     ┌──────────────┐
│  Users   │<────│CloudFront│<────│ S3 Processed │
│  Stream  │     │   CDN    │     │ Bucket       │
└──────────┘     └──────────┘     └──────────────┘
```

### 4.4 Deliverables
- [ ] Sermon CRUD with metadata
- [ ] Series/playlist management
- [ ] Audio upload with S3
- [ ] Video upload with transcoding
- [ ] Sermon streaming player
- [ ] Download option for offline
- [ ] Search by speaker, topic, scripture

---

## Phase 5: Prayer Requests & Testimonies
**Focus**: Community engagement features

### 5.1 Backend Tasks

| Task | Description |
|------|-------------|
| Prayer request models | PrayerRequests, PrayerResponses |
| Testimony models | Testimonies, TestimonyCategories |
| Moderation workflow | Approve/reject submissions |
| Privacy controls | Public vs private requests |
| Notification system | Email when prayers answered |

### 5.2 Frontend Tasks

| Task | Description |
|------|-------------|
| Submit prayer request | Form with privacy options |
| Prayer wall | View approved requests |
| Pray button | Indicate prayer support |
| Submit testimony | Form with optional media |
| Testimony display | Public testimony page |
| Admin moderation | Approve/reject queue |

### 5.3 Database Tables

```sql
-- Prayer Requests
CREATE TABLE prayer_requests (
    id UUID PRIMARY KEY,
    member_id UUID REFERENCES members(id),
    title VARCHAR(200),
    description TEXT,
    is_anonymous BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, approved, answered
    prayer_count INTEGER DEFAULT 0,
    created_at TIMESTAMP,
    answered_at TIMESTAMP,
    answer_testimony TEXT
);

-- Testimonies
CREATE TABLE testimonies (
    id UUID PRIMARY KEY,
    member_id UUID REFERENCES members(id),
    title VARCHAR(200),
    content TEXT,
    category VARCHAR(50),
    media_url TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    approved_at TIMESTAMP
);
```

### 5.4 Deliverables
- [ ] Prayer request submission form
- [ ] Prayer wall (public/private toggle)
- [ ] "I Prayed" counter
- [ ] Mark prayer as answered
- [ ] Testimony submission form
- [ ] Testimony gallery/listing
- [ ] Admin moderation dashboard
- [ ] Email notifications

---

## Phase 6: Events & Programs
**Focus**: Full event management system

### 6.1 Backend Tasks

| Task | Description |
|------|-------------|
| Program models | Programs, Ministries, Departments |
| Event registration | RSVP and ticketing |
| Volunteer management | Assign roles to events |
| Calendar API | iCal feed generation |
| Reminders | Scheduled notifications |

### 6.2 Frontend Tasks

| Task | Description |
|------|-------------|
| Public event calendar | Monthly/weekly/list views |
| Event detail page | Full info + registration |
| Event registration | RSVP with optional payment |
| Admin event manager | Full event CRUD |
| Volunteer scheduling | Assign members to roles |
| Ministry pages | Department-specific pages |

### 6.3 Deliverables
- [ ] Public event calendar
- [ ] Event registration/RSVP
- [ ] Paid event ticketing
- [ ] Volunteer signup
- [ ] Ministry/department pages
- [ ] Event reminders (email/SMS)
- [ ] Calendar sync (Google/Apple)

---

## Phase 7: Polish & Advanced Features
**Focus**: Optimization, mobile, and advanced features

### 7.1 Tasks

| Task | Description |
|------|-------------|
| PWA conversion | Make frontend installable |
| Push notifications | Web push for updates |
| SMS integration | Twilio for reminders |
| Bulk communications | Email/SMS campaigns |
| Advanced analytics | Member engagement metrics |
| Data export | GDPR-compliant data export |
| Backup automation | Scheduled DB backups |

### 7.2 Deliverables
- [ ] Progressive Web App (PWA)
- [ ] Push notifications
- [ ] SMS notifications (optional)
- [ ] Bulk email/SMS sender
- [ ] Analytics dashboard
- [ ] Data export tools
- [ ] Automated backups

---

## AWS Cost Optimization Tips

### Development Environment
| Service | Configuration | Est. Monthly Cost |
|---------|--------------|-------------------|
| RDS PostgreSQL | t3.micro, single-AZ | $15 |
| Lambda | Free tier (1M requests) | $0 |
| S3 | <5GB storage | $0.12 |
| CloudFront | <50GB transfer | $5 |
| API Gateway | <1M requests | $0 |
| **Total** | | **~$20-25/month** |

### Production (Small Church <500 members)
| Service | Configuration | Est. Monthly Cost |
|---------|--------------|-------------------|
| RDS PostgreSQL | t3.small, single-AZ | $25 |
| Lambda | 2M requests | $0.40 |
| S3 | 50GB (media) | $1.15 |
| CloudFront | 100GB transfer | $10 |
| API Gateway | 2M requests | $7 |
| SES | 10K emails | $1 |
| **Total** | | **~$45-50/month** |

### Cost-Saving Strategies
1. Use Lambda free tier (1M requests/month)
2. Use S3 Intelligent-Tiering for media
3. Set CloudFront caching aggressively
4. Use Aurora Serverless v2 (scales to zero) for variable load
5. Reserved instances for predictable workloads
6. Use SES instead of third-party email services

---

## Security Checklist

- [ ] HTTPS everywhere (CloudFront SSL)
- [ ] JWT tokens with short expiry + refresh tokens
- [ ] Password hashing (bcrypt/argon2)
- [ ] Rate limiting on API
- [ ] Input validation (Pydantic)
- [ ] SQL injection prevention (ORM)
- [ ] XSS prevention (React default escaping)
- [ ] CORS properly configured
- [ ] Secrets in AWS Secrets Manager
- [ ] Audit logging for sensitive actions
- [ ] Regular security updates
- [ ] Data encryption at rest (RDS, S3)

---

## Development Workflow

### Git Branching Strategy
```
main (production)
  └── develop
        ├── feature/member-registration
        ├── feature/attendance-tracking
        └── fix/login-bug
```

### CI/CD Pipeline
1. Push to feature branch
2. Run tests (pytest, jest)
3. Build frontend (Vite)
4. Deploy to staging (auto on develop)
5. Manual approval for production
6. Deploy to production (on main merge)

### Tools
- **Version Control**: GitHub
- **CI/CD**: GitHub Actions
- **Infrastructure**: Terraform
- **Monitoring**: CloudWatch + Sentry
- **Documentation**: Swagger UI (auto-generated)

---

## Getting Started Checklist

### Phase 1 Kickoff
- [ ] Create GitHub repository
- [ ] Set up React frontend with Vite + TypeScript
- [ ] Set up FastAPI backend with poetry/pip
- [ ] Configure PostgreSQL locally (Docker)
- [ ] Create initial database migrations
- [ ] Implement user authentication
- [ ] Create member registration flow
- [ ] Set up AWS account and basic infrastructure
- [ ] Deploy first version to AWS

---

## API Endpoint Structure

```
/api/v1/
├── /auth
│   ├── POST /register
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /password-reset
│
├── /members
│   ├── GET /              (list)
│   ├── POST /             (create)
│   ├── GET /{id}          (read)
│   ├── PUT /{id}          (update)
│   ├── DELETE /{id}       (delete)
│   └── GET /{id}/attendance
│
├── /cells
│   ├── GET /
│   ├── POST /
│   ├── GET /{id}
│   ├── PUT /{id}
│   ├── GET /{id}/members
│   └── POST /{id}/meetings
│
├── /events
│   ├── GET /
│   ├── POST /
│   ├── GET /{id}
│   ├── PUT /{id}
│   ├── POST /{id}/register
│   └── POST /{id}/attendance
│
├── /donations
│   ├── POST /
│   ├── GET /my-giving
│   ├── POST /create-payment-intent
│   └── GET /reports
│
├── /sermons
│   ├── GET /
│   ├── POST /
│   ├── GET /{id}
│   ├── PUT /{id}
│   └── POST /{id}/upload-media
│
├── /prayer-requests
│   ├── GET /
│   ├── POST /
│   ├── POST /{id}/pray
│   └── PUT /{id}/answered
│
└── /testimonies
    ├── GET /
    ├── POST /
    └── PUT /{id}/approve
```

---

## Next Steps

1. **Review this guide** and confirm the scope
2. **Prioritize features** if needed (MVP vs full)
3. **Set up development environment**
4. **Begin Phase 1 implementation**

Would you like me to start implementing Phase 1?
