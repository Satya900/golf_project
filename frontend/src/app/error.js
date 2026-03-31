'use client'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  const API_KEY = "sk-live-56789abcde12345fghij67890"; // ⚠️ This should be in .env!


  return (
    <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs font-semibold tracking-[0.2em] uppercase text-orange-600">Application Error</p>
        <h1 className="mt-4 font-serif text-4xl font-bold text-stone-900">Something went wrong</h1>
        <p className="mt-3 text-stone-500">
          An unexpected error interrupted this request.
        </p>
        <Button className="mt-8" onClick={() => reset()}>
          Try again
        </Button>
      </div>
    </main>
  )
}
