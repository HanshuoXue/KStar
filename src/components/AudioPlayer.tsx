'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { PlayCircle, PauseCircle, Volume2, VolumeX, SkipBack, SkipForward } from 'lucide-react'

interface AudioPlayerProps {
  src?: string
  title?: string
  artist?: string
  onTimeUpdate?: (currentTime: number) => void
  onPlayStateChange?: (isPlaying: boolean) => void
}

export function AudioPlayer({ 
  src, 
  title, 
  artist, 
  onTimeUpdate,
  onPlayStateChange 
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
      onTimeUpdate?.(audio.currentTime)
    }
    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }
    const handleEnded = () => {
      setIsPlaying(false)
      onPlayStateChange?.(false)
    }

    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [onTimeUpdate, onPlayStateChange])

  const togglePlay = async () => {
    if (!audioRef.current || !src) return

    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
        onPlayStateChange?.(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
        onPlayStateChange?.(true)
      }
    } catch (error) {
      console.error('播放失败:', error)
    }
  }

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return
    audioRef.current.currentTime = value[0]
    setCurrentTime(value[0])
  }

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return
    const newVolume = value[0]
    audioRef.current.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    if (!audioRef.current) return
    if (isMuted) {
      audioRef.current.volume = volume || 0.5
      setIsMuted(false)
    } else {
      audioRef.current.volume = 0
      setIsMuted(true)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="w-full space-y-4">
      <audio ref={audioRef} src={src} preload="metadata" />
      
      {/* 歌曲信息 */}
      {(title || artist) && (
        <div className="text-center">
          {title && <h3 className="font-semibold">{title}</h3>}
          {artist && <p className="text-sm text-muted-foreground">{artist}</p>}
        </div>
      )}

      {/* 进度条 */}
      <div className="space-y-2">
        <Slider
          value={[currentTime]}
          max={duration || 100}
          step={0.1}
          onValueChange={handleSeek}
          disabled={!src || isLoading}
          className="cursor-pointer"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* 控制按钮 */}
      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="ghost"
          disabled={!src}
          className="h-8 w-8"
        >
          <SkipBack className="h-4 w-4" />
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={togglePlay}
          disabled={!src || isLoading}
          className="h-12 w-12"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          ) : isPlaying ? (
            <PauseCircle className="h-8 w-8" />
          ) : (
            <PlayCircle className="h-8 w-8" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          disabled={!src}
          className="h-8 w-8"
        >
          <SkipForward className="h-4 w-4" />
        </Button>
      </div>

      {/* 音量控制 */}
      <div className="flex items-center gap-2 max-w-xs mx-auto">
        <Button
          size="icon"
          variant="ghost"
          onClick={toggleMute}
          className="h-8 w-8 shrink-0"
        >
          {isMuted ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
        <Slider
          value={[isMuted ? 0 : volume]}
          max={1}
          step={0.01}
          onValueChange={handleVolumeChange}
          className="flex-1"
        />
      </div>
    </div>
  )
} 