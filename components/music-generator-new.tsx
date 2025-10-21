'use client'

import { useState, useEffect } from "react"
import { Music, Mic, ImageIcon, Loader2, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import type { User } from "@supabase/supabase-js"
import { ptBR } from "@/lib/translations"

const GENRE_OPTIONS = ["Pop", "Rap", "Rock", "Eletrônica", "Sertanejo", "Funk", "MPB", "Samba", "Forró", "Trap"]

const t = ptBR.musicGenerator

interface MusicGeneratorProps {
  user: User
  profile: {
    id: string
    email: string
    display_name: string | null
  } | null
  subscription: {
    plan_name: string
    generations_used: number
  } | null
  unreadNotifications: number
}

export default function MusicGeneratorNew({ user, profile, subscription, unreadNotifications }: MusicGeneratorProps) {
  const [styleText, setStyleText] = useState("")
  const [lyricsText, setLyricsText] = useState("")
  const [descriptionText, setDescriptionText] = useState("")
  const [titleText, setTitleText] = useState("")
  const [isInstrumental, setIsInstrumental] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false)
  const [showMoreGenres, setShowMoreGenres] = useState(false)
  const [showDescription, setShowDescription] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const generateLyricsWithAI = async () => {
    if (!styleText.trim()) {
      toast({
        title: "Estilo não especificado",
        description: "Por favor, selecione pelo menos um estilo musical antes de gerar a letra.",
        variant: "destructive"
      })
      return
    }

    setIsGeneratingLyrics(true)
    
    try {
      const response = await fetch('/api/generate-lyrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          theme: descriptionText || 'amor',
          style: styleText,
          userId: user?.id || ''
        })
      })

      const data = await response.json()
      console.log('Resposta da API:', data) // Log da resposta completa
      
      if (!response.ok) {
        console.error('Erro na resposta:', data) // Log de erro detalhado
        throw new Error(data.error || 'Falha ao gerar letra')
      }

      if (!data.lyrics) {
        console.error('Letra não encontrada na resposta:', data) // Log se não houver letra
        throw new Error('A API não retornou uma letra válida')
      }

      console.log('Letra recebida:', data.lyrics) // Log da letra recebida
      setLyricsText(data.lyrics)
      
    } catch (error) {
      console.error('Erro ao gerar letra:', error)
      toast({
        title: "Erro ao gerar letra",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao tentar gerar a letra. Por favor, tente novamente.",
        variant: "destructive"
      })
    } finally {
      setIsGeneratingLyrics(false)
    }
  }

  const handleGenreClick = (genre: string) => {
    const currentStyles = styleText
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
    
    if (currentStyles.includes(genre)) {
      setStyleText(currentStyles.filter(g => g !== genre).join(", "))
    } else {
      setStyleText([...currentStyles, genre].join(", "))
    }
  }

  const generateLyrics = async () => {
    if (!descriptionText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, descreva o tema da letra.",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

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
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Falha ao gerar letra")
      }

      setLyricsText(data.lyrics)
      
      toast({
        title: "Letra gerada com sucesso!",
        description: "Agora você pode revisar e editar a letra antes de gerar a música.",
      })
    } catch (error) {
      console.error("Erro ao gerar letra:", error)
      toast({
        title: "Erro ao gerar letra",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const formatLyricsForSuno = (lyrics: string) => {
    // Remove markdown formatting and clean up lyrics
    return lyrics
      .replace(/\[.*?\]/g, '') // Remove [Verse], [Chorus] etc
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove **bold**
      .replace(/\*(.*?)\*/g, '$1') // Remove *italic*
      .trim()
  }

  const buildSunoPrompt = () => {
    if (isInstrumental) {
      // Para músicas instrumentais
      return descriptionText || `Instrumental no estilo ${styleText}`
    } else {
      // Para músicas com letra
      const formattedLyrics = formatLyricsForSuno(lyricsText)
      const styleInfo = styleText ? ` no estilo ${styleText}` : ''
      const descriptionInfo = descriptionText ? `. ${descriptionText}` : ''
      
      return `${formattedLyrics}${styleInfo}${descriptionInfo}`
    }
  }

  const handleCreateSong = async () => {
    if (!lyricsText.trim() && !isInstrumental) {
      toast({
        title: "Erro",
        description: "Por favor, adicione uma letra ou marque como instrumental.",
        variant: "destructive",
      })
      return
    }

    if (!styleText.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, selecione pelo menos um estilo musical.",
        variant: "destructive",
      })
      return
    }

    // Verificar assinatura/limites
    const maxFreeGenerations = 10
    if (subscription?.plan_name === 'free' && subscription?.generations_used >= maxFreeGenerations) {
      toast({
        title: "Limite Atingido",
        description: `Você usou todas as ${maxFreeGenerations} gerações do plano gratuito.`,
        variant: "destructive",
        action: (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/plans')}
            className="mt-2"
          >
            Ver Planos
          </Button>
        ),
      })
      return
    }

    try {
      setIsGenerating(true)

      const sunoPrompt = buildSunoPrompt()
      const title = titleText || `Música ${isInstrumental ? 'Instrumental' : ''} ${new Date().toLocaleDateString()}`

      const response = await fetch("/api/suno/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: sunoPrompt,
          title: title,
          tags: styleText,
          make_instrumental: isInstrumental,
          wait_audio: false // Não esperar pelo processamento completo
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.message || "Falha ao gerar música")
      }

      if (data.success) {
        toast({
          title: "Música em produção! 🎵",
          description: "Sua música está sendo gerada e estará disponível em breve na sua biblioteca.",
        })

        // Redirecionar para a biblioteca após um pequeno delay
        setTimeout(() => {
          router.push("/library")
        }, 3000)
      } else {
        throw new Error(data.message || "Erro na geração da música")
      }

    } catch (error) {
      console.error("Erro ao gerar música:", error)
      toast({
        title: "Erro ao gerar música",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      <main className="flex-1 px-4 py-6 overflow-y-auto max-w-3xl mx-auto w-full">
        <div className="pb-24">
          {/* Cabeçalho */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t.title}</h1>
            <p className="text-gray-600">Gere músicas incríveis com IA em poucos passos</p>
          </div>

          {/* Seção de Título */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-[#338d97]" />
              Título da Música
            </h2>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              placeholder="Digite o título da música..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#338d97] focus:border-transparent"
              maxLength={50}
            />
            <div className="text-xs text-gray-500 mt-1 text-right">
              {titleText.length}/50 caracteres
            </div>
          </div>

          {/* Seção de Gênero */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Music className="w-5 h-5 text-[#338d97]" />
              {t.style.title}
            </h2>
            
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 mb-2">
                {GENRE_OPTIONS.slice(0, showMoreGenres ? GENRE_OPTIONS.length : 6).map((genre) => (
                  <button
                    key={genre}
                    onClick={() => handleGenreClick(genre)}
                    className={`px-3 py-1.5 text-sm rounded-full border-2 transition-colors ${
                      styleText.includes(genre)
                        ? 'bg-[#338d97] text-white border-[#338d97]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#338d97] hover:bg-gray-50'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setShowMoreGenres(!showMoreGenres)}
                className="text-sm text-[#338d97] hover:underline flex items-center gap-1 mt-2"
              >
                {showMoreGenres ? (
                  <>
                    <ChevronUp className="w-4 h-4" />
                    {t.style.showLess}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4" />
                    {t.style.showMore}
                  </>
                )}
              </button>
            </div>

            <div className="mt-4">
              <label htmlFor="customStyle" className="block text-sm font-medium text-gray-700 mb-2">
                {t.style.customStyle}
              </label>
              <input
                type="text"
                id="customStyle"
                value={styleText}
                onChange={(e) => setStyleText(e.target.value)}
                placeholder={t.style.placeholder}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#338d97] focus:border-transparent"
              />
            </div>
          </div>

          {/* Seção de Letra */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Mic className="w-5 h-5 text-[#338d97]" />
                Letra da Música
              </h2>
              <div className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-full">
                <span className="text-sm font-medium text-gray-700">
                  {isInstrumental ? 'Instrumental' : 'Com Letra'}
                </span>
                <Switch
                  checked={isInstrumental}
                  onCheckedChange={setIsInstrumental}
                  className="data-[state=checked]:bg-[#338d97] data-[state=unchecked]:bg-gray-300"
                />
              </div>
            </div>

            {!isInstrumental ? (
              <>
                <div className="relative mb-4">
                  <Textarea
                    value={lyricsText}
                    onChange={(e) => setLyricsText(e.target.value)}
                    placeholder="Digite a letra da música aqui..."
                    className="min-h-[200px] font-mono text-sm pr-24"
                    disabled={isGenerating}
                  />
                  <Button
                    onClick={generateLyricsWithAI}
                    disabled={isGeneratingLyrics || isGenerating}
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white/90 hover:bg-gray-50 border-gray-200"
                  >
                    {isGeneratingLyrics ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span>Gerar com IA</span>
                    )}
                  </Button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-500">
                    {lyricsText.length} caracteres
                  </div>
                  <Button
                    onClick={generateLyrics}
                    disabled={isGenerating || !descriptionText.trim()}
                    className={`flex items-center gap-2 ${
                      isGenerating || !descriptionText.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-[#338d97] hover:bg-[#2a7a83] text-white'
                    }`}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Gerando...
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        {!descriptionText.trim() ? 'Descreva a música primeiro' : 'Gerar Letra com IA'}
                      </>
                    )}
                  </Button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg text-gray-500">
                <Music className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                <p>Música instrumental selecionada. Nenhuma letra necessária.</p>
              </div>
            )}
          </div>

          {/* Seção de Descrição */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
            <button
              onClick={() => setShowDescription(!showDescription)}
              className="w-full flex justify-between items-center mb-2"
            >
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#338d97]" />
                Descrição da Música (Opcional)
              </h2>
              {showDescription ? (
                <ChevronUp className="w-5 h-5 text-gray-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500" />
              )}
            </button>
            
            {showDescription && (
              <div className="mt-4">
                <Textarea
                  value={descriptionText}
                  onChange={(e) => setDescriptionText(e.target.value)}
                  placeholder="Descreva o tema, clima, referências ou instruções específicas para a geração da música..."
                  className="min-h-[120px] bg-white border-gray-300 focus:border-[#338d97] focus-visible:ring-0 mb-4"
                  disabled={isGenerating}
                  maxLength={500}
                />
                <div className="flex justify-between mt-2">
                  <span className="text-xs text-gray-500">
                    Detalhes adicionais sobre a música
                  </span>
                  <span className="text-xs text-gray-500">{descriptionText.length}/500</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Botão de Ação Principal */}
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200 sticky bottom-0">
          <div className="max-w-3xl mx-auto px-0 sm:px-4">
            <Button
              onClick={handleCreateSong}
              disabled={isGenerating || (!lyricsText.trim() && !isInstrumental) || !styleText.trim()}
              variant="default"
              className="w-full h-12 text-sm font-medium rounded-lg bg-[#338d97] hover:bg-[#2a7a83] text-white disabled:bg-gray-300 disabled:text-gray-500"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isInstrumental ? 'Criando Música Instrumental...' : 'Criando Música com Letra...'}</span>
                </>
              ) : (
                <>
                  <Music className="w-5 h-5" />
                  <span>{isInstrumental ? 'Criar Música Instrumental' : 'Criar Música com Letra'}</span>
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-gray-500 mt-3 px-2">
              Ao criar, você concorda com nossos <a href="/termos" className="text-[#338d97] hover:underline">Termos de Uso</a> e <a href="/privacidade" className="text-[#338d97] hover:underline">Política de Privacidade</a>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}