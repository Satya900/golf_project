import './globals.css'
import { Toaster } from 'sonner'

export const metadata = {
  title: 'Birdie & Give | Golf Charity Platform',
  description: 'Play golf. Win prizes. Change lives. A subscription platform combining golf performance tracking with charitable giving.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 antialiased">
        {children}
        <Toaster position="bottom-right" richColors />
      </body>
    </html>
  )
}
