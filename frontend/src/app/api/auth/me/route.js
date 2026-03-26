import { getCurrentUser } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { getParticipationSummary } from '@/lib/server/draws'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    const [profile, subscription, notifications, participation] = await Promise.all([
      supabaseAdmin.from('profiles').select('*, charities(name)').eq('id', user.id).single(),
      supabaseAdmin.from('subscriptions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1),
      supabaseAdmin.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(5),
      getParticipationSummary(user.id),
    ])

    if (!profile.data) return errorResponse('Profile not found', 404)

    const data = { ...profile.data }
    data.charity_name = profile.data.charities?.name || null
    delete data.charities

    return json({
      ...data,
      subscription: subscription.data?.[0] || null,
      participation,
      notifications: notifications.data || [],
    })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
