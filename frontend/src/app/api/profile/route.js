import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function PUT(request) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    const allowed = ['full_name', 'selected_charity_id', 'charity_contribution_pct', 'avatar_url']
    const updates = Object.fromEntries(Object.entries(body).filter(([key]) => allowed.includes(key)))
    await supabaseAdmin.from('profiles').update(updates).eq('id', user.id)
    const profile = await supabaseAdmin.from('profiles').select('*').eq('id', user.id).single()
    return json(profile.data || {})
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
