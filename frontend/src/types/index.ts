export type UserRole = 'admin' | 'pastor' | 'leader' | 'member'

export interface User {
  id: string
  email: string
  role: UserRole
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface UserDetail extends User {
  last_login_at: string | null
  updated_at: string
}

export interface UserListResponse {
  items: UserDetail[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface UserUpdate {
  role?: UserRole
  is_active?: boolean
  is_verified?: boolean
}

export interface UserStats {
  total_users: number
  by_role: Record<string, number>
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface Member {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: 'male' | 'female' | 'other' | null
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string
  member_status: 'active' | 'inactive' | 'visitor'
  join_date: string | null
  baptism_date: string | null
  photo_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MemberListResponse {
  items: Member[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface FamilyMember {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  relationship_type: 'spouse' | 'child' | 'parent' | 'sibling'
}

export interface DashboardStats {
  total_members: number
  new_members_this_month: number
  active_cells: number
  upcoming_events: number
}

export interface RecentMember {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  join_date: string | null
  created_at: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  password: string
  confirm_password: string
  first_name: string
  last_name: string
}

export interface MemberCreate {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: 'male' | 'female' | 'other'
  address_line1?: string
  address_line2?: string
  city?: string
  state?: string
  postal_code?: string
  country?: string
  member_status?: 'active' | 'inactive' | 'visitor'
  join_date?: string
  baptism_date?: string
  notes?: string
}

export type MemberUpdate = Partial<MemberCreate>

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[]
}

// Cell Types
export type MeetingDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export interface CellLeaderInfo {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
}

export interface CellMemberInfo {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
  email: string | null
  phone: string | null
}

export interface Cell {
  id: string
  name: string
  description: string | null
  leader_id: string | null
  assistant_leader_id: string | null
  meeting_day: MeetingDay | null
  meeting_time: string | null
  meeting_location: string | null
  is_active: boolean
  created_at: string
  updated_at: string
  member_count: number
  leader: CellLeaderInfo | null
  assistant_leader: CellLeaderInfo | null
}

export interface CellDetail extends Cell {
  members: CellMemberInfo[]
}

export interface CellListResponse {
  items: Cell[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CellCreate {
  name: string
  description?: string
  leader_id?: string
  assistant_leader_id?: string
  meeting_day?: MeetingDay
  meeting_time?: string
  meeting_location?: string
}

export type CellUpdate = Partial<CellCreate>

// Event Types
export type EventType = 'service' | 'cell_meeting' | 'conference' | 'special' | 'other'
export type RecurrenceRule = 'weekly' | 'biweekly' | 'monthly'

export interface Event {
  id: string
  title: string
  description: string | null
  event_type: EventType
  start_datetime: string
  end_datetime: string | null
  location: string | null
  capacity: number | null
  is_recurring: boolean
  recurrence_rule: RecurrenceRule | null
  parent_event_id: string | null
  is_public: boolean
  allow_self_checkin: boolean
  qr_code_token: string | null
  is_cancelled: boolean
  created_by: string | null
  created_at: string
  updated_at: string
  attendance_count: number
}

export interface EventListResponse {
  items: Event[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface CalendarEvent {
  id: string
  title: string
  event_type: EventType
  start_datetime: string
  end_datetime: string | null
  is_cancelled: boolean
  is_recurring: boolean
}

export interface EventCreate {
  title: string
  description?: string
  event_type: EventType
  start_datetime: string
  end_datetime?: string
  location?: string
  capacity?: number
  is_public?: boolean
  allow_self_checkin?: boolean
  is_recurring?: boolean
  recurrence_rule?: RecurrenceRule
}

export type EventUpdate = Partial<Omit<EventCreate, 'is_recurring' | 'recurrence_rule'>>

export interface QRCodeResponse {
  event_id: string
  qr_code_token: string
  event_title: string
}

// Attendance Types
export type CheckInMethod = 'manual' | 'self' | 'qr'

export interface MemberInfo {
  id: string
  first_name: string
  last_name: string
  photo_url: string | null
}

export interface Attendance {
  id: string
  event_id: string
  member_id: string
  checked_in_at: string
  check_in_method: CheckInMethod
  checked_in_by: string | null
  notes: string | null
  member: MemberInfo
}

export interface AttendanceListResponse {
  items: Attendance[]
  total: number
  event_id: string
  event_title: string
}

export interface AttendanceCreate {
  member_id: string
  notes?: string
}

export interface AttendanceBulkCreate {
  member_ids: string[]
  notes?: string
}

export interface SelfCheckInResponse {
  success: boolean
  message: string
  attendance_id: string | null
}

export interface QRVerifyRequest {
  qr_token: string
  member_id: string
}

export interface QRVerifyResponse {
  success: boolean
  message: string
  attendance_id: string | null
}

// Report Types
export interface MemberAttendanceRecord {
  event_id: string
  event_title: string
  event_type: EventType
  event_date: string
  checked_in_at: string
}

export interface MemberAttendanceReport {
  member_id: string
  member_name: string
  total_events_attended: number
  attendance_records: MemberAttendanceRecord[]
}

export interface EventAttendanceSummary {
  event_id: string
  event_title: string
  event_type: EventType
  event_date: string
  attendance_count: number
  capacity: number | null
}

export interface AttendanceSummaryReport {
  period_start: string
  period_end: string
  total_events: number
  total_attendance: number
  average_attendance: number
  events: EventAttendanceSummary[]
}

export interface CellAttendanceComparison {
  cell_id: string
  cell_name: string
  total_attendance: number
  average_attendance: number
  member_count: number
}

// Sermon Types
export type MediaType = 'audio' | 'video' | 'thumbnail' | 'notes'

export interface SermonSpeaker {
  id: string
  first_name: string
  last_name: string
}

export interface SermonSeries {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  start_date: string | null
  end_date: string | null
  is_active: boolean
  created_at: string
  sermon_count: number
}

export interface SermonSeriesListResponse {
  items: SermonSeries[]
  total: number
}

export interface SermonSeriesCreate {
  title: string
  description?: string
  start_date?: string
  end_date?: string
}

export type SermonSeriesUpdate = Partial<SermonSeriesCreate> & {
  is_active?: boolean
}

export interface Sermon {
  id: string
  title: string
  description: string | null
  speaker_id: string | null
  speaker_name: string | null
  series_id: string | null
  sermon_date: string
  scripture_reference: string | null
  duration_seconds: number | null
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  notes_url: string | null
  view_count: number
  is_published: boolean
  published_at: string | null
  scheduled_publish_at: string | null
  created_at: string
  updated_at: string
  series_title: string | null
  speaker: SermonSpeaker | null
}

export interface SermonDetail extends Sermon {
  related_sermons: Sermon[]
}

export interface SermonListResponse {
  items: Sermon[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PublicSermon {
  id: string
  title: string
  description: string | null
  speaker_name: string | null
  sermon_date: string
  scripture_reference: string | null
  duration_seconds: number | null
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  view_count: number
  series_id: string | null
  series_title: string | null
}

export interface PublicSermonListResponse {
  items: PublicSermon[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface SermonCreate {
  title: string
  description?: string
  speaker_id?: string
  speaker_name?: string
  series_id?: string
  sermon_date: string
  scripture_reference?: string
}

export interface SermonUpdate {
  title?: string
  description?: string
  speaker_id?: string
  speaker_name?: string
  series_id?: string
  sermon_date?: string
  scripture_reference?: string
  duration_seconds?: number
}

export interface SermonPublishRequest {
  scheduled_publish_at?: string
}

export interface MediaUploadRequest {
  media_type: MediaType
  file_name: string
  content_type: string
}

export interface MediaUploadResponse {
  upload_url: string
  file_key: string
  media_type: MediaType
}

export interface MediaUploadComplete {
  media_type: MediaType
  file_key: string
  duration_seconds?: number
}

// Prayer Request Types
export type PrayerStatus = 'pending' | 'approved' | 'rejected' | 'answered'

export interface PrayerRequestAuthor {
  id: string
  first_name: string
  last_name: string
}

export interface PrayerRequest {
  id: string
  member_id: string | null
  author_name: string | null
  author_email: string | null
  title: string
  description: string
  is_anonymous: boolean
  is_public: boolean
  status: PrayerStatus
  prayer_count: number
  answered_at: string | null
  answer_testimony: string | null
  created_at: string
  updated_at: string
  author: PrayerRequestAuthor | null
}

export interface PrayerRequestListResponse {
  items: PrayerRequest[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PublicPrayerRequest {
  id: string
  title: string
  description: string
  author_name: string | null
  is_anonymous: boolean
  status: PrayerStatus
  prayer_count: number
  answered_at: string | null
  answer_testimony: string | null
  created_at: string
  has_prayed: boolean
}

export interface PublicPrayerListResponse {
  items: PublicPrayerRequest[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PrayerRequestCreate {
  title: string
  description: string
  author_name?: string
  author_email?: string
  is_anonymous?: boolean
  is_public?: boolean
}

export interface PrayerRequestUpdate {
  title?: string
  description?: string
  is_anonymous?: boolean
  is_public?: boolean
}

export interface PrayResponse {
  success: boolean
  prayer_count: number
  message: string
}

export interface MarkAnsweredRequest {
  answer_testimony?: string
}

export interface MarkAnsweredResponse {
  success: boolean
  message: string
}

export interface PrayerModerationRequest {
  action: 'approve' | 'reject'
  rejection_reason?: string
}

export interface PrayerModerationResponse {
  success: boolean
  message: string
  status: PrayerStatus
}

// Testimony Types
export type TestimonyCategory =
  | 'healing'
  | 'provision'
  | 'salvation'
  | 'deliverance'
  | 'family'
  | 'career'
  | 'other'

export type TestimonyStatus = 'pending' | 'approved' | 'rejected'

export interface TestimonyAuthor {
  id: string
  first_name: string
  last_name: string
}

export interface Testimony {
  id: string
  member_id: string | null
  author_name: string | null
  title: string
  content: string
  category: TestimonyCategory | null
  media_url: string | null
  status: TestimonyStatus
  is_featured: boolean
  rejection_reason: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
  author: TestimonyAuthor | null
}

export interface TestimonyListResponse {
  items: Testimony[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface PublicTestimony {
  id: string
  title: string
  content: string
  category: TestimonyCategory | null
  author_name: string | null
  media_url: string | null
  is_featured: boolean
  created_at: string
}

export interface PublicTestimonyListResponse {
  items: PublicTestimony[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface TestimonyCreate {
  title: string
  content: string
  author_name?: string
  category?: TestimonyCategory
}

export interface TestimonyUpdate {
  title?: string
  content?: string
  category?: TestimonyCategory
}

export interface TestimonyMediaUploadRequest {
  file_name: string
  content_type: string
}

export interface TestimonyMediaUploadResponse {
  upload_url: string
  file_key: string
}

export interface TestimonyMediaComplete {
  file_key: string
}

export interface TestimonyModerationRequest {
  action: 'approve' | 'reject'
  rejection_reason?: string
}

export interface TestimonyModerationResponse {
  success: boolean
  message: string
  status: TestimonyStatus
}

export interface TestimonyFeatureRequest {
  is_featured: boolean
}

export interface TestimonyFeatureResponse {
  success: boolean
  message: string
  is_featured: boolean
}

// Donation Types
export type PaymentMethod = 'cash' | 'eft' | 'bank_transfer' | 'card' | 'snapscan'
export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded'
export type DonationFrequency = 'weekly' | 'monthly' | 'quarterly' | 'annually'

export interface DonationCategory {
  id: string
  name: string
  description: string | null
  is_active: boolean
  created_at: string
  donation_count: number
  total_amount: number
}

export interface DonationCategoryListResponse {
  items: DonationCategory[]
  total: number
}

export interface DonationCategoryCreate {
  name: string
  description?: string
}

export interface DonationCategoryUpdate {
  name?: string
  description?: string
  is_active?: boolean
}

export interface DonorInfo {
  id: string
  first_name: string
  last_name: string
  email: string | null
}

export interface Donation {
  id: string
  member_id: string | null
  donor_name: string | null
  donor_email: string | null
  category_id: string | null
  category_name: string | null
  amount: number
  currency: string
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  transaction_reference: string | null
  donation_date: string
  notes: string | null
  created_by: string | null
  created_at: string
  donor: DonorInfo | null
}

export interface DonationListResponse {
  items: Donation[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export interface DonationCreate {
  member_id?: string
  donor_name?: string
  donor_email?: string
  category_id?: string
  amount: number
  currency?: string
  payment_method?: PaymentMethod
  transaction_reference?: string
  donation_date: string
  notes?: string
}

export type DonationUpdate = Partial<DonationCreate>

// Donation Report Types
export interface CategorySummary {
  category_id: string | null
  category_name: string
  total_amount: number
  donation_count: number
  percentage: number
}

export interface FinancialSummaryReport {
  period_start: string
  period_end: string
  total_donations: number
  total_amount: number
  currency: string
  by_category: CategorySummary[]
  by_payment_method: Record<string, number>
}

export interface MonthlyTrendItem {
  month: string
  total_amount: number
  donation_count: number
}

export interface FinancialTrendReport {
  period_start: string
  period_end: string
  trends: MonthlyTrendItem[]
}

export interface TopDonorItem {
  member_id: string | null
  donor_name: string
  total_amount: number
  donation_count: number
}

export interface TopDonorsReport {
  period_start: string
  period_end: string
  top_donors: TopDonorItem[]
}

export interface DonorHistoryItem {
  id: string
  amount: number
  currency: string
  category_name: string | null
  payment_method: string | null
  donation_date: string
  transaction_reference: string | null
}

export interface DonorHistoryResponse {
  member_id: string | null
  donor_name: string
  donor_email: string | null
  total_donations: number
  total_amount: number
  first_donation_date: string | null
  last_donation_date: string | null
  donations: DonorHistoryItem[]
}

export interface TaxStatementItem {
  donation_id: string
  amount: number
  currency: string
  category_name: string | null
  donation_date: string
  transaction_reference: string | null
}

export interface TaxStatementResponse {
  year: number
  donor_name: string
  donor_email: string | null
  member_id: string | null
  total_amount: number
  currency: string
  donations: TaxStatementItem[]
  generated_at: string
}

export interface PaymentProviderStatus {
  provider: string
  is_configured: boolean
  is_enabled: boolean
  supported_methods: string[]
  message: string | null
}