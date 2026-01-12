import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { memberService } from '@/services/members'
import type { MemberCreate, MemberUpdate } from '@/types'

const memberSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  date_of_birth: z.string().optional().or(z.literal('')),
  gender: z.enum(['male', 'female', 'other', '']).optional(),
  address_line1: z.string().optional().or(z.literal('')),
  address_line2: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  state: z.string().optional().or(z.literal('')),
  postal_code: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  member_status: z.enum(['active', 'inactive', 'visitor']),
  join_date: z.string().optional().or(z.literal('')),
  baptism_date: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

type MemberFormData = z.infer<typeof memberSchema>

function cleanFormData(data: MemberFormData): MemberCreate {
  const cleaned: Record<string, unknown> = {
    first_name: data.first_name,
    last_name: data.last_name,
  }
  for (const [key, value] of Object.entries(data)) {
    if (value !== '' && value !== undefined && key !== 'first_name' && key !== 'last_name') {
      cleaned[key] = value
    }
  }
  return cleaned as unknown as MemberCreate
}

export function MemberForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const isEditing = !!id

  const { data: member, isLoading: memberLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMember(id!),
    enabled: isEditing,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      member_status: 'active',
      country: 'Kenya',
    },
  })

  useEffect(() => {
    if (member) {
      reset({
        first_name: member.first_name,
        last_name: member.last_name,
        email: member.email || '',
        phone: member.phone || '',
        date_of_birth: member.date_of_birth || '',
        gender: (member.gender as 'male' | 'female' | 'other' | '') || '',
        address_line1: member.address_line1 || '',
        address_line2: member.address_line2 || '',
        city: member.city || '',
        state: member.state || '',
        postal_code: member.postal_code || '',
        country: member.country || 'Kenya',
        member_status: member.member_status,
        join_date: member.join_date || '',
        baptism_date: member.baptism_date || '',
        notes: member.notes || '',
      })
    }
  }, [member, reset])

  const createMutation = useMutation({
    mutationFn: (data: MemberCreate) => memberService.createMember(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      navigate('/admin/members')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MemberUpdate }) =>
      memberService.updateMember(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['member', id] })
      navigate(`/admin/members/${id}`)
    },
  })

  const onSubmit = async (data: MemberFormData) => {
    const cleanData = cleanFormData(data)
    if (isEditing) {
      await updateMutation.mutateAsync({ id: id!, data: cleanData })
    } else {
      await createMutation.mutateAsync(cleanData)
    }
  }

  if (isEditing && memberLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to={isEditing ? `/admin/members/${id}` : '/admin/members'}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Edit Member' : 'Add New Member'}
          </h1>
          <p className="text-muted-foreground">
            {isEditing ? 'Update member information' : 'Create a new church member profile'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Basic contact details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First Name *</Label>
                  <Input id="first_name" {...register('first_name')} />
                  {errors.first_name && (
                    <p className="text-sm text-destructive">{errors.first_name.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last Name *</Label>
                  <Input id="last_name" {...register('last_name')} />
                  {errors.last_name && (
                    <p className="text-sm text-destructive">{errors.last_name.message}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...register('email')} />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input id="phone" {...register('phone')} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input id="date_of_birth" type="date" {...register('date_of_birth')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <select
                    id="gender"
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                    {...register('gender')}
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Church Information */}
          <Card>
            <CardHeader>
              <CardTitle>Church Information</CardTitle>
              <CardDescription>Membership status and dates</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="member_status">Status</Label>
                <select
                  id="member_status"
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('member_status')}
                >
                  <option value="active">Active</option>
                  <option value="visitor">Visitor</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="join_date">Join Date</Label>
                  <Input id="join_date" type="date" {...register('join_date')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="baptism_date">Baptism Date</Label>
                  <Input id="baptism_date" type="date" {...register('baptism_date')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <textarea
                  id="notes"
                  rows={4}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  {...register('notes')}
                />
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Address</CardTitle>
              <CardDescription>Physical address information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="address_line1">Address Line 1</Label>
                <Input id="address_line1" {...register('address_line1')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address_line2">Address Line 2</Label>
                <Input id="address_line2" {...register('address_line2')} />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input id="city" {...register('city')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State/Province</Label>
                  <Input id="state" {...register('state')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postal_code">Postal Code</Label>
                  <Input id="postal_code" {...register('postal_code')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input id="country" {...register('country')} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 mt-6">
          <Link to={isEditing ? `/admin/members/${id}` : '/admin/members'}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Update Member' : 'Create Member'}
          </Button>
        </div>
      </form>
    </div>
  )
}
