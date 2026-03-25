'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { CreditCard, Trophy, Heart, Target, Plus, Trash2, ExternalLink } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState('')
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('golf_token')
    if (!token) { router.push('/auth/login'); return }
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [me, sc, res] = await Promise.all([api.getMe(), api.getScores(), api.getMyResults()])
      setProfile(me)
      setScores(sc)
      setResults(res)
    } catch (err) {
      if (err.message === 'Unauthorized') return
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAddScore = async (e) => {
    e.preventDefault()
    const scoreNum = parseInt(newScore)
    if (scoreNum < 1 || scoreNum > 45) { toast.error('Score must be 1-45'); return }
    setAdding(true)
    try {
      await api.addScore({ score: scoreNum, played_date: newDate })
      toast.success('Score added!')
      setNewScore('')
      setNewDate('')
      const sc = await api.getScores()
      setScores(sc)
    } catch (err) {
      toast.error(err.message || 'Failed to add score')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteScore = async (id) => {
    try {
      await api.deleteScore(id)
      setScores(scores.filter(s => s.id !== id))
      toast.success('Score removed')
    } catch (err) {
      toast.error('Failed to delete score')
    }
  }

  const handleManageBilling = async () => {
    try {
      const res = await api.getPortalUrl()
      if (res.portal_url) window.open(res.portal_url, '_blank')
    } catch {
      toast.error('Unable to open billing portal')
    }
  }

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading...</div></div>

  const sub = profile?.subscription
  const isActive = sub?.status === 'active'

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen bg-stone-50" data-testid="user-dashboard">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="font-serif text-4xl font-bold text-stone-900">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="mt-2 text-stone-500">Here&apos;s your golf charity overview.</p>
          </motion.div>

          {/* Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Subscription</p>
                    <Badge variant={isActive ? 'success' : 'destructive'} data-testid="subscription-status-badge">
                      {sub?.status || 'None'}
                    </Badge>
                  </div>
                </div>
                {sub?.plan && <p className="mt-3 text-sm text-stone-500">Plan: {sub.plan === 'month' ? 'Monthly' : 'Yearly'}</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                    <Target className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Scores</p>
                    <p className="text-2xl font-serif font-bold text-stone-900" data-testid="scores-count">{scores.length}/5</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Winnings</p>
                    <p className="text-2xl font-serif font-bold text-stone-900" data-testid="total-winnings">
                      {results.reduce((s, r) => s + (r.prize_amount || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                    <Heart className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <p className="text-xs text-stone-400 uppercase tracking-wider">Charity</p>
                    <p className="text-sm font-medium text-stone-900" data-testid="selected-charity">
                      {profile?.selected_charity_id ? `${profile.charity_contribution_pct}% giving` : 'Not selected'}
                    </p>
                  </div>
                </div>
                {!profile?.selected_charity_id && (
                  <Button variant="ghost" size="sm" className="mt-2 text-orange-600" onClick={() => router.push('/charities')} data-testid="select-charity-btn">
                    Choose a charity
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Score Entry */}
            <Card data-testid="score-entry-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Target className="w-5 h-5 text-orange-600" /> Your Scores
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!isActive ? (
                  <div className="text-center py-8">
                    <p className="text-stone-500 mb-4">Subscribe to enter your golf scores</p>
                    <Button onClick={() => router.push('/subscription')} data-testid="subscribe-for-scores-btn">Subscribe Now</Button>
                  </div>
                ) : (
                  <>
                    <form onSubmit={handleAddScore} className="flex gap-3 mb-6">
                      <Input
                        type="number"
                        min="1"
                        max="45"
                        value={newScore}
                        onChange={(e) => setNewScore(e.target.value)}
                        placeholder="Score (1-45)"
                        className="w-32"
                        required
                        data-testid="score-input"
                      />
                      <Input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        required
                        data-testid="score-date-input"
                      />
                      <Button type="submit" disabled={adding} size="icon" data-testid="add-score-button">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </form>
                    <div className="space-y-3">
                      {scores.length === 0 ? (
                        <p className="text-stone-400 text-sm text-center py-4">No scores yet. Add your first score above.</p>
                      ) : (
                        scores.map((s, i) => (
                          <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100" data-testid={`score-row-${i}`}>
                            <div className="flex items-center gap-4">
                              <span className="text-2xl font-serif font-bold text-stone-900">{s.score}</span>
                              <span className="text-sm text-stone-500">{formatDate(s.played_date)}</span>
                            </div>
                            <button onClick={() => handleDeleteScore(s.id)} className="text-stone-400 hover:text-red-500 transition-colors" data-testid={`delete-score-${i}`}>
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <p className="mt-4 text-xs text-stone-400">Only your latest 5 scores are kept. New scores replace the oldest.</p>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Subscription & Actions */}
            <div className="space-y-6">
              <Card data-testid="subscription-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <CreditCard className="w-5 h-5 text-orange-600" /> Subscription
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {sub ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 text-sm">Status</span>
                        <Badge variant={isActive ? 'success' : 'warning'}>{sub.status}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-stone-500 text-sm">Plan</span>
                        <span className="font-medium text-stone-900">{sub.plan === 'month' ? 'Monthly' : 'Yearly'}</span>
                      </div>
                      {sub.current_period_end && (
                        <div className="flex justify-between items-center">
                          <span className="text-stone-500 text-sm">Renews</span>
                          <span className="text-sm text-stone-700">{formatDate(sub.current_period_end)}</span>
                        </div>
                      )}
                      {sub.cancel_at_period_end && (
                        <Badge variant="warning">Cancels at end of period</Badge>
                      )}
                      <Button variant="secondary" className="w-full" onClick={handleManageBilling} data-testid="manage-billing-btn">
                        <ExternalLink className="w-4 h-4 mr-2" /> Manage Billing
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-stone-500 mb-4">No active subscription</p>
                      <Button onClick={() => router.push('/subscription')} data-testid="subscribe-btn">Subscribe Now</Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Draw Results */}
              <Card data-testid="draw-results-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Trophy className="w-5 h-5 text-amber-600" /> Your Draw Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <p className="text-stone-400 text-sm text-center py-4">No results yet. Enter scores and wait for the next draw!</p>
                  ) : (
                    <div className="space-y-3">
                      {results.slice(0, 5).map((r, i) => (
                        <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-100" data-testid={`result-row-${i}`}>
                          <div>
                            <Badge>{r.match_type}</Badge>
                            <p className="text-xs text-stone-400 mt-1">
                              Matched: {(r.matched_numbers || []).join(', ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-serif font-bold text-stone-900">${(r.prize_amount || 0).toFixed(2)}</p>
                            <Badge variant={r.payment_status === 'paid' ? 'success' : 'warning'} className="text-xs">
                              {r.payment_status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
