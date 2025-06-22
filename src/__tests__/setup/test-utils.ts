import { NextRequest } from 'next/server'

// Create a mock NextRequest
export function createMockRequest(url: string, options?: RequestInit): NextRequest {
  // Create a base URL if not provided
  const fullUrl = url.startsWith('http') ? url : `http://localhost:3000${url}`
  
  // Create request with proper headers
  const headers = new Headers(options?.headers)
  if (options?.body && typeof options.body === 'string') {
    headers.set('content-type', 'application/json')
  }

  const request = new Request(fullUrl, {
    ...options,
    headers,
  }) as NextRequest

  return request
}

// Extract JSON from NextResponse
export async function getResponseData(response: Response) {
  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
} 