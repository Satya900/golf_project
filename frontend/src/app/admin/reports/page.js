'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

const COLORS = ['#ea580c', '#f97316', '#fb923c', '#fdba74']

export default function AdminReportsPage() {
  const [reports, setReports] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.adminGetReports().then(setReports).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>
  if (!reports) return <div className="text-center py-12 text-stone-400">No data</div>

  const poolData = [
    { name: '5-Match', value: reports.prize_pool?.five_match || 0 },
    { name: '4-Match', value: reports.prize_pool?.four_match || 0 },
    { name: '3-Match', value: reports.prize_pool?.three_match || 0 },
  ]

  const overviewData = [
    { name: 'Users', value: reports.total_users },
    { name: 'Subscribers', value: reports.active_subscribers },
    { name: 'Winners', value: reports.total_winners },
    { name: 'Draws', value: reports.total_draws },
  ]

  const drawStatusData = [
    { name: 'Pending', value: reports.draw_statistics?.pending || 0 },
    { name: 'Simulated', value: reports.draw_statistics?.simulated || 0 },
    { name: 'Published', value: reports.draw_statistics?.published || 0 },
  ]

  return (
    <div data-testid="admin-reports-page">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Reports & Analytics</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Platform Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={overviewData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ea580c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prize Pool Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={poolData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value" label={({ name, value }) => `${name}: $${value.toFixed(0)}`}>
                    {poolData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="p-4 bg-stone-50 rounded-xl">
                <p className="text-xs text-stone-400 uppercase tracking-wider">Total Prize Pool</p>
                <p className="text-2xl font-serif font-bold text-stone-900">${(reports.prize_pool?.total || 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl">
                <p className="text-xs text-stone-400 uppercase tracking-wider">Prizes Awarded</p>
                <p className="text-2xl font-serif font-bold text-stone-900">${(reports.total_prizes_awarded || 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl">
                <p className="text-xs text-stone-400 uppercase tracking-wider">Charity Contributions</p>
                <p className="text-2xl font-serif font-bold text-stone-900">${(reports.total_charity_contributions || 0).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl">
                <p className="text-xs text-stone-400 uppercase tracking-wider">Active Subscribers</p>
                <p className="text-2xl font-serif font-bold text-stone-900">{reports.active_subscribers || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Draw Status Mix</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={drawStatusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#78716c' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#78716c' }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#44403c" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score Frequency Insight</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Most Frequent Scores</p>
              <div className="flex flex-wrap gap-2">
                {(reports.score_frequency?.most_frequent || []).map((entry) => (
                  <span key={`most-${entry.score}`} className="rounded-full bg-orange-100 px-3 py-1 text-sm text-orange-700">
                    {entry.score} ({entry.count})
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-stone-400 uppercase tracking-wider mb-2">Least Frequent Scores</p>
              <div className="flex flex-wrap gap-2">
                {(reports.score_frequency?.least_frequent || []).map((entry) => (
                  <span key={`least-${entry.score}`} className="rounded-full bg-stone-100 px-3 py-1 text-sm text-stone-700">
                    {entry.score} ({entry.count})
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Draws</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(reports.recent_draws || []).map((draw) => (
                <div key={draw.id} className="rounded-xl border border-stone-100 bg-stone-50 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="font-medium text-stone-900">{draw.draw_date}</p>
                    <p className="text-sm text-stone-500">{draw.draw_type} draw • {draw.status}</p>
                  </div>
                  <div className="text-sm text-stone-600">
                    Pool ${(draw.total_prize_pool || 0).toFixed(2)} • Rollover ${(draw.jackpot_rollover || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
