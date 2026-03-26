import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    await requireAdmin(request)
    const subs = await supabaseAdmin.from('subscriptions').select('*, profiles(full_name, email)').order('created_at', { ascending: false })
    return json(subs.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
