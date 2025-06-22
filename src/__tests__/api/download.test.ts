import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/download/route'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { testApiHandler } from 'next-test-api-route-handler'
import * as appHandler from '@/app/api/download/route'
import { createMockUser } from '../setup/test-utils'

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    processingTask: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    song: {
      create: jest.fn(),
    },
  },
}))

jest.mock('child_process', () => ({
  exec: jest.fn((cmd, callback) => {
    callback(null, { stdout: '{}', stderr: '' })
  }),
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({
    send: jest.fn().mockResolvedValue({}),
  })),
  PutObjectCommand: jest.fn(),
}))

const mockAuth = auth as unknown as jest.Mock

describe('/api/download', () => {
  beforeEach(async () => {
    await createMockUser()
  })

  describe('POST - 创建下载任务', () => {
    it('应该能够下载 Jamendo 免费音乐', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Mode': 'true',
              'X-Test-User-Id': 'test_clerk_123'
            },
            body: JSON.stringify({
              url: 'https://www.jamendo.com/track/1781603/summer-vibes'
            })
          })

          const json = await res.json()
          
          expect(res.status).toBe(200)
          expect(json.success).toBe(true)
          expect(json.data).toHaveProperty('taskId')
          expect(json.data).toHaveProperty('songId')
          expect(json.data.status).toBe('COMPLETED')
          expect(json.data.message).toBe('测试下载任务已完成')
        }
      })
    })

    it('应该能够使用 test:// 协议进行快速测试', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Mode': 'true',
              'X-Test-User-Id': 'test_clerk_123'
            },
            body: JSON.stringify({
              url: 'test://example-song'
            })
          })

          const json = await res.json()
          
          expect(res.status).toBe(200)
          expect(json.success).toBe(true)
          expect(json.data).toHaveProperty('taskId')
          expect(json.data).toHaveProperty('songId')
        }
      })
    })

    it('应该拒绝不支持的平台', async () => {
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Mode': 'true',
              'X-Test-User-Id': 'test_clerk_123'
            },
            body: JSON.stringify({
              url: 'https://unsupported-platform.com/song'
            })
          })

          const json = await res.json()
          
          expect(res.status).toBe(400)
          expect(json.error).toBe('不支持的平台')
        }
      })
    })
  })

  describe('GET - 查询任务状态', () => {
    it('应该能够查询任务状态', async () => {
      // 首先创建一个任务
      let taskId: string = ''
      
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Test-Mode': 'true',
              'X-Test-User-Id': 'test_clerk_123'
            },
            body: JSON.stringify({
              url: 'test://example-song'
            })
          })

          const json = await res.json()
          taskId = json.data.taskId
        }
      })

      // 然后查询任务状态
      await testApiHandler({
        appHandler,
        test: async ({ fetch }) => {
          const res = await fetch({
            method: 'GET',
            headers: {
              'X-Test-Mode': 'true',
              'X-Test-User-Id': 'test_clerk_123'
            },
            url: `?taskId=${taskId}`
          })

          const json = await res.json()
          
          expect(res.status).toBe(200)
          expect(json.success).toBe(true)
          expect(json.data).toHaveProperty('status')
          expect(json.data.status).toBe('COMPLETED')
        }
      })
    })
  })
})

// 示例：真实的 Jamendo 音乐数据
export const JAMENDO_EXAMPLES = [
  {
    id: '1972914',
    url: 'https://www.jamendo.com/track/1972914/cinematic-documentary',
    title: 'Cinematic Documentary',
    artist: 'MaxKoMusic',
    duration: 154,
    mp3: 'https://mp3d.jamendo.com/download/track/1972914/mp32/'
  },
  {
    id: '1884133',
    url: 'https://www.jamendo.com/track/1884133/inspiring-cinematic-background',
    title: 'Inspiring Cinematic Background',
    artist: 'AGsoundtrax',
    duration: 137,
    mp3: 'https://mp3d.jamendo.com/download/track/1884133/mp32/'
  },
  {
    id: '1781603',
    url: 'https://www.jamendo.com/track/1781603/summer-vibes',
    title: 'Summer Vibes',
    artist: 'Roa Music',
    duration: 185,
    mp3: 'https://mp3d.jamendo.com/download/track/1781603/mp32/'
  }
] 