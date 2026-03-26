import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(_request, { params }) {
  try {
    const draw = await supabaseAdmin.from('draws').select('*').eq('id', params.id).eq('status', 'published').single()
    if (!draw.data) return errorResponse('Draw not found', 404)
    const results = await supabaseAdmin.from('draw_results').select('*, profiles(full_name, email)').eq('draw_id', params.id)
    return json({ ...draw.data, results: results.data || [] })
  } catch (error) {
    return errorResponse(error, 500)
  }
}
