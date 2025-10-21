import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audioUrl, coverStyle, userId } = body

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()

    if (profileError || !profile || profile.credits < 2) {
      return NextResponse.json({ error: "Insufficient credits" }, { status: 400 })
    }

    // Deduct credits
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ credits: profile.credits - 2 })
      .eq("id", user.id)

    if (updateError) {
      console.error("Error updating credits:", updateError)
    }

    // Save cover generation request to database
    const { data: song, error: songError } = await supabase
      .from("songs")
      .insert({
        user_id: user.id,
        title: "AI Cover",
        style: coverStyle,
        status: "pending",
        audio_url: audioUrl,
        is_cover: true,
      })
      .select()
      .single()

    if (songError) {
      console.error("Error saving cover:", songError)
      return NextResponse.json({ error: "Failed to save cover request" }, { status: 500 })
    }

    // Create notification
    await supabase.from("notifications").insert({
      user_id: user.id,
      title: "AI Cover Generation Started",
      message: `Your AI cover is being generated. This may take a few minutes.`,
      type: "info",
    })

    // TODO: Integrate with actual AI cover generation service
    // For now, we'll simulate the process

    return NextResponse.json({
      success: true,
      songId: song.id,
      message: "Cover generation started",
    })
  } catch (error) {
    console.error("Error in generate-cover route:", error)
    return NextResponse.json({ error: "Failed to generate cover" }, { status: 500 })
  }
}
