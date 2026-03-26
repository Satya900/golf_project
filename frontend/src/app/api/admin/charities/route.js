import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    await requireAdmin(request)
    const charities = await supabaseAdmin.from('charities').select('*').order('name')
    return json(charities.data || [])
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}

export async function POST(request) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    const charity = await supabaseAdmin.from('charities').insert(body)
    return json(charity.data?.[0] || {})
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
