import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import PlansClient from "@/components/plans-client"

export default async function PlansPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch plans
  const { data: plans } = await supabase
    .from("plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })

  // Fetch user's current subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*, plans(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .single()

  // Fetch user's profile for credits
  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", user.id).single()

  return <PlansClient plans={plans || []} currentSubscription={subscription} currentCredits={profile?.credits || 0} />
}
