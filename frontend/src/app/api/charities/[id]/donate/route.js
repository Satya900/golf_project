import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { createNotification } from '@/lib/server/notifications'

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    const amount = Number(body.amount || 0)
    if (amount <= 0) return errorResponse('Donation amount must be greater than zero', 400)

    await supabaseAdmin.from('charity_contributions').insert({
      user_id: user.id,
      charity_id: params.id,
      amount,
    })

    await supabaseAdmin.rpc('increment_charity_total', {
      charity_id_input: params.id,
      amount_input: amount,
    })

    await createNotification({
      userId: user.id,
      email: user.email,
      type: 'donation',
      title: 'Donation recorded',
      message: `Your independent donation of $${amount.toFixed(2)} was recorded successfully.`,
    })

    return json({ message: 'Donation recorded' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
