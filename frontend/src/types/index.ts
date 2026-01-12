export interface User {
  id: string
  email: string
  role: 'admin' | 'pastor' | 'leader' | 'member'
  is_active: boolean
  is_verified: boolean
  created_at: string
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

export interface MemberUpdate extends Partial<MemberCreate> {}

export interface ApiError {
  detail: string | { msg: string; loc: string[] }[]
}
