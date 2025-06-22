import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthUserId, isTestMode } from '@/lib/test-auth'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'kstar-audio'

// GET: 获取用户的歌曲列表
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 开始处理歌曲API请求')
    const userId = await getAuthUserId(request)
    console.log('🧪 获取到用户ID:', userId)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    console.log('🧪 查询到用户:', user ? '存在' : '不存在')

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 简化查询，只获取基础歌曲信息
    const [songs, total] = await Promise.all([
      prisma.userSong.findMany({
        where: { userId: user.id },
        include: {
          song: true
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.userSong.count({
        where: { userId: user.id }
      })
    ])

    console.log('🧪 查询到歌曲数量:', songs.length)

    return NextResponse.json({
      success: true,
      data: songs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('🚨 获取歌曲列表失败:', error)
    return NextResponse.json({ 
      error: '服务器错误',
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// POST: 创建新歌曲并生成预签名URL
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { title, artist, duration, sourceUrl, sourceType } = body

    if (!title || !artist) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 生成唯一的文件名
    const timestamp = Date.now()
    const fileName = `${user.id}/${timestamp}-${title.replace(/[^a-z0-9]/gi, '_')}.mp3`
    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${fileName}`

    // 创建歌曲记录
    const song = await prisma.song.create({
      data: {
        title,
        artist,
        duration: duration || 0,
        sourceUrl,
        sourceType: sourceType || 'YOUTUBE',
        sourceId: `${timestamp}-${user.id}`,
        fileUrl,
        isProcessed: false,
        userSongs: {
          create: {
            userId: user.id,
            status: 'ACTIVE'
          }
        }
      },
      include: {
        audioData: true
      }
    })

    // 测试模式：跳过S3预签名URL生成
    if (isTestMode(request)) {
      console.log('🧪 测试模式：跳过S3预签名URL生成')
      return NextResponse.json({
        success: true,
        data: {
          song,
          uploadUrl: 'https://test-upload-url.example.com',
          expiresIn: 3600,
          testMode: true
        }
      })
    }

    // 生产模式：生成真实的S3预签名URL
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
      ContentType: 'audio/mpeg',
      Metadata: {
        userId: user.id,
        songId: song.id,
        title,
        artist
      }
    })

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 })

    return NextResponse.json({
      success: true,
      data: {
        song,
        uploadUrl: presignedUrl,
        expiresIn: 3600
      }
    })
  } catch (error) {
    console.error('创建歌曲失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// PUT: 更新歌曲状态
export async function PUT(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { songId, status, analysisResult } = body

    if (!songId || !status) {
      return NextResponse.json({ error: '缺少必要参数' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 验证用户是否拥有该歌曲
    const userSong = await prisma.userSong.findFirst({
      where: {
        userId: user.id,
        songId: songId
      }
    })

    if (!userSong) {
      return NextResponse.json({ error: '无权操作此歌曲' }, { status: 403 })
    }

    // 更新歌曲状态
    const updateData: any = { 
      isProcessed: status === 'COMPLETED'
    }

    // 如果有分析结果，创建分析记录
    if (analysisResult && status === 'COMPLETED') {
      updateData.audioData = {
        create: {
          key: analysisResult.key || 'C',
          tempo: analysisResult.tempo || 120,
          pitchMin: analysisResult.pitchMin || 0,
          pitchMax: analysisResult.pitchMax || 0,
          pitchAverage: analysisResult.pitchAverage || 0,
          pitchVariance: analysisResult.pitchVariance || 0,
          pitchMedian: analysisResult.pitchMedian || 0,
          difficulty: analysisResult.difficulty || 'MEDIUM',
          complexityScore: analysisResult.complexityScore || 0,
          vocalDemand: analysisResult.vocalDemand || 0,
          breathingDemand: analysisResult.breathingDemand || 0,
        }
      }
    }

    const song = await prisma.song.update({
      where: { id: songId },
      data: updateData,
      include: {
        audioData: true,
      }
    })

    return NextResponse.json({
      success: true,
      data: song
    })
  } catch (error) {
    console.error('更新歌曲失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 