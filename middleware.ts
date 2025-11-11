import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add CORS headers for all requests
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response
  }

  if (request.url.includes('/api/socket')) {
    console.log('Socket.IO request:', request.url)
    const { searchParams } = new URL(request.url)
    const transport = searchParams.get('transport')
    console.log('Transport:', transport)
  }

  return response
}

export const config = {
  matcher: ['/api/socket/:path*']
}