import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AICoverClient from "@/components/ai-cover-client"

export default async function AICoverPage() {
  const supabase = await createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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

  return <AICoverClient user={user} profile={profile} unreadNotifications={unreadNotifications || 0} />
}
