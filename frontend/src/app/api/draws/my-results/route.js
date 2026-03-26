import { getCurrentUser } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    const results = await supabaseAdmin
      .from('draw_results')
      .select('*, draws(draw_date, winning_numbers)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      
    return json(results.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
