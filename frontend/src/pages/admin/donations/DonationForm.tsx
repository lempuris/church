import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Loader2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { donationService, memberService } from '@/services'
import type { DonationCreate } from '@/types'

const donationSchema = z.object({
  member_id: z.string().optional(),
  donor_name: z.string().optional(),
  donor_email: z.string().email().optional().or(z.literal('')),
  category_id: z.string().optional(),
  amount: z.string().min(1, 'Amount is required'),
  currency: z.string(),
  payment_method: z.enum(['cash', 'eft', 'bank_transfer', 'card', 'snapscan']).optional(),
  transaction_reference: z.string().optional(),
  donation_date: z.string().min(1, 'Date is required'),
  notes: z.string().optional(),
})

type DonationFormData = z.infer<typeof donationSchema>

function cleanFormData(data: DonationFormData): DonationCreate {
  const result: DonationCreate = {
    amount: parseFloat(data.amount),
    donation_date: data.donation_date,
  }
  
  if (data.member_id) result.member_id = data.member_id
  if (data.donor_name) result.donor_name = data.donor_name
  if (data.donor_email) result.donor_email = data.donor_email
  if (data.category_id) result.category_id = data.category_id
  if (data.currency) result.currency = data.currency
  if (data.payment_method) result.payment_method = data.payment_method
  if (data.transaction_reference) result.transaction_reference = data.transaction_reference
  if (data.notes) result.notes = data.notes
  
  return result
}

export function DonationForm() {
  const navigate = useNavigate()
  const { id } = useParams()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<DonationFormData>({
    resolver: zodResolver(donationSchema),
    defaultValues: {
      currency: 'ZAR',
      donation_date: format(new Date(), 'yyyy-MM-dd'),
    },
  })

  const memberId = watch('member_id')

  const { data: categories } = useQuery({
    queryKey: ['donation-categories'],
    queryFn: () => donationService.getCategories(),
  })

  const { data: members } = useQuery({
    queryKey: ['members', { page: 1, page_size: 100 }],
    queryFn: () => memberService.getMembers({ page: 1, page_size: 100 }),
  })

  const { data: donation, isLoading: donationLoading } = useQuery({
    queryKey: ['donation', id],
    queryFn: () => donationService.getDonation(id!),
    enabled: isEditing,
  })

  useEffect(() => {
    if (donation) {
      reset({
        member_id: donation.member_id || '',
        donor_name: donation.donor_name || '',
        donor_email: donation.donor_email || '',
        category_id: donation.category_id || '',
        amount: donation.amount.toString(),
        currency: donation.currency,
        payment_method: donation.payment_method || undefined,
        transaction_reference: donation.transaction_reference || '',
        donation_date: donation.donation_date,
        notes: donation.notes || '',
      })
    }
  }, [donation, reset])

  const createMutation = useMutation({
    mutationFn: (data: DonationCreate) => donationService.createDonation(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      navigate('/admin/donations')
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: DonationCreate) => donationService.updateDonation(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donations'] })
      queryClient.invalidateQueries({ queryKey: ['donation', id] })
      navigate('/admin/donations')
    },
  })

  const onSubmit = async (data: DonationFormData) => {
    const cleanData = cleanFormData(data)
    if (isEditing) {
      await updateMutation.mutateAsync(cleanData)
    } else {
      await createMutation.mutateAsync(cleanData)
    }
  }

  if (isEditing && donationLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {isEditing ? 'Edit Donation' : 'Record Donation'}
        </h1>
        <p className="text-muted-foreground">
          {isEditing ? 'Update donation details' : 'Record a new donation'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card>
          <CardHeader>
            <CardTitle>Donation Details</CardTitle>
            <CardDescription>
              Enter the donation information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Donor Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Donor Information</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="member_id">Member (Optional)</Label>
                  <select
                    id="member_id"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    {...register('member_id')}
                  >
                    <option value="">Select a member or enter manually</option>
                    {members?.items.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.first_name} {member.last_name}
                      </option>
                    ))}
                  </select>
                </div>
                {!memberId && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="donor_name">Donor Name</Label>
                      <Input
                        id="donor_name"
                        placeholder="Enter donor name"
                        {...register('donor_name')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="donor_email">Donor Email</Label>
                      <Input
                        id="donor_email"
                        type="email"
                        placeholder="donor@example.com"
                        {...register('donor_email')}
                      />
                      {errors.donor_email && (
                        <p className="text-sm text-destructive">{errors.donor_email.message}</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Donation Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Donation Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <select
                    id="category_id"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    {...register('category_id')}
                  >
                    <option value="">Select category</option>
                    {categories?.items.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    {...register('amount')}
                  />
                  {errors.amount && (
                    <p className="text-sm text-destructive">{errors.amount.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    {...register('currency')}
                  >
                    <option value="ZAR">ZAR - South African Rand</option>
                    <option value="USD">USD - US Dollar</option>
                    <option value="EUR">EUR - Euro</option>
                    <option value="GBP">GBP - British Pound</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="payment_method">Payment Method</Label>
                  <select
                    id="payment_method"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
                    {...register('payment_method')}
                  >
                    <option value="">Select method</option>
                    <option value="cash">Cash</option>
                    <option value="eft">EFT</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="card">Card</option>
                    <option value="snapscan">SnapScan</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="donation_date">Date *</Label>
                  <Input
                    id="donation_date"
                    type="date"
                    {...register('donation_date')}
                  />
                  {errors.donation_date && (
                    <p className="text-sm text-destructive">{errors.donation_date.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction_reference">Reference Number</Label>
                  <Input
                    id="transaction_reference"
                    placeholder="e.g., EFT reference, SnapScan code"
                    {...register('transaction_reference')}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
                  placeholder="Any additional notes..."
                  {...register('notes')}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEditing ? 'Update Donation' : 'Record Donation'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/donations')}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
