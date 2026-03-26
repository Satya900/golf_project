import { getCurrentUser } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    const sub = await supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1)
    return json(sub.data?.[0] || null)
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
