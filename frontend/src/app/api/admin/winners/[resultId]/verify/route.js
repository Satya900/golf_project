import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { createNotification } from '@/lib/server/notifications'

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    const updates = { verification_status: body.status }
    if (body.status === 'approved') updates.verified_at = new Date().toISOString()
    await supabaseAdmin.from('draw_results').update(updates).eq('id', params.resultId)

    const result = await supabaseAdmin.from('draw_results').select('user_id, profiles(email)').eq('id', params.resultId).single()
    await createNotification({
      userId: result.data?.user_id,
      email: result.data?.profiles?.email,
      type: 'winner-verification',
      title: `Winner ${body.status}`,
      message: `Your winner submission has been ${body.status}.`,
    })

    return json({ message: `Winner ${body.status}` })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
