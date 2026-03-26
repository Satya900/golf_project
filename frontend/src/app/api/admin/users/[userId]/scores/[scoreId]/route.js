import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    await supabaseAdmin.from('scores').update({
      score: body.score,
      played_date: body.played_date,
    }).eq('id', params.scoreId).eq('user_id', params.userId)
    return json({ message: 'Score updated' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
