import { NextRequest } from 'next/server'
import { GET, POST, PUT } from '@/app/api/songs/route'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Mock modules
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    userSong: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
    },
    song: {
      create: jest.fn(),
      update: jest.fn(),
    },
  },
}))

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}))

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({})),
  PutObjectCommand: jest.fn(),
  GetObjectCommand: jest.fn(),
}))

const mockAuth = auth as unknown as jest.Mock
const mockGetSignedUrl = getSignedUrl as jest.Mock

describe('/api/songs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/songs', () => {
    it('should return paginated songs list', async () => {
      const mockUser = { id: 'user-1', clerkId: 'test-user-id' }
      const mockSongs = [
        {
          id: '1',
          userId: 'user-1',
          songId: 'song-1',
          song: {
            id: 'song-1',
            title: 'Test Song',
            artist: 'Test Artist',
            audioData: null,
          },
        },
      ]

      mockAuth.mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
      ;(prisma.userSong.findMany as jest.Mock).mockResolvedValueOnce(mockSongs)
      ;(prisma.userSong.count as jest.Mock).mockResolvedValueOnce(1)

      const request = new NextRequest('http://localhost:3000/api/songs?page=1&limit=10')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSongs)
      expect(data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      })
    })
  })

  describe('POST /api/songs', () => {
    it('should create song and return presigned URL', async () => {
      const mockUser = { id: 'user-1', clerkId: 'test-user-id' }
      const mockSong = {
        id: 'song-1',
        title: 'New Song',
        artist: 'New Artist',
        fileUrl: 'https://test-bucket.s3.amazonaws.com/user-1/123456-New_Song.mp3',
        audioData: null,
      }

      mockAuth.mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
      ;(prisma.song.create as jest.Mock).mockResolvedValueOnce(mockSong)
      mockGetSignedUrl.mockResolvedValueOnce('https://presigned-url.com')

      const request = new NextRequest('http://localhost:3000/api/songs', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Song',
          artist: 'New Artist',
          duration: 180,
          sourceUrl: 'https://youtube.com/watch?v=123',
          sourceType: 'YOUTUBE',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data.song).toEqual(mockSong)
      expect(data.data.uploadUrl).toBe('https://presigned-url.com')
      expect(data.data.expiresIn).toBe(3600)
    })

    it('should return 400 when missing required fields', async () => {
      mockAuth.mockResolvedValueOnce({ userId: 'test-user-id' })

      const request = new NextRequest('http://localhost:3000/api/songs', {
        method: 'POST',
        body: JSON.stringify({
          title: 'New Song',
          // Missing artist
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('缺少必要参数')
    })
  })

  describe('PUT /api/songs', () => {
    it('should update song status with analysis result', async () => {
      const mockUser = { id: 'user-1', clerkId: 'test-user-id' }
      const mockUserSong = { userId: 'user-1', songId: 'song-1' }
      const mockUpdatedSong = {
        id: 'song-1',
        isProcessed: true,
        audioData: {
          key: 'C',
          tempo: 120,
          difficulty: 'MEDIUM',
        },
      }

      mockAuth.mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
      ;(prisma.userSong.findFirst as jest.Mock).mockResolvedValueOnce(mockUserSong)
      ;(prisma.song.update as jest.Mock).mockResolvedValueOnce(mockUpdatedSong)

      const request = new NextRequest('http://localhost:3000/api/songs', {
        method: 'PUT',
        body: JSON.stringify({
          songId: 'song-1',
          status: 'COMPLETED',
          analysisResult: {
            key: 'C',
            tempo: 120,
            difficulty: 'MEDIUM',
          },
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUpdatedSong)
    })

    it('should return 403 when user does not own the song', async () => {
      const mockUser = { id: 'user-1', clerkId: 'test-user-id' }

      mockAuth.mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)
      ;(prisma.userSong.findFirst as jest.Mock).mockResolvedValueOnce(null)

      const request = new NextRequest('http://localhost:3000/api/songs', {
        method: 'PUT',
        body: JSON.stringify({
          songId: 'song-1',
          status: 'COMPLETED',
        }),
      })

      const response = await PUT(request)
      const data = await response.json()

      expect(response.status).toBe(403)
      expect(data.error).toBe('无权操作此歌曲')
    })
  })
}) 