import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { ensureUpcomingDraw, prepareDrawPreview } from '@/lib/server/draws'

export async function POST(request, { params }) {
  try {
    await requireAdmin(request)
    const preview = await prepareDrawPreview(params.drawId, { persist: true })
    const updated = await supabaseAdmin.from('draws').select('*').eq('id', params.drawId).single()
    await ensureUpcomingDraw(updated.data?.draw_date)

    return json({
      ...updated.data,
      winners_count: preview.winners_count,
      results: preview.results,
    })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
