import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId, isTestMode } from '@/lib/test-auth'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)

// Initialize S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'kstar-audio'

// 支持的平台配置
const SUPPORTED_PLATFORMS = {
  youtube: {
    regex: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be|m\.youtube\.com)\/.+/,
    type: 'YOUTUBE'
  },
  bilibili: {
    regex: /^(https?:\/\/)?(www\.)?(bilibili\.com|b23\.tv)\/.+/,
    type: 'BILIBILI'
  },
  netease: {
    regex: /^(https?:\/\/)?(www\.)?(music\.163\.com|y\.music\.163\.com)\/.+/,
    type: 'NETEASE'
  },
  qq: {
    regex: /^(https?:\/\/)?(y\.qq\.com|music\.qq\.com)\/.+/,
    type: 'QQ'
  },
  jamendo: {
    regex: /^(https?:\/\/)?(www\.)?jamendo\.com\/track\/(\d+)\/.*/,
    type: 'JAMENDO'
  },
  test: {
    regex: /^test:\/\/.+/,
    type: 'LOCAL'
  }
}

// 检测平台类型
function detectPlatform(url: string) {
  for (const [platform, config] of Object.entries(SUPPORTED_PLATFORMS)) {
    if (config.regex.test(url)) {
      return config.type
    }
  }
  return null
}

// POST: 创建下载任务
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { url } = body

    if (!url) {
      return NextResponse.json({ error: '缺少URL参数' }, { status: 400 })
    }

    // 检测平台
    const sourceType = detectPlatform(url)
    if (!sourceType) {
      return NextResponse.json({ error: '不支持的平台' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    // 测试模式：使用测试数据
    if (isTestMode(request) && (sourceType === 'LOCAL' || sourceType === 'JAMENDO')) {
      console.log('🧪 测试模式：使用测试数据')
      
      // 直接创建已完成的任务和歌曲
      const testSong = await createTestSong(user.id, url, sourceType)
      
      const task = await prisma.processingTask.create({
        data: {
          userId: user.id,
          taskType: 'download',
          status: 'COMPLETED',
          sourceType: sourceType as any,
          sourceUrl: url,
          progress: 100,
          resultSongId: testSong.id,
          startedAt: new Date(),
          completedAt: new Date()
        }
      })

      return NextResponse.json({
        success: true,
        data: {
          taskId: task.id,
          status: 'COMPLETED',
          message: '测试下载任务已完成',
          songId: testSong.id
        }
      })
    }

    // 创建处理任务
    const task = await prisma.processingTask.create({
      data: {
        userId: user.id,
        taskType: 'download',
        status: 'PENDING',
        sourceType: sourceType as any,
        sourceUrl: url,
        progress: 0
      }
    })

    // 异步处理下载任务
    processDownload(task.id, user.id, url, sourceType).catch(error => {
      console.error('下载任务失败:', error)
      prisma.processingTask.update({
        where: { id: task.id },
        data: {
          status: 'FAILED',
          errorMessage: error.message
        }
      })
    })

    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
        status: 'PENDING',
        message: '下载任务已创建'
      }
    })
  } catch (error) {
    console.error('创建下载任务失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// GET: 查询任务状态
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get('taskId')
    
    const user = await prisma.user.findUnique({
      where: { clerkId: userId }
    })

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 })
    }

    if (taskId) {
      // 查询特定任务
      const task = await prisma.processingTask.findFirst({
        where: {
          id: taskId,
          userId: user.id
        }
      })

      if (!task) {
        return NextResponse.json({ error: '任务不存在' }, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: task
      })
    } else {
      // 查询用户所有任务
      const tasks = await prisma.processingTask.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 10
      })

      return NextResponse.json({
        success: true,
        data: tasks
      })
    }
  } catch (error) {
    console.error('查询任务失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 异步处理下载
async function processDownload(taskId: string, userId: string, url: string, sourceType: string) {
  // 更新任务状态为处理中
  await prisma.processingTask.update({
    where: { id: taskId },
    data: {
      status: 'PROCESSING',
      startedAt: new Date(),
      progress: 10
    }
  })

  // 创建临时目录
  const tempDir = path.join(os.tmpdir(), `kstar-download-${taskId}`)
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // 获取视频信息
    const infoCmd = `yt-dlp --dump-json --no-warnings "${url}"`
    const { stdout: infoStr } = await execAsync(infoCmd)
    const info = JSON.parse(infoStr)

    // 更新进度
    await prisma.processingTask.update({
      where: { id: taskId },
      data: { progress: 30 }
    })

    // 下载音频
    const outputPath = path.join(tempDir, '%(title)s.%(ext)s')
    const downloadCmd = `yt-dlp -x --audio-format mp3 --audio-quality 128K -o "${outputPath}" "${url}"`
    await execAsync(downloadCmd)

    // 更新进度
    await prisma.processingTask.update({
      where: { id: taskId },
      data: { progress: 70 }
    })

    // 获取下载的文件
    const files = await fs.readdir(tempDir)
    const mp3File = files.find(f => f.endsWith('.mp3'))
    
    if (!mp3File) {
      throw new Error('下载失败：未找到音频文件')
    }

    const filePath = path.join(tempDir, mp3File)
    const fileBuffer = await fs.readFile(filePath)

    // 生成S3键
    const timestamp = Date.now()
    const s3Key = `${userId}/${timestamp}-${mp3File.replace(/[^a-z0-9]/gi, '_')}`

    // 上传到S3
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: 'audio/mpeg',
      Metadata: {
        userId,
        sourceUrl: url,
        sourceType,
        title: info.title || 'Unknown',
        artist: info.uploader || 'Unknown'
      }
    })

    await s3Client.send(uploadCommand)

    // 更新进度
    await prisma.processingTask.update({
      where: { id: taskId },
      data: { progress: 90 }
    })

    // 创建歌曲记录
    const fileUrl = `https://${BUCKET_NAME}.s3.amazonaws.com/${s3Key}`
    const song = await prisma.song.create({
      data: {
        title: info.title || mp3File.replace('.mp3', ''),
        artist: info.uploader || info.channel || 'Unknown',
        duration: Math.round(info.duration || 0),
        sourceUrl: url,
        sourceType: sourceType as any,
        sourceId: info.id || timestamp.toString(),
        fileUrl,
        thumbnailUrl: info.thumbnail,
        isProcessed: false,
        userSongs: {
          create: {
            userId,
            status: 'ACTIVE'
          }
        }
      }
    })

    // 完成任务
    await prisma.processingTask.update({
      where: { id: taskId },
      data: {
        status: 'COMPLETED',
        progress: 100,
        resultSongId: song.id,
        completedAt: new Date()
      }
    })

    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true })

  } catch (error: any) {
    // 清理临时文件
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
    
    throw error
  }
}

