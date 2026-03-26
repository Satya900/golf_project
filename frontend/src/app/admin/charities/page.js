'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import Image from 'next/image'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'

export default function AdminCharitiesPage() {
  const [charities, setCharities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', image_url: '', website_url: '', category: '', featured: false })
  const [eventForm, setEventForm] = useState({ charityId: '', title: '', description: '', event_date: '', location: '', registration_url: '' })

  const loadCharities = () => {
    api.adminGetCharities().then(setCharities).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { loadCharities() }, [])

  const resetForm = () => {
    setForm({ name: '', description: '', image_url: '', website_url: '', category: '', featured: false })
    setShowForm(false)
    setEditId(null)
  }

  const handleSave = async () => {
    if (!form.name) { toast.error('Name is required'); return }
    try {
      if (editId) {
        await api.adminUpdateCharity(editId, form)
        toast.success('Charity updated')
      } else {
        await api.adminCreateCharity(form)
        toast.success('Charity created')
      }
      resetForm()
      loadCharities()
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    }
  }

  const handleEdit = (c) => {
    setForm({ name: c.name, description: c.description || '', image_url: c.image_url || '', website_url: c.website_url || '', category: c.category || '', featured: c.featured })
    setEditId(c.id)
    setShowForm(true)
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this charity?')) return
    try {
      await api.adminDeleteCharity(id)
      toast.success('Charity deleted')
      loadCharities()
    } catch {
      toast.error('Failed to delete')
    }
  }

  const handleAddEvent = async () => {
    if (!eventForm.charityId || !eventForm.title || !eventForm.event_date) {
      toast.error('Event title, charity, and date are required')
      return
    }
    try {
      await api.adminAddCharityEvent(eventForm.charityId, eventForm)
      toast.success('Event added')
      setEventForm({ charityId: '', title: '', description: '', event_date: '', location: '', registration_url: '' })
    } catch (err) {
      toast.error(err.message || 'Failed to add event')
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  return (
    <div data-testid="admin-charities-page">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-serif text-3xl font-bold text-stone-900">Charity Management</h1>
        <Button onClick={() => { resetForm(); setShowForm(true) }} data-testid="add-charity-btn">
          <Plus className="w-4 h-4 mr-2" /> Add Charity
        </Button>
      </div>

      {showForm && (
        <Card className="mb-8">
          <CardContent className="p-6">
            <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">{editId ? 'Edit' : 'New'} Charity</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-stone-600 block mb-1">Name *</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="charity-name-input" />
              </div>
              <div>
                <label className="text-sm text-stone-600 block mb-1">Category</label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} data-testid="charity-category-input" />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm text-stone-600 block mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm min-h-[100px]" data-testid="charity-desc-input" />
              </div>
              <div>
                <label className="text-sm text-stone-600 block mb-1">Image URL</label>
                <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} data-testid="charity-image-input" />
              </div>
              <div>
                <label className="text-sm text-stone-600 block mb-1">Website URL</label>
                <Input value={form.website_url} onChange={(e) => setForm({ ...form, website_url: e.target.value })} data-testid="charity-website-input" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} className="rounded" data-testid="charity-featured-input" />
                <label className="text-sm text-stone-600">Featured</label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={handleSave} data-testid="save-charity-btn">
                <Check className="w-4 h-4 mr-1" /> {editId ? 'Update' : 'Create'}
              </Button>
              <Button variant="ghost" onClick={resetForm} data-testid="cancel-charity-btn">
                <X className="w-4 h-4 mr-1" /> Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">Upcoming Charity Event</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-stone-600 block mb-1">Charity</label>
              <select
                value={eventForm.charityId}
                onChange={(e) => setEventForm({ ...eventForm, charityId: e.target.value })}
                className="h-10 rounded-xl border border-stone-200 px-3 text-sm w-full"
              >
                <option value="">Select charity</option>
                {charities.map((charity) => <option key={charity.id} value={charity.id}>{charity.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-stone-600 block mb-1">Event Date</label>
              <Input type="datetime-local" value={eventForm.event_date} onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-stone-600 block mb-1">Title</label>
              <Input value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} />
            </div>
            <div>
              <label className="text-sm text-stone-600 block mb-1">Location</label>
              <Input value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-stone-600 block mb-1">Description</label>
              <textarea value={eventForm.description} onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })} className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm min-h-[80px]" />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm text-stone-600 block mb-1">Registration URL</label>
              <Input value={eventForm.registration_url} onChange={(e) => setEventForm({ ...eventForm, registration_url: e.target.value })} />
            </div>
          </div>
          <Button className="mt-6" onClick={handleAddEvent}>Add Event</Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {charities.map((c, i) => (
          <Card key={c.id} data-testid={`admin-charity-${i}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                {c.image_url && (
                  <Image src={c.image_url} alt={c.name} width={48} height={48} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <div>
                  <h4 className="font-medium text-stone-900">{c.name}</h4>
                  <div className="flex gap-2 mt-1">
                    {c.category && <Badge variant="secondary">{c.category}</Badge>}
                    {c.featured && <Badge>Featured</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} data-testid={`edit-charity-${i}`}>
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} data-testid={`delete-charity-${i}`}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
