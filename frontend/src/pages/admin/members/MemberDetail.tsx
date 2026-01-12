import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Users,
  Loader2,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { memberService } from '@/services/members'
import { cn } from '@/lib/utils'

export function MemberDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: member, isLoading } = useQuery({
    queryKey: ['member', id],
    queryFn: () => memberService.getMember(id!),
    enabled: !!id,
  })

  const { data: family } = useQuery({
    queryKey: ['member', id, 'family'],
    queryFn: () => memberService.getMemberFamily(id!),
    enabled: !!id,
  })

  const deleteMutation = useMutation({
    mutationFn: () => memberService.deleteMember(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      navigate('/admin/members')
    },
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!member) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold">Member not found</h2>
        <Link to="/admin/members">
          <Button className="mt-4">Back to Members</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            {member.photo_url ? (
              <img
                src={member.photo_url}
                alt={`${member.first_name} ${member.last_name}`}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xl">
                {member.first_name.charAt(0)}
                {member.last_name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold">
                {member.first_name} {member.last_name}
              </h1>
              <span
                className={cn(
                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                  member.member_status === 'active' && 'bg-green-100 text-green-800',
                  member.member_status === 'visitor' && 'bg-blue-100 text-blue-800',
                  member.member_status === 'inactive' && 'bg-gray-100 text-gray-800'
                )}
              >
                {member.member_status}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/admin/members/${id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Delete</CardTitle>
              <CardDescription>
                Are you sure you want to delete {member.first_name} {member.last_name}?
                This will mark them as inactive.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Delete
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {member.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <a href={`mailto:${member.email}`} className="text-primary hover:underline">
                  {member.email}
                </a>
              </div>
            )}
            {member.phone && (
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <a href={`tel:${member.phone}`} className="hover:underline">
                  {member.phone}
                </a>
              </div>
            )}
            {(member.address_line1 || member.city) && (
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  {member.address_line1 && <p>{member.address_line1}</p>}
                  {member.address_line2 && <p>{member.address_line2}</p>}
                  <p>
                    {[member.city, member.state, member.postal_code]
                      .filter(Boolean)
                      .join(', ')}
                  </p>
                  {member.country && <p>{member.country}</p>}
                </div>
              </div>
            )}
            {!member.email && !member.phone && !member.address_line1 && (
              <p className="text-muted-foreground">No contact information</p>
            )}
          </CardContent>
        </Card>

        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {member.gender && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Gender</span>
                <span className="capitalize">{member.gender}</span>
              </div>
            )}
            {member.date_of_birth && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Birth</span>
                <span>{new Date(member.date_of_birth).toLocaleDateString()}</span>
              </div>
            )}
            {member.join_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Join Date</span>
                <span>{new Date(member.join_date).toLocaleDateString()}</span>
              </div>
            )}
            {member.baptism_date && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Baptism Date</span>
                <span>{new Date(member.baptism_date).toLocaleDateString()}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Family Relationships */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-4 w-4" />
              Family
            </CardTitle>
          </CardHeader>
          <CardContent>
            {family && family.length > 0 ? (
              <div className="space-y-3">
                {family.map((relative) => (
                  <Link
                    key={relative.id}
                    to={`/admin/members/${relative.id}`}
                    className="flex items-center gap-3 p-2 -mx-2 rounded-md hover:bg-muted transition-colors"
                  >
                    {relative.photo_url ? (
                      <img
                        src={relative.photo_url}
                        alt={`${relative.first_name} ${relative.last_name}`}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-medium">
                        {relative.first_name.charAt(0)}
                        {relative.last_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">
                        {relative.first_name} {relative.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {relative.relationship_type}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No family relationships</p>
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        {member.notes && (
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{member.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
