import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PlansClient from "@/components/plans-client";
import { cookies } from "next/headers";

export default async function PlansPage() {
  const cookieStore = cookies()
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/auth/login");
  }

  // Planos são definidos diretamente no código para facilitar a configuração
  // Substitua os price_ids pelos IDs de preço reais do seu painel Stripe
  const plans = [
    {
      id: "1",
      name: "Básico",
      price: 10,
      credits: 10,
      price_id: "prod_T8GcqvDRwpgXCz", // SUBSTITUA PELO SEU ID DE PREÇO REAL
    },
    {
      id: "2",
      name: "Pro",
      price: 49.90,
      credits: 100,
      price_id: "prod_TCFeipCb4e6TQo", // SUBSTITUA PELO SEU ID DE PREÇO REAL
    },
    {
      id: "3",
      name: "Premium",
      price: 100,
      credits: 500,
      price_id: "prod_T8GdGuaWDbgFvV", // SUBSTITUA PELO SEU ID DE PREÇO REAL
    },
  ];

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("plan_id, status")
    .eq("user_id", user.id)
    .in("status", ["trialing", "active"])
    .maybeSingle();

  return <PlansClient user={user} plans={plans || []} subscription={subscription} />;
}
