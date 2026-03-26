import { getCurrentUser } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET(request) {
  try {
    const user = await getCurrentUser(request)
    const profile = await supabaseAdmin.from('profiles').select('polar_customer_id').eq('id', user.id).single()
    const customerId = profile.data?.polar_customer_id
    if (!customerId) return errorResponse('No billing account found', 404)

    const response = await fetch('https://api.polar.sh/v1/customer-sessions/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ customer_id: customerId }),
    })
    const data = await response.json()
    if (!response.ok) return errorResponse(data?.detail || 'Unable to create portal session', 400)
    return json({ portal_url: data.customer_portal_url })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
