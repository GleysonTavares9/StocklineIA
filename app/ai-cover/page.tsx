import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import AiCoverClient from "@/components/ai-cover-client"
import { cookies } from "next/headers"

export default async function AiCoverPage() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  return <AiCoverClient user={user} profile={profile} unreadNotifications={unreadNotifications || 0} />
}
