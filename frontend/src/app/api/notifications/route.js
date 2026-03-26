import { getCurrentUser } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    const notifications = await supabaseAdmin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20)
    return json(notifications.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
