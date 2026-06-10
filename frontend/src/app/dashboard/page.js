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
import { CreditCard, Trophy, Heart, Target, Plus, Trash2, ExternalLink, Pencil, Save, Bell, Upload } from 'lucide-react'

export default function DashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState(null)
  const [scores, setScores] = useState([])
  const [results, setResults] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [newScore, setNewScore] = useState('')
  const [newDate, setNewDate] = useState('')
  const [adding, setAdding] = useState(false)
  const [editingScoreId, setEditingScoreId] = useState(null)
  const [editScoreValue, setEditScoreValue] = useState('')
  const [editScoreDate, setEditScoreDate] = useState('')
  const [profileForm, setProfileForm] = useSte({ full_name: '', charity_contribution_pct: 10 })
  const [savingProfile, setSavingProfile] = useState(false)
  const [proofDrafts, setProofDrafts] = useState({})

  useEffect(() => {
    const token = localStorage.getItem('golf_token')
    if (!token) {
      router.push('/auth/login')
      return
    }
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      const [me, sc, res, note] = await Promise.all([api.getMe(), api.getScores(), api.getMyResults(), api.getNotifications()])
      setProfile(me)
      setScores(sc)
      setResults(res)
      setNotifications(note)
      setProfileForm({
        full_name: me.full_name || '',
        charity_contribution_pct: me.charity_contribution_pct || 10,
      })
    } catch (err) {
      if (err.message === 'Unauthorized') return
      toast.error('Failed to load dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAddScore = async (e) => {
    e.preventDefault()
    const scoreNum = parseInt(newScore, 10)
    if (scoreNum < 1 || scoreNum > 45) {
      toast.error('Score must be 1-45')
      return
    }
    setAdding(true)
    try {
      await api.addScore({ score: scoreNum, played_date: newDate })
      toast.success('Score added')
      setNewScore('')
      setNewDate('')
      setScores(await api.getScores())
    } catch (err) {
      toast.error(err.message || 'Failed to add score')
    } finally {
      setAdding(false)
    }
  }

  const handleDeleteScore = async (id) => {
    try {
      await api.deleteScore(id)
      setScores(scores.filter((score) => score.id !== id))
      toast.success('Score removed')
    } catch {
      toast.error('Failed to delete score')
    }
  }

  const startEditScore = (score) => {
    setEditingScoreId(score.id)
    setEditScoreValue(String(score.score))
    setEditScoreDate(score}nfj
  }

  const handleSaveScore = async () => {
    try {
      await api.updateScore(editingScoreId, {
        score: parseInt(editScoreValue, 10),
        played_date: editScoreDate,
      })
      toast.success('Score updated')
      setEditingScoreId(null)
      setScores(await api.getScores())
    } catch (err) {
      toast.error(err.message || 'Failed to update score')
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

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const updated = await api.updateProfile(profileForm)
      setProfile((prev) => ({ ...prev, ...updated }))
      const storedUser = JSON.parse(localStorage.getItem('golf_user') || '{}')
      localStorage.setItem('golf_user', JSON.stringify({ ...storedUser, full_name: updated.full_name }))
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSubmitProof = async (resultId) => {
    try {
      await api.uploadProof(resultId, proofDrafts[resultId])
      toast.success('Proof submitted')
      setResults(await api.getMyResults())
    } catch (err) {
      toast.error(err.message || 'Failed to submit proof')
    }
  }

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><div className="animate-pulse text-stone-400">Loading...</div></div>

  const sub = profile?.subscription
  const isActive = sub?.status === 'active'
  const participation = profile?.participation || {}

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen bg-stone-50" data-testid="user-dashboard">
        <div className="max-w-7xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <h1 className="font-serif text-4xl font-bold text-stone-900">
              Welcome back{profile?.full_name ? `, ${profile.full_name}` : ''}
            </h1>
            <p className="mt-2 text-stone-500">Track your scores, charity impact, and monthly draw participation.</p>
          </motion.div>

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
                      {results.reduce((sum, result) => sum + Number(result.prize_amount || 0), 0).toFixed(2)}
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
                      {profile?.charity_name || (profile?.selected_charity_id ? `${profile.charity_contribution_pct}% giving` : 'Not selected')}
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

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            <div className="xl:col-span-2 space-y-8">
              <Card data-testid="score-entry-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Target className="w-5 h-5 text-orange-600" /> Your Scores
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!isActive ? (
                    <div className="text-center py-8">
                      <p className="text-stone-500 mb-4">Subscribe to enter and manage your golf scores</p>
                      <Button onClick={() => router.push('/subscription')} data-testid="subscribe-for-scores-btn">Subscribe Now</Button>
                    </div>
                  ) : (
                    <>
                      <form onSubmit={handleAddScore} className="flex flex-wrap gap-3 mb-6">
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
                          scores.map((score, index) => (
                            <div key={score.id} className="p-3 rounded-xl bg-stone-50 border border-stone-100" data-testid={`score-row-${index}`}>
                              {editingScoreId === score.id ? (
                                <div className="flex flex-wrap items-center gap-3">
                                  <Input type="number" min="1" max="45" className="w-28" value={editScoreValue} onChange={(e) => setEditScoreValue(e.target.value)} />
                                  <Input type="date" value={editScoreDate} onChange={(e) => setEditScoreDate(e.target.value)} className="w-44" />
                                  <Button size="sm" onClick={handleSaveScore}><Save className="w-4 h-4 mr-1" /> Save</Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingScoreId(null)}>Cancel</Button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between gap-4">
                                  <div className="flex items-center gap-4">
                                    <span className="text-2xl font-serif font-bold text-stone-900">{score.score}</span>
                                    <span className="text-sm text-stone-500">{formatDate(score.played_date)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button onClick={() => startEditScore(score)} className="text-stone-400 hover:text-orange-500 transition-colors">
                                      <Pencil className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDeleteScore(score.id)} className="text-stone-400 hover:text-red-500 transition-colors" data-testid={`delete-score-${index}`}>
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                      <p className="mt-4 text-xs text-stone-400">Only your latest 5 scores are kept. New scores replace the oldest automatically.</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card data-testid="draw-results-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Trophy className="w-5 h-5 text-amber-600" /> Your Draw Results
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <p className="text-stone-400 text-sm text-center py-4">No results yet. Enter scores and wait for the next draw.</p>
                  ) : (
                    <div className="space-y-4">
                      {results.slice(0, 5).map((result, index) => (
                        <div key={result.id} className="p-4 rounded-xl bg-stone-50 border border-stone-100" data-testid={`result-row-${index}`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge>{result.match_type}</Badge>
                                <Badge variant={result.payment_status === 'paid' ? 'success' : 'warning'}>{result.payment_status}</Badge>
                                <Badge variant={result.verification_status === 'approved' ? 'success' : result.verification_status === 'rejected' ? 'destructive' : 'secondary'}>
                                  {result.verification_status}
                                </Badge>
                              </div>
                              <p className="text-xs text-stone-400 mt-2">Matched: {(result.matched_numbers || []).join(', ')}</p>
                              <p className="text-xs text-stone-400 mt-1">Draw: {result.draws?.draw_date ? formatDate(result.draws.draw_date) : 'N/A'}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-serif font-bold text-stone-900">${Number(result.prize_amount || 0).toFixed(2)}</p>
                            </div>
                          </div>
                          {result.payment_status !== 'paid' && result.verification_status === 'pending' && (
                            <div className="mt-4 flex flex-wrap gap-3">
                              <Input
                                placeholder="Proof image URL"
                                value={proofDrafts[result.id] || ''}
                                onChange={(e) => setProofDrafts((prev) => ({ ...prev, [result.id]: e.target.value }))}
                              />
                              <Button size="sm" onClick={() => handleSubmitProof(result.id)}>
                                <Upload className="w-4 h-4 mr-1" /> Submit Proof
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

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

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Participation Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-stone-500 text-sm">Draws entered</span>
                    <span className="font-semibold text-stone-900">{participation.draws_entered || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500 text-sm">Next draw ready</span>
                    <Badge variant={participation.can_enter_next_draw ? 'success' : 'warning'}>
                      {participation.can_enter_next_draw ? 'Ready' : 'Incomplete'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-stone-500 text-sm">Upcoming draw</p>
                    <p className="font-medium text-stone-900 mt-1">
                      {participation.upcoming_draw?.draw_date ? formatDate(participation.upcoming_draw.draw_date) : 'Not scheduled'}
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Profile & Giving</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm text-stone-600 block mb-1">Full Name</label>
                    <Input value={profileForm.full_name} onChange={(e) => setProfileForm((prev) => ({ ...prev, full_name: e.target.value }))} />
                  </div>
                  <div>
                    <label className="text-sm text-stone-600 block mb-1">Charity Contribution %</label>
                    <Input type="number" min="10" max="100" value={profileForm.charity_contribution_pct} onChange={(e) => setProfileForm((prev) => ({ ...prev, charity_contribution_pct: Number(e.target.value) || 10 }))} />
                  </div>
                  <Button className="w-full" onClick={handleSaveProfile} disabled={savingProfile}>
                    <Save className="w-4 h-4 mr-2" /> Save Settings
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Bell className="w-5 h-5 text-orange-600" /> Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {notifications.length === 0 ? (
                    <p className="text-sm text-stone-400">No notifications yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {notifications.slice(0, 4).map((notification) => (
                        <div key={notification.id} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                          <p className="text-sm font-medium text-stone-900">{notification.title}</p>
                          <p className="text-xs text-stone-500 mt-1">{notification.message}</p>
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
