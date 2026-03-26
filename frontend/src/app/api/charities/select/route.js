import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    await supabaseAdmin.from('profiles').update({
      selected_charity_id: body.charity_id,
      charity_contribution_pct: body.contribution_pct,
    }).eq('id', user.id)
    return json({ message: 'Charity selected' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
