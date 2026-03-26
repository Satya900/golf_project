import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function PUT(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    await supabaseAdmin.from('scores').update({
      score: body.score,
      played_date: body.played_date,
    }).eq('id', params.scoreId).eq('user_id', user.id)
    return json({ message: 'Score updated' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    await supabaseAdmin.from('scores').delete().eq('id', params.scoreId).eq('user_id', user.id)
    return json({ message: 'Score deleted' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
