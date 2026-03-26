import { requireAdmin } from '@/lib/server/auth'
import { json, errorResponse } from '@/lib/server/http'
import { prepareDrawPreview } from '@/lib/server/draws'

export async function POST(request, { params }) {
  try {
    await requireAdmin(request)
    const preview = await prepareDrawPreview(params.drawId, { persist: false })
    return json(preview)
  } catch (error) {
    return errorResponse(error, error.status || 500)
  }
}
