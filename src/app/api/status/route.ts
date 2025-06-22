import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // 检查 Clerk 认证
    const { userId } = await auth()
    
    // 检查数据库连接
    let dbStatus = 'disconnected'
    try {
      await prisma.user.findFirst()
      dbStatus = 'connected'
    } catch (error) {
      dbStatus = 'error'
    }
    
    // 检查环境变量
    const envCheck = {
      AWS_ACCESS_KEY_ID: !!process.env.AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY: !!process.env.AWS_SECRET_ACCESS_KEY,
      AWS_REGION: !!process.env.AWS_REGION,
      S3_BUCKET_NAME: !!process.env.S3_BUCKET_NAME,
      DATABASE_URL: !!process.env.DATABASE_URL,
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      CLERK_WEBHOOK_SECRET: !!process.env.CLERK_WEBHOOK_SECRET,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    }
    
    // API 路由状态
    const apiRoutes = {
      '/api/user': '✅ 用户信息管理（Clerk集成）',
      '/api/songs': '✅ 歌曲管理（S3预签名URL）',
      '/api/download': '✅ 下载任务（yt-dlp集成）',
      '/api/lyrics': '✅ 歌词时间轴（Aeneas集成）',
      '/api/webhooks/clerk': '✅ Clerk Webhook',
      '/api/health': '✅ 健康检查',
      '/api/env-check': '✅ 环境变量检查',
    }
    
    // 功能实现状态
    const features = {
      authentication: {
        status: '✅ 已完成',
        details: 'Clerk OAuth + 邮箱登录'
      },
      storage: {
        status: '✅ 已完成',
        details: 'S3存储 + 预签名URL上传'
      },
      dataFetching: {
        status: '✅ 已完成',
        details: 'yt-dlp下载 + 多平台支持'
      },
      lyricsSync: {
        status: '✅ 已完成',
        details: 'Aeneas歌词时间轴生成'
      },
      database: {
        status: dbStatus === 'connected' ? '✅ 已连接' : '❌ 未连接',
        details: 'MongoDB Atlas'
      }
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      authentication: {
        isAuthenticated: !!userId,
        userId
      },
      database: {
        status: dbStatus
      },
      environment: envCheck,
      apiRoutes,
      features,
      nextSteps: [
        '步骤5: 音步分析管道 - 需要设置Lambda Worker和FFmpeg Layer',
        '步骤6: 可视化MVP - 集成wavesurfer.js和visx/D3'
      ]
    })
  } catch (error) {
    console.error('状态检查失败:', error)
    return NextResponse.json({ 
      error: '状态检查失败',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
} 