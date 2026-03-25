'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/Navbar'
import { Users, Trophy, Heart, BarChart3, Award, Calendar, Shield } from 'lucide-react'

export default function AdminLayout({ children }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('golf_user')
    if (!stored) { router.push('/auth/login'); return }
    const parsed = JSON.parse(stored)
    if (parsed.role !== 'admin') { router.push('/dashboard'); return }
    setUser(parsed)
  }, [])

  const links = [
    { href: '/admin', icon: BarChart3, label: 'Overview' },
    { href: '/admin/users', icon: Users, label: 'Users' },
    { href: '/admin/draws', icon: Calendar, label: 'Draws' },
    { href: '/admin/charities', icon: Heart, label: 'Charities' },
    { href: '/admin/winners', icon: Award, label: 'Winners' },
    { href: '/admin/reports', icon: Trophy, label: 'Reports' },
  ]

  if (!user) return null

  return (
    <>
      <Navbar />
      <div className="pt-16 min-h-screen bg-stone-50 flex">
        <aside className="w-64 bg-white border-r border-stone-200 fixed top-16 bottom-0 overflow-y-auto hidden lg:block" data-testid="admin-sidebar">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <Shield className="w-5 h-5 text-orange-600" />
              <span className="font-serif font-bold text-stone-900">Admin Panel</span>
            </div>
            <nav className="space-y-1">
              {links.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    pathname === l.href ? 'bg-orange-50 text-orange-700' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'
                  }`}
                  data-testid={`admin-nav-${l.label.toLowerCase()}`}
                >
                  <l.icon className="w-4 h-4" /> {l.label}
                </Link>
              ))}
            </nav>
          </div>
        </aside>
        <main className="flex-1 lg:ml-64 p-6 lg:p-10">
          {/* Mobile nav */}
          <div className="lg:hidden flex gap-2 mb-6 overflow-x-auto pb-2">
            {links.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  pathname === l.href ? 'bg-orange-600 text-white' : 'bg-white text-stone-600 border border-stone-200'
                }`}
              >
                <l.icon className="w-3 h-3" /> {l.label}
              </Link>
            ))}
          </div>
          {children}
        </main>
      </div>
    </>
  )
}
