import { useState, useEffect, useCallback } from 'react'
import { Search, UserPlus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { memberService } from '@/services/members'
import type { Member } from '@/types'

interface AddFamilyMemberModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  onSuccess?: () => void
}

type RelationshipType = 'spouse' | 'child' | 'parent' | 'sibling'

const RELATIONSHIP_OPTIONS: { value: RelationshipType; label: string }[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
]

export function AddFamilyMemberModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  onSuccess,
}: AddFamilyMemberModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Member[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('spouse')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('')
      setSearchResults([])
      setSelectedMember(null)
      setRelationshipType('spouse')
      setError(null)
    }
  }, [isOpen])

  // Search for members
  const searchMembers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await memberService.getMembers({
        search: query,
        page_size: 10,
      })
      // Filter out the current member
      setSearchResults(response.items.filter((m) => m.id !== memberId))
    } catch (err) {
      console.error('Search error:', err)
    } finally {
      setIsSearching(false)
    }
  }, [memberId])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchMembers(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchMembers])

  const handleSubmit = async () => {
    if (!selectedMember) {
      setError('Please select a family member')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      await memberService.addFamilyRelationship(
        memberId,
        selectedMember.id,
        relationshipType
      )
      onSuccess?.()
      onClose()
    } catch (err) {
      console.error('Error adding family member:', err)
      setError('Failed to add family relationship. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">Add Family Member</h2>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <p className="text-sm text-gray-600">
            Add a family relationship for <span className="font-medium">{memberName}</span>
          </p>

          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search Members</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="search"
                type="text"
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
              )}
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && !selectedMember && (
            <div className="border rounded-lg max-h-48 overflow-y-auto">
              {searchResults.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 border-b last:border-b-0 text-left"
                  onClick={() => {
                    setSelectedMember(member)
                    setSearchQuery('')
                    setSearchResults([])
                  }}
                >
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {member.first_name[0]}{member.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {member.first_name} {member.last_name}
                    </p>
                    {member.email && (
                      <p className="text-sm text-gray-500">{member.email}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Selected Member */}
          {selectedMember && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {selectedMember.photo_url ? (
                    <img
                      src={selectedMember.photo_url}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 font-medium">
                        {selectedMember.first_name[0]}{selectedMember.last_name[0]}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">
                      {selectedMember.first_name} {selectedMember.last_name}
                    </p>
                    {selectedMember.email && (
                      <p className="text-sm text-gray-500">{selectedMember.email}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMember(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Relationship Type */}
          <div className="space-y-2">
            <Label>Relationship Type</Label>
            <div className="grid grid-cols-2 gap-2">
              {RELATIONSHIP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium transition-colors
                    ${
                      relationshipType === option.value
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-gray-200 hover:border-gray-300'
                    }
                  `}
                  onClick={() => setRelationshipType(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {selectedMember
                ? `${selectedMember.first_name} is ${memberName}'s ${relationshipType}`
                : 'Select how this person is related'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedMember || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding...
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4 mr-2" />
                Add Relationship
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default AddFamilyMemberModal
