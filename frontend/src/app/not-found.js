import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-600">404</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-stone-900">Page not found</h1>
        <p className="mt-3 text-stone-500">
          The page you requested does not exist or may have moved.
        </p>
        <Link href="/" className="inline-block mt-8">
          <Button>Back to home</Button>
        </Link>
      </div>
    </main>
  )
}
