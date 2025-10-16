"use client"

import { Play, Pause, Loader2, Trash2, Music, Home, Mic, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"
import { ptBR } from "@/lib/translations"

interface LibraryClientProps {
  user: User
  profile: {
    id: string
    email: string
    display_name: string | null
    credits: number
  } | null
  unreadNotifications: number
  userSongs: Array<{
    id: string
    title: string
    style: string
    audio_url: string | null
    status: string
    created_at: string
  }>
}

export default function LibraryClient({ user, profile, unreadNotifications, userSongs }: LibraryClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [playingSongId, setPlayingSongId] = useState<string | null>(null)
  const [deletingSongId, setDeletingSongId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const t = ptBR.library


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

  const handleDelete = async (songId: string) => {
    if (!confirm(t.table.confirmDelete)) {
      return
    }

    setDeletingSongId(songId)

    try {
      const response = await fetch(`/api/songs/${songId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete song")
      }

      toast({
        title: t.table.deleteSuccess,
        description: "",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting song:", error)
      toast({
        title: t.table.deleteError,
        description: "",
        variant: "destructive",
      })
    } finally {
      setDeletingSongId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusText = t.table.statuses[status as keyof typeof t.table.statuses] || status
    
    switch (status) {
      case "completed":
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">{statusText}</span>
      case "processing":
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">{statusText}</span>
      case "failed":
        return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">{statusText}</span>
      default:
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium">{statusText}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">{t.title}</h2>

          {userSongs.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-200">
              <Music className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">{t.emptyState.title}</h3>
              <p className="text-gray-500 mb-6">{t.emptyState.description}</p>
              <Button 
                onClick={() => router.push('/')}
                className="bg-[#338d97] hover:bg-[#2a7a83] text-white"
              >
                {t.emptyState.createButton}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {userSongs.map((song) => (
                <div key={song.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:border-[#338d97] transition-colors">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900">{song.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{song.style}</p>
                      <div className="mt-2 flex items-center space-x-2">
                        {getStatusBadge(song.status)}
                        <span className="text-xs text-gray-400">
                          {new Date(song.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {song.audio_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayPause(song.id, song.audio_url!)}
                          className="text-gray-500 hover:text-[#338d97]"
                          aria-label={playingSongId === song.id ? t.table.pause : t.table.play}
                        >
                          {playingSongId === song.id ? (
                            <Pause className="h-5 w-5" />
                          ) : (
                            <Play className="h-5 w-5" />
                          )}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(song.id)}
                        className="text-gray-500 hover:text-red-500"
                        disabled={deletingSongId === song.id}
                        aria-label={t.table.delete}
                      >
                        {deletingSongId === song.id ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
