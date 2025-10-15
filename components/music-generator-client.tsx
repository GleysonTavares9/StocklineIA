'use client'

import { useState } from "react"
import { Bell, HelpCircle, Music, Home, Mic, ImageIcon, Loader2, UploadCloud } from "lucide-react"
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
  } | null
  subscription: {
    plan_name: string;
    generations_used: number;
  } | null;
  unreadNotifications: number
}

export default function MusicGeneratorClient({ user, profile, subscription, unreadNotifications }: MusicGeneratorClientProps) {
  const [activeTab, setActiveTab] = useState("lyrics")
  const [styleText, setStyleText] = useState("")
  const [lyricsText, setLyricsText] = useState("")
  const [descriptionText, setDescriptionText] = useState("")
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
    if (activeTab === 'audio') {
      toast({
        title: "Em Breve!",
        description: "A geração de áudio para áudio é um novo recurso que estará disponível em breve.",
      });
      return;
    }

    if (!subscription) {
      toast({
        title: "Nenhuma assinatura encontrada",
        description: "Você precisa de um plano para gerar músicas. Por favor, visite a página de planos.",
        variant: "destructive",
      });
      router.push('/plans');
      return;
    }

    const { plan_name, generations_used } = subscription;
    const credit_limit = plan_name === 'Plus' ? 50 : 5;

    if (plan_name !== 'Premium' && generations_used >= credit_limit) {
        toast({
            title: "Créditos Esgotados",
            description: `Você atingiu seu limite de ${credit_limit} créditos para o plano ${plan_name}. Por favor, faça um upgrade para obter mais créditos.`,
            variant: "destructive",
        });
        router.push('/plans');
        return;
    }

    const promptText = activeTab === 'lyrics' ? lyricsText : descriptionText;
    if (!styleText && !promptText) {
      toast({
        title: "Informação Faltando",
        description: "Por favor, forneça um estilo de música, letra ou descrição para gerar uma canção.",
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
          customMode: promptText.length > 0,
          tags: styleText || "pop",
          prompt: promptText || styleText,
          instrumental: isInstrumental,
          model: "chirp-v4-5",
          title: "StocklineIA Generated Song",
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Falha ao gerar música")
      }

      const data = await response.json()

      toast({
        title: "Geração de Música Iniciada!",
        description: "Sua música está sendo criada. Isso pode levar alguns minutos.",
      })

      if (data.taskId) {
        pollForCompletion(data.taskId)
      }
    } catch (error) {
      console.error("Erro ao gerar música:", error)
      toast({
        title: "Falha na Geração",
        description: "Ocorreu um erro ao gerar sua música. Por favor, tente novamente.",
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
          await fetch("/api/increment-generations", { method: "POST" });
          toast({
            title: "Música Pronta!",
            description: "Sua música foi gerada com sucesso.",
          })
          router.refresh()
          return
        }

        if (data.status === "failed") {
          throw new Error("Geração falhou")
        }

        attempts++
        if (attempts < maxAttempts) {
          setTimeout(checkStatus, 5000)
        } else {
          throw new Error("Tempo limite de geração atingido")
        }
      } catch (error) {
        console.error("Erro ao verificar status:", error)
        setIsGenerating(false)
        toast({
          title: "Erro",
          description: "Falha ao verificar o status da geração.",
          variant: "destructive",
        })
      }
    }

    checkStatus()
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
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
            className={`text-base font-medium pb-2 relative ${activeTab === "description" ? "text-white" : "text-zinc-400"}`}
          >
            Description
            {activeTab === "description" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff00]" />}
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`text-base font-medium pb-2 relative ${activeTab === "audio" ? "text-white" : "text-zinc-400"}`}
          >
            Audio
            <span className="absolute -top-2 -right-10 bg-[#00ff00] text-black text-[10px] font-bold px-1.5 py-0.5 rounded">
              NEW
            </span>
            {activeTab === "audio" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#00ff00]" />}
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

        {/* Tab-dependent Section */}
        {activeTab === 'lyrics' && (
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
        )}

        {activeTab === 'description' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold">Description</h2>
              <HelpCircle className="w-5 h-5 text-zinc-500" />
            </div>
            <div className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
              <Textarea
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                placeholder="Describe the music you want to create..."
                maxLength={3000}
                className="min-h-[180px] bg-transparent border-none text-white placeholder:text-zinc-600 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm text-zinc-500">{descriptionText.length} / 3000</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold">Audio to Audio</h2>
                  <HelpCircle className="w-5 h-5 text-zinc-500" />
              </div>
              <div className="bg-zinc-900 rounded-2xl p-8 border-2 border-dashed border-zinc-700 flex flex-col items-center justify-center text-center">
                  <UploadCloud className="w-12 h-12 text-zinc-600 mb-4" />
                  <h3 className="font-semibold text-white mb-2">Upload your audio file</h3>
                  <p className="text-zinc-500 text-sm mb-4">Drag and drop or click to upload</p>
                  <Button variant="outline" className="border-zinc-700 text-white hover:bg-zinc-800 bg-transparent">
                      Select File
                  </Button>
                  <p className="text-xs text-zinc-600 mt-8">Audio to Audio generation is a new feature coming soon!</p>
              </div>
          </div>
        )}

        {/* Create Song Button */}
        <Button
          onClick={handleCreateSong}
          disabled={isGenerating || activeTab === 'audio'}
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
    </div>
  )
}
