import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    const scores = await supabaseAdmin.from('scores').select('*').eq('user_id', user.id).order('played_date', { ascending: false }).limit(5)
    return json(scores.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    const subscription = await supabaseAdmin.from('subscriptions').select('status').eq('user_id', user.id).eq('status', 'active').limit(1)
    if (!(subscription.data || []).length) return errorResponse('Active subscription required to enter scores', 403)

    const existing = await supabaseAdmin.from('scores').select('id').eq('user_id', user.id).order('played_date', { ascending: false })
    const scores = existing.data || []
    if (scores.length >= 5) {
      await supabaseAdmin.from('scores').delete().eq('id', scores[scores.length - 1].id)
    }

    const result = await supabaseAdmin.from('scores').insert({
      user_id: user.id,
      score: body.score,
      played_date: body.played_date,
    })

    return json(result.data?.[0] || {}, { status: 201 })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
