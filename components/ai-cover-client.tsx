"use client"

import { Bell, Music, Home, Mic, ImageIcon, Upload, Loader2 } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"

interface AICoverClientProps {
  user: User
  profile: {
    id: string
    email: string
    display_name: string | null
    credits: number
  } | null
  unreadNotifications: number
}

export default function AICoverClient({ user, profile, unreadNotifications }: AICoverClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [songUrl, setSongUrl] = useState("")
  const [coverStyle, setCoverStyle] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const avatarInitial = displayName[0]?.toUpperCase() || "U"

  const handleCreateCover = async () => {
    if (!songUrl) {
      toast({
        title: "Missing Information",
        description: "Please provide a song URL to create a cover.",
        variant: "destructive",
      })
      return
    }

    if (!profile || profile.credits < 2) {
      toast({
        title: "Insufficient Credits",
        description: "You need at least 2 credits to generate an AI cover.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    // Simulate cover generation (you would integrate with actual API)
    setTimeout(() => {
      setIsGenerating(false)
      toast({
        title: "Coming Soon!",
        description: "AI Cover generation will be available in the next update.",
      })
    }, 2000)
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
        <h2 className="text-2xl font-bold mb-2">AI Cover</h2>
        <p className="text-zinc-400 mb-6">Create AI-powered covers of your favorite songs</p>

        {/* Song URL Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Song URL or Upload</label>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <input
              type="text"
              value={songUrl}
              onChange={(e) => setSongUrl(e.target.value)}
              placeholder="Paste song URL (YouTube, Spotify, etc.)"
              className="w-full bg-transparent border-none text-white placeholder:text-zinc-600 focus:outline-none"
            />
          </div>
          <Button variant="outline" className="mt-3 w-full border-zinc-700 text-white hover:bg-zinc-800 bg-transparent">
            <Upload className="w-4 h-4 mr-2" />
            Or Upload Audio File
          </Button>
        </div>

        {/* Cover Style */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Cover Style (Optional)</label>
          <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
            <Textarea
              value={coverStyle}
              onChange={(e) => setCoverStyle(e.target.value)}
              placeholder="Describe the style you want (e.g., acoustic, rock, jazz, electronic)"
              maxLength={200}
              className="min-h-[100px] bg-transparent border-none text-white placeholder:text-zinc-600 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <div className="flex justify-end mt-2">
              <span className="text-sm text-zinc-500">{coverStyle.length} / 200</span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <h3 className="font-semibold mb-2 text-[#00ff00]">How it works:</h3>
          <ul className="text-sm text-zinc-400 space-y-1">
            <li>• Provide a song URL or upload an audio file</li>
            <li>• Optionally describe the style you want</li>
            <li>• AI will generate a cover in your chosen style</li>
            <li>• Costs 2 credits per cover generation</li>
          </ul>
        </div>

        {/* Create Cover Button */}
        <Button
          onClick={handleCreateCover}
          disabled={isGenerating}
          className="w-full bg-[#00ff00] hover:bg-[#00dd00] text-black font-bold text-lg py-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Creating Cover...
            </>
          ) : (
            <>
              <Mic className="w-6 h-6 mr-2" />
              Create AI Cover
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
        <button onClick={() => router.push("/")} className="flex flex-col items-center gap-1 text-zinc-400">
          <Music className="w-6 h-6" />
          <span className="text-xs">AI Music</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-[#00ff00]">
          <Mic className="w-6 h-6" />
          <span className="text-xs font-medium">AI Cover</span>
        </button>
        <button onClick={() => router.push("/library")} className="flex flex-col items-center gap-1 text-zinc-400">
          <ImageIcon className="w-6 h-6" />
          <span className="text-xs">Library</span>
        </button>
      </nav>
    </div>
  )
}
