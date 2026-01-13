import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Plus, Filter, Trash2, Edit, Eye } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { donationService } from '@/services'
import { useAuthStore } from '@/store/auth'
import type { PaymentMethod } from '@/types'

function formatCurrency(amount: number, currency = 'ZAR'): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount)
}

export function DonationList() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const { user } = useAuthStore()

  const page = parseInt(searchParams.get('page') || '1')
  const categoryId = searchParams.get('category_id') || undefined
  const paymentMethod = searchParams.get('payment_method') as PaymentMethod | undefined
  const startDate = searchParams.get('start_date') || undefined
  const endDate = searchParams.get('end_date') || undefined

  const [showFilters, setShowFilters] = useState(false)
  const [filterStartDate, setFilterStartDate] = useState(startDate || '')
  const [filterEndDate, setFilterEndDate] = useState(endDate || '')
  const [filterCategory, setFilterCategory] = useState(categoryId || '')
  const [filterPaymentMethod, setFilterPaymentMethod] = useState(paymentMethod || '')

  const { data, isLoading } = useQuery({
    queryKey: ['donations', { page, categoryId, paymentMethod, startDate, endDate }],
    queryFn: () =>
      donationService.getDonations({
        page,
        page_size: 20,
        category_id: categoryId,
        payment_method: paymentMethod,
        start_date: startDate,
        end_date: endDate,
      }),
  })

  const { data: categories } = useQuery({
    queryKey: ['donation-categories'],
    queryFn: () => donationService.getCategories(),
  })

  const deleteMutation = useMutation({
    mutationFn: donationService.deleteDonation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
    },
  })

  const handleApplyFilters = () => {
    const params = new URLSearchParams()
    if (filterStartDate) params.set('start_date', filterStartDate)
    if (filterEndDate) params.set('end_date', filterEndDate)
    if (filterCategory) params.set('category_id', filterCategory)
    if (filterPaymentMethod) params.set('payment_method', filterPaymentMethod)
    setSearchParams(params)
  }

  const handleClearFilters = () => {
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterCategory('')
    setFilterPaymentMethod('')
    setSearchParams({})
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this donation?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', newPage.toString())
    setSearchParams(params)
  }

  const isAdmin = user?.role === 'admin'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donations</h1>
          <p className="text-muted-foreground">Manage and track all donations</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button asChild>
            <Link to="/admin/donations/new">
              <Plus className="h-4 w-4 mr-2" />
              Record Donation
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                >
                  <option value="">All Categories</option>
                  {categories?.items.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                  value={filterPaymentMethod}
                  onChange={(e) => setFilterPaymentMethod(e.target.value)}
                >
                  <option value="">All Methods</option>
                  <option value="cash">Cash</option>
                  <option value="eft">EFT</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="card">Card</option>
                  <option value="snapscan">SnapScan</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleApplyFilters}>Apply Filters</Button>
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Donations List */}
      <Card>
        <CardHeader>
          <CardTitle>All Donations</CardTitle>
          <CardDescription>
            {data?.total || 0} donation{data?.total !== 1 ? 's' : ''} found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : data?.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No donations found</p>
              <Button asChild className="mt-4">
                <Link to="/admin/donations/new">Record First Donation</Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">Date</th>
                      <th className="text-left py-3 px-2 font-medium">Donor</th>
                      <th className="text-left py-3 px-2 font-medium">Category</th>
                      <th className="text-left py-3 px-2 font-medium">Method</th>
                      <th className="text-right py-3 px-2 font-medium">Amount</th>
                      <th className="text-right py-3 px-2 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.items.map((donation) => (
                      <tr key={donation.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2">
                          {format(new Date(donation.donation_date), 'MMM d, yyyy')}
                        </td>
                        <td className="py-3 px-2">
                          {donation.donor_name || 'Anonymous'}
                        </td>
                        <td className="py-3 px-2">
                          {donation.category_name || '—'}
                        </td>
                        <td className="py-3 px-2 capitalize">
                          {donation.payment_method?.replace('_', ' ') || '—'}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">
                          {formatCurrency(donation.amount, donation.currency)}
                        </td>
                        <td className="py-3 px-2 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/admin/donations/${donation.id}`}>
                                <Eye className="h-4 w-4" />
                              </Link>
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link to={`/admin/donations/${donation.id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                            {isAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(donation.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {data && data.total_pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {data.page} of {data.total_pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page - 1)}
                      disabled={page <= 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={page >= data.total_pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
