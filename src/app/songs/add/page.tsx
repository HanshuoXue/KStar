'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { ArrowLeft, Link as LinkIcon, Upload, Music, Check, AlertCircle } from 'lucide-react'
import Link from 'next/link'

type TabType = 'url' | 'upload'

interface DownloadTask {
  id: string
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  songId?: string
  errorMessage?: string
}

export default function AddSongPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<TabType>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [task, setTask] = useState<DownloadTask | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!url.trim()) return

    setLoading(true)
    setError(null)
    setTask(null)

    try {
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '创建下载任务失败')
      }

      if (data.success && data.data.taskId) {
        // 开始轮询任务状态
        pollTaskStatus(data.data.taskId)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误')
      setLoading(false)
    }
  }

  const pollTaskStatus = async (taskId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/download?taskId=${taskId}`)
        const data = await response.json()

        if (data.success && data.data) {
          const taskData = data.data
          setTask({
            id: taskData.id,
            status: taskData.status,
            progress: taskData.progress || 0,
            songId: taskData.resultSongId,
            errorMessage: taskData.errorMessage
          })

          // 任务完成或失败时停止轮询
          if (taskData.status === 'COMPLETED' || taskData.status === 'FAILED') {
            clearInterval(interval)
            setLoading(false)

            if (taskData.status === 'COMPLETED' && taskData.resultSongId) {
              // 3秒后跳转到歌曲详情页
              setTimeout(() => {
                router.push(`/songs/${taskData.resultSongId}`)
              }, 3000)
            }
          }
        }
      } catch (err) {
        console.error('轮询任务状态失败:', err)
      }
    }, 2000) // 每2秒查询一次

    // 5分钟后自动停止轮询
    setTimeout(() => {
      clearInterval(interval)
      setLoading(false)
    }, 300000)
  }

  const getSupportedPlatforms = () => [
    { name: 'YouTube', icon: '🎥', example: 'https://youtube.com/watch?v=...' },
    { name: 'Bilibili', icon: '📺', example: 'https://bilibili.com/video/BV...' },
    { name: '网易云音乐', icon: '🎵', example: 'https://music.163.com/song?id=...' },
    { name: 'QQ音乐', icon: '🎶', example: 'https://y.qq.com/n/ryqq/songDetail/...' },
    { name: 'Jamendo', icon: '🎸', example: 'https://jamendo.com/track/...' },
  ]

  const getTestExamples = () => [
    { title: 'Summer Vibes', url: 'https://www.jamendo.com/track/1781603/summer-vibes' },
    { title: 'Cinematic Documentary', url: 'https://www.jamendo.com/track/1972914/cinematic-documentary' },
    { title: 'Inspiring Background', url: 'https://www.jamendo.com/track/1884133/inspiring-cinematic-background' },
  ]

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* 返回按钮 */}
      <Link href="/songs" className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" />
        返回歌曲列表
      </Link>

      {/* 页面标题 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">添加新歌曲</h1>
        <p className="text-muted-foreground">
          从支持的平台导入音乐，或上传本地文件
        </p>
      </div>

      {/* 选项卡 */}
      <div className="flex gap-4 mb-6">
        <Button
          variant={activeTab === 'url' ? 'default' : 'outline'}
          onClick={() => setActiveTab('url')}
          className="flex-1"
        >
          <LinkIcon className="mr-2 h-4 w-4" />
          URL导入
        </Button>
        <Button
          variant={activeTab === 'upload' ? 'default' : 'outline'}
          onClick={() => setActiveTab('upload')}
          className="flex-1"
        >
          <Upload className="mr-2 h-4 w-4" />
          上传文件
        </Button>
      </div>

      {/* URL导入 */}
      {activeTab === 'url' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>从URL导入</CardTitle>
              <CardDescription>
                输入音乐或视频链接，系统将自动下载音频
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUrlSubmit} className="space-y-4">
                <div>
                  <Input
                    placeholder="粘贴音乐链接..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    disabled={loading}
                    className="text-lg"
                  />
                </div>
                
                {error && (
                  <div className="flex items-center gap-2 text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}

                {task && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {task.status === 'PENDING' && '准备下载...'}
                        {task.status === 'PROCESSING' && '下载中...'}
                        {task.status === 'COMPLETED' && '下载完成！'}
                        {task.status === 'FAILED' && '下载失败'}
                      </span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} />
                    
                    {task.status === 'COMPLETED' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">成功！正在跳转...</span>
                      </div>
                    )}
                    
                    {task.status === 'FAILED' && task.errorMessage && (
                      <p className="text-sm text-destructive">{task.errorMessage}</p>
                    )}
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={loading || !url.trim()}
                  size="lg"
                >
                  {loading ? '处理中...' : '开始导入'}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* 支持的平台 */}
          <Card>
            <CardHeader>
              <CardTitle>支持的平台</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {getSupportedPlatforms().map((platform) => (
                  <div key={platform.name} className="flex items-start gap-3">
                    <span className="text-2xl">{platform.icon}</span>
                    <div>
                      <p className="font-medium">{platform.name}</p>
                      <p className="text-sm text-muted-foreground">{platform.example}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 测试示例 */}
          <Card>
            <CardHeader>
              <CardTitle>免费音乐示例</CardTitle>
              <CardDescription>
                使用Jamendo的免费音乐进行测试
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {getTestExamples().map((example) => (
                  <div 
                    key={example.url}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setUrl(example.url)}
                  >
                    <div className="flex items-center gap-3">
                      <Music className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{example.title}</span>
                    </div>
                    <Button size="sm" variant="ghost">
                      使用此链接
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 文件上传 */}
      {activeTab === 'upload' && (
        <Card>
          <CardHeader>
            <CardTitle>上传音频文件</CardTitle>
            <CardDescription>
              支持 MP3, WAV, FLAC 等常见音频格式
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed rounded-lg p-12 text-center">
              <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                拖放文件到此处，或点击选择文件
              </p>
              <Button variant="secondary">
                选择文件
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                最大文件大小: 100MB
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 