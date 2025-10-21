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

  // Planos com preços em reais baseados no custo em dólar (1 USD = 5.50 BRL)
  const plans: Plan[] = [
    {
      id: "1",
      name: "Básico",
      price: 54.90,      // Custo: $5 (R$27.50) | Venda: R$54.90 (100% lucro)
      credits: 1000,     // 1.000 créditos = ~83 músicas (12 créditos/música)
      price_id: "price_1SC05REaMssn2zemsq2aSBba",
    },
    {
      id: "2",
      name: "Avançado",
      price: 494.90,     // Custo: $50 (R$275) | Venda: R$494.90 (80% lucro)
      credits: 10000,    // 10.000 créditos = ~833 músicas
      price_id: "price_1SFr8mEaMssn2zemIlFlxF7z",
    },
    {
      id: "3",
      name: "Profissional",
      price: 4674.50,    // Custo: $500 (R$2,750) | Venda: R$4,674.50 (70% lucro)
      credits: 105000,   // 105.000 créditos = ~8.750 músicas
      price_id: "price_1SC068EaMssn2zempsT65CNC",
    },
    {
      id: "4",
      name: "Empresarial",
      price: 10999,      // Custo: $1,250 (R$6,875) | Venda: R$10,999 (60% lucro)
      credits: 275000,   // 275.000 créditos = ~22.916 músicas
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
