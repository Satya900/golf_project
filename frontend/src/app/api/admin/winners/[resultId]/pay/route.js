import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { createNotification } from '@/lib/server/notifications'

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request)
    await supabaseAdmin.from('draw_results').update({
      payment_status: 'paid',
      paid_at: new Date().toISOString(),
    }).eq('id', params.resultId)

    const result = await supabaseAdmin.from('draw_results').select('user_id, profiles(email)').eq('id', params.resultId).single()
    await createNotification({
      userId: result.data?.user_id,
      email: result.data?.profiles?.email,
      type: 'winner-payment',
      title: 'Prize payment completed',
      message: 'Your prize payout has been marked as paid.',
    })

    return json({ message: 'Marked as paid' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
