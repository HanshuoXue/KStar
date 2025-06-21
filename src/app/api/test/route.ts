import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查环境变量的详细状态
    const envDebug = {
      NODE_ENV: process.env.NODE_ENV,
      // 数据库
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        prefix: process.env.DATABASE_URL?.substring(0, 10) || 'undefined'
      },
      // Clerk服务器端
      CLERK_SECRET_KEY: {
        exists: !!process.env.CLERK_SECRET_KEY,
        length: process.env.CLERK_SECRET_KEY?.length || 0,
        prefix: process.env.CLERK_SECRET_KEY?.substring(0, 10) || 'undefined'
      },
      CLERK_WEBHOOK_SECRET: {
        exists: !!process.env.CLERK_WEBHOOK_SECRET,
        length: process.env.CLERK_WEBHOOK_SECRET?.length || 0,
        prefix: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 10) || 'undefined'
      }
    }

    // 列出所有环境变量键名（用于调试）
    const allEnvKeys = Object.keys(process.env)
      .filter(key => key.includes('CLERK') || key.includes('DATABASE') || key.includes('NEXT_PUBLIC'))
      .sort()

    return NextResponse.json({
      status: 'OK',
      message: 'Environment variable diagnostics',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      hasEnvVars: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
        CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET
      },
      envDebug,
      allEnvKeys,
      totalEnvVars: Object.keys(process.env).length
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 