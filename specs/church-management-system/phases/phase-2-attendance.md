# Phase 2: Attendance & Cell Groups

**Status:** Ready for Implementation
**Dependencies:** Phase 1 (Foundation)

---

## Overview

Phase 2 adds cell group (small group) management, event scheduling, and attendance tracking capabilities. This enables the church to organize members into cells, schedule services and events, and track participation.

---

## Functional Requirements

### FR6: Cell Group Management

**FR6.1: Create Cell Group**
- Fields: name, description, leader, assistant leader, meeting day, time, location
- Leader must be an existing member
- **Success Criteria**: Cell created; leader assigned; appears in cell list

**FR6.2: Edit Cell Group**
- Update any cell field
- Change leader/assistant
- **Success Criteria**: Changes saved; leader change reflected

**FR6.3: Delete Cell Group**
- Soft delete (is_active = false)
- Members unassigned from cell
- **Success Criteria**: Cell hidden from active list; members freed

**FR6.4: Assign Members to Cell**
- Add member to cell
- Member can only be in one cell
- View cell roster
- **Success Criteria**: Member added; duplicate prevented; roster shows member

**FR6.5: Remove Member from Cell**
- Remove without deleting member
- **Success Criteria**: Member removed from roster; member still exists

**FR6.6: Cell Leader Dashboard**
- Leaders see their cell on dashboard
- View cell members
- Record cell meeting attendance
- **Success Criteria**: Leader sees only their cell; can record attendance

---

### FR7: Event Management

**FR7.1: Create Event**
- Fields: title, description, type, start datetime, end datetime, location, capacity
- Event types: service, cell_meeting, conference, special, other
- Public or private event
- **Success Criteria**: Event created; shows on calendar

**FR7.2: Recurring Events**
- Set recurrence: weekly, biweekly, monthly
- Generate individual instances
- Edit single instance or entire series
- **Success Criteria**: Recurring events generate instances; edits apply correctly

**FR7.3: Edit Event**
- Update event details
- Handle recurring event edits (this instance / all instances)
- **Success Criteria**: Changes saved; recurrence handled

**FR7.4: Cancel Event**
- Cancel single event or recurring series
- Notify registered attendees (if any)
- **Success Criteria**: Event marked cancelled; shows as cancelled in UI

**FR7.5: Event Calendar View**
- Monthly calendar view
- Weekly view
- List view
- Filter by event type
- **Success Criteria**: All views work; filters apply; events display correctly

**FR7.6: Public Event Listing**
- Public events visible on website
- Event detail page with info
- Upcoming events on homepage
- **Success Criteria**: Public events show; private events hidden

---

### FR8: Attendance Tracking

**FR8.1: Manual Check-In**
- Admin/leader selects event
- Search and select members to check in
- Bulk check-in from list
- **Success Criteria**: Attendance recorded; timestamp captured

**FR8.2: Self Check-In**
- Member checks themselves in for enabled events
- Available during event window (start - 2hrs to end)
- **Success Criteria**: Self check-in works within time window

**FR8.3: QR Code Check-In**
- Generate unique QR code for each event
- Member scans QR to check in
- QR code displays on event page
- **Success Criteria**: QR generates; scanning records attendance

**FR8.4: Attendance List**
- View attendees for an event
- Export attendance (CSV)
- Add notes to attendance record
- **Success Criteria**: List shows attendees; export works; notes save

**FR8.5: Attendance Reports**
- Member attendance history
- Event attendance counts
- Attendance trends (weekly/monthly charts)
- Cell group attendance comparison
- **Success Criteria**: Reports show accurate data; charts display

---

## Technical Tasks

### Backend Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Cell model | cells, cell_members tables | P0 |
| Cell CRUD endpoints | Create, read, update, delete cells | P0 |
| Cell membership endpoints | Add/remove members | P0 |
| Event model | events table with recurrence | P0 |
| Event CRUD endpoints | Full event management | P0 |
| Recurring event logic | Generate instances from rules | P0 |
| Attendance model | attendance table | P0 |
| Attendance endpoints | Check-in, list, reports | P0 |
| QR code generation | Generate and validate codes | P1 |
| Attendance reports | Aggregate queries | P1 |
| CSV export | Attendance export endpoint | P1 |

