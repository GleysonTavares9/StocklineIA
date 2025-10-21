import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import FeaturedClient from "@/components/featured-client"
import { cookies } from "next/headers"

export default async function FeaturedPage() {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Get unread notifications count
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  // Get featured songs (completed songs ordered by created_at)
  const { data: featuredSongs } = await supabase
    .from("songs")
    .select(`
      *,
      profiles:user_id (
        display_name,
        email
      )
    `)
    .eq("status", "completed")
    .not("audio_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <FeaturedClient
      user={user}
      profile={profile}
      unreadNotifications={unreadNotifications || 0}
      featuredSongs={featuredSongs || []}
    />
  )
}
