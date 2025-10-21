import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const songId = params.id

    // Verify the song belongs to the user
    const { data: song } = await supabase.from("songs").select("user_id").eq("id", songId).single()

    if (!song || song.user_id !== user.id) {
      return NextResponse.json({ error: "Song not found or unauthorized" }, { status: 404 })
    }

    // Delete the song
    const { error } = await supabase.from("songs").delete().eq("id", songId)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting song:", error)
    return NextResponse.json({ error: "Failed to delete song" }, { status: 500 })
  }
}
