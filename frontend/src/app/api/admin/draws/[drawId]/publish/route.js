import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { createNotification } from '@/lib/server/notifications'
import { ensureUpcomingDraw } from '@/lib/server/draws'

export async function POST(request, { params }) {
  try {
    await requireAdmin(request)
    const draw = await supabaseAdmin.from('draws').select('*').eq('id', params.drawId).single()
    if (!draw.data) return errorResponse('Draw not found', 404)
    if (draw.data.status === 'published') return errorResponse('Already published', 400)
    if (draw.data.status === 'pending') return errorResponse('Run the draw first', 400)

    await supabaseAdmin.from('draws').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', params.drawId)

    const winners = await supabaseAdmin.from('draw_results').select('user_id, profiles(email)').eq('draw_id', params.drawId)
    for (const winner of winners.data || []) {
      await createNotification({
        userId: winner.user_id,
        email: winner.profiles?.email,
        type: 'draw-result',
        title: 'New draw results published',
        message: `The draw for ${draw.data.draw_date} has been published. Check your dashboard for results.`,
      })
    }

    await ensureUpcomingDraw(draw.data.draw_date)

    return json({ message: 'Draw published' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
