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

  const generateLyrics = async () => {
    if (!descriptionText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o tema da letra.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/generate-lyrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          theme: descriptionText,
          style: styleText,
          userId: user.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao gerar letra");
      }

      setLyricsText(data.lyrics);
      
      toast({
        title: "Letra gerada com sucesso!",
        description: "Agora você pode revisar e editar a letra antes de gerar a música.",
      });
    } catch (error) {
      console.error("Erro ao gerar letra:", error);
      toast({
        title: "Erro ao gerar letra",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateSong = async () => {
    // Verificar se o usuário tem uma assinatura ou se ainda tem gerações gratuitas disponíveis
    if (!subscription) {
      // Verificar se o usuário já usou suas 2 gerações gratuitas
      const freeGenerationsResponse = await fetch("/api/check-free-generations", {
        method: "GET",
      });
      
      const freeGenerationsData = await freeGenerationsResponse.json();
      
      if (freeGenerationsData.used >= 2) {
        toast({
          title: "Limite de gerações gratuitas atingido",
          description: "Você já usou suas 2 gerações gratuitas. Assine um plano para gerar mais músicas.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              onClick={() => router.push("/plans")}
              className="ml-2"
            >
              Ver Planos
            </Button>
          ),
        });
        return;
      }
    } else if (subscription.generations_used >= 10) {
      toast({
        title: "Limite de gerações atingido",
        description: "Você atingiu o limite de gerações do seu plano.",
        variant: "destructive",
        action: (
          <Button
            variant="outline"
            onClick={() => router.push("/billing")}
            className="ml-2"
          >
            Atualizar Plano
          </Button>
        ),
      });
      return;
    }

    if (!lyricsText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira ou gere uma letra para a música.",
        variant: "destructive",
      });
      return;
    }
    
    if (!descriptionText.trim() || descriptionText.trim().length < 10) {
      toast({
        title: "Erro na descrição",
        description: "O campo de descrição é obrigatório e deve ter pelo menos 10 caracteres.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await fetch("/api/suno/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: descriptionText,
          lyrics: lyricsText,
          style: styleText,
          isInstrumental,
          userId: user.id,
        }),
      });

      const data = await response.json();
console.log('API Response:', { status: response.status, data });

