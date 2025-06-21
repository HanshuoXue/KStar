import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    checks: {
      server: true,
      database: false,
      environment_variables: {
        DATABASE_URL: !!process.env.DATABASE_URL,
        CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
        CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET,
        NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
      }
    },
    details: {
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime()
    }
  }

  // 测试数据库连接
  try {
    await prisma.$connect()
    await prisma.$queryRaw`SELECT 1`
    healthCheck.checks.database = true
    healthCheck.details.database = 'Connected successfully'
  } catch (error) {
    healthCheck.status = 'ERROR'
    healthCheck.checks.database = false
    healthCheck.details.database = `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  } finally {
    await prisma.$disconnect()
  }

  // 环境变量详细检查
  const envDetails = {
    DATABASE_URL_PREFIX: process.env.DATABASE_URL?.substring(0, 20) + '...',
    CLERK_SECRET_KEY_PREFIX: process.env.CLERK_SECRET_KEY?.substring(0, 15) + '...',
    CLERK_WEBHOOK_SECRET_PREFIX: process.env.CLERK_WEBHOOK_SECRET?.substring(0, 15) + '...',
  }

  return NextResponse.json({
    ...healthCheck,
    envDetails
  }, { 
    status: healthCheck.status === 'OK' ? 200 : 503 
  })
} 