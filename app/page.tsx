import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import MusicGeneratorNew from "@/components/music-generator-new"

export const dynamic = 'force-dynamic' // Impede a renderização estática

export default async function StocklineIAPage() {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      redirect("/auth/login")
    }

    // Fetch data in parallel for better performance
    const [
      { data: profile },
      { data: subscription },
      { count: unreadCount }
    ] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
      supabase.from('user_subscriptions').select('*').eq('user_id', user.id).maybeSingle(),
      supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("read", false)
    ])

    return (
      <MusicGeneratorNew 
        user={user} 
        profile={profile} 
        subscription={subscription} 
        unreadNotifications={unreadCount || 0} 
      />
    )
  } catch (error) {
    console.error('Error in StocklineIAPage:', error)
    redirect('/error')
  }
}
