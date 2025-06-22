'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { ArrowLeft, PlayCircle, PauseCircle, Download, Music2, Mic, Clock, Activity, Hash } from 'lucide-react'
import Link from 'next/link'

interface AudioData {
  key?: string
  tempo?: number
  pitchMin?: number
  pitchMax?: number
  pitchAverage?: number
  difficulty?: string
  complexityScore?: number
  vocalDemand?: number
}

interface Song {
  id: string
  title: string
  artist: string
  duration: number
  fileUrl?: string
  isProcessed: boolean
  sourceType?: string
  createdAt: string
  audioData?: AudioData
}

interface LyricsData {
  timeStamps: Array<{
    begin: number
    end: number
    text: string
  }>
  language?: string
  totalFragments?: number
}

export default function SongDetailPage() {
  const params = useParams()
  const songId = params.id as string
  
  const [song, setSong] = useState<Song | null>(null)
  const [lyrics, setLyrics] = useState<LyricsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [selectedLyricIndex, setSelectedLyricIndex] = useState(0)

  useEffect(() => {
    if (songId) {
      fetchSongDetails()
      fetchLyrics()
    }
  }, [songId])

  const fetchSongDetails = async () => {
    try {
      const response = await fetch(`/api/songs?songId=${songId}`)
      if (response.ok) {
        const data = await response.json()
        // 假设返回的是单个歌曲对象
        if (data.data && data.data.length > 0) {
          setSong(data.data[0].song)
        }
      }
    } catch (error) {
      console.error('获取歌曲详情失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLyrics = async () => {
    try {
      const response = await fetch(`/api/lyrics?songId=${songId}`)
      if (response.ok) {
        const data = await response.json()
        if (data.data && data.data.timeStamps) {
          setLyrics(data.data)
        }
      }
    } catch (error) {
      console.error('获取歌词失败:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getDifficultyColor = (difficulty?: string) => {
    switch(difficulty) {
      case 'EASY': return 'text-green-600'
      case 'MEDIUM': return 'text-yellow-600'
      case 'HARD': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getDifficultyText = (difficulty?: string) => {
    switch(difficulty) {
      case 'EASY': return '简单'
      case 'MEDIUM': return '中等'
      case 'HARD': return '困难'
      default: return '未知'
    }
  }

  // 模拟播放进度更新
  useEffect(() => {
    if (isPlaying && song) {
      const interval = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= song.duration) {
            setIsPlaying(false)
            return 0
          }
          return prev + 0.1
        })
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isPlaying, song])

  // 更新当前歌词
  useEffect(() => {
    if (lyrics && lyrics.timeStamps) {
      const currentLyric = lyrics.timeStamps.findIndex(
        (item, index) => {
          const next = lyrics.timeStamps[index + 1]
          return currentTime >= item.begin && (!next || currentTime < next.begin)
        }
      )
      if (currentLyric !== -1) {
        setSelectedLyricIndex(currentLyric)
      }
    }
  }, [currentTime, lyrics])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!song) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center py-12">
          <Music2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">歌曲未找到</p>
          <Link href="/songs">
            <Button className="mt-4">返回歌曲列表</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* 返回按钮 */}
      <Link href="/songs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回歌曲列表
      </Link>

      {/* 歌曲信息头部 */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">{song.title}</h1>
            <p className="text-xl text-muted-foreground mb-4">{song.artist}</p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {formatDuration(song.duration)}
              </span>
              {song.audioData?.tempo && (
                <span className="flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  {song.audioData.tempo} BPM
                </span>
              )}
              {song.audioData?.key && (
                <span className="flex items-center gap-1">
                  <Hash className="h-4 w-4" />
                  {song.audioData.key}调
                </span>
              )}
            </div>
          </div>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 播放器 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* 波形图占位 */}
            <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg flex items-center justify-center">
              <p className="text-muted-foreground">音频波形图</p>
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={song.duration}
                step={0.1}
                onValueChange={(value) => setCurrentTime(value[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(song.duration)}</span>
              </div>
            </div>

            {/* 控制按钮 */}
            <div className="flex justify-center">
              <Button
                size="lg"
                variant="ghost"
                className="rounded-full"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <PauseCircle className="h-12 w-12" />
                ) : (
                  <PlayCircle className="h-12 w-12" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 音频分析 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mic className="h-5 w-5" />
              音频分析
            </CardTitle>
            <CardDescription>
              AI分析的音频特征和演唱难度
            </CardDescription>
          </CardHeader>
          <CardContent>
            {song.isProcessed && song.audioData ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">演唱难度</span>
                  <span className={`font-semibold ${getDifficultyColor(song.audioData.difficulty)}`}>
                    {getDifficultyText(song.audioData.difficulty)}
                  </span>
                </div>

                {song.audioData.complexityScore !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>复杂度评分</span>
                      <span>{song.audioData.complexityScore.toFixed(1)}/10</span>
                    </div>
                    <Progress value={song.audioData.complexityScore * 10} />
                  </div>
                )}

                {song.audioData.vocalDemand !== undefined && (
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>音域要求</span>
                      <span>{song.audioData.vocalDemand.toFixed(1)}/10</span>
                    </div>
                    <Progress value={song.audioData.vocalDemand * 10} />
                  </div>
                )}

                {song.audioData.pitchMin !== undefined && song.audioData.pitchMax !== undefined && (
                  <div>
                    <span className="text-sm font-medium">音高范围</span>
                    <div className="mt-2 p-3 bg-secondary rounded-lg">
                      <div className="flex justify-between text-sm">
                        <span>最低: {song.audioData.pitchMin.toFixed(0)} Hz</span>
                        <span>最高: {song.audioData.pitchMax.toFixed(0)} Hz</span>
                      </div>
                      {song.audioData.pitchAverage !== undefined && (
                        <div className="text-center text-sm text-muted-foreground mt-1">
                          平均: {song.audioData.pitchAverage.toFixed(0)} Hz
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  音频分析尚未完成
                </p>
                <Progress value={50} className="w-32 mx-auto" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 歌词显示 */}
        <Card>
          <CardHeader>
            <CardTitle>歌词</CardTitle>
            <CardDescription>
              {lyrics ? `共 ${lyrics.totalFragments} 句` : '加载中...'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lyrics && lyrics.timeStamps.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {lyrics.timeStamps.map((item, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      index === selectedLyricIndex
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                    onClick={() => setCurrentTime(item.begin)}
                  >
                    <p className={`${
                      index === selectedLyricIndex ? 'font-semibold' : ''
                    }`}>
                      {item.text}
                    </p>
                    <p className={`text-xs ${
                      index === selectedLyricIndex
                        ? 'text-primary-foreground/70'
                        : 'text-muted-foreground'
                    }`}>
                      {formatDuration(item.begin)} - {formatDuration(item.end)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Music2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  暂无歌词
                </p>
                <Button variant="outline" className="mt-4">
                  添加歌词
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 