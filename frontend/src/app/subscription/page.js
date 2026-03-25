'use client'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { motion } from 'framer-motion'
import { Check, ArrowRight } from 'lucide-react'

const MONTHLY_ID = process.env.NEXT_PUBLIC_POLAR_MONTHLY_ID || '8c4437f7-fa39-4559-a055-b0abd2d0d8b4'
const YEARLY_ID = process.env.NEXT_PUBLIC_POLAR_YEARLY_ID || '164ec589-0a26-46aa-81bd-d79ee27cd8d0'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('golf_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const handleCheckout = async (productId) => {
    if (!user) {
      toast.error('Please sign in first')
      window.location.href = '/auth/login'
      return
    }
    setLoading(productId)
    try {
      const res = await api.createCheckout(productId)
      if (res.checkout_url) {
        window.location.href = res.checkout_url
      } else {
        toast.error('Failed to create checkout session')
      }
    } catch (err) {
      toast.error(err.message || 'Checkout failed')
    } finally {
      setLoading(null)
    }
  }

  const plans = [
    {
      id: MONTHLY_ID,
      name: 'Monthly',
      price: '9.99',
      period: '/month',
      features: ['Enter 5 golf scores', 'Monthly prize draws', '10% to charity (min)', 'Full dashboard access', 'Winner verification'],
      popular: false,
    },
    {
      id: YEARLY_ID,
      name: 'Yearly',
      price: '99.99',
      period: '/year',
      features: ['Everything in Monthly', '2 months free', 'Priority draw entries', 'Increased prize eligibility', 'Annual impact report'],
      popular: true,
    },
  ]

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen bg-stone-50" data-testid="subscription-page">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge className="mb-4">Choose Your Plan</Badge>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
              Subscribe & Start Winning
            </h1>
            <p className="mt-4 text-stone-500 text-lg max-w-xl mx-auto">
              Join the community. Enter your scores. Support charity. Win prizes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {plans.map((plan, i) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className={`relative h-full ${plan.popular ? 'ring-2 ring-orange-600' : ''}`} data-testid={`plan-${plan.name.toLowerCase()}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <div className="mt-4">
                      <span className="text-5xl font-serif font-bold text-stone-900">${plan.price}</span>
                      <span className="text-stone-400 ml-1">{plan.period}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((f, j) => (
                        <li key={j} className="flex items-center gap-3 text-sm text-stone-600">
                          <Check className="w-4 h-4 text-orange-600 flex-shrink-0" /> {f}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'default' : 'secondary'}
                      size="lg"
                      disabled={loading === plan.id}
                      onClick={() => handleCheckout(plan.id)}
                      data-testid={`checkout-${plan.name.toLowerCase()}-btn`}
                    >
                      {loading === plan.id ? 'Redirecting...' : 'Subscribe'} <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
