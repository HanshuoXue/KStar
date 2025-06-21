'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface UserData {
  id: string
  firstName: string
  lastName: string
  email: string
  avatar?: string
  bio?: string
  vocalRange?: {
    lowest: number
    highest: number
    voiceType?: string
    confidenceScore: number
  }
  stats?: {
    songsAnalyzed: number
    totalListenTime: number
    favoriteKey?: string
    currentStreak: number
    achievementPoints: number
  }
  _count?: {
    playlists: number
    songs: number
    followers: number
    following: number
  }
}

export default function Dashboard() {
  const { user, isLoaded } = useUser()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, user])

  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user')
      const data = await response.json()
      
      if (data.success) {
        setUserData(data.data)
      } else {
        setError(data.error || '获取用户数据失败')
      }
    } catch (err) {
      console.error('获取用户数据失败:', err)
      setError('网络错误')
    } finally {
      setLoading(false)
    }
  }

  if (!isLoaded || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <Button onClick={() => window.location.href = '/sign-in'}>
            前往登录
          </Button>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">错误</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchUserData}>
            重试
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 用户信息头部 */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            {user.imageUrl && (
              <Image 
                src={user.imageUrl} 
                alt="头像" 
                width={64}
                height={64}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                欢迎回来，{user.firstName || user.emailAddresses[0].emailAddress}
              </h1>
              <p className="text-gray-600">这是你的音域分析仪表板</p>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">分析歌曲</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🎵</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userData?.stats?.songsAnalyzed || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                首歌曲已分析
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">播放列表</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">📝</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userData?._count?.playlists || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                个播放列表
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">听歌时长</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">⏱️</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.floor((userData?.stats?.totalListenTime || 0) / 60)}
              </div>
              <p className="text-xs text-muted-foreground">
                分钟
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">成就点数</CardTitle>
              <div className="h-4 w-4 text-muted-foreground">🏆</div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {userData?.stats?.achievementPoints || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                点成就
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 音域信息 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>音域信息</CardTitle>
            </CardHeader>
            <CardContent>
              {userData?.vocalRange ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">声部类型</p>
                    <p className="text-lg font-semibold">
                      {userData.vocalRange.voiceType || '未设置'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">音域范围</p>
                    <p className="text-lg font-semibold">
                      {userData.vocalRange.lowest > 0 && userData.vocalRange.highest > 0
                        ? `${userData.vocalRange.lowest.toFixed(0)}Hz - ${userData.vocalRange.highest.toFixed(0)}Hz`
                        : '尚未分析'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">分析可信度</p>
                    <p className="text-lg font-semibold">
                      {(userData.vocalRange.confidenceScore * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">还没有音域数据</p>
                  <Button>开始音域分析</Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>快速操作</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button className="w-full" variant="default">
                  🎤 录制音域分析
                </Button>
                <Button className="w-full" variant="outline">
                  🎵 上传音频文件
                </Button>
                <Button className="w-full" variant="outline">
                  📝 创建新播放列表
                </Button>
                <Button className="w-full" variant="outline">
                  ⚙️ 个人设置
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 调试信息 */}
        {process.env.NODE_ENV === 'development' && (
          <Card>
            <CardHeader>
              <CardTitle>调试信息</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto">
                {JSON.stringify(userData, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 