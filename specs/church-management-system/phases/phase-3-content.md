# Phase 3: Content & Community

**Status:** Ready for Implementation
**Dependencies:** Phase 1 (Foundation), Phase 2 (Attendance)

---

## Overview

Phase 3 adds sermon media management, prayer request submissions, and testimony sharing. This phase enables the church to share recorded sermons with the congregation and provides community engagement features for prayer support and testimony sharing.

---

## Functional Requirements

### FR9: Sermon Management

**FR9.1: Create Sermon**
- Fields: title, speaker, sermon date, scripture reference, description
- Select existing member as speaker or enter custom name
- Assign to series (optional)
- **Success Criteria**: Sermon created with all fields; speaker linked if member

**FR9.2: Upload Audio**
- Presigned S3 URL for direct upload
- Accepted formats: MP3, M4A, WAV
- Max file size: 200MB
- Show upload progress
- **Success Criteria**: Audio uploads; URL saved; playback works

**FR9.3: Upload Video**
- Presigned S3 URL for direct upload
- Accepted formats: MP4, MOV, WebM
- Max file size: 2GB
- Show upload progress
- **Success Criteria**: Video uploads; URL saved; streaming works

**FR9.4: Sermon Series**
- Create series with title, description, thumbnail
- Add sermons to series
- Series listing page
- **Success Criteria**: Series created; sermons assigned; listing works

**FR9.5: Publish/Unpublish**
- Draft sermons not visible to public
- Publish makes sermon visible
- Schedule future publish date
- **Success Criteria**: Draft hidden; published visible; scheduling works

**FR9.6: Public Sermon Listing**
- Grid/list view of published sermons
- Search by title, speaker, scripture
- Filter by series, date range
- Pagination
- **Success Criteria**: Search returns results; filters work; pagination works

**FR9.7: Sermon Player Page**
- Audio player with: play/pause, seek, speed control, volume
- Video player with: full controls, fullscreen
- Sermon details displayed
- Download option for audio
- Related sermons (same series or speaker)
- **Success Criteria**: Player controls work; download works; related shows

**FR9.8: Track Views**
- Increment view count on sermon access
- Display view count
- **Success Criteria**: Count increments; displays correctly

---

### FR10: Prayer Requests

**FR10.1: Submit Prayer Request**
- Fields: title, description, anonymous option
- Public or private visibility
- Logged-in members auto-linked
- Guest submissions allowed (with name/email)
- **Success Criteria**: Request submitted; member linked; guest allowed

**FR10.2: Prayer Wall**
- List of approved public prayer requests
- Newest first
- Filter: all, active, answered
- **Success Criteria**: Wall shows public requests; filters work

**FR10.3: "I Prayed" Feature**
- Button to indicate prayer support
- Shows prayer count
- One pray per member per request
- **Success Criteria**: Count increments; no duplicates

**FR10.4: Mark as Answered**
- Author can mark prayer as answered
- Add answer testimony (optional)
- Shows on prayer wall with answered badge
- **Success Criteria**: Status changes; testimony saves; badge displays

**FR10.5: My Prayer Requests**
- View own submitted requests
- Edit or delete own requests
- See prayer count and status
- **Success Criteria**: Own requests listed; edit/delete works

**FR10.6: Admin Moderation**
- View all prayer requests
- Approve/reject pending requests
- Edit or delete any request
- **Success Criteria**: Admin sees all; moderation works

---

### FR11: Testimonies

**FR11.1: Submit Testimony**
- Fields: title, content, category
- Categories: healing, provision, salvation, deliverance, family, career, other
- Optional media attachment (photo/video)
- **Success Criteria**: Testimony submitted with category; media attached

**FR11.2: Approval Workflow**
- New testimonies have 'pending' status
- Admin reviews and approves/rejects
- Rejection reason (optional)
- **Success Criteria**: Pending queue visible; approval changes status

**FR11.3: Public Testimony Listing**
- Grid of approved testimonies
- Filter by category
- Pagination
- **Success Criteria**: Only approved shown; filters work

**FR11.4: Testimony Detail Page**
- Full testimony content
- Media display
- Author info (unless anonymous)
- Share buttons
- **Success Criteria**: Content displays; media shows; share works

**FR11.5: Featured Testimonies**
- Admin can mark as featured
- Featured show on homepage
- Rotating/carousel display
- **Success Criteria**: Featured on home; rotation works

**FR11.6: My Testimonies**
- View own submitted testimonies
- See status (pending, approved, rejected)
- Edit pending testimonies
- **Success Criteria**: Own testimonies listed; status visible

---

## Technical Tasks

### Backend Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Sermon model | sermons, sermon_series tables | P0 |
| Sermon CRUD endpoints | Full sermon management | P0 |
| Series CRUD endpoints | Series management | P0 |
| Media upload | S3 presigned URLs for audio/video | P0 |
| Prayer request model | prayer_requests, prayer_interactions | P0 |
| Prayer request endpoints | Submit, list, pray, answer | P0 |
| Testimony model | testimonies table | P0 |
| Testimony endpoints | Submit, list, approve | P0 |
| Search implementation | Full-text search for sermons | P1 |
| View tracking | Increment sermon views | P1 |
| CloudFront signed URLs | Secure media streaming | P1 |

