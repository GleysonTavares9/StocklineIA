import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { customMode, tags, prompt, instrumental, model, title, userId } = body

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.credits < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Suno API endpoint
    const sunoApiUrl = "https://api.sunoapi.com/api/v1/generate"
    const apiKey = process.env.SUNO_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Please add SUNO_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    const response = await fetch(sunoApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": apiKey,
      },
      body: JSON.stringify({
        custom_mode: customMode,
        tags: tags,
        prompt: prompt,
        make_instrumental: instrumental,
        mv: model || "chirp-v4-5",
        title: title || "Generated Song",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error("Suno API error:", errorText)
      throw new Error(`Suno API error: ${response.status}`)
    }

    const data = await response.json()

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 1 })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating credits:", updateError)
    }

    const { error: songError } = await supabase.from("songs").insert({
      user_id: user.id,
      title: title || "Untitled Song",
      style: tags,
      lyrics: customMode ? prompt : null,
      is_instrumental: instrumental,
      status: "pending",
      suno_task_id: data.taskId || data.id,
    })

    if (songError) {
      console.error("Error saving song:", songError)
    }

    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Song Generation Started",
      message: `Your song "${title || "Untitled Song"}" is being generated. This may take a few minutes.`,
      type: "info",
    })

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in generate-music route:", error)
    return NextResponse.json({ error: "Failed to generate music. Please try again." }, { status: 500 })
  }
}
