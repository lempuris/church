import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit, Trash2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { donationService } from '@/services'
import { useAuthStore } from '@/store/auth'
import type { DonationCategoryCreate } from '@/types'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function CategoryList() {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'admin'

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: categories, isLoading } = useQuery({
    queryKey: ['donation-categories', false],
    queryFn: () => donationService.getCategories(false),
  })

  const createMutation = useMutation({
    mutationFn: (data: DonationCategoryCreate) => donationService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-categories'] })
      resetForm()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: DonationCategoryCreate }) =>
      donationService.updateCategory(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-categories'] })
      resetForm()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: donationService.deleteCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['donation-categories'] })
    },
  })

  const resetForm = () => {
    setShowForm(false)
    setEditingId(null)
    setName('')
    setDescription('')
  }

  const handleEdit = (category: { id: string; name: string; description: string | null }) => {
    setEditingId(category.id)
    setName(category.name)
    setDescription(category.description || '')
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    const data: DonationCategoryCreate = {
      name: name.trim(),
      description: description.trim() || undefined,
    }

    if (editingId) {
      await updateMutation.mutateAsync({ id: editingId, data })
    } else {
      await createMutation.mutateAsync(data)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to deactivate this category?')) {
      await deleteMutation.mutateAsync(id)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Donation Categories</h1>
          <p className="text-muted-foreground">Manage donation categories</p>
        </div>
        {isAdmin && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        )}
      </div>

      {/* Add/Edit Form */}
      {showForm && isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? 'Edit Category' : 'Add Category'}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Tithe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g., Regular tithe - 10% of income"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editingId ? 'Update' : 'Create'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Categories List */}
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
          <CardDescription>
            {categories?.items.length || 0} categories
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : categories?.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No categories yet</p>
            </div>
          ) : (
            <div className="divide-y">
              {categories?.items.map((category) => (
                <div
                  key={category.id}
                  className={`flex items-center justify-between py-4 ${
                    !category.is_active ? 'opacity-50' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{category.name}</h3>
                      {!category.is_active && (
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground">
                        {category.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {category.donation_count} donations &bull;{' '}
                      {formatCurrency(category.total_amount)} total
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {category.is_active && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(category.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
