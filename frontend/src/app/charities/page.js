'use client'
import { useState, useEffect } from 'react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Search, Heart, ArrowRight, Star } from 'lucide-react'

export default function CharitiesPage() {
  const [charities, setCharities] = useState([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getCharities().then(setCharities).catch(() => toast.error('Failed to load charities')).finally(() => setLoading(false))
  }, [])

  const categories = [...new Set(charities.map(c => c.category).filter(Boolean))]
  const filtered = charities.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.description || '').toLowerCase().includes(search.toLowerCase())
    const matchCat = !category || c.category === category
    return matchSearch && matchCat
  })

  const featured = charities.filter(c => c.featured)

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 px-6 lg:px-10 min-h-screen bg-stone-50" data-testid="charities-page">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <p className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-orange-600 mb-2">Our Partners</p>
            <h1 className="font-serif text-4xl md:text-5xl font-bold tracking-tight text-stone-900">
              Charity Directory
            </h1>
            <p className="mt-3 text-stone-500 max-w-xl">
              Choose a charity to support with your subscription. Every round of golf makes a difference.
            </p>
          </div>

          {/* Featured */}
          {featured.length > 0 && (
            <div className="mb-12">
              <h2 className="font-serif text-2xl font-bold text-stone-900 mb-6 flex items-center gap-2">
                <Star className="w-5 h-5 text-orange-500" /> Featured Charities
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {featured.map((c, i) => (
                  <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Link href={`/charities/${c.id}`}>
                      <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" data-testid={`featured-charity-${i}`}>
                        <div className="relative h-48 overflow-hidden">
                          <Image src={c.image_url || 'https://images.pexels.com/photos/6646933/pexels-photo-6646933.jpeg?auto=compress&w=400'} alt={c.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                          <div className="absolute top-3 left-3">
                            <Badge className="bg-orange-600 text-white border-none">Featured</Badge>
                          </div>
                        </div>
                        <CardContent className="p-5">
                          <Badge variant="secondary" className="mb-2">{c.category}</Badge>
                          <h3 className="font-serif text-lg font-bold text-stone-900">{c.name}</h3>
                          <p className="mt-1 text-sm text-stone-500 line-clamp-2">{c.description}</p>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Search & Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search charities..."
                className="pl-10"
                data-testid="charity-search-input"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant={!category ? 'default' : 'secondary'} size="sm" onClick={() => setCategory('')} data-testid="filter-all">All</Button>
              {categories.map(cat => (
                <Button key={cat} variant={category === cat ? 'default' : 'secondary'} size="sm" onClick={() => setCategory(cat)} data-testid={`filter-${cat.toLowerCase().replace(/\s/g, '-')}`}>
                  {cat}
                </Button>
              ))}
            </div>
          </div>

          {/* Charity Grid */}
          {loading ? (
            <div className="text-center py-12 text-stone-400">Loading charities...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c, i) => (
                <motion.div key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ delay: (i % 6) * 0.05 }} viewport={{ once: true }}>
                  <Link href={`/charities/${c.id}`}>
                    <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer" data-testid={`charity-card-${i}`}>
                      <div className="relative h-40 overflow-hidden">
                        <Image src={c.image_url || 'https://images.pexels.com/photos/6995090/pexels-photo-6995090.jpeg?auto=compress&w=400'} alt={c.name} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <CardContent className="p-5">
                        <Badge variant="secondary" className="mb-2">{c.category || 'General'}</Badge>
                        <h3 className="font-serif text-lg font-bold text-stone-900">{c.name}</h3>
                        <p className="mt-1 text-sm text-stone-500 line-clamp-2">{c.description}</p>
                        <div className="mt-4 flex items-center gap-2 text-orange-600 text-sm font-medium">
                          View Details <ArrowRight className="w-3 h-3" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-12 text-stone-400">No charities found matching your search.</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
