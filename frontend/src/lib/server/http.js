import { NextResponse } from 'next/server'

export function json(data, init) {
  return NextResponse.json(data, init)
}

export function errorResponse(error, status = 500) {
  const detail = typeof error === 'string' ? error : error?.message || 'Request failed'
  return NextResponse.json({ detail }, { status })
}

export async function parseBody(request) {
  try {
    return await request.json()
  } catch {
    return {}
  }
}
