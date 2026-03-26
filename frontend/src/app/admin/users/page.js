'use client'
import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedUserId, setSelectedUserId] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    role: 'user',
    charity_contribution_pct: 10,
    selected_charity_id: '',
  })
  const [scoreDrafts, setScoreDrafts] = useState({})

  useEffect(() => {
    api.adminGetUsers().then(setUsers).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false))
  }, [])

  const loadUserDetail = async (userId) => {
    setSelectedUserId(userId)
    setDetailLoading(true)
    try {
      const detail = await api.adminGetUser(userId)
      setSelectedUser(detail)
      setProfileForm({
        full_name: detail.profile?.full_name || '',
        role: detail.profile?.role || 'user',
        charity_contribution_pct: detail.profile?.charity_contribution_pct || 10,
        selected_charity_id: detail.profile?.selected_charity_id || '',
      })
      setScoreDrafts(
        Object.fromEntries(
          (detail.scores || []).map((score) => [
            score.id,
            { score: String(score.score), played_date: score.played_date },
          ])
        )
      )
    } catch {
      toast.error('Failed to load user details')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!selectedUserId) return
    try {
      await api.adminUpdateUser(selectedUserId, {
        ...profileForm,
        selected_charity_id: profileForm.selected_charity_id || null,
      })
      toast.success('User updated')
      setUsers((current) =>
        current.map((user) =>
          user.id === selectedUserId
            ? {
                ...user,
                full_name: profileForm.full_name,
                role: profileForm.role,
                charity_contribution_pct: profileForm.charity_contribution_pct,
                selected_charity_id: profileForm.selected_charity_id || null,
              }
            : user
        )
      )
      await loadUserDetail(selectedUserId)
    } catch (error) {
      toast.error(error.message || 'Failed to update user')
    }
  }

  const handleSaveScore = async (scoreId) => {
    if (!selectedUserId) return
    const draft = scoreDrafts[scoreId]
    try {
      await api.adminUpdateScore(selectedUserId, scoreId, {
        score: Number(draft.score),
        played_date: draft.played_date,
      })
      toast.success('Score updated')
      await loadUserDetail(selectedUserId)
    } catch (error) {
      toast.error(error.message || 'Failed to update score')
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  return (
    <div data-testid="admin-users-page">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">User Management</h1>
      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-8">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" data-testid="users-table">
                <thead>
                  <tr className="border-b border-stone-100">
                    <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Name</th>
                    <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Email</th>
                    <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Role</th>
                    <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Charity %</th>
                    <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Joined</th>
                    <th className="text-left p-4 text-xs text-stone-400 uppercase tracking-wider font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors" data-testid={`user-row-${index}`}>
                      <td className="p-4 font-medium text-stone-900">{user.full_name || '-'}</td>
                      <td className="p-4 text-stone-500 text-sm">{user.email}</td>
                      <td className="p-4">
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>{user.role}</Badge>
                      </td>
                      <td className="p-4 text-stone-600">{user.charity_contribution_pct || 10}%</td>
                      <td className="p-4 text-stone-500 text-sm">{formatDate(user.created_at)}</td>
                      <td className="p-4">
                        <Button variant="ghost" size="sm" onClick={() => loadUserDetail(user.id)}>
                          Manage
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-6">
            <div>
              <h2 className="font-serif text-2xl font-bold text-stone-900">User Detail</h2>
              <p className="text-sm text-stone-500 mt-1">Edit profile data and the user&apos;s saved scores.</p>
            </div>

            {!selectedUserId ? (
              <div className="rounded-xl border border-dashed border-stone-200 p-6 text-sm text-stone-400">
                Select a user to edit their profile, role, charity settings, and golf scores.
              </div>
            ) : detailLoading || !selectedUser ? (
              <div className="text-sm text-stone-400">Loading details...</div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-stone-600 block mb-1">Full Name</label>
                    <Input value={profileForm.full_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm text-stone-600 block mb-1">Role</label>
                    <select
                      value={profileForm.role}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, role: e.target.value }))}
                      className="h-10 rounded-xl border border-stone-200 px-3 text-sm w-full"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm text-stone-600 block mb-1">Charity Contribution %</label>
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      value={profileForm.charity_contribution_pct}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, charity_contribution_pct: Number(e.target.value) || 10 }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm text-stone-600 block mb-1">Selected Charity ID</label>
                    <Input
                      value={profileForm.selected_charity_id}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, selected_charity_id: e.target.value }))}
                      placeholder="Optional UUID"
                    />
                  </div>
                  <Button className="w-full" onClick={handleSaveProfile}>Save User</Button>
                </div>

                <div className="border-t border-stone-100 pt-6">
                  <h3 className="font-serif text-lg font-bold text-stone-900 mb-3">Scores</h3>
                  <div className="space-y-3">
                    {(selectedUser.scores || []).length === 0 && (
                      <p className="text-sm text-stone-400">No scores saved for this user.</p>
                    )}
                    {(selectedUser.scores || []).map((score) => (
                      <div key={score.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            type="number"
                            min="1"
                            max="45"
                            value={scoreDrafts[score.id]?.score || ''}
                            onChange={(e) =>
                              setScoreDrafts((prev) => ({
                                ...prev,
                                [score.id]: { ...prev[score.id], score: e.target.value },
                              }))
                            }
                          />
                          <Input
                            type="date"
                            value={scoreDrafts[score.id]?.played_date || ''}
                            onChange={(e) =>
                              setScoreDrafts((prev) => ({
                                ...prev,
                                [score.id]: { ...prev[score.id], played_date: e.target.value },
                              }))
                            }
                          />
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => handleSaveScore(score.id)}>
                          Save Score
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
