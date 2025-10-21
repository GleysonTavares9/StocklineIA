import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlansClient from "@/components/plans-client";
import { cookies } from "next/headers";
import type { User } from '@supabase/supabase-js';

interface Plan {
  id: string;
  name: string;
  price: number;
  credits: number;
  price_id: string;
}

export default async function PlansPage() {
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/auth/login");
  }

  // Planos com os IDs de preço corretos do Stripe
  const plans: Plan[] = [
    {
      id: "1",
      name: "Básico",
      price: 10,
      credits: 10,
      price_id: "price_1SC05REaMssn2zemsq2aSBba",
    },
    {
      id: "2",
      name: "Pro",
      price: 49.90,
      credits: 100,
      price_id: "price_1SFr8mEaMssn2zemIlFlxF7z",
    },
    {
      id: "3",
      name: "Premium",
      price: 100,
      credits: 500,
      price_id: "price_1SC068EaMssn2zempsT65CNC",
    },
  ];

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active"])
    .maybeSingle();

  return <PlansClient user={user} plans={plans} subscription={subscription} />;
}
