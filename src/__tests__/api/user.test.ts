import { NextRequest, NextResponse } from 'next/server'
import { GET, PUT, PATCH } from '@/app/api/user/route'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

// Mock Prisma
jest.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}))

const mockAuth = auth as unknown as jest.Mock

describe('/api/user', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('GET /api/user', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Mock auth to return no userId
      mockAuth.mockResolvedValueOnce({ userId: null })

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(401)
      expect(data.error).toBe('未登录')
    })

    it('should return 404 when user does not exist', async () => {
      mockAuth.mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(null)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('用户不存在')
    })

    it('should return user data successfully', async () => {
      const mockUser = {
        id: '1',
        clerkId: 'test-user-id',
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        vocalRange: null,
        preferences: null,
        stats: null,
        playlists: [],
        songs: [],
      }

      ;(auth as jest.Mock).mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockUser)

      const response = await GET()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUser)
    })
  })

  describe('PUT /api/user', () => {
    it('should update user information', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/user', {
        method: 'PUT',
        body: JSON.stringify({
          bio: 'Updated bio',
          vocalRange: {
            lowest: 100,
            highest: 800,
          },
        }),
      })

      const mockUpdatedUser = {
        id: '1',
        clerkId: 'test-user-id',
        bio: 'Updated bio',
        vocalRange: {
          lowest: 100,
          highest: 800,
        },
      }

      ;(auth as jest.Mock).mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.update as jest.Mock).mockResolvedValueOnce(mockUpdatedUser)

      const response = await PUT(mockRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockUpdatedUser)
    })
  })

  describe('PATCH /api/user', () => {
    it('should update user activity and return summary', async () => {
      const mockSummary = {
        id: '1',
        firstName: 'Test',
        lastName: 'User',
        avatar: null,
        stats: {
          songsAnalyzed: 10,
          totalListenTime: 3600,
          favoriteKey: 'C',
          currentStreak: 5,
          achievementPoints: 100,
        },
        vocalRange: {
          voiceType: 'tenor',
          noteRangeLow: 'C3',
          noteRangeHigh: 'C5',
          confidenceScore: 0.85,
        },
        _count: {
          playlists: 3,
          songs: 10,
          followers: 2,
          following: 5,
        },
      }

      ;(auth as jest.Mock).mockResolvedValueOnce({ userId: 'test-user-id' })
      ;(prisma.user.update as jest.Mock).mockResolvedValueOnce({})
      ;(prisma.user.findUnique as jest.Mock).mockResolvedValueOnce(mockSummary)

      const response = await PATCH()
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.data).toEqual(mockSummary)
    })
  })
}) 