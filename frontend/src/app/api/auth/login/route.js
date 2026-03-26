import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabase, supabaseAdmin } from '@/lib/server/supabase'

export async function POST(request) {
  try {
    const body = await parseBody(request)
    const { email, password } = body

    const login = await supabase.auth.signInWithPassword({ email, password })
    if (login.error || !login.data?.user || !login.data?.session) {
      return errorResponse('Invalid credentials', 401)
    }

    const profile = await supabaseAdmin.from('profiles').select('*').eq('id', login.data.user.id).single()
    return json({
      user: {
        id: String(login.data.user.id),
        email: login.data.user.email,
        full_name: profile.data?.full_name || '',
        role: profile.data?.role || 'user',
        selected_charity_id: profile.data?.selected_charity_id || null,
        charity_contribution_pct: profile.data?.charity_contribution_pct || 10,
      },
      token: login.data.session.access_token,
    })
  } catch {
    return errorResponse('Invalid credentials', 401)
  }
}