### Frontend Tasks

| Task | Description | Priority |
|------|-------------|----------|
| Cell list page | Table with CRUD | P0 |
| Cell form | Create/edit cell | P0 |
| Cell detail page | Roster, meeting info | P0 |
| Cell member assignment | Add/remove UI | P0 |
| Event calendar | Monthly/weekly views | P0 |
| Event form | Create/edit with recurrence | P0 |
| Event detail page | Info, attendance, QR | P0 |
| Attendance check-in | Search and select UI | P0 |
| QR code display | Generate and show QR | P1 |
| QR scanner | Camera-based scanning | P1 |
| Attendance reports | Charts and tables | P1 |
| Public events page | Event listing | P1 |

---

## API Endpoints for Phase 2

```
# Cell Groups
GET    /api/v1/cells
POST   /api/v1/cells
GET    /api/v1/cells/{id}
PUT    /api/v1/cells/{id}
DELETE /api/v1/cells/{id}
GET    /api/v1/cells/{id}/members
POST   /api/v1/cells/{id}/members
DELETE /api/v1/cells/{id}/members/{member_id}
GET    /api/v1/cells/my-cell

# Events
GET    /api/v1/events
POST   /api/v1/events
GET    /api/v1/events/{id}
PUT    /api/v1/events/{id}
DELETE /api/v1/events/{id}
GET    /api/v1/events/upcoming
GET    /api/v1/events/calendar

# Attendance
POST   /api/v1/events/{id}/attendance
GET    /api/v1/events/{id}/attendance
DELETE /api/v1/events/{id}/attendance/{member_id}
POST   /api/v1/events/{id}/self-checkin
GET    /api/v1/events/{id}/qr-code
POST   /api/v1/attendance/verify-qr
GET    /api/v1/attendance/export/{event_id}
GET    /api/v1/attendance/reports/member/{member_id}
GET    /api/v1/attendance/reports/summary
```

---

## Database Migrations for Phase 2

**Migration 004: Create cells tables**
```sql
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

CREATE TABLE cell_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cell_id UUID NOT NULL REFERENCES cells(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(cell_id, member_id)
);

CREATE INDEX idx_cell_members_cell ON cell_members(cell_id);
CREATE INDEX idx_cell_members_member ON cell_members(member_id);
```

**Migration 005: Create events table**
```sql
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_type VARCHAR(50) NOT NULL,
    start_datetime TIMESTAMP NOT NULL,
    end_datetime TIMESTAMP,
    location VARCHAR(255),
    capacity INTEGER,
    is_recurring BOOLEAN DEFAULT false,
    recurrence_rule VARCHAR(100),
    parent_event_id UUID REFERENCES events(id),
    is_public BOOLEAN DEFAULT true,
    allow_self_checkin BOOLEAN DEFAULT false,
    qr_code_token VARCHAR(100),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_events_datetime ON events(start_datetime);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_parent ON events(parent_event_id);
```

**Migration 006: Create attendance table**
```sql
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
    checked_in_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    check_in_method VARCHAR(20) DEFAULT 'manual',
    checked_in_by UUID REFERENCES users(id),
    notes TEXT,
    UNIQUE(event_id, member_id)
);

CREATE INDEX idx_attendance_event ON attendance(event_id);
CREATE INDEX idx_attendance_member ON attendance(member_id);
```

---

## Success Criteria

### Automated
- [ ] Cell CRUD endpoints return correct responses
- [ ] Event CRUD endpoints work
- [ ] Attendance endpoints record and retrieve data
- [ ] Recurring event generation works
- [ ] Tests pass

### Manual Testing
- [ ] Create, edit, delete cell group
- [ ] Assign members to cell
- [ ] Leader sees their cell on dashboard
- [ ] Create single event
- [ ] Create recurring event (weekly service)
- [ ] Edit single instance of recurring event
- [ ] Calendar view shows events correctly
- [ ] Manual attendance check-in works
- [ ] Self check-in works during event window
- [ ] QR code generates and displays
- [ ] QR scan records attendance
- [ ] Attendance report shows correct data
- [ ] Public events visible on website
- [ ] Private events hidden from public
