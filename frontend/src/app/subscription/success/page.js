'use client'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { Suspense } from 'react'
import { CheckCircle } from 'lucide-react'

function SuccessContent() {
  const params = useSearchParams()
  const plan = params.get('plan') || 'month'

  return (
    <Card className="max-w-md w-full">
      <CardContent className="p-10 text-center">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <CheckCircle className="w-8 h-8 text-emerald-600" />
        </div>
        <h1 className="font-serif text-3xl font-bold text-stone-900">Welcome aboard!</h1>
        <p className="mt-3 text-stone-500">
          Your {plan === 'year' ? 'yearly' : 'monthly'} subscription is being activated. You can now enter your scores and participate in draws.
        </p>
        <div className="mt-8 space-y-3">
          <Link href="/dashboard" className="block">
            <Button className="w-full" data-testid="go-to-dashboard-btn">Go to Dashboard</Button>
          </Link>
          <Link href="/charities" className="block">
            <Button variant="secondary" className="w-full" data-testid="choose-charity-btn">Choose a Charity</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SubscriptionSuccessPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-stone-50 flex items-center justify-center px-4" data-testid="subscription-success-page">
        <Suspense fallback={<div>Loading...</div>}>
          <SuccessContent />
        </Suspense>
      </main>
    </>
  )
}
