import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// 获取当前用户信息
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      include: {
        vocalRange: true,
        preferences: true,
        stats: true,
        playlists: {
          include: { 
            items: { 
              include: { 
                song: {
                  include: {
                    audioData: true
                  }
                }
              },
              orderBy: { order: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        songs: {
          include: {
            song: {
              include: {
                audioData: true
              }
            }
          },
          where: { status: 'ACTIVE' },
          orderBy: { lastPlayed: 'desc' }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 更新用户信息
export async function PUT(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { vocalRange, preferences, stats, ...userData } = body
    
    // 更新用户基础信息
    const updateData: any = {}
    
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
export async function PATCH() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    // 更新最后活跃时间
    await prisma.user.update({
      where: { clerkId: userId },
      data: {
        stats: {
          update: {
            lastActive: new Date(),
            totalSessions: { increment: 1 }
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