'use client'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, Trophy, Target, Users, ArrowRight, Star, TrendingUp, Gift } from 'lucide-react'

const fadeUp = { hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0 } }

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative min-h-[90vh] flex items-center overflow-hidden" data-testid="hero-section">
          <div className="absolute inset-0">
            <img
              src="https://images.unsplash.com/photo-1505794718076-13e166c01a33?w=1920&q=80"
              alt="Golfer silhouette at sunset"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-stone-900/90 via-stone-900/70 to-transparent" />
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-24">
            <motion.div
              initial="hidden"
              animate="visible"
              transition={{ staggerChildren: 0.15 }}
              className="max-w-2xl"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.6 }}>
                <Badge variant="outline" className="border-orange-400/50 text-orange-300 mb-6">
                  Every swing makes a difference
                </Badge>
              </motion.div>
              <motion.h1 variants={fadeUp} transition={{ duration: 0.6 }} className="font-serif text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.1]">
                Play Golf.<br />
                <span className="text-orange-400">Win Prizes.</span><br />
                Change Lives.
              </motion.h1>
              <motion.p variants={fadeUp} transition={{ duration: 0.6 }} className="mt-6 text-lg text-stone-300 leading-relaxed max-w-lg">
                Subscribe, enter your scores, and compete in monthly prize draws — all while supporting the charities you care about most.
              </motion.p>
              <motion.div variants={fadeUp} transition={{ duration: 0.6 }} className="mt-10 flex flex-wrap gap-4">
                <Link href="/auth/signup">
                  <Button size="xl" data-testid="hero-cta-subscribe">
                    Start Your Journey <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/charities">
                  <Button variant="outline" size="xl" className="border-white/30 text-white hover:bg-white/10" data-testid="hero-cta-charities">
                    Explore Charities
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 px-6 lg:px-10" data-testid="how-it-works-section">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <p className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-orange-600 mb-3">How It Works</p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
                Three steps to make an impact
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
              {[
                { icon: Target, title: 'Subscribe & Play', desc: 'Choose a monthly or yearly plan. Enter your last 5 Stableford golf scores to get into the draw.', step: '01' },
                { icon: Trophy, title: 'Win Monthly Prizes', desc: 'Each month, a draw matches your scores against winning numbers. Match 3, 4, or all 5 to win from the prize pool.', step: '02' },
                { icon: Heart, title: 'Support Charities', desc: 'A portion of every subscription goes directly to your chosen charity. Track your impact in real-time.', step: '03' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardContent className="p-8">
                      <span className="text-6xl font-serif font-bold text-stone-100">{item.step}</span>
                      <div className="mt-4 w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center">
                        <item.icon className="w-6 h-6 text-orange-600" />
                      </div>
                      <h3 className="mt-5 font-serif text-xl font-bold text-stone-900">{item.title}</h3>
                      <p className="mt-3 text-stone-500 text-sm leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Charity Spotlight */}
        <section className="py-24 px-6 lg:px-10 bg-white" data-testid="charity-spotlight-section">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-5">
                <p className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-orange-600 mb-3">Charity Spotlight</p>
                <h2 className="font-serif text-4xl font-bold tracking-tight text-stone-900">
                  Your game powers real change
                </h2>
                <p className="mt-4 text-stone-500 leading-relaxed">
                  Every subscription automatically supports a charity of your choosing. From youth development to environmental conservation — your love of golf creates tangible impact.
                </p>
                <div className="mt-8 flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Star className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-stone-700">Minimum 10% of subscription goes to charity</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-stone-700">Track your cumulative impact on your dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center">
                      <Gift className="w-4 h-4 text-emerald-600" />
                    </div>
                    <span className="text-sm text-stone-700">Increase your contribution percentage anytime</span>
                  </div>
                </div>
                <Link href="/charities" className="mt-8 inline-block">
                  <Button data-testid="charity-explore-btn">
                    Browse Charities <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
              <div className="lg:col-span-7">
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src="https://images.pexels.com/photos/6646933/pexels-photo-6646933.jpeg?auto=compress&w=800"
                    alt="Charity volunteers"
                    className="w-full h-[400px] object-cover"
                  />
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/70 to-transparent">
                    <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">Featured Charity</Badge>
                    <h3 className="mt-2 font-serif text-2xl font-bold text-white">Golf For Good Foundation</h3>
                    <p className="text-stone-200 text-sm mt-1">Bringing golf to underserved communities worldwide</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Prize Pool Section */}
        <section className="py-24 px-6 lg:px-10 bg-stone-900" data-testid="prize-pool-section">
          <div className="max-w-7xl mx-auto text-center">
            <p className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-orange-400 mb-3">Monthly Prize Pool</p>
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-white">
              Match your scores. Win big.
            </h2>
            <p className="mt-4 text-stone-400 max-w-lg mx-auto">
              Each month, five winning numbers are drawn. The more scores you match, the bigger your prize.
            </p>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { match: '5 Numbers', pct: '40%', label: 'Jackpot — rolls over if unclaimed', color: 'from-orange-600 to-amber-500' },
                { match: '4 Numbers', pct: '35%', label: 'Split equally among winners', color: 'from-orange-500 to-orange-400' },
                { match: '3 Numbers', pct: '25%', label: 'Split equally among winners', color: 'from-amber-500 to-amber-400' },
              ].map((tier, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className="rounded-2xl border border-stone-800 p-8 bg-stone-800/50"
                >
                  <div className={`text-3xl font-serif font-bold bg-gradient-to-r ${tier.color} bg-clip-text text-transparent`}>
                    {tier.pct}
                  </div>
                  <h3 className="mt-3 text-xl font-serif font-bold text-white">{tier.match}</h3>
                  <p className="mt-2 text-stone-400 text-sm">{tier.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-6 lg:px-10" data-testid="cta-section">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
              Ready to make every round count?
            </h2>
            <p className="mt-4 text-stone-500 text-lg max-w-xl mx-auto">
              Join thousands of golfers who play with purpose. Subscribe today and start your journey.
            </p>
            <div className="mt-10 flex justify-center gap-4">
              <Link href="/auth/signup">
                <Button size="xl" data-testid="cta-subscribe-button">
                  Subscribe Now <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
