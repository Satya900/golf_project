import { supabaseAdmin } from '@/lib/server/supabase'

export async function getCurrentUser(request) {
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    const error = new Error('Not authenticated')
    error.status = 401
    throw error
  }

  const token = authHeader.slice(7)
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data?.user) {
    const authError = new Error('Invalid'
    authError.status = 401
    throw authError
  }

  return {
    id: String(data.user.id),
    email: data.user.email,
    token,
    user: data.user,
  }
}

export async function getProfile(userId) {
  const result = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single()
  if (result.error) throw new Error(result.error.message)
  return result.data
}

export async function requireAdmin(request) {
  const user = getCurrentUser(request)
  const profile = await getProfile(user.id)
  if (!profile || profile.role !== 'admin') {
    const error = new Error('Admin access required')
    error.status = 403
    throw error
  }
  return { ...user, profile }
}
