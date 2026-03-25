'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { Plus, Play, Send, Eye } from 'lucide-react'

export default function AdminDrawsPage() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [newDate, setNewDate] = useState('')
  const [drawType, setDrawType] = useState('random')
  const [creating, setCreating] = useState(false)

  const loadDraws = () => {
    api.adminGetDraws().then(setDraws).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { loadDraws() }, [])

  const handleCreate = async () => {
    if (!newDate) { toast.error('Select a draw date'); return }
    setCreating(true)
    try {
      await api.adminCreateDraw({ draw_date: newDate, draw_type: drawType })
      toast.success('Draw created')
      setNewDate('')
      loadDraws()
    } catch (err) {
      toast.error(err.message || 'Failed to create')
    } finally {
      setCreating(false)
    }
  }

  const handleRun = async (id) => {
    try {
      const res = await api.adminRunDraw(id)
      toast.success(`Draw run! ${res.winners_count || 0} winners found`)
      loadDraws()
    } catch (err) {
      toast.error(err.message || 'Failed to run')
    }
  }

  const handlePublish = async (id) => {
    try {
      await api.adminPublishDraw(id)
      toast.success('Draw published!')
      loadDraws()
    } catch (err) {
      toast.error(err.message || 'Failed to publish')
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  return (
    <div data-testid="admin-draws-page">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Draw Management</h1>

      {/* Create Draw */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <h3 className="font-serif text-lg font-bold text-stone-900 mb-4">Create New Draw</h3>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="text-sm text-stone-600 block mb-1">Draw Date</label>
              <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} data-testid="draw-date-input" />
            </div>
            <div>
              <label className="text-sm text-stone-600 block mb-1">Type</label>
              <select
                value={drawType}
                onChange={(e) => setDrawType(e.target.value)}
                className="h-10 rounded-xl border border-stone-200 px-3 text-sm"
                data-testid="draw-type-select"
              >
                <option value="random">Random</option>
                <option value="algorithmic">Algorithmic</option>
              </select>
            </div>
            <Button onClick={handleCreate} disabled={creating} data-testid="create-draw-btn">
              <Plus className="w-4 h-4 mr-2" /> Create Draw
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Draws List */}
      <div className="space-y-4">
        {draws.map((draw, i) => (
          <Card key={draw.id} data-testid={`admin-draw-${i}`}>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-lg font-bold text-stone-900">
                      Draw — {formatDate(draw.draw_date)}
                    </h3>
                    <Badge variant={draw.status === 'published' ? 'success' : draw.status === 'simulated' ? 'warning' : 'secondary'}>
                      {draw.status}
                    </Badge>
                    <Badge variant="outline">{draw.draw_type}</Badge>
                  </div>
                  {draw.winning_numbers && draw.winning_numbers.length > 0 && (
                    <div className="flex gap-2 mt-2">
                      {draw.winning_numbers.map((n, j) => (
                        <span key={j} className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-sm font-bold">
                          {n}
                        </span>
                      ))}
                    </div>
                  )}
                  {draw.total_prize_pool > 0 && (
                    <p className="text-sm text-stone-500 mt-2">
                      Prize Pool: ${(draw.total_prize_pool || 0).toFixed(2)} | 
                      5-match: ${(draw.five_match_pool || 0).toFixed(2)} |
                      4-match: ${(draw.four_match_pool || 0).toFixed(2)} |
                      3-match: ${(draw.three_match_pool || 0).toFixed(2)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  {draw.status === 'pending' && (
                    <Button size="sm" variant="secondary" onClick={() => handleRun(draw.id)} data-testid={`run-draw-${i}`}>
                      <Play className="w-3 h-3 mr-1" /> Run Draw
                    </Button>
                  )}
                  {draw.status === 'simulated' && (
                    <>
                      <Button size="sm" variant="secondary" onClick={() => handleRun(draw.id)} data-testid={`rerun-draw-${i}`}>
                        <Play className="w-3 h-3 mr-1" /> Re-run
                      </Button>
                      <Button size="sm" onClick={() => handlePublish(draw.id)} data-testid={`publish-draw-${i}`}>
                        <Send className="w-3 h-3 mr-1" /> Publish
                      </Button>
                    </>
                  )}
                  {draw.status === 'published' && (
                    <Badge variant="success">Published {draw.published_at ? formatDate(draw.published_at) : ''}</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
