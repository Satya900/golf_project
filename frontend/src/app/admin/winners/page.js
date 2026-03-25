'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { formatDate } from '@/lib/utils'
import { toast } from 'sonner'
import { CheckCircle, XCircle, DollarSign } from 'lucide-react'

export default function AdminWinnersPage() {
  const [winners, setWinners] = useState([])
  const [loading, setLoading] = useState(true)

  const loadWinners = () => {
    api.adminGetWinners().then(setWinners).catch(() => toast.error('Failed to load')).finally(() => setLoading(false))
  }

  useEffect(() => { loadWinners() }, [])

  const handleVerify = async (id, status) => {
    try {
      await api.adminVerifyWinner(id, status)
      toast.success(`Winner ${status}`)
      loadWinners()
    } catch {
      toast.error('Failed to verify')
    }
  }

  const handlePay = async (id) => {
    try {
      await api.adminMarkPaid(id)
      toast.success('Marked as paid')
      loadWinners()
    } catch {
      toast.error('Failed to mark paid')
    }
  }

  if (loading) return <div className="text-center py-12 text-stone-400">Loading...</div>

  return (
    <div data-testid="admin-winners-page">
      <h1 className="font-serif text-3xl font-bold text-stone-900 mb-8">Winner Verification</h1>

      {winners.length === 0 ? (
        <Card><CardContent className="p-12 text-center text-stone-400">No winners yet</CardContent></Card>
      ) : (
        <div className="space-y-4">
          {winners.map((w, i) => (
            <Card key={w.id} data-testid={`winner-row-${i}`}>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium text-stone-900">{w.profiles?.full_name || w.profiles?.email || 'Unknown'}</span>
                      <Badge>{w.match_type}</Badge>
                      <Badge variant={w.verification_status === 'approved' ? 'success' : w.verification_status === 'rejected' ? 'destructive' : 'warning'}>
                        {w.verification_status}
                      </Badge>
                      <Badge variant={w.payment_status === 'paid' ? 'success' : 'secondary'}>
                        {w.payment_status}
                      </Badge>
                    </div>
                    <p className="text-sm text-stone-500">
                      Prize: ${(w.prize_amount || 0).toFixed(2)} | 
                      Matched: {(w.matched_numbers || []).join(', ')} |
                      Draw: {w.draws?.draw_date ? formatDate(w.draws.draw_date) : 'N/A'}
                    </p>
                    {w.proof_image_url && (
                      <a href={w.proof_image_url} target="_blank" rel="noopener noreferrer" className="text-orange-600 text-sm hover:underline mt-1 inline-block">
                        View Proof
                      </a>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {w.verification_status === 'submitted' && (
                      <>
                        <Button size="sm" onClick={() => handleVerify(w.id, 'approved')} data-testid={`approve-winner-${i}`}>
                          <CheckCircle className="w-3 h-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleVerify(w.id, 'rejected')} data-testid={`reject-winner-${i}`}>
                          <XCircle className="w-3 h-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {w.verification_status === 'approved' && w.payment_status !== 'paid' && (
                      <Button size="sm" onClick={() => handlePay(w.id)} data-testid={`pay-winner-${i}`}>
                        <DollarSign className="w-3 h-3 mr-1" /> Mark Paid
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
