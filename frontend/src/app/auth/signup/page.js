'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function SignupPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [charities, setCharities] = useState([])
  const [selectedCharityId, setSelectedCharityId] = useState('')
  const [contributionPct, setContributionPct] = useState(10)
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    api.getCharities().then((data) => {
      setCharities(data)
      if (data[0]?.id) setSelectedCharityId(data[0].id)
    }).catch(() => {})
  }, [])

  const handleSignup = async (e) => {
    e.preventDefault()
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    try {
      const res = await api.signup({
        email,
        password,
        full_name: fullName,
        selected_charity_id: selectedCharityId || null,
        charity_contribution_pct: contributionPct,
      })
      if (res.token) {
        localStorage.setItem('golf_token', res.token)
        localStorage.setItem('golf_user', JSON.stringify(res.user))
        toast.success('Account created! Welcome aboard.')
        router.push('/subscription')
      } else {
        toast.success('Account created! Please check your email to confirm, then sign in.')
        router.push('/auth/login')
      }
    } catch (err) {
      toast.error(err.message || 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors" data-testid="back-to-home">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Create your account</CardTitle>
            <CardDescription>Join Birdie&Give and start making an impact</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Full Name</label>
                <Input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                  required
                  data-testid="signup-name-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="signup-email-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    required
                    data-testid="signup-password-input"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Choose Your Charity</label>
                <select
                  value={selectedCharityId}
                  onChange={(e) => setSelectedCharityId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-stone-200 bg-white px-4 py-2 text-sm text-stone-900 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                >
                  {charities.map((charity) => (
                    <option key={charity.id} value={charity.id}>{charity.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Contribution Percentage</label>
                <Input
                  type="number"
                  min="10"
                  max="100"
                  value={contributionPct}
                  onChange={(e) => setContributionPct(parseInt(e.target.value, 10) || 10)}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="signup-submit-button">
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-stone-500">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-orange-600 font-medium hover:underline" data-testid="login-link">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
