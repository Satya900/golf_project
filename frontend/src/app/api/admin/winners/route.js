import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    await requireAdmin(request)
    const results = await supabaseAdmin.from('draw_results').select('*, profiles(full_name, email), draws(draw_date, winning_numbers)').order('created_at', { ascending: false })
    return json(results.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
