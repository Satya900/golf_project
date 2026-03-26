import { json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function GET() {
  try {
    const charities = await supabaseAdmin.from('charities').select('*').order('featured', { ascending: false }).order('name')
    return json(charities.data || [])
  } catch (error) {
    return errorResponse(error, 500)
  }
}
