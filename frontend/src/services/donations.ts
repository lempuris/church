import api from './api'
import type {
  Donation,
  DonationCategory,
  DonationCategoryCreate,
  DonationCategoryListResponse,
  DonationCategoryUpdate,
  DonationCreate,
  DonationListResponse,
  DonationUpdate,
  DonorHistoryResponse,
  FinancialSummaryReport,
  FinancialTrendReport,
  PaymentMethod,
  PaymentProviderStatus,
  TaxStatementResponse,
  TopDonorsReport,
} from '@/types'

interface DonationListParams {
  page?: number
  page_size?: number
  member_id?: string
  category_id?: string
  payment_method?: PaymentMethod
  start_date?: string
  end_date?: string
  min_amount?: number
  max_amount?: number
}

export const donationService = {
  // Categories
  async getCategories(activeOnly = true): Promise<DonationCategoryListResponse> {
    const response = await api.get<DonationCategoryListResponse>('/donations/categories', {
      params: { active_only: activeOnly },
    })
    return response.data
  },

  async createCategory(data: DonationCategoryCreate): Promise<DonationCategory> {
    const response = await api.post<DonationCategory>('/donations/categories', data)
    return response.data
  },

  async updateCategory(id: string, data: DonationCategoryUpdate): Promise<DonationCategory> {
    const response = await api.put<DonationCategory>(`/donations/categories/${id}`, data)
    return response.data
  },

  async deleteCategory(id: string): Promise<void> {
    await api.delete(`/donations/categories/${id}`)
  },

  // Donations
  async getDonations(params: DonationListParams = {}): Promise<DonationListResponse> {
    const response = await api.get<DonationListResponse>('/donations', { params })
    return response.data
  },

  async getDonation(id: string): Promise<Donation> {
    const response = await api.get<Donation>(`/donations/${id}`)
    return response.data
  },

  async createDonation(data: DonationCreate): Promise<Donation> {
    const response = await api.post<Donation>('/donations', data)
    return response.data
  },

  async updateDonation(id: string, data: DonationUpdate): Promise<Donation> {
    const response = await api.put<Donation>(`/donations/${id}`, data)
    return response.data
  },

  async deleteDonation(id: string): Promise<void> {
    await api.delete(`/donations/${id}`)
  },

  // Donor History
  async getMemberDonationHistory(memberId: string): Promise<DonorHistoryResponse> {
    const response = await api.get<DonorHistoryResponse>(
      `/donations/members/${memberId}/history`
    )
    return response.data
  },

  // Reports
  async getFinancialSummary(
    startDate: string,
    endDate: string,
    currency = 'ZAR'
  ): Promise<FinancialSummaryReport> {
    const response = await api.get<FinancialSummaryReport>('/donations/reports/summary', {
      params: { start_date: startDate, end_date: endDate, currency },
    })
    return response.data
  },

  async getFinancialTrends(
    startDate: string,
    endDate: string,
    currency = 'ZAR'
  ): Promise<FinancialTrendReport> {
    const response = await api.get<FinancialTrendReport>('/donations/reports/trends', {
      params: { start_date: startDate, end_date: endDate, currency },
    })
    return response.data
  },

  async getTopDonors(
    startDate: string,
    endDate: string,
    limit = 10,
    currency = 'ZAR'
  ): Promise<TopDonorsReport> {
    const response = await api.get<TopDonorsReport>('/donations/reports/top-donors', {
      params: { start_date: startDate, end_date: endDate, limit, currency },
    })
    return response.data
  },

  async generateTaxStatement(memberId: string, year: number): Promise<TaxStatementResponse> {
    const response = await api.get<TaxStatementResponse>(
      `/donations/reports/tax-statement/${memberId}`,
      { params: { year } }
    )
    return response.data
  },

  // Payment Provider
  async getPaymentStatus(): Promise<PaymentProviderStatus> {
    const response = await api.get<PaymentProviderStatus>('/donations/payment/status')
    return response.data
  },
}
