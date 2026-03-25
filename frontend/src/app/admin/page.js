'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { Users, CreditCard, Trophy, Heart, DollarSign, Calendar } from 'lucide-react'

export default function AdminOverviewPage() {
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.adminGetReports().then(setReports).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  const stats = [
    { label: 'Total Users', value: reports?.total_users || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Subscribers', value: reports?.active_subscribers || 0, icon: CreditCard, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Prize Pool', value: `$${(reports?.prize_pool?.total || 0).toFixed(2)}`, icon: Trophy, color: 'bg-amber-50 text-amber-600' },
    { label: 'Charity Total', value: `$${(reports?.total_charity_contributions || 0).toFixed(2)}`, icon: Heart, color: 'bg-rose-50 text-rose-600' },
    { label: 'Total Draws', value: reports?.total_draws || 0, icon: Calendar, color: 'bg-purple-50 text-purple-600' },
    { label: 'Total Winners', value: reports?.total_winners || 0, icon: DollarSign, color: 'bg-orange-50 text-orange-600' },
  ]

  return (
    <div data-testid="admin-overview">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <Card key={i} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.color}`}>
                  <s.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-stone-400 uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-serif font-bold text-stone-900">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
