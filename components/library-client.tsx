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
        return <span className="text-xs bg-[#00ff00] text-black px-2 py-1 rounded-full">Completed</span>
      case "processing":
        return <span className="text-xs bg-yellow-500 text-black px-2 py-1 rounded-full">Processing</span>
      case "failed":
        return <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">Failed</span>
      default:
        return <span className="text-xs bg-zinc-600 text-white px-2 py-1 rounded-full">{status}</span>
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">My Library</h2>

        {userSongs.length === 0 ? (
          <div className="text-center py-12 text-zinc-400">
            <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Your library is empty. Create your first song!</p>
            <Button onClick={() => router.push("/")} className="mt-4 bg-[#00ff00] hover:bg-[#00dd00] text-black">
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
                  className="bg-zinc-900 rounded-xl p-4 border border-zinc-800 hover:border-[#00ff00] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {song.status === "completed" && song.audio_url ? (
                      <Button
                        onClick={() => handlePlayPause(song.id, song.audio_url!)}
                        size="icon"
                        className="bg-[#00ff00] hover:bg-[#00dd00] text-black rounded-full w-12 h-12 flex-shrink-0"
                      >
                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                      </Button>
                    ) : (
                      <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center flex-shrink-0">
                        {song.status === "processing" ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#00ff00]" />
                        ) : (
                          <Music className="w-5 h-5 text-zinc-600" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-white truncate">{song.title}</h3>
                      <p className="text-xs text-zinc-500 mt-1">{song.style}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {getStatusBadge(song.status)}
                        <span className="text-xs text-zinc-500">{new Date(song.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDelete(song.id)}
                      disabled={isDeleting}
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-500/10 flex-shrink-0"
                    >
                      {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
