import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      status: 'OK',
      message: 'Simple test API working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      hasEnvVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
        CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
} 