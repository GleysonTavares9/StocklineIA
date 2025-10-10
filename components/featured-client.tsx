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

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const avatarInitial = displayName[0]?.toUpperCase() || "U"

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
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#00ff00] rounded-lg flex items-center justify-center">
            <Music className="w-5 h-5 text-black" />
          </div>
          <h1 className="text-xl font-bold">StocklineIA</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-zinc-400">
            Credits: <span className="text-[#00ff00]">{profile?.credits || 0}</span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-zinc-800 relative"
            onClick={() => router.push("/notifications")}
          >
            <Bell className="w-5 h-5" />
            {unreadNotifications > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadNotifications}
              </span>
            )}
          </Button>
          <button onClick={() => router.push("/profile")}>
            <Avatar className="w-10 h-10 bg-zinc-700 cursor-pointer hover:ring-2 hover:ring-[#00ff00] transition-all">
              <AvatarFallback className="bg-[#00ff00] text-black font-bold">{avatarInitial}</AvatarFallback>
            </Avatar>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">Featured Songs</h2>

        {featuredSongs.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <Music className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>No featured songs yet. Be the first to create one!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {featuredSongs.map((song) => {
              const artistName = song.profiles.display_name || song.profiles.email.split("@")[0]
              const isPlaying = playingSongId === song.id

              return (
                <div
                  key={song.id}
                  className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-[#00ff00] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={() => handlePlayPause(song.id, song.audio_url)}
                      size="icon"
                      className="bg-[#00ff00] hover:bg-[#00dd00] text-black rounded-full w-12 h-12 flex-shrink-0"
                    >
                      {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{song.title}</h3>
                      <p className="text-sm text-zinc-400 truncate">by {artistName}</p>
                      <p className="text-xs text-zinc-500 mt-1">{song.style}</p>
                    </div>
                    <div className="text-xs text-zinc-500">{new Date(song.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-4 py-3 border-t border-zinc-800 bg-black">
        <button className="flex flex-col items-center gap-1 text-[#00ff00]">
          <Home className="w-6 h-6" />
          <span className="text-xs font-medium">Featured</span>
        </button>
        <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 text-zinc-400">
          <Music className="w-6 h-6" />
          <span className="text-xs">AI Music</span>
        </button>
        <button onClick={() => router.push("/ai-cover")} className="flex flex-col items-center gap-1 text-zinc-400">
          <Mic className="w-6 h-6" />
          <span className="text-xs">AI Cover</span>
        </button>
        <button onClick={() => router.push("/library")} className="flex flex-col items-center gap-1 text-zinc-400">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs">Library</span>
        </button>
      </nav>
    </div>
  )
}