### Frontend Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Sermon list page (admin) | Table with CRUD | P0 |
| Sermon form | Create/edit with upload | P0 |
| Media uploader | Progress, multi-file | P0 |
| Series management | Create/edit series | P0 |
| Public sermon listing | Grid view with search | P0 |
| Sermon player page | Audio/video player | P0 |
| Prayer request form | Public submission form | P0 |
| Prayer wall page | List with interactions | P0 |
| Prayer request admin | Moderation queue | P0 |
| Testimony form | Submission with media | P0 |
| Testimony listing | Public grid view | P0 |
| Testimony admin | Approval queue | P0 |
| Featured testimonies | Homepage component | P1 |

---

## API Endpoints for Phase 3

```
# Sermons
GET    /api/v1/sermons
POST   /api/v1/sermons
GET    /api/v1/sermons/{id}
PUT    /api/v1/sermons/{id}
DELETE /api/v1/sermons/{id}
POST   /api/v1/sermons/{id}/upload
PUT    /api/v1/sermons/{id}/publish
GET    /api/v1/sermons/public

# Sermon Series
GET    /api/v1/sermons/series
POST   /api/v1/sermons/series
GET    /api/v1/sermons/series/{id}
PUT    /api/v1/sermons/series/{id}
DELETE /api/v1/sermons/series/{id}

# Prayer Requests
GET    /api/v1/prayer-requests
POST   /api/v1/prayer-requests
GET    /api/v1/prayer-requests/{id}
PUT    /api/v1/prayer-requests/{id}
DELETE /api/v1/prayer-requests/{id}
POST   /api/v1/prayer-requests/{id}/pray
PUT    /api/v1/prayer-requests/{id}/answered
GET    /api/v1/prayer-requests/my
GET    /api/v1/prayer-requests/pending

# Testimonies
GET    /api/v1/testimonies
POST   /api/v1/testimonies
GET    /api/v1/testimonies/{id}
PUT    /api/v1/testimonies/{id}
DELETE /api/v1/testimonies/{id}
PUT    /api/v1/testimonies/{id}/approve
PUT    /api/v1/testimonies/{id}/feature
GET    /api/v1/testimonies/my
GET    /api/v1/testimonies/pending
GET    /api/v1/testimonies/featured
```

---

## Database Migrations for Phase 3

**Migration 007: Create sermon tables**
```sql
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

CREATE TABLE sermons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    speaker_id UUID REFERENCES members(id),
    speaker_name VARCHAR(200),
    series_id UUID REFERENCES sermon_series(id),
    sermon_date DATE NOT NULL,
    scripture_reference VARCHAR(255),
    duration_seconds INTEGER,
    audio_url VARCHAR(500),
    video_url VARCHAR(500),
    thumbnail_url VARCHAR(500),
    notes_url VARCHAR(500),
    view_count INTEGER DEFAULT 0,
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sermons_date ON sermons(sermon_date);
CREATE INDEX idx_sermons_published ON sermons(is_published);
CREATE INDEX idx_sermons_series ON sermons(series_id);
```

**Migration 008: Create prayer_requests tables**
```sql
CREATE TABLE prayer_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    author_name VARCHAR(200),
    author_email VARCHAR(255),
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT false,
    is_public BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'pending',
    prayer_count INTEGER DEFAULT 0,
    answered_at TIMESTAMP,
    answer_testimony TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE prayer_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prayer_request_id UUID NOT NULL REFERENCES prayer_requests(id) ON DELETE CASCADE,
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    prayed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(prayer_request_id, member_id)
);

CREATE INDEX idx_prayer_requests_status ON prayer_requests(status);
CREATE INDEX idx_prayer_requests_member ON prayer_requests(member_id);
```

**Migration 009: Create testimonies table**
```sql
CREATE TABLE testimonies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID REFERENCES members(id) ON DELETE SET NULL,
    author_name VARCHAR(200),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50),
    media_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending',
    is_featured BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_testimonies_status ON testimonies(status);
CREATE INDEX idx_testimonies_featured ON testimonies(is_featured);
CREATE INDEX idx_testimonies_category ON testimonies(category);
```

---

## Media Storage Structure (S3)

```
church-media-bucket/
├── sermons/
│   ├── audio/
│   │   └── {sermon_id}/
│   │       └── sermon.mp3
│   ├── video/
│   │   └── {sermon_id}/
│   │       └── sermon.mp4
│   └── thumbnails/
│       └── {sermon_id}/
│           └── thumbnail.jpg
├── series/
│   └── thumbnails/
│       └── {series_id}/
│           └── thumbnail.jpg
├── testimonies/
│   └── {testimony_id}/
│       └── media.{ext}
└── members/
    └── photos/
        └── {member_id}/
            └── photo.jpg
```

---

## Success Criteria

### Automated
- [ ] Sermon CRUD endpoints work
- [ ] Series CRUD endpoints work
- [ ] Prayer request endpoints work
- [ ] Testimony endpoints work
- [ ] S3 presigned URL generation works
- [ ] Tests pass

### Manual Testing
- [ ] Create sermon with audio upload
- [ ] Create sermon with video upload
- [ ] Create and assign sermon to series
- [ ] Publish/unpublish sermon
- [ ] Public sermon search works
- [ ] Audio player plays and controls work
- [ ] Video player plays and controls work
- [ ] Download sermon audio works
- [ ] Submit prayer request (member)
- [ ] Submit prayer request (guest)
- [ ] Prayer wall displays requests
- [ ] "I Prayed" button works
- [ ] Mark prayer as answered
- [ ] Admin approves prayer request
- [ ] Submit testimony with media
- [ ] Admin approves testimony
- [ ] Featured testimony on homepage
- [ ] Category filter works
