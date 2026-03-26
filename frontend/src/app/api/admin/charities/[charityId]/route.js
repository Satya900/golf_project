import { requireAdmin } from '@/lib/server/auth'
import { parseBody, json, errorResponse } from '@/lib/server/http'
import { supabaseAdmin } from '@/lib/server/supabase'

export async function PUT(request, { params }) {
  try {
    await requireAdmin(request)
    const body = await parseBody(request)
    await supabaseAdmin.from('charities').update(body).eq('id', params.charityId)
    return json({ message: 'Charity updated' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request)
    await supabaseAdmin.from('charities').delete().eq('id', params.charityId)
    return json({ message: 'Charity deleted' })
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
