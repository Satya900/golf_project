import { createClient } from '@supabase/supabase-js'

let browserSafeClient
let adminClient

function readEnv() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey }
}

function ensureEnv(requireServiceRole = false) {
  const { supabaseUrl, supabaseAnonKey, supabaseServiceKey } = readEnv()
  if (!supabaseUrl || !supabaseAnonKey || (requireServiceRole && !supabaseServiceKey)) {
    throw new Error('Supabase environment variables are not fully configured')
  }
  return { supabaseUrl, supabaseAnonKey, supabaseServiceKey }
}

function getSupabaseClient() {
  if (!browserSafeClient) {
    const { supabaseUrl, supabaseAnonKey } = ensureEnv(false)
    browserSafeClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return browserSafeClient
}

function getSupabaseAdminClient() {
  if (!adminClient) {
    const { supabaseUrl, supabaseServiceKey } = ensureEnv(true)
    adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }
  return adminClient
}

export const supabase = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseClient()[prop]
  },
})

export const supabaseAdmin = new Proxy({}, {
  get(_target, prop) {
    return getSupabaseAdminClient()[prop]
  },
})
