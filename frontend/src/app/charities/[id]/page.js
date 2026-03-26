'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowLeft, Heart, Globe, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

export default function CharityDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [charity, setCharity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [pct, setPct] = useState(10)
  const [donationAmount, setDonationAmount] = useState('')
  const [selecting, setSelecting] = useState(false)
  const [donating, setDonating] = useState(false)

  useEffect(() => {
    if (params.id) {
      api.getCharity(params.id).then(setCharity).catch(() => toast.error('Charity not found')).finally(() => setLoading(false))
    }
  }, [params.id])

  const handleSelect = async () => {
    const token = localStorage.getItem('golf_token')
    if (!token) { toast.error('Please sign in first'); router.push('/auth/login'); return }
    setSelecting(true)
    try {
      await api.selectCharity(charity.id, pct)
      toast.success(`Now supporting ${charity.name}!`)
    } catch (err) {
      toast.error(err.message || 'Failed to select charity')
    } finally {
      setSelecting(false)
    }
  }

  const handleDonate = async () => {
    const token = localStorage.getItem('golf_token')
    if (!token) { toast.error('Please sign in first'); router.push('/auth/login'); return }
    setDonating(true)
    try {
      await api.donateToCharity(charity.id, Number(donationAmount))
      toast.success('Donation recorded')
      setDonationAmount('')
      const refreshed = await api.getCharity(charity.id)
      setCharity(refreshed)
    } catch (err) {
      toast.error(err.message || 'Failed to record donation')
    } finally {
      setDonating(false)
    }
  }

  if (loading) return <><Navbar /><div className="min-h-screen pt-24 flex items-center justify-center text-stone-400">Loading...</div></>

  if (!charity) return <><Navbar /><div className="min-h-screen pt-24 flex items-center justify-center text-stone-400">Charity not found</div></>

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen bg-stone-50" data-testid="charity-detail-page">
        <div className="max-w-5xl mx-auto px-6 lg:px-10">
          <Link href="/charities" className="flex items-center gap-2 text-stone-500 hover:text-stone-700 mb-8 transition-colors" data-testid="back-to-charities">
            <ArrowLeft className="w-4 h-4" /> All Charities
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <div className="relative rounded-2xl overflow-hidden mb-6 h-[350px]">
                <Image
                  src={charity.image_url || 'https://images.pexels.com/photos/6646933/pexels-photo-6646933.jpeg?auto=compress&w=800'}
                  alt={charity.name}
                  fill
                  sizes="(max-width: 1024px) 100vw, 66vw"
                  className="object-cover"
                />
              </div>
              <Badge variant="secondary" className="mb-3">{charity.category || 'General'}</Badge>
              {charity.featured && <Badge className="ml-2">Featured</Badge>}
              <h1 className="font-serif text-4xl font-bold text-stone-900" data-testid="charity-name">{charity.name}</h1>
              <p className="mt-4 text-stone-600 leading-relaxed text-lg">{charity.description}</p>
              {charity.events?.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-serif text-2xl font-bold text-stone-900 mb-4">Upcoming Events</h2>
                  <div className="space-y-3">
                    {charity.events.map((event) => (
                      <div key={event.id} className="rounded-2xl border border-stone-200 bg-white p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <h3 className="font-semibold text-stone-900">{event.title}</h3>
                            <p className="text-sm text-stone-500 mt-1">{event.description}</p>
                            <p className="text-xs text-stone-400 mt-2">{formatDate(event.event_date)}{event.location ? ` • ${event.location}` : ''}</p>
                          </div>
                          {event.registration_url && (
                            <a href={event.registration_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 text-sm hover:underline">
                              Register
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {charity.website_url && (
                <a href={charity.website_url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-2 text-orange-600 hover:underline">
                  <Globe className="w-4 h-4" /> Visit Website <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            <div>
              <Card data-testid="support-charity-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-rose-600" />
                    </div>
                    <h3 className="font-serif text-xl font-bold text-stone-900">Support This Charity</h3>
                  </div>

                  <p className="text-stone-500 text-sm mb-6">
                    Choose how much of your subscription goes to {charity.name}. Minimum 10%.
                  </p>

                  <label className="text-sm font-medium text-stone-700 mb-2 block">Contribution Percentage</label>
                  <div className="flex items-center gap-3 mb-4">
                    <Input
                      type="number"
                      min="10"
                      max="100"
                      value={pct}
                      onChange={(e) => setPct(parseInt(e.target.value) || 10)}
                      className="w-24"
                      data-testid="contribution-pct-input"
                    />
                    <span className="text-stone-500">%</span>
                  </div>

                  <div className="p-4 bg-stone-50 rounded-xl mb-6">
                    <p className="text-sm text-stone-500">Total raised so far</p>
                    <p className="text-2xl font-serif font-bold text-stone-900" data-testid="charity-total-raised">
                      {formatCurrency(charity.total_raised || 0)}
                    </p>
                  </div>

                  <Button className="w-full" onClick={handleSelect} disabled={selecting} data-testid="select-charity-btn">
                    {selecting ? 'Selecting...' : 'Support This Charity'}
                  </Button>

                  <div className="mt-6 border-t border-stone-100 pt-6">
                    <p className="text-sm font-medium text-stone-700 mb-2">Independent Donation</p>
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        min="1"
                        placeholder="Amount"
                        value={donationAmount}
                        onChange={(e) => setDonationAmount(e.target.value)}
                      />
                      <Button variant="secondary" onClick={handleDonate} disabled={donating}>
                        {donating ? 'Saving...' : 'Donate'}
                      </Button>
                    </div>
                  </div>
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
