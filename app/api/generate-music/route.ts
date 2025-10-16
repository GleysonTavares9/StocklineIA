import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cookies } from "next/headers"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const body = await request.json()
    const { prompt, duration = 30, style = "electronic", title, userId } = body

    const supabase = createClient()
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

    if (profileError || !profile || (profile.credits || 0) < 1) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Skywork.ai API endpoint
    const skyworkApiUrl = "https://api.skywork.ai/v1/music/generate"
    const apiKey = process.env.SKYWORK_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: "API key not configured. Please add SKYWORK_API_KEY to your environment variables." },
        { status: 500 },
      )
    }

    const response = await fetch(skyworkApiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        prompt,
        duration_seconds: Math.min(Math.max(10, duration), 300), // 10s to 5min
        style,
        format: "mp3",
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error("Skywork API error:", error)
      return NextResponse.json(
        { error: error.message || "Failed to generate music" },
        { status: response.status },
      )
    }

    const result = await response.json()

    // Save song to database
    const { error: songError } = await supabase.from("songs").insert({
      user_id: user.id,
      title: title || "Generated Music",
      style: style,
      status: "completed",
      audio_url: result.audio_url,
      metadata: {
        provider: "skywork.ai",
        duration: duration,
        style: style,
      },
    })

    if (songError) {
      console.error("Error saving song:", songError)
    }

    // Deduct credit
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits || 0) - 1 })
      .eq("id", user.id)

    // Send notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "Music Generation Complete",
      message: `Your music "${title || "Untitled"}" has been generated successfully!`,
      type: "success",
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error in generate-music route:", error)
    return NextResponse.json(
      { error: "Failed to generate music. Please try again." },
      { status: 500 },
    )
  }
}
