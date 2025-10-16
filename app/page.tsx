import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MusicGeneratorClient from "@/components/music-generator-client"

export default async function StocklineIAPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()

  const { data: subscription } = await supabase.from('user_subscriptions').select('*').eq('user_id', user.id).maybeSingle();

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("read", false)

  return <MusicGeneratorClient user={user} profile={profile} subscription={subscription} unreadNotifications={unreadCount || 0} />
}
