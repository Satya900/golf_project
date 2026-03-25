'use client'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Trophy, Calendar, Hash } from 'lucide-react'

export default function DrawsPage() {
  const [draws, setDraws] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getDraws().then(setDraws).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen bg-stone-50" data-testid="draws-page">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <p className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-orange-600 mb-2">Monthly Draws</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
              Draw Results
            </h1>
            <p className="mt-3 text-stone-500 max-w-xl">
              Check the latest monthly draw results. Match your scores to win from the prize pool.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-stone-400">Loading draws...</div>
          ) : draws.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Trophy className="w-12 h-12 text-stone-300 mx-auto mb-4" />
                <h3 className="font-serif text-xl font-bold text-stone-700">No draws yet</h3>
                <p className="text-stone-400 mt-2">The first monthly draw is coming soon. Stay tuned!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {draws.map((draw, i) => (
                <motion.div
                  key={draw.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Card className="overflow-hidden" data-testid={`draw-card-${i}`}>
                    <CardHeader className="bg-stone-900 text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Calendar className="w-5 h-5 text-orange-400" />
                          <CardTitle className="text-white text-xl">
                            Draw — {formatDate(draw.draw_date)}
                          </CardTitle>
                        </div>
                        <Badge className="bg-orange-600 text-white border-none">{draw.draw_type}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="mb-6">
                        <p className="text-xs text-stone-400 uppercase tracking-wider mb-3">Winning Numbers</p>
                        <div className="flex gap-3" data-testid={`winning-numbers-${i}`}>
                          {(draw.winning_numbers || []).map((n, j) => (
                            <div key={j} className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center font-serif font-bold text-lg shadow-md">
                              {n}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-stone-50 rounded-xl text-center">
                          <p className="text-xs text-stone-400 uppercase">5-Match Pool</p>
                          <p className="font-serif font-bold text-lg text-stone-900">${(draw.five_match_pool || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-stone-50 rounded-xl text-center">
                          <p className="text-xs text-stone-400 uppercase">4-Match Pool</p>
                          <p className="font-serif font-bold text-lg text-stone-900">${(draw.four_match_pool || 0).toFixed(2)}</p>
                        </div>
                        <div className="p-4 bg-stone-50 rounded-xl text-center">
                          <p className="text-xs text-stone-400 uppercase">3-Match Pool</p>
                          <p className="font-serif font-bold text-lg text-stone-900">${(draw.three_match_pool || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      {draw.jackpot_rollover > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                          <p className="text-amber-700 text-sm font-medium">
                            Jackpot rollover: ${(draw.jackpot_rollover || 0).toFixed(2)}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
