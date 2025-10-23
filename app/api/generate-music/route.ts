import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export const dynamic = 'force-dynamic' // Impede a renderização estática

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { prompt, duration = 30, style = "electronic", title } = body

    const supabase = createClient()
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // CORREÇÃO: Removida a verificação user.id !== userId por segurança
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("Error fetching profile:", profileError)
      return NextResponse.json({ error: "Error fetching user profile" }, { status: 500 })
    }

    if (!profile || (profile.credits || 0) < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Sonu API endpoint
    const sonuApiUrl = "https://api.sonu.ai/v1/music/generate"
    const apiKey = process.env.SONU_API_KEY

    if (!apiKey) {
      console.error("Sonu API key not configured")
      return NextResponse.json(
        { error: "API key not configured" },
        { status: 500 },
      )
    }

    console.log("Starting music generation for user:", user.id)
    console.log("Prompt:", prompt, "Style:", style, "Duration:", duration)

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 300000) // 5 minutos timeout

    // Formatando o prompt para a API da Sonu
    const formattedPrompt = `${style} music, ${prompt}`.trim()
    
    const response = await fetch(sonuApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "X-Requested-With": "XMLHttpRequest"
      },
      body: JSON.stringify({
        text_prompt: formattedPrompt,
        duration: Math.min(Math.max(10, duration), 300), // 10s to 5min
        model: "sonu-pro",
        output_format: "mp3",
        quality: "high",
        bpm: style === "electronic" ? 128 : style === "ambient" ? 90 : 100
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      let errorMessage = "Failed to generate music"
      try {
        const errorData = await response.json()
        errorMessage = errorData.message || errorData.error || errorMessage
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`
      }
      
      console.error("Sonu API error:", errorMessage)
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status },
      )
    }

    const result = await response.json()
    
    if (!result.success || !result.data?.audio_url) {
      throw new Error(result.message || "Failed to generate music")
    }

    console.log("Music generation successful, audio URL:", result.data.audio_url)

    // Salvar música no banco com tratamento de erro
    const songData = {
      user_id: user.id,
      title: title?.trim() || `Generated ${style} Music`,
      style: style,
      status: "completed",
      audio_url: result.data.audio_url,
      metadata: {
        provider: "sonu.ai",
        duration: result.data.duration || duration,
        style: style,
        prompt: prompt,
        bpm: result.data.bpm,
        model: result.data.model
      },
    }

    const { error: songError } = await supabase.from("songs").insert(songData)

    if (songError) {
      console.error("Error saving song:", songError)
      // Não retornar erro aqui, apenas logar
    }

    // CORREÇÃO: Atualizar créditos com verificação
    const newCredits = Math.max(0, (profile.credits || 0) - 1)
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: newCredits })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating credits:", updateError)
      // Não retornar erro aqui, apenas logar
    }

    // CORREÇÃO: Enviar notificação com tratamento de erro
    try {
      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Music Generation Complete",
        message: `Your music "${title || "Untitled"}" has been generated successfully!`,
        type: "success",
      })
    } catch (notifyError) {
      console.error("Error sending notification:", notifyError)
    }

    return NextResponse.json({
      success: true,
      audio_url: result.audio_url,
      credits_remaining: newCredits,
      message: "Music generated successfully"
    })

  } catch (error: any) {
    console.error("Error in generate-music route:", error)
    
    // CORREÇÃO: Mensagens de erro mais específicas
    let errorMessage = "Failed to generate music. Please try again."
    let statusCode = 500

    if (error.name === 'AbortError') {
      errorMessage = "Request timeout. Please try again."
      statusCode = 408
    } else if (error.message?.includes('fetch')) {
      errorMessage = "Network error. Please check your connection and try again."
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode },
    )
  }
}