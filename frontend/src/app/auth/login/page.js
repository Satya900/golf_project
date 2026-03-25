'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Eye, EyeOff, ArrowLeft } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await api.login({ email, password })
      localStorage.setItem('golf_token', res.token)
      localStorage.setItem('golf_user', JSON.stringify(res.user))
      toast.success('Welcome back!')
      if (res.user.role === 'admin') {
        router.push('/admin')
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      toast.error(err.message || 'Login failed')
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
            <CardTitle className="text-3xl">Welcome back</CardTitle>
            <CardDescription>Sign in to your Birdie&Give account</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  data-testid="login-email-input"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-700 mb-1 block">Password</label>
                <div className="relative">
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    data-testid="login-password-input"
                  />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading} data-testid="login-submit-button">
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
            <p className="mt-6 text-center text-sm text-stone-500">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="text-orange-600 font-medium hover:underline" data-testid="signup-link">Sign up</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
