import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const draws = await supabaseAdmin.from('draws').select('*').eq('status', 'published').order('draw_date', { ascending: false })
    return json(draws.data || [])
  } catch (error) {
    return errorResponse(error, 500)
  }
}
