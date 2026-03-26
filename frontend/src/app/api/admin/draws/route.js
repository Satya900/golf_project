import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { ensureUpcomingDraw } from '@/lib/server/draws'

export async function GET(request) {
  try {
    await requireAdmin(request)
    await ensureUpcomingDraw()
    const draws = await supabaseAdmin.from('draws').select('*').order('draw_date', { ascending: false })
    return json(draws.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}

export async function POST(request) {
  try {
    const user = await requireAdmin(request)
    const body = await parseBody(request)
    const result = await supabaseAdmin.from('draws').insert({
      draw_date: body.draw_date,
      draw_type: body.draw_type || 'random',
      created_by: user.id,
      winning_numbers: [],
    })
    return json(result.data?.[0] || {})
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
