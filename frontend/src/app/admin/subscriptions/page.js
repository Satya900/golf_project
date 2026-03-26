'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    plan: 'month',
    status: 'active',
    current_period_end: '',
    cancel_at_period_end: false,
  })

  useEffect(() => {
    api.adminGetSubscriptions().then(setSubscriptions).catch(() => toast.error('Failed to load subscriptions')).finally(() => setLoading(false))
  }, [])

  const startEdit = (subscription) => {
    setEditingId(subscription.id)
    setForm({
      plan: subscription.plan || 'month',
      status: subscription.status || 'active',
      current_period_end: subscription.current_period_end ? subscription.current_period_end.slice(0, 10) : '',
      cancel_at_period_end: Boolean(subscription.cancel_at_period_end),
    })
  }

  const handleSave = async () => {
    try {
      const updated = await api.adminUpdateSubscription(editingId, {
        ...form,
        current_period_end: form.current_period_end || null,
      })
      setSubscriptions((current) => current.map((sub) => (sub.id === editingId ? updated : sub)))
      setEditingId(null)
      toast.success('Subscription updated')
    } catch (error) {
      toast.error(error.message || 'Failed to update subscription')
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  return (
    <div data-testid="admin-subscriptions-page">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Subscription Management</h1>
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stone-100">
                  <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Subscriber</th>
                  <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Plan</th>
                  <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Status</th>
                  <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Renews</th>
                  <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Cancel At Period End</th>
                  <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-stone-50 align-top">
                    <td className="p-4">
                      <p className="font-medium text-stone-900">{sub.profiles?.full_name || 'Unknown user'}</p>
                      <p className="text-sm text-stone-500">{sub.profiles?.email}</p>
                    </td>
                    <td className="p-4">
                      {editingId === sub.id ? (
                        <select
                          value={form.plan}
                          onChange={(e) => setForm((prev) => ({ ...prev, plan: e.target.value }))}
                          className="h-10 rounded-xl border border-stone-200 px-3 text-sm w-full"
                        >
                          <option value="month">Monthly</option>
                          <option value="year">Yearly</option>
                        </select>
                      ) : (
                        <span className="text-stone-600">{sub.plan === 'month' ? 'Monthly' : 'Yearly'}</span>
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === sub.id ? (
                        <select
                          value={form.status}
                          onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
                          className="h-10 rounded-xl border border-stone-200 px-3 text-sm w-full"
                        >
                          <option value="incomplete">Incomplete</option>
                          <option value="active">Active</option>
                          <option value="canceled">Canceled</option>
                          <option value="past_due">Past Due</option>
                          <option value="revoked">Revoked</option>
                        </select>
                      ) : (
                        <Badge variant={sub.status === 'active' ? 'success' : 'warning'}>{sub.status}</Badge>
                      )}
                    </td>
                    <td className="p-4 text-stone-500">
                      {editingId === sub.id ? (
                        <Input type="date" value={form.current_period_end} onChange={(e) => setForm((prev) => ({ ...prev, current_period_end: e.target.value }))} />
                      ) : (
                        sub.current_period_end ? formatDate(sub.current_period_end) : 'N/A'
                      )}
                    </td>
                    <td className="p-4 text-stone-500">
                      {editingId === sub.id ? (
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={form.cancel_at_period_end}
                            onChange={(e) => setForm((prev) => ({ ...prev, cancel_at_period_end: e.target.checked }))}
                          />
                          Cancel at period end
                        </label>
                      ) : (
                        sub.cancel_at_period_end ? 'Yes' : 'No'
                      )}
                    </td>
                    <td className="p-4">
                      {editingId === sub.id ? (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={handleSave}>Save</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" onClick={() => startEdit(sub)}>
                          Manage
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
