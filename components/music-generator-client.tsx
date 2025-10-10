"use client"

import { useState } from "react"
import { Bell, HelpCircle, Music, Home, Mic, ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"

const GENRE_OPTIONS = ["Pop", "Rap", "Bass", "Rock", "Jazz", "Electronic", "Classical", "Hip Hop"]

interface MusicGeneratorClientProps {
  user: User
  profile: {
    id: string
    email: string
    display_name: string | null
    credits: number
  } | null
  unreadNotifications: number
}

export default function MusicGeneratorClient({ user, profile, unreadNotifications }: MusicGeneratorClientProps) {
  const [activeTab, setActiveTab] = useState("lyrics")
  const [styleText, setStyleText] = useState("")
  const [lyricsText, setLyricsText] = useState("")
  const [isInstrumental, setIsInstrumental] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showMoreGenres, setShowMoreGenres] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleGenreClick = (genre: string) => {
    const currentStyles = styleText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    if (!currentStyles.includes(genre)) {
      setStyleText(currentStyles.length > 0 ? `${styleText}, ${genre}` : genre)
    }
  }

  const handleCreateSong = async () => {
    if (!styleText && !lyricsText) {
      toast({
        title: "Missing Information",
        description: "Please provide either a music style or lyrics to generate a song.",
        variant: "destructive",
      })
      return
    }

    if (!profile || profile.credits < 1) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 1 credit to generate a song.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const response = await fetch("/api/generate-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customMode: lyricsText.length > 0,
          tags: styleText || "pop",
          prompt: lyricsText || styleText,
          instrumental: isInstrumental,
          model: "chirp-v4-5",
          title: "StocklineIA Generated Song",
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate music")
      }

      const data = await response.json()

      toast({
        title: "Song Generation Started!",
        description: "Your song is being created. This may take a few minutes.",
      })

      // Poll for completion
      if (data.taskId) {
        pollForCompletion(data.taskId)
      }
    } catch (error) {
      console.error("Error generating song:", error)
      toast({
        title: "Generation Failed",
        description: "There was an error generating your song. Please try again.",
        variant: "destructive",
      })
      setIsGenerating(false)
    }
  }

  const pollForCompletion = async (taskId: string) => {
    const maxAttempts = 60
    let attempts = 0

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/check-status?taskId=${taskId}&userId=${user.id}`)
        const data = await response.json()

        if (data.status === "completed" && data.audioUrl) {
          setIsGenerating(false)
          toast({
            title: "Song Ready!",
            description: "Your song has been generated successfully.",
          })
          router.refresh()
          return
        }

        if (data.status === "failed") {
          throw new Error("Generation failed")
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000)
        } else {
          throw new Error("Generation timeout")
        }
      } catch (error) {
        console.error("Error checking status:", error)
        setIsGenerating(false)
        toast({
          title: "Error",
          description: "Failed to check generation status.",
          variant: "destructive",
        })
      }
    }

    checkStatus()
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const avatarInitial = displayName[0]?.toUpperCase() || "U"

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

      {/* Navigation Tabs */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-800">
        <div className="flex gap-6">
          <button
            onClick={() => setActiveTab("lyrics")}
            className={`text-base font-medium pb-2 relative ${activeTab === "lyrics" ? "text-white" : "text-zinc-400"}`}
          >
            Lyrics
            {activeTab === "lyrics" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff00]" />}
          </button>
          <button
            onClick={() => setActiveTab("description")}
            className={`text-base font-medium ${activeTab === "description" ? "text-white" : "text-zinc-400"}`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`text-base font-medium relative ${activeTab === "audio" ? "text-white" : "text-zinc-400"}`}
          >
            Audio
            <span className="absolute -top-2 -right-10 bg-[#00ff00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
              NEW
            </span>
          </button>
        </div>
        <button className="flex items-center gap-2 px-4 py-1.5 border-2 border-[#00ff00] rounded-full text-sm">
          V1.0
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 px-4 py-6 overflow-y-auto">
        {/* Style of Music Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold">Style of Music</h2>
              <HelpCircle className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm">Instrumental</span>
              <Switch
                checked={isInstrumental}
                onCheckedChange={setIsInstrumental}
                className="data-[state=checked]:bg-[#00ff00]"
              />
            </div>
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <Textarea
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              placeholder="Enter style of your music"
              maxLength={200}
              className="min-h-[120px] bg-transparent border-none text-white placeholder:text-zinc-600 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex items-center justify-between mt-2">
              <div className="flex gap-2 flex-wrap">
                {(showMoreGenres ? GENRE_OPTIONS : GENRE_OPTIONS.slice(0, 3)).map((genre) => (
                  <Button
                    key={genre}
                    onClick={() => handleGenreClick(genre)}
                    variant="secondary"
                    size="sm"
                    className="bg-zinc-800 hover:bg-zinc-700 text-white rounded-full"
                  >
                    {genre}
                  </Button>
                ))}
                <Button
                  onClick={() => setShowMoreGenres(!showMoreGenres)}
                  variant="ghost"
                  size="sm"
                  className="text-[#00ff00] hover:bg-zinc-800 rounded-full"
                >
                  {showMoreGenres ? "Less" : "More"} &gt;
                </Button>
              </div>
              <span className="text-sm text-zinc-500">{styleText.length} / 200</span>
            </div>
          </div>
        </div>

        {/* Lyrics Section */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold">Lyrics</h2>
            <HelpCircle className="w-5 h-5 text-zinc-500" />
          </div>

          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <Textarea
              value={lyricsText}
              onChange={(e) => setLyricsText(e.target.value)}
              placeholder="Enter lyrics of your music or try to get inspired"
              maxLength={3000}
              className="min-h-[180px] bg-transparent border-none text-white placeholder:text-zinc-600 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex justify-end mt-2">
              <span className="text-sm text-zinc-500">{lyricsText.length} / 3000</span>
            </div>
          </div>
        </div>

        {/* Create Song Button */}
        <Button
          onClick={handleCreateSong}
          disabled={isGenerating}
          className="w-full bg-[#00ff00] hover:bg-[#00dd00] text-black font-bold text-lg py-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Generating Song...
            </>
          ) : (
            <>
              <Music className="w-6 h-6 mr-2" />
              Create Song
            </>
          )}
        </Button>
      </main>

      {/* Bottom Navigation */}
      <nav className="flex items-center justify-around px-4 py-3 border-t border-zinc-800 bg-black">
        <button onClick={() => router.push("/featured")} className="flex flex-col items-center gap-1 text-zinc-400">
          <Home className="w-6 h-6" />
          <span className="text-xs">Featured</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#00ff00]">
          <div className="w-6 h-6 relative">
            <Music className="w-6 h-6" />
          </div>
          <span className="text-xs font-medium">AI Music</span>
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
