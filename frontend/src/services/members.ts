import api from './api'
import type { Member, MemberListResponse, MemberCreate, MemberUpdate, FamilyMember } from '@/types'

interface MemberListParams {
  page?: number
  page_size?: number
  search?: string
  status?: 'active' | 'inactive' | 'visitor'
  sort_by?: 'name' | 'join_date'
  sort_order?: 'asc' | 'desc'
}

export const memberService = {
  async getMembers(params: MemberListParams = {}): Promise<MemberListResponse> {
    const response = await api.get<MemberListResponse>('/members', { params })
    return response.data
  },

  async getMember(id: string): Promise<Member> {
    const response = await api.get<Member>(`/members/${id}`)
    return response.data
  },

  async createMember(data: MemberCreate): Promise<Member> {
    const response = await api.post<Member>('/members', data)
    return response.data
  },

  async updateMember(id: string, data: MemberUpdate): Promise<Member> {
    const response = await api.put<Member>(`/members/${id}`, data)
    return response.data
  },

  async deleteMember(id: string): Promise<void> {
    await api.delete(`/members/${id}`)
  },

  async reactivateMember(id: string): Promise<Member> {
    const response = await api.post<Member>(`/members/${id}/reactivate`)
    return response.data
  },

  async getMemberFamily(id: string): Promise<FamilyMember[]> {
    const response = await api.get<FamilyMember[]>(`/members/${id}/family`)
    return response.data
  },

  async addFamilyRelationship(
    memberId: string,
    relatedMemberId: string,
    relationshipType: 'spouse' | 'child' | 'parent' | 'sibling'
  ): Promise<FamilyMember> {
    const response = await api.post<FamilyMember>(`/members/${memberId}/family`, {
      related_member_id: relatedMemberId,
      relationship_type: relationshipType,
    })
    return response.data
  },

  async removeFamilyRelationship(memberId: string, relationshipId: string): Promise<void> {
    await api.delete(`/members/${memberId}/family/${relationshipId}`)
  },

  async getPhotoUploadUrl(id: string): Promise<{ upload_url: string; photo_url: string }> {
    const response = await api.post<{ upload_url: string; photo_url: string }>(
      `/members/${id}/photo`
    )
    return response.data
  },
}
