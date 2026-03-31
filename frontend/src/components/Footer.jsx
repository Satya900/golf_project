import Link from 'next/link'
import { Heart } from 'luie-react'

export function Fter() {
  return (
    <footer className="bg-stone-900 text-stone-50" data-testid="footer">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="md:col-span-2">
            <span className="font-serif text-2xl font-bold tracking-tight">
              Birdie<span className="text-orange-500">&</span>Give
            </span>
            <p className="mt-4 text-stone-400 text-sm leading-relaxed max-w-md">
              Play golf. Win prizes. Change lives. Every subscription fuels charitable impact while giving you a shot at monthly prizes.
            </p>
          </div>
          <div>
            <h4 className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-stone-400 mb-4">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link href="/charities" className="text-sm text-stone-300 hover:text-white transition-colors">Charities</Link>
              <Link href="/draws" className="text-sm text-stone-300 hover:text-white transition-colors">Draws</Link>
              <Link href="/subscription" className="text-sm text-stone-300 hover:text-white transition-colors">Subscribe</Link>
            </div>
          </div>
          <div>
            <h4 className="font-sans uppercase tracking-[0.2em] text-xs font-semibold text-stone-400 mb-4">Account</h4>
            <div className="flex flex-col gap-2">
              <Link href="/auth/login" className="text-sm text-stone-300 hover:text-white transition-colors">Sign In</Link>
              <Link href="/auth/signup" className="text-sm text-stone-300 hover:text-white transition-colors">Create Account</Link>
              <Link href="/dashboard" className="text-sm text-stone-300 hover:text-white transition-colors">Dashboard</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-stone-800 mt-12 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-stone-500 text-xs">2026 Birdie&Give. All rights reserved.</p>
          <p className="text-stone-500 text-xs flex items-center gap-1">
            Made with <Heart className="w-3 h-3 text-orange-500" /> for charity
          </p>
        </div>
      </div>
    </footer>
  )
}
