import { supabaseAdmin } from '@/lib/server/supabase'

async function sendEmailFallback(payload) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.NOTIFICATION_FROM_EMAIL
  if (!apiKey || !from || !payload.to) return

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: payload.to,
        subject: payload.subject,
        html: `<p>${payload.message}</p>`,
      }),
    })
  } catch (error) {
    console.error('Email send failed', error)
  }
}

export async function createNotification({ userId, email, type, title, message }) {
  await supabaseAdmin.from('notifications').insert({
    user_id: userId,
    type,
    title,
    message,
  })

  await sendEmailFallback({
    to: email,
    subject: title,
    message,
  })
}
