import crypto from 'crypto'
import { json } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'
import { createNotification } from '@/lib/server/notifications'

function verifySignature(rawBody, signature) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) return true
  if (!signature) return false
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected)
  const signatureBuffer = Buffer.from(signature)
  if (expectedBuffer.length !== signatureBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
}

async function processCharityContribution(userId, amount) {
  const profile = await supabaseAdmin.from('profiles').select('selected_charity_id, charity_contribution_pct').eq('id', userId).single()
  if (!profile.data?.selected_charity_id) return
  const contribution = Number(((Number(amount || 0) * (profile.data.charity_contribution_pct || 10)) / 10000).toFixed(2))
  await supabaseAdmin.from('charity_contributions').insert({
    user_id: userId,
    charity_id: profile.data.selected_charity_id,
    amount: contribution,
  })
  await supabaseAdmin.rpc('increment_charity_total', {
    charity_id_input: profile.data.selected_charity_id,
    amount_input: contribution,
  })
}

export async function POST(request) {
  const rawBody = await request.text()
  const signature = request.headers.get('polar-signature')
  if (!verifySignature(rawBody, signature)) {
    return json({ detail: 'Invalid webhook signature' }, { status: 401 })
  }

  const payload = rawBody ? JSON.parse(rawBody) : {}
  const eventType = payload.type || ''
  const data = payload.data || {}

  if (eventType === 'subscription.created') {
    const metadata = data.metadata || {}
    if (metadata.user_id) {
      await supabaseAdmin.from('profiles').update({ polar_customer_id: data.customer_id }).eq('id', metadata.user_id)
    }
    await supabaseAdmin.from('subscriptions').upsert({
      polar_subscription_id: data.id,
      polar_customer_id: data.customer_id,
      user_id: metadata.user_id,
      product_id: data.product_id,
      plan: metadata.plan || 'month',
      status: data.status || 'active',
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end || false,
    }, { onConflict: 'polar_subscription_id' })
  }

  if (eventType === 'subscription.updated') {
    await supabaseAdmin.from('subscriptions').update({
      status: data.status,
      current_period_start: data.current_period_start,
      current_period_end: data.current_period_end,
      cancel_at_period_end: data.cancel_at_period_end || false,
    }).eq('polar_subscription_id', data.id)
  }

  if (eventType === 'subscription.revoked') {
    await supabaseAdmin.from('subscriptions').update({ status: 'revoked' }).eq('polar_subscription_id', data.id)
  }

  if (eventType === 'order.created') {
    const metadata = data.metadata || {}
    const existing = await supabaseAdmin.from('orders').select('id').eq('polar_order_id', data.id)
    if (!(existing.data || []).length) {
      await supabaseAdmin.from('orders').insert({
        polar_order_id: data.id,
        user_id: metadata.user_id,
        amount: data.amount,
        currency: data.currency || 'usd',
        billing_reason: data.billing_reason,
        status: data.status,
      })
      if (data.billing_reason === 'subscription_cycle' && metadata.user_id) {
        await processCharityContribution(metadata.user_id, data.amount)
        const profile = await supabaseAdmin.from('profiles').select('email').eq('id', metadata.user_id).single()
        await createNotification({
          userId: metadata.user_id,
          email: profile.data?.email,
          type: 'subscription-renewal',
          title: 'Subscription renewed',
          message: 'Your subscription renewal was processed successfully.',
        })
      }
    }
  }

  return json({ status: 'accepted', event_type: eventType })
}
