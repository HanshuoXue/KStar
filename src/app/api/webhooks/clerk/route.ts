import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { WebhookEvent } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: Request) {
  // 检查 webhook secret
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET

  if (!WEBHOOK_SECRET) {
    throw new Error('请在环境变量中设置 CLERK_WEBHOOK_SECRET')
  }

  // 获取headers
  const headerPayload = await headers()
  const svix_id = headerPayload.get("svix-id")
  const svix_timestamp = headerPayload.get("svix-timestamp")
  const svix_signature = headerPayload.get("svix-signature")

  // 验证headers
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('缺少svix headers', { status: 400 })
  }

  // 获取请求body
  const payload = await req.text()

  // 创建Svix实例验证webhook
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: WebhookEvent

  // 验证请求
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent
  } catch (err) {
    console.error('Webhook验证失败:', err)
    return new Response('Webhook验证失败', { status: 400 })
  }

  // 处理不同的事件类型
  const eventType = evt.type

  console.log(`收到Clerk事件: ${eventType}`)

  try {
    switch (eventType) {
      case 'user.created':
        await handleUserCreated(evt.data)
        break
      
      case 'user.updated':
        await handleUserUpdated(evt.data)
        break
      
      case 'user.deleted':
        await handleUserDeleted(evt.data)
        break
      
      default:
        console.log(`未处理的事件类型: ${eventType}`)
    }

    return NextResponse.json({ message: '事件处理成功' })
  } catch (error) {
    console.error('处理Clerk事件失败:', error)
    return NextResponse.json({ error: '事件处理失败' }, { status: 500 })
  }
}

// 处理用户创建事件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUserCreated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data

  console.log('创建用户:', id)

  try {
    // 创建用户及其关联数据
    await prisma.user.create({
      data: {
        clerkId: id,
        email: email_addresses[0]?.email_address || '',
        firstName: first_name || '',
        lastName: last_name || '',
        avatar: image_url,
        // 创建关联的音域数据
        vocalRange: {
          create: {
            lowest: 0,
            highest: 0,
            comfortableLow: 0,
            comfortableHigh: 0,
            analysisCount: 0,
            confidenceScore: 0
          }
        },
        // 创建用户偏好
        preferences: {
          create: {
            language: 'zh',
            genres: [],
            difficulty: 'BEGINNER',
            autoPlaylist: true,
            matchThreshold: 0.7,
            preferredKeys: [],
            avoidKeys: [],
            showDifficulty: true,
            showMatchScore: true,
            defaultSort: 'match',
            emailNotifications: true,
            pushNotifications: true,
            weeklyReport: true
          }
        },
        // 创建用户统计
        stats: {
          create: {
            songsAnalyzed: 0,
            totalListenTime: 0,
            lastActive: new Date(),
            weeklyUsage: 0,
            monthlyUsage: 0,
            totalSessions: 0,
            playlistsCreated: 0,
            playlistsShared: 0,
            followersCount: 0,
            followingCount: 0,
            achievementPoints: 0,
            currentStreak: 0,
            maxStreak: 0
          }
        }
      }
    })

    console.log(`用户 ${id} 创建成功`)
  } catch (error) {
    console.error('创建用户失败:', error)
    throw error
  }
}

// 处理用户更新事件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUserUpdated(data: any) {
  const { id, email_addresses, first_name, last_name, image_url } = data

  console.log('更新用户:', id)

  try {
    await prisma.user.update({
      where: { clerkId: id },
      data: {
        email: email_addresses[0]?.email_address || '',
        firstName: first_name || '',
        lastName: last_name || '',
        avatar: image_url,
      }
    })

    console.log(`用户 ${id} 更新成功`)
  } catch (error) {
    console.error('更新用户失败:', error)
    throw error
  }
}

// 处理用户删除事件
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUserDeleted(data: any) {
  const { id } = data

  console.log('删除用户:', id)

  try {
    // Prisma会自动处理级联删除
    await prisma.user.delete({
      where: { clerkId: id }
    })

    console.log(`用户 ${id} 删除成功`)
  } catch (error) {
    console.error('删除用户失败:', error)
    throw error
  }
} 