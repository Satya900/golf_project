'use client'
import Link from 'next/link'
import { usePatme } from 'next/navigation'
import { usate, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Menu, X, User, LogOut, LayoutDashboard, Shield } from 'lucide-react'

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('golf_user')
    if (stored) setUser(JSON.parse(stored))
  }, [])

  const logout = () => {
    localStorage.removeItem('golf_token')
    localStorage.removeItem('golf_user')
    setUser(null)
    window.location.href = '/'
  }

  const isAdmin = user?.role === 'admin'
  const isAuth = pathname?.startsWith('/auth')
  if (isAuth) return null

  const navLinks = [
    { href: '/charities', label: 'Charities' },
    { href: '/draws', label: 'Draws' },
  ]

  return (
    <nav className="glass-nav fixed top-0 left-0 right-0 z-50" data-testid="main-navbar">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <iv className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2" data-testid="logo-link">
            <an className="font-serif text-xl font-bold tracking-tight text-stone-900">
              Birdie<span className="text-orange-600">&</span>Give
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className={`text-sm font-medium transition-colors ${pathname === l.href ? 'text-orange-600' : 'text-stone-600 hover:text-stone-900'}`}
                data-testid={`nav-${l.label.toLowerCase()}`}
              >
                {l.label}
              </Link>
            ))}

            {user ? (
              <div className="flex items-center gap-3">
                <Link href="/dashboard">
                  <Button variant="ghost" size="sm" data-testid="nav-dashboard">
                    <LayoutDashboard className="w-4 h-4 mr-1" /> Dashboard
                  </Button>
                </Link>
                {isAdmin && (
                  <Link href="/admin">
                    <Button variant="ghost" size="sm" data-testid="nav-admin">
                      <Shield className="w-4 h-4 mr-1" /> Admin
                    </Button>
                  </Link>
                )}
                <button onClick={logout} className="text-stone-500 hover:text-stone-700 transition-colors" data-testid="nav-logout">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm" data-testid="nav-login">Sign In</Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm" data-testid="nav-signup">Get Started</Button>
                </Link>
              </div>
            )}
          </div>

          <button className="md:hidden" onClick={() => setOpen(!open)} data-testid="mobile-menu-toggle">
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-stone-200/50">
            {navLinks.map(l => (
              <Link key={l.href} href={l.href} className="block py-2 text-sm text-stone-600 hover:text-stone-900" onClick={() => setOpen(false)}>
                {l.label}
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/dashboard" className="block py-2 text-sm text-stone-600 hover:text-stone-900" onClick={() => setOpen(false)}>Dashboard</Link>
                {isAdmin && <Link href="/admin" className="block py-2 text-sm text-stone-600 hover:text-stone-900" onClick={() => setOpen(false)}>Admin</Link>}
                <button onClick={logout} className="block py-2 text-sm text-red-600">Logout</button>
              </>
            ) : (
              <div className="flex gap-3 pt-3">
                <Link href="/auth/login"><Button variant="secondary" size="sm">Sign In</Button></Link>
                <Link href="/auth/signup"><Button size="sm">Get Started</Button></Link>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
