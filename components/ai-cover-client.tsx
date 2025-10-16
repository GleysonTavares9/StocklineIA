"use client"

import type React from "react"

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
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const displayName = profile?.display_name || user.email?.split("@")[0] || "User"
  const avatarInitial = displayName[0]?.toUpperCase() || "U"

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Invalid File",
          description: "Please upload an audio file (MP3, WAV, etc.)",
          variant: "destructive",
        })
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setAudioFile(file)
      setSongUrl("") // Clear URL if file is uploaded
      toast({
        title: "File Selected",
        description: `${file.name} ready to upload`,
      })
    }
  }

  const handleCreateCover = async () => {
    if (!songUrl && !audioFile) {
      toast({
        title: "Missing Information",
        description: "Please provide a song URL or upload an audio file.",
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

    try {
      let audioUrl = songUrl

      if (audioFile) {
        const formData = new FormData()
        formData.append("file", audioFile)
        formData.append("userId", user.id)

        const uploadResponse = await fetch("/api/upload-audio", {
          method: "POST",
          body: formData,
        })

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload audio file")
        }

        const uploadData = await uploadResponse.json()
        audioUrl = uploadData.url
      }

      const response = await fetch("/api/generate-cover", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          audioUrl,
          coverStyle: coverStyle || "original style",
          userId: user.id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate cover")
      }

      const data = await response.json()

      toast({
        title: "Cover Generation Started!",
        description: "Your AI cover is being created. This may take a few minutes.",
      })

      setSongUrl("")
      setCoverStyle("")
      setAudioFile(null)

      setTimeout(() => {
        router.push("/library")
      }, 2000)
    } catch (error) {
      console.error("Error generating cover:", error)
      toast({
        title: "Generation Failed",
        description: "There was an error generating your cover. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Criar Cover com IA</h1>
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
          <h2 className="text-2xl font-bold mb-1 text-gray-900">Criar Cover com IA</h2>
          <p className="text-gray-600 mb-6">Transforme qualquer música com IA no estilo que você quiser</p>

          {/* Song URL Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">URL da Música</label>
            <div className="bg-white rounded-xl p-4 border border-gray-300 hover:border-[#338d97] transition-colors">
              <input
                type="text"
                value={songUrl}
                onChange={(e) => {
                  setSongUrl(e.target.value)
                  if (e.target.value) setAudioFile(null)
                }}
                placeholder="Cole o link da música (YouTube, Spotify, etc.)"
                className="w-full bg-transparent border-none text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
                disabled={!!audioFile}
              />
            </div>
          </div>

          {/* File Upload Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">Ou envie um arquivo de áudio</label>
            <div className="bg-white rounded-xl p-4 border-2 border-dashed border-gray-300 hover:border-[#338d97] transition-colors">
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
                id="audio-upload"
                disabled={!!songUrl}
              />
              <label
                htmlFor="audio-upload"
                className="flex flex-col items-center justify-center gap-3 cursor-pointer p-6 text-center"
              >
                <div className="p-3 bg-blue-50 rounded-full">
                  <Upload className="w-6 h-6 text-[#338d97]" />
                </div>
                {audioFile ? (
                  <span className="text-gray-900 font-medium">{audioFile.name}</span>
                ) : (
                  <div className="text-center">
                    <p className="text-gray-700 font-medium">Arraste um arquivo ou clique para selecionar</p>
                    <p className="text-sm text-gray-500 mt-1">Formatos suportados: MP3, WAV, etc. (até 10MB)</p>
                  </div>
                )}
              </label>
              {audioFile && (
                <div className="flex justify-center mt-2">
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                  >
                    <span>Remover arquivo</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Cover Style */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 text-gray-700">Estilo do Cover (Opcional)</label>
            <div className="bg-white rounded-xl p-4 border border-gray-300">
              <Textarea
                value={coverStyle}
                onChange={(e) => setCoverStyle(e.target.value)}
                placeholder="Descreva o estilo que deseja (ex: versão acústica, rock, jazz, eletrônica, etc.)"
                maxLength={200}
                className="min-h-[120px] bg-white border-none text-gray-900 placeholder:text-gray-400 resize-none focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">Exemplo: "Versão acústica com violão e voz suave"</p>
                <span className="text-sm text-gray-500">{coverStyle.length} / 200</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-[#338d97]">Como funciona:</span>
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-[#338d97] mt-1">•</span>
                <span>Forneça um link ou envie um arquivo de áudio</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#338d97] mt-1">•</span>
                <span>Descreva o estilo desejado (opcional)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#338d97] mt-1">•</span>
                <span>Nossa IA criará uma versão única da música</span>
              </li>
              <li className="flex items-start gap-2 font-medium">
                <span className="text-[#338d97] mt-1">•</span>
                <span>Cada geração custa 2 créditos</span>
              </li>
            </ul>
          </div>

          {/* Create Cover Button */}
          <Button
            onClick={handleCreateCover}
            disabled={isGenerating || (!songUrl && !audioFile)}
            className="w-full bg-[#338d97] hover:bg-[#2a7a83] text-white font-semibold text-lg py-6 rounded-xl disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.01] shadow-md hover:shadow-lg"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Criando seu cover...
              </>
            ) : (
              <>
                <Mic className="w-5 h-5 mr-2" />
                Criar Cover com IA (2 créditos)
              </>
            )}
          </Button>

          <p className="text-center text-sm text-gray-500 mt-4">
            Precisa de mais créditos?{' '}
            <a href="/plans" className="text-[#338d97] font-medium hover:underline">
              Ver planos
            </a>
          </p>
        </div>
      </main>
    </div>
  )
}
