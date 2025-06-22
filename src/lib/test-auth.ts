import { auth } from '@clerk/nextjs/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * 测试认证工具
 * 在测试模式下绕过Clerk认证，生产环境正常使用Clerk
 */
export async function getAuthUserId(request: NextRequest): Promise<string | null> {
  // 检查是否为测试模式
  const testMode = request.headers.get('x-test-mode')
  const testSecret = request.headers.get('x-test-secret')
  
  // 测试模式：需要特定的头部和密钥
  if (testMode === 'true' && testSecret === 'kstar-test-2024') {
    const testUserId = request.headers.get('x-test-user-id') || 'test-user-12345'
    console.log('🧪 测试模式启用，使用测试用户ID:', testUserId)
    
    // 在测试模式下，确保测试用户存在于数据库中
    await ensureTestUserExists(testUserId)
    return testUserId
  }
  
  // 生产模式：使用Clerk认证
  try {
    const { userId } = await auth()
    return userId
  } catch (error) {
    console.error('Clerk认证失败:', error)
    return null
  }
}

/**
 * 确保测试用户存在于数据库中
 */
async function ensureTestUserExists(clerkId: string): Promise<void> {
  try {
    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { clerkId }
    })
    
    if (!existingUser) {
      // 创建测试用户
      await prisma.user.create({
        data: {
          clerkId,
          email: `test_${clerkId}@kstar.com`,
          firstName: '测试',
          lastName: '用户'
        }
      })
      console.log('🧪 创建测试用户:', clerkId)
    }
  } catch (error) {
    console.error('创建测试用户失败:', error)
  }
}

/**
 * 检查是否为测试模式
 */
export function isTestMode(request: NextRequest): boolean {
  const testMode = request.headers.get('x-test-mode')
  const testSecret = request.headers.get('x-test-secret')
  return testMode === 'true' && testSecret === 'kstar-test-2024'
} 