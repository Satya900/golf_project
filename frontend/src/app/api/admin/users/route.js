import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    await requireAdmin(request)
    const users = await supabaseAdmin.from('profiles').select('*').order('created_at', { ascending: false })
    return json(users.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
