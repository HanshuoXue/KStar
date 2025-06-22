import { auth } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { getAuthUserId, isTestMode } from '@/lib/test-auth'
import { prisma } from '@/lib/prisma'
import { exec } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
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

// POST: 生成歌词时间轴
export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const body = await request.json()
    const { songId, lyrics, language = 'zho' } = body

    if (!songId || !lyrics) {
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
      },
      include: {
        song: true
      }
    })

    if (!userSong || !userSong.song) {
      return NextResponse.json({ error: '歌曲不存在' }, { status: 404 })
    }

    const song = userSong.song

    // 测试模式：返回模拟的歌词时间轴
    if (isTestMode(request)) {
      console.log('🧪 测试模式：返回模拟歌词时间轴')
      
      // 生成模拟的时间轴数据
      const lines = lyrics.split('\n').filter((line: string) => line.trim())
      const duration = song.duration || 180
      const timePerLine = duration / lines.length
      
      const timeStamps = lines.map((line: string, index: number) => ({
        begin: index * timePerLine,
        end: (index + 1) * timePerLine,
        text: line.trim()
      }))

      return NextResponse.json({
        success: true,
        data: {
          songId,
          timeStamps,
          totalFragments: timeStamps.length,
          testMode: true
        }
      })
    }

    if (!song.fileUrl) {
      return NextResponse.json({ error: '歌曲音频文件不存在' }, { status: 400 })
    }

    // 创建临时目录
    const tempDir = path.join(os.tmpdir(), `kstar-lyrics-${songId}-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    try {
      // 从S3下载音频文件
      const s3Key = song.fileUrl.split('.amazonaws.com/')[1]
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key
      })
      
      const response = await s3Client.send(command)
      const audioBuffer = await response.Body?.transformToByteArray()
      
      if (!audioBuffer) {
        throw new Error('无法下载音频文件')
      }

      const audioPath = path.join(tempDir, 'audio.mp3')
      await fs.writeFile(audioPath, audioBuffer)

      // 将歌词写入文件
      const lyricsPath = path.join(tempDir, 'lyrics.txt')
      await fs.writeFile(lyricsPath, lyrics, 'utf-8')

      // 创建Aeneas配置文件
      const configPath = path.join(tempDir, 'config.txt')
      const config = `
task_language=${language}
is_text_type=plain
os_task_file_format=json
task_adjust_boundary_nonspeech_min=0.500
task_adjust_boundary_nonspeech_string=REMOVE
`.trim()
      await fs.writeFile(configPath, config)

      // 运行Aeneas
      const outputPath = path.join(tempDir, 'output.json')
      const aeneasCmd = `python -m aeneas.tools.execute_task "${audioPath}" "${lyricsPath}" "task_language=${language}|os_task_file_format=json|is_text_type=plain" "${outputPath}"`
      
      const { stdout, stderr } = await execAsync(aeneasCmd)
      console.log('Aeneas output:', stdout)
      if (stderr) console.error('Aeneas stderr:', stderr)

      // 读取结果
      const resultJson = await fs.readFile(outputPath, 'utf-8')
      const result = JSON.parse(resultJson)

      // 格式化时间轴数据
      const timeStamps = result.fragments.map((fragment: any) => ({
        begin: parseFloat(fragment.begin),
        end: parseFloat(fragment.end),
        text: fragment.lines[0] || fragment.text
      }))

      // 保存到数据库（可以考虑添加一个新的模型来存储歌词时间轴）
      // 这里暂时返回结果
      
      // 清理临时文件
      await fs.rm(tempDir, { recursive: true, force: true })

      return NextResponse.json({
        success: true,
        data: {
          songId,
          timeStamps,
          totalFragments: timeStamps.length
        }
      })

    } catch (error: any) {
      // 清理临时文件
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {})
      throw error
    }

  } catch (error) {
    console.error('生成歌词时间轴失败:', error)
    return NextResponse.json({ 
      error: '生成歌词时间轴失败', 
      details: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}

// GET: 获取歌词时间轴
export async function GET(request: NextRequest) {
  try {
    const userId = await getAuthUserId(request)
    
    if (!userId) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const songId = searchParams.get('songId')

    if (!songId) {
      return NextResponse.json({ error: '缺少歌曲ID' }, { status: 400 })
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
      },
      include: {
        song: true
      }
    })

    if (!userSong) {
      return NextResponse.json({ error: '无权访问此歌曲' }, { status: 403 })
    }

    // 测试模式：返回示例歌词
    if (isTestMode(request)) {
      console.log('🧪 测试模式：返回示例歌词')
      
      // 根据歌曲标题返回不同的示例歌词
      const sampleLyrics: Record<string, any> = {
        'Cinematic Documentary': {
          lyrics: [
            { begin: 0, end: 10, text: '在光影交错的世界里' },
            { begin: 10, end: 20, text: '记录着时光的痕迹' },
            { begin: 20, end: 30, text: '每一帧都是故事' },
            { begin: 30, end: 40, text: '每一秒都是永恒' }
          ],
          language: 'zho'
        },
        'Summer Vibes': {
          lyrics: [
            { begin: 0, end: 8, text: 'Feel the summer breeze' },
            { begin: 8, end: 16, text: 'Dancing through the trees' },
            { begin: 16, end: 24, text: 'Golden sunset skies' },
            { begin: 24, end: 32, text: 'Magic in our eyes' }
          ],
          language: 'eng'
        },
        'Test Song': {
          lyrics: [
            { begin: 0, end: 5, text: '这是一首测试歌曲' },
            { begin: 5, end: 10, text: '用来验证功能是否正常' },
            { begin: 10, end: 15, text: '歌词同步显示' },
            { begin: 15, end: 20, text: '一切都在掌控之中' }
          ],
          language: 'zho'
        }
      }

      const songTitle = userSong.song.title
      const lyricsData = sampleLyrics[songTitle] || sampleLyrics['Test Song']

      return NextResponse.json({
        success: true,
        data: {
          songId,
          timeStamps: lyricsData.lyrics,
          language: lyricsData.language,
          totalFragments: lyricsData.lyrics.length,
          testMode: true
        }
      })
    }

    // TODO: 从数据库获取已保存的歌词时间轴
    // 这里需要根据实际的数据模型来实现

    return NextResponse.json({
      success: true,
      data: {
        songId,
        message: '功能开发中'
      }
    })
  } catch (error) {
    console.error('获取歌词时间轴失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
} 