"use client"

import { Play, Pause, Loader2, Trash2, Music, Home, Mic, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useState, useRef } from "react"
import { useToast } from "@/hooks/use-toast"

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
    if (!confirm("Are you sure you want to delete this song?")) {
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
        title: "Song Deleted",
        description: "Your song has been removed from your library.",
      })

      router.refresh()
    } catch (error) {
      console.error("Error deleting song:", error)
      toast({
        title: "Delete Failed",
        description: "There was an error deleting your song.",
        variant: "destructive",
      })
    } finally {
      setDeletingSongId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">Completed</span>
      case "processing":
        return <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-medium">Processing</span>
      case "failed":
        return <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full font-medium">Failed</span>
      default:
        return <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full font-medium">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-900">My Library</h2>

          {userSongs.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">Your library is empty. Create your first song!</p>
              <Button 
                onClick={() => router.push("/")} 
                className="bg-[#338d97] hover:bg-[#2a7a83] text-white"
              >
                Create Song
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userSongs.map((song) => {
                const isPlaying = playingSongId === song.id
                const isDeleting = deletingSongId === song.id

                return (
                  <div
                    key={song.id}
                    className="bg-white rounded-lg p-4 border border-gray-200 hover:border-[#338d97] transition-colors shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      {song.status === "completed" && song.audio_url ? (
                        <Button
                          onClick={() => handlePlayPause(song.id, song.audio_url!)}
                          size="icon"
                          className="bg-[#338d97] hover:bg-[#2a7a83] text-white rounded-full w-12 h-12 flex-shrink-0 shadow-sm"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                        </Button>
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 border border-gray-200">
                          {song.status === "processing" ? (
                            <Loader2 className="w-5 h-5 animate-spin text-[#338d97]" />
                          ) : (
                            <Music className="w-5 h-5 text-gray-400" />
                          )}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">{song.title || 'Untitled'}</h3>
                        <p className="text-sm text-gray-600 mt-0.5">{song.style}</p>
                        <div className="flex items-center gap-3 mt-1.5">
                          {getStatusBadge(song.status)}
                          <span className="text-xs text-gray-500">
                            {new Date(song.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDelete(song.id)}
                        disabled={isDeleting}
                        variant="ghost"
                        size="icon"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 flex-shrink-0"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
