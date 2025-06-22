'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Music, Search, Filter, Plus, PlayCircle, PauseCircle, Download, Trash2, MoreVertical, Mic, Clock } from 'lucide-react'
import Link from 'next/link'
import { Progress } from '@/components/ui/progress'

interface Song {
  id: string
  song: {
    id: string
    title: string
    artist: string
    duration: number
    fileUrl?: string
    isProcessed: boolean
    sourceType?: string
    createdAt: string
    audioData?: {
      tempo?: number
      key?: string
      difficulty?: string
    }
  }
  status: string
  createdAt: string
}

export default function SongsPage() {
  const [songs, setSongs] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'processed' | 'processing'>('all')

  useEffect(() => {
    fetchSongs()
  }, [])

  const fetchSongs = async () => {
    try {
      const response = await fetch('/api/songs')
      if (response.ok) {
        const data = await response.json()
        setSongs(data.data)
      }
    } catch (error) {
      console.error('获取歌曲失败:', error)
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

  const getSourceIcon = (sourceType?: string) => {
    switch(sourceType) {
      case 'YOUTUBE': return '🎥'
      case 'BILIBILI': return '📺'
      case 'NETEASE': return '🎵'
      case 'QQ': return '🎶'
      case 'JAMENDO': return '🎸'
      default: return '📁'
    }
  }

  const filteredSongs = songs.filter(item => {
    const matchesSearch = item.song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         item.song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filterType === 'all' ||
                         (filterType === 'processed' && item.song.isProcessed) ||
                         (filterType === 'processing' && !item.song.isProcessed)
    
    return matchesSearch && matchesFilter
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">我的歌曲库</h1>
        <p className="text-muted-foreground">
          管理你的音乐收藏，查看分析结果
        </p>
      </div>

      {/* 操作栏 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="搜索歌曲或艺术家..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>筛选</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setFilterType('all')}>
                全部歌曲
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('processed')}>
                已分析
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterType('processing')}>
                处理中
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <Link href="/songs/add">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            添加歌曲
          </Button>
        </Link>
      </div>

      {/* 歌曲统计 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">总歌曲数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{songs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">已分析</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {songs.filter(s => s.song.isProcessed).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">总时长</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(songs.reduce((acc, s) => acc + s.song.duration, 0))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 歌曲列表 */}
      {filteredSongs.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Music className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {searchQuery ? '没有找到匹配的歌曲' : '还没有添加任何歌曲'}
            </p>
            {!searchQuery && (
              <Link href="/songs/add">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  添加第一首歌
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredSongs.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4 flex-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => togglePlay(item.song.id)}
                      className="shrink-0"
                    >
                      {playingSongId === item.song.id ? (
                        <PauseCircle className="h-6 w-6" />
                      ) : (
                        <PlayCircle className="h-6 w-6" />
                      )}
                    </Button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">{item.song.title}</h3>
                      <p className="text-muted-foreground truncate">{item.song.artist}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(item.song.duration)}
                        </span>
                        <span>{getSourceIcon(item.song.sourceType)} {item.song.sourceType}</span>
                        {item.song.audioData && (
                          <>
                            {item.song.audioData.tempo && (
                              <span>🎵 {item.song.audioData.tempo} BPM</span>
                            )}
                            {item.song.audioData.key && (
                              <span>🎹 {item.song.audioData.key}</span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.song.isProcessed ? (
                      <>
                        <Link href={`/songs/${item.song.id}`}>
                          <Button size="sm" variant="outline">
                            <Mic className="mr-2 h-4 w-4" />
                            查看分析
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Download className="mr-2 h-4 w-4" />
                              下载
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Progress value={50} className="w-24" />
                        <span className="text-sm text-muted-foreground">
                          处理中
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 