import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabase, supabaseAdmin } from '@/lib/server/supabase'

export async function POST(request) {
  try {
    const body = await parseBody(request)
    const {
      email,
      password,
      full_name = '',
      selected_charity_id = null,
      charity_contribution_pct = 10,
    } = body

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name },
    })
    if (error || !data?.user) {
      return errorResponse(error?.message || 'Signup failed', 400)
    }

    if (selected_charity_id) {
      await supabaseAdmin.from('profiles').update({
        selected_charity_id,
        charity_contribution_pct,
      }).eq('id', data.user.id)
    }

    const login = await supabase.auth.signInWithPassword({ email, password })
    if (login.error) return errorResponse(login.error.message, 400)

    return json({
      user: {
        id: String(data.user.id),
        email: data.user.email,
        full_name,
        role: 'user',
        selected_charity_id,
        charity_contribution_pct,
      },
      token: login.data.session?.access_token || null,
      message: 'Account created successfully',
    })
  } catch (error) {
    const detail = String(error?.message || '')
    const message = /already|duplicate/i.test(detail)
      ? 'An account with this email already exists'
      : detail || 'Signup failed'
    return errorResponse(message, 400)
  }
}
