import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const taskId = searchParams.get("taskId")
    const userId = searchParams.get("userId")

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user || (userId && user.id !== userId)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const apiKey = process.env.SUNO_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: "API key not configured" }, { status: 500 })
    }

    // Check task status with Suno API
    const response = await fetch(`https://api.sunoapi.com/api/v1/query?ids=${taskId}`, {
      headers: {
        "api-key": apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Suno API error: ${response.status}`)
    }

    const data = await response.json()

    if (data.status === "completed" && data.audioUrl) {
      const { error: updateError } = await supabase
        .from("songs")
        .update({
          status: "completed",
          audio_url: data.audioUrl,
          image_url: data.imageUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq("suno_task_id", taskId)
        .eq("user_id", user.id)

      if (updateError) {
        console.error("Error updating song:", updateError)
      }

      const { data: song } = await supabase
        .from("songs")
        .select("title")
        .eq("suno_task_id", taskId)
        .eq("user_id", user.id)
        .single()

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Song Ready!",
        message: `Your song "${song?.title || "Untitled Song"}" has been generated successfully.`,
        type: "success",
      })
    } else if (data.status === "failed") {
      await supabase
        .from("songs")
        .update({
          status: "failed",
          updated_at: new Date().toISOString(),
        })
        .eq("suno_task_id", taskId)
        .eq("user_id", user.id)

      const { data: song } = await supabase
        .from("songs")
        .select("title")
        .eq("suno_task_id", taskId)
        .eq("user_id", user.id)
        .single()

      await supabase.from("notifications").insert({
        user_id: user.id,
        title: "Song Generation Failed",
        message: `Failed to generate "${song?.title || "Untitled Song"}". Please try again.`,
        type: "error",
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error checking status:", error)
    return NextResponse.json({ error: "Failed to check status" }, { status: 500 })
  }
}
