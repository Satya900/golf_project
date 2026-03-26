import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request, { params }) {
  try {
    await requireAdmin(request)
    const [profile, scores, subscription] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('id', params.userId).single(),
      supabaseAdmin.from('scores').select('*').eq('user_id', params.userId).order('played_date', { ascending: false }),
      supabaseAdmin.from('subscriptions').select('*').eq('user_id', params.userId).order('created_at', { ascending: false }).limit(1),
    ])

    return json({
      profile: profile.data || null,
      scores: scores.data || [],
      subscription: subscription.data?.[0] || null,
    })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    const allowed = ['full_name', 'role', 'charity_contribution_pct', 'selected_charity_id']
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))
    await supabaseAdmin.from('profiles').update(updates).eq('id', params.userId)
    return json({ message: 'User updated' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
