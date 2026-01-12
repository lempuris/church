import api from './api'
import type {
  Cell,
  CellCreate,
  CellDetail,
  CellListResponse,
  CellMemberInfo,
  CellUpdate,
} from '@/types'

interface CellListParams {
  page?: number
  page_size?: number
  search?: string
  active_only?: boolean
}

export const cellService = {
  async getCells(params: CellListParams = {}): Promise<CellListResponse> {
    const response = await api.get<CellListResponse>('/cells', { params })
    return response.data
  },

  async getCell(id: string): Promise<CellDetail> {
    const response = await api.get<CellDetail>(`/cells/${id}`)
    return response.data
  },

  async getMyCell(): Promise<CellDetail | null> {
    const response = await api.get<CellDetail | null>('/cells/my-cell')
    return response.data
  },

  async createCell(data: CellCreate): Promise<Cell> {
    const response = await api.post<Cell>('/cells', data)
    return response.data
  },

  async updateCell(id: string, data: CellUpdate): Promise<Cell> {
    const response = await api.put<Cell>(`/cells/${id}`, data)
    return response.data
  },

  async deleteCell(id: string): Promise<void> {
    await api.delete(`/cells/${id}`)
  },

  async getCellMembers(cellId: string): Promise<CellMemberInfo[]> {
    const response = await api.get<CellMemberInfo[]>(`/cells/${cellId}/members`)
    return response.data
  },

  async addCellMember(cellId: string, memberId: string): Promise<CellMemberInfo> {
    const response = await api.post<CellMemberInfo>(`/cells/${cellId}/members`, {
      member_id: memberId,
    })
    return response.data
  },

  async removeCellMember(cellId: string, memberId: string): Promise<void> {
    await api.delete(`/cells/${cellId}/members/${memberId}`)
  },
}