if (!response.ok) {
  // Handle profile-specific errors
  if (data.error && data.error.includes("perfil")) {
    toast({
      title: "Erro de perfil",
      description: "Não foi possível carregar seu perfil. Por favor, atualize a página e tente novamente.",
      variant: "destructive",
    });
    return;
  }
  
  // Log detailed error information
  console.error('API Error Details:', {
    status: response.status,
    statusText: response.statusText,
    error: data.error,
    data
  });
  
  throw new Error(data.error || `Falha ao gerar música (${response.status} ${response.statusText})`);
}

      toast({
        title: "Música gerada com sucesso!",
        description: "Sua música está sendo processada e estará disponível em breve.",
      });

      // Atualizar o contador de gerações
      if (subscription) {
        await fetch("/api/increment-generations", { method: "POST" });
      }
      router.refresh();
    } catch (error) {
      console.error("Erro ao gerar música:", error);
      toast({
        title: "Erro ao gerar música",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const pollForCompletion = async (taskId: string) => {
    const maxAttempts = 60
    let attempts = 0

    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/check-status?taskId=${taskId}&userId=${user.id}`)
        const data = await response.json()

        if (data.status === "completed" && data.audioUrl) {
          setIsGenerating(false)
          // Apenas incrementa o contador para usuários com assinatura
          if (subscription) {
            await fetch("/api/increment-generations", { method: "POST" });
          }
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
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      {/* Navigation Tabs */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100">
        <div className="flex gap-8">
          <button
            onClick={() => setActiveTab("lyrics")}
            className={`text-sm font-medium py-2 px-1 border-b-2 ${
              activeTab === "lyrics" 
                ? "border-[#338d97] text-gray-600" 
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            } transition-colors`}
          >
            Letras
          </button>
          <button
            onClick={() => setActiveTab("description")}
            className={`text-sm font-medium py-2 px-1 border-b-2 ${
              activeTab === "description" 
                ? "border-[#338d97] text-gray-600" 
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            } transition-colors`}
          >
            Descrição
          </button>
          <button
            onClick={() => setActiveTab("audio")}
            className={`text-sm font-medium py-2 px-1 border-b-2 ${
              activeTab === "audio" 
                ? "border-[#338d97] text-gray-600" 
                : "border-transparent text-gray-400 hover:text-gray-600 hover:border-gray-200"
            } transition-colors relative`}
          >
            <div className="flex items-center">
              Áudio
              <span className="ml-2 bg-[#338d97] text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                NOVO
              </span>
            </div>
          </button>
        </div>
        <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-500 border border-gray-300 rounded-full hover:bg-gray-50 transition-colors">
          V1.0
          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <h2 className="text-lg font-bold text-gray-800">Estilo Musical</h2>
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-700">Instrumental</span>
              <Switch
                checked={isInstrumental}
                onCheckedChange={setIsInstrumental}
                className="data-[state=checked]:bg-[#338d97]"
              />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
            <Textarea
              value={styleText}
              onChange={(e) => setStyleText(e.target.value)}
              placeholder="Descreva o estilo musical (ex: pop, rock, eletrônico...)"
              maxLength={200}
              className="min-h-[80px] mb-3 bg-white border-zinc-300 text-black placeholder:text-zinc-500 focus:border-[#338d97] focus-visible:ring-0"
            />
            <div className="flex space-x-2">
              <Button 
                type="button"
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#338d97] hover:text-[#338d97]"
                onClick={generateLyrics}
                disabled={isGenerating || !descriptionText.trim()}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Mic className="mr-2 h-4 w-4" />
                )}
                Gerar Letra
              </Button>
              <Button 
                type="button"
                className="flex-1 bg-[#338d97] hover:bg-[#2a7a83] text-white" 
                onClick={handleCreateSong}
                disabled={isGenerating || !lyricsText.trim()}
              >
                {isGenerating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Music className="mr-2 h-4 w-4" />
                )}
                Gerar Música
              </Button>
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-sm text-zinc-500">{styleText.length} / 200</span>
            </div>
          </div>
        </div>

        {/* Tab-dependent Section */}
        {activeTab === 'lyrics' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Letras</h2>
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <Textarea
                value={lyricsText}
                onChange={(e) => setLyricsText(e.target.value)}
                placeholder="Digite a letra da sua música ou deixe-se inspirar"
                maxLength={3000}
                className="min-h-[180px] bg-white border-zinc-300 text-black placeholder:text-zinc-500 focus:border-[#338d97] focus-visible:ring-0"
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm text-black">{lyricsText.length} / 3000</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-gray-800">Descrição</h2>
              <HelpCircle className="w-5 h-5 text-gray-400" />
            </div>
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <Textarea
                value={descriptionText}
                onChange={(e) => setDescriptionText(e.target.value)}
                placeholder="Descreva a música que você deseja criar..."
                maxLength={3000}
                className="min-h-[180px] bg-white border-zinc-300 text-black placeholder:text-zinc-500 focus:border-[#338d97] focus-visible:ring-0"
              />
              <div className="flex justify-end mt-2">
                <span className="text-sm text-gray-600">{descriptionText.length} / 3000</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'audio' && (
          <div className="mb-6">
              <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-bold text-gray-800">Áudio para Áudio</h2>
                  <HelpCircle className="w-5 h-5 text-gray-400" />
              </div>
              <div className="bg-white rounded-2xl p-8 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center shadow-sm">
                  <UploadCloud className="w-12 h-12 text-gray-400 mb-4" />
                  <h3 className="font-semibold text-gray-800 mb-2">Envie seu arquivo de áudio</h3>
                  <p className="text-gray-500 text-sm mb-4">Arraste e solte ou clique para enviar</p>
                  <Button variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-[#338d97] hover:text-[#338d97]">
                      Selecionar Arquivo
                  </Button>
                  <p className="text-xs text-gray-400 mt-8">A geração de áudio para áudio é um novo recurso que chegará em breve!</p>
              </div>
          </div>
        )}

        {/* Create Song Button */}
        <Button
          onClick={handleCreateSong}
          disabled={isGenerating || activeTab === 'audio'}
          className="w-full bg-[#338d97] hover:bg-[#2a7a83] text-white font-bold text-lg py-6 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-6 h-6 mr-2 animate-spin" />
              Gerando Música...
            </>
          ) : (
            <>
              <Music className="w-6 h-6 mr-2" />
              Criar Música
            </>
          )}
        </Button>
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 shadow-lg md:hidden">
        <div className="flex justify-around items-center h-16">
          <button
            onClick={() => setActiveTab("lyrics")}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              activeTab === "lyrics" ? "text-[#338d97]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Mic className="h-5 w-5" />
            <span className="text-xs mt-1">Letras</span>
          </button>
          
          <button
            onClick={() => setActiveTab("description")}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${
              activeTab === "description" ? "text-[#338d97]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <ImageIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Descrição</span>
          </button>
          
          <button
            onClick={() => setActiveTab("audio")}
            className={`flex flex-col items-center justify-center w-full h-full relative transition-colors ${
              activeTab === "audio" ? "text-[#338d97]" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="relative">
              <UploadCloud className="h-5 w-5" />
              <span className="absolute -top-2 -right-3 bg-[#338d97] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                NOVO
              </span>
            </div>
            <span className="text-xs mt-1">Áudio</span>
          </button>
          
          <button 
            className="flex flex-col items-center justify-center w-full h-full text-gray-500 hover:text-gray-700 transition-colors"
            onClick={() => router.push('/profile')}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs mt-1">Início</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
