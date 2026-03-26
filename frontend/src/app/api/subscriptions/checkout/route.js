import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function POST(request) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    const profile = await supabaseAdmin.from('profiles').select('email').eq('id', user.id).single()
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'http://localhost:3000'
    const monthlyId = process.env.POLAR_MONTHLY_PRODUCT_ID || process.env.NEXT_PUBLIC_POLAR_MONTHLY_ID
    const plan = body.product_id === monthlyId ? 'month' : 'year'

    const response = await fetch('https://api.polar.sh/v1/checkouts/custom/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: body.product_id,
        customer_email: profile.data?.email || user.email,
        success_url: `${appUrl}/subscription/success?plan=${plan}`,
        metadata: { user_id: user.id, plan },
      }),
    })

    const data = await response.json()
    if (!response.ok) return errorResponse(`Checkout failed: ${JSON.stringify(data)}`, 400)
    return json({ checkout_url: data.url, checkout_id: data.id })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
