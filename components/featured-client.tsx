"use client"

import { Bell, Music, Home, Mic, ImageIcon, Play, Pause } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useState, useRef } from "react"

interface FeaturedClientProps {
  user: User
  profile: {
    id: string
    email: string
    display_name: string | null
    credits: number
  } | null
  unreadNotifications: number
  featuredSongs: Array<{
    id: string
    title: string
    style: string
    audio_url: string
    created_at: string
    profiles: {
      display_name: string | null
      email: string
    }
  }>
}

export default function FeaturedClient({ user, profile, unreadNotifications, featuredSongs }: FeaturedClientProps) {
  const router = useRouter()
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handlePlayPause = (songId: string, audioUrl: string) => {
    if (playingSongId === songId) {
      audioRef.current?.pause()
      setPlayingSongId(null)
    } else {
      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      audioRef.current.onended = () => setPlayingSongId(null)
      setPlayingSongId(songId)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Músicas em Destaque</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-full">
              <div className="w-2 h-2 bg-[#338d97] rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">{profile?.credits || 0} créditos</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto max-w-4xl mx-auto w-full">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">Músicas em Destaque</h2>
          <p className="text-gray-600 mb-6">Confira as últimas criações da nossa comunidade</p>

          {featuredSongs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-xl">
              <Music className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Nenhuma música em destaque ainda.</p>
              <p className="text-sm text-gray-400 mt-1">Seja o primeiro a criar uma música incrível!</p>
              <Button 
                onClick={() => router.push('/')} 
                className="mt-4 bg-[#338d97] hover:bg-[#2a7a83] text-white"
              >
                Criar Música
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {featuredSongs.map((song) => {
                const artistName = song.profiles.display_name || song.profiles.email.split("@")[0]
                const isPlaying = playingSongId === song.id
                const createdAt = new Date(song.created_at)
                const formattedDate = createdAt.toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric'
                })

                return (
                  <div
                    key={song.id}
                    className="bg-white rounded-xl p-4 border border-gray-200 hover:border-[#338d97] transition-all hover:shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <Button
                        onClick={() => handlePlayPause(song.id, song.audio_url)}
                        size="icon"
                        className={`rounded-full w-12 h-12 flex-shrink-0 ${
                          isPlaying 
                            ? 'bg-[#2a7a83] hover:bg-[#338d97]' 
                            : 'bg-[#338d97] hover:bg-[#2a7a83]'
                        }`}
                      >
                        {isPlaying ? (
                          <Pause className="w-5 h-5 text-white" />
                        ) : (
                          <Play className="w-5 h-5 ml-0.5 text-white" />
                        )}
                      </Button>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{song.title || 'Sem título'}</h3>
                        <p className="text-sm text-gray-600 truncate">
                          <span className="text-gray-500">por</span> {artistName}
                        </p>
                        {song.style && (
                          <div className="mt-1">
                            <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                              {song.style}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      <div className="text-right">
                        <div className="text-xs text-gray-500 whitespace-nowrap">{formattedDate}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {createdAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
              
              <div className="mt-6 text-center">
                <Button 
                  variant="outline" 
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={() => router.push('/')}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Criar minha própria música
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
