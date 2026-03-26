import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    const allowed = ['plan', 'status', 'cancel_at_period_end', 'current_period_start', 'current_period_end']
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))
    await supabaseAdmin.from('subscriptions').update(updates).eq('id', params.subscriptionId)
    const updated = await supabaseAdmin
      .from('subscriptions')
      .select('*, profiles(full_name, email)')
      .eq('id', params.subscriptionId)
      .single()
    return json(updated.data || { message: 'Subscription updated' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
