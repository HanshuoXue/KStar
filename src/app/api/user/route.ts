import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, isTestMode } from '@/lib/test-auth'

// 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 开始处理用户API请求')
    const userId = await getAuthUserId(request)
    console.log('🧪 获取到用户ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 简化查询，只获取基础用户信息
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })
    
    console.log('🧪 查询到用户:', user ? '存在' : '不存在')
    
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar
      }
    })
  } catch (error) {
    console.error('🚨 获取用户信息失败:', error)
    return NextResponse.json({ 
      error: '服务器错误', 
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { vocalRange, preferences, stats, ...userData } = body
    
    // 更新用户基础信息
    const updateData: Record<string, unknown> = {}
    
    if (userData.bio !== undefined) updateData.bio = userData.bio
    if (userData.avatar !== undefined) updateData.avatar = userData.avatar

    // 更新关联数据
    if (vocalRange) {
      updateData.vocalRange = {
        upsert: {
          create: vocalRange,
          update: vocalRange
        }
      }
    }

    if (preferences) {
      updateData.preferences = {
        upsert: {
          create: preferences,
          update: preferences
        }
      }
    }

    if (stats) {
      updateData.stats = {
        upsert: {
          create: {
            ...stats,
            lastActive: new Date()
          },
          update: {
            ...stats,
            lastActive: new Date()
          }
        }
      }
    }

    const user = await prisma.user.update({
      where: { clerkId: userId },
      data: updateData,
      include: {
        vocalRange: true,
        preferences: true,
        stats: true
      }
    })

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 获取用户统计摘要
export async function PATCH(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 更新最后活跃时间
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        stats: {
          upsert: {
            create: {
              lastActive: new Date(),
              totalSessions: 1,
              songsAnalyzed: 0,
              totalListenTime: 0,
              achievementPoints: 0,
              currentStreak: 0
            },
            update: {
              lastActive: new Date(),
              totalSessions: { increment: 1 }
            }
          }
        }
      }
    })

    // 获取用户统计摘要
    const summary = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatar: true,
        stats: {
          select: {
            songsAnalyzed: true,
            totalListenTime: true,
            favoriteKey: true,
            currentStreak: true,
            achievementPoints: true
          }
        },
        vocalRange: {
          select: {
            voiceType: true,
            noteRangeLow: true,
            noteRangeHigh: true,
            confidenceScore: true
          }
        },
        _count: {
          select: {
            playlists: true,
            songs: true,
            followers: true,
            following: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: summary
    })
  } catch (error) {
    console.error('获取用户统计失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 