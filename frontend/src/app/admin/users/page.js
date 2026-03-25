'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'

export default function AdminUsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.adminGetUsers().then(setUsers).catch(() => toast.error('Failed to load users')).finally(() => setLoading(false))
  }, [])

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    try {
      await api.adminUpdateUser(userId, { role: newRole })
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u))
      toast.success(`Role updated to ${newRole}`)
    } catch {
      toast.error('Failed to update role')
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  return (
    <div data-testid="admin-users-page">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">User Management</h1>
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
                {users.map((u, i) => (
                  <tr key={u.id} className="border-b border-stone-50 hover:bg-stone-50 transition-colors" data-testid={`user-row-${i}`}>
                    <td className="p-4 font-medium text-stone-900">{u.full_name || '—'}</td>
                    <td className="p-4 text-stone-500 text-sm">{u.email}</td>
                    <td className="p-4">
                      <Badge variant={u.role === 'admin' ? 'default' : 'secondary'}>{u.role}</Badge>
                    </td>
                    <td className="p-4 text-stone-600">{u.charity_contribution_pct || 10}%</td>
                    <td className="p-4 text-stone-500 text-sm">{formatDate(u.created_at)}</td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm" onClick={() => handleRoleToggle(u.id, u.role)} data-testid={`toggle-role-${i}`}>
                        {u.role === 'admin' ? 'Make User' : 'Make Admin'}
                      </Button>
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
