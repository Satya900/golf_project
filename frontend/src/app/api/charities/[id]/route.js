import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(_request, { params }) {
  try {
    const charity = await supabaseAdmin.from('charities').select('*').eq('id', params.id).single()
    if (!charity.data) return errorResponse('Charity not found', 404)

    const events = await supabaseAdmin
      .from('charity_events')
      .select('*')
      .eq('charity_id', params.id)
      .gte('event_date', new Date().toISOString())
      .order('event_date')
      

    return json({
      ...charity.data,
      events: events.data || [],
    })
  } catch (error) {
    return errorResponse(error, 500)
  }
}
