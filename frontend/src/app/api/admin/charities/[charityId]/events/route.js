import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function POST(request, { params }) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    const result = await supabaseAdmin.from('charity_events').insert({
      charity_id: params.charityId,
      title: body.title,
      description: body.description || '',
      location: body.location || '',
      event_date: body.event_date,
      registration_url: body.registration_url || '',
    })
    return json(result.data?.[0] || {})
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
