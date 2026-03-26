import { getCurrentUser } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { createNotification } from '@/lib/server/notifications'

export async function POST(request, { params }) {
  try {
    const user = await getCurrentUser(request)
    const body = await parseBody(request)
    await supabaseAdmin.from('draw_results').update({
      proof_image_url: body.proof_image_url,
      verification_status: 'submitted',
    }).eq('id', params.id).eq('user_id', user.id)

    await createNotification({
      userId: user.id,
      email: user.email,
      type: 'winner-proof',
      title: 'Winner proof submitted',
      message: 'Your winner proof was submitted for review.',
    })

    return json({ message: 'Proof uploaded' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