// 创建测试歌曲
async function createTestSong(userId: string, url: string, sourceType: string) {
  let songData: any = {
    title: 'Test Song',
    artist: 'Test Artist',
    duration: 180,
    sourceUrl: url,
    sourceType: sourceType as any,
    sourceId: `test-${Date.now()}`,
    fileUrl: 'https://example.com/test.mp3',
    isProcessed: true
  }

  // 如果是Jamendo URL，尝试提取真实信息
  if (sourceType === 'JAMENDO') {
    const jamendoMatch = url.match(/jamendo\.com\/track\/(\d+)/)
    if (jamendoMatch) {
      const trackId = jamendoMatch[1]
      
      // 使用Jamendo的一些真实示例数据
      const jamendoExamples: Record<string, any> = {
        '1972914': {
          title: 'Cinematic Documentary',
          artist: 'MaxKoMusic',
          duration: 154,
          fileUrl: 'https://mp3d.jamendo.com/download/track/1972914/mp32/',
          thumbnailUrl: 'https://usercontent.jamendo.com?type=album&id=399517&width=300'
        },
        '1884133': {
          title: 'Inspiring Cinematic Background',
          artist: 'AGsoundtrax',
          duration: 137,
          fileUrl: 'https://mp3d.jamendo.com/download/track/1884133/mp32/',
          thumbnailUrl: 'https://usercontent.jamendo.com?type=album&id=353475&width=300'
        },
        '1781603': {
          title: 'Summer Vibes',
          artist: 'Roa Music',
          duration: 185,
          fileUrl: 'https://mp3d.jamendo.com/download/track/1781603/mp32/',
          thumbnailUrl: 'https://usercontent.jamendo.com?type=album&id=285114&width=300'
        }
      }

      // 如果找到对应的示例数据，使用它
      if (jamendoExamples[trackId]) {
        songData = {
          ...songData,
          ...jamendoExamples[trackId],
          sourceId: `jamendo-${trackId}-${Date.now()}`
        }
      }
    }
  }

  // 创建歌曲记录
  const song = await prisma.song.create({
    data: {
      ...songData,
      userSongs: {
        create: {
          userId,
          status: 'ACTIVE'
        }
      }
    }
  })

  return song
} 