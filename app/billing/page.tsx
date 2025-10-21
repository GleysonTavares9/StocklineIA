import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import BillingClient from "@/components/billing-client"
import { cookies } from "next/headers"

export default async function BillingPage() {
  const supabase = createClient()

  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("*, plan_id(*)")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active"])
    .maybeSingle()

  return <BillingClient user={user} subscription={subscription} />
}
