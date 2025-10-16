import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import LibraryClient from "@/components/library-client"
import { cookies } from "next/headers"

export default async function LibraryPage() {
  const supabase = createClient()

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

  // Get user's songs
  const { data: userSongs } = await supabase
    .from("songs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <LibraryClient
      user={user}
      profile={profile}
      unreadNotifications={unreadNotifications || 0}
      userSongs={userSongs || []}
    />
  )
}
