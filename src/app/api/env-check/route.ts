import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // 检查所有相关环境变量
    const envVars = {
      // 数据库
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        length: process.env.DATABASE_URL?.length || 0,
        prefix: process.env.DATABASE_URL?.substring(0, 15) || 'undefined',
        type: typeof process.env.DATABASE_URL
      },
      
      // Clerk服务器端
      CLERK_SECRET_KEY: {
        exists: !!process.env.CLERK_SECRET_KEY,
        length: process.env.CLERK_SECRET_KEY?.length || 0,
        prefix: process.env.CLERK_SECRET_KEY?.substring(0, 15) || 'undefined',
        type: typeof process.env.CLERK_SECRET_KEY
      },
      
      CLERK_WEBHOOK_SECRET: {
        exists: !!process.env.CLERK_WEBHOOK_SECRET,
        length: process.env.CLERK_WEBHOOK_SECRET?.length || 0,
        prefix: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 15) || 'undefined',
        type: typeof process.env.CLERK_WEBHOOK_SECRET
      },
      
      // Clerk客户端
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        length: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.length || 0,
        prefix: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 15) || 'undefined',
        type: typeof process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      },
      
      // Clerk URL配置
      NEXT_PUBLIC_CLERK_SIGN_IN_URL: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
        value: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || 'undefined',
        type: typeof process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL
      },
      
      NEXT_PUBLIC_CLERK_SIGN_UP_URL: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
        value: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || 'undefined',
        type: typeof process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL
      },
      
      NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL,
        value: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || 'undefined',
        type: typeof process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
      },
      
      NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL: {
        exists: !!process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL,
        value: process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || 'undefined',
        type: typeof process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
      }
    }

    // 计算总结 - 使用直接计算避免TypeScript错误
    const summary = {
      total_vars: Object.keys(envVars).length,
      server_vars_found: (
        envVars.DATABASE_URL.exists ? 1 : 0
      ) + (
        envVars.CLERK_SECRET_KEY.exists ? 1 : 0  
      ) + (
        envVars.CLERK_WEBHOOK_SECRET.exists ? 1 : 0
      ),
      client_vars_found: (
        envVars.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.exists ? 1 : 0
      ) + (
        envVars.NEXT_PUBLIC_CLERK_SIGN_IN_URL.exists ? 1 : 0
      ) + (
        envVars.NEXT_PUBLIC_CLERK_SIGN_UP_URL.exists ? 1 : 0
      ) + (
        envVars.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL.exists ? 1 : 0
      ) + (
        envVars.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL.exists ? 1 : 0
      ),
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({
      status: 'OK',
      summary,
      envVars,
      allEnvKeys: Object.keys(process.env).filter(key => 
        key.includes('CLERK') || key.includes('DATABASE')
      ).sort()
    })
  } catch (error) {
    return NextResponse.json({
      status: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 