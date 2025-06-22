'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Music, Download, Mic, PlayCircle, PauseCircle, Upload, Plus } from 'lucide-react'
import Link from 'next/link'

interface UserStats {
  totalSongs: number
  totalMinutes: number
  songsAnalyzed: number
  practiceStreak: number
}

interface Song {
  id: string
  song: {
    id: string
    title: string
    artist: string
    duration: number
    fileUrl?: string
    isProcessed: boolean
    createdAt: string
  }
  status: string
  createdAt: string
}

export default function DashboardPage() {
  const { user, isLoaded } = useUser()
  const [userStats, setUserStats] = useState<UserStats | null>(null)
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && user) {
      fetchUserData()
    }
  }, [isLoaded, user])

  const fetchUserData = async () => {
    try {
      // 获取用户统计数据
      const statsRes = await fetch('/api/user')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setUserStats(statsData.data.stats)
      }

      // 获取用户歌曲列表
      const songsRes = await fetch('/api/songs')
      if (songsRes.ok) {
        const songsData = await songsRes.json()
        setSongs(songsData.data)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const togglePlay = (songId: string) => {
    if (playingSongId === songId) {
      setPlayingSongId(null)
    } else {
      setPlayingSongId(songId)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  if (!isLoaded || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 欢迎区域 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          欢迎回来，{user?.firstName || user?.username || '用户'}！
        </h1>
        <p className="text-muted-foreground">
          开始今天的音乐之旅，探索你的声音潜力
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">歌曲总数</CardTitle>
            <Music className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalSongs || 0}</div>
            <p className="text-xs text-muted-foreground">
              已上传的歌曲
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">练习时长</CardTitle>
            <Mic className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.totalMinutes || 0}分钟</div>
            <p className="text-xs text-muted-foreground">
              累计练习时间
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已分析</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.songsAnalyzed || 0}</div>
            <p className="text-xs text-muted-foreground">
              音频分析完成
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">连续练习</CardTitle>
            <PlayCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats?.practiceStreak || 0}天</div>
            <p className="text-xs text-muted-foreground">
              保持练习习惯
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>添加新歌曲</CardTitle>
            <CardDescription>
              从YouTube、Bilibili等平台下载，或上传本地音频文件
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link href="/songs/add">
              <Button className="w-full" size="lg">
                <Plus className="mr-2 h-5 w-5" />
                添加歌曲
              </Button>
            </Link>
            <div className="flex gap-2">
              <Link href="/songs/upload" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Upload className="mr-2 h-4 w-4" />
                  上传文件
                </Button>
              </Link>
              <Link href="/songs/import" className="flex-1">
                <Button variant="outline" className="w-full">
                  <Download className="mr-2 h-4 w-4" />
                  导入URL
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>音域测试</CardTitle>
            <CardDescription>
              了解你的音域范围，找到适合的歌曲
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>最低音: C3</span>
                  <span>最高音: C5</span>
                </div>
                <Slider
                  defaultValue={[30, 70]}
                  max={100}
                  step={1}
                  className="mb-4"
                  disabled
                />
              </div>
              <Link href="/vocal-test">
                <Button variant="secondary" className="w-full">
                  开始测试
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 歌曲列表 */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>我的歌曲</CardTitle>
              <CardDescription>
                管理你的歌曲库，查看分析结果
              </CardDescription>
            </div>
            <Link href="/songs">
              <Button variant="outline">查看全部</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {songs.length === 0 ? (
            <div className="text-center py-12">
              <Music className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                还没有添加任何歌曲
              </p>
              <Link href="/songs/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一首歌
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {songs.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => togglePlay(item.song.id)}
                    >
                      {playingSongId === item.song.id ? (
                        <PauseCircle className="h-5 w-5" />
                      ) : (
                        <PlayCircle className="h-5 w-5" />
                      )}
                    </Button>
                    <div>
                      <h4 className="font-medium">{item.song.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {item.song.artist} · {formatDuration(item.song.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.song.isProcessed ? (
                      <Link href={`/songs/${item.song.id}`}>
                        <Button size="sm" variant="outline">
                          查看分析
                        </Button>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={50} className="w-20" />
                        <span className="text-sm text-muted-foreground">
                          处理中
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 