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

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  credits: number;
  price_id: string;
  features: string[];
  recommended?: boolean;
}

export default async function PlansPage() {
  const supabase = createClient();

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return redirect("/auth/login");
  }

  // Buscar planos do banco de dados
  const { data: plansData, error: plansError } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true) // Apenas planos ativos
    .order('price', { ascending: true });

  let plans: Plan[] = [];
  
  if (plansError) {
    console.error('Erro ao buscar planos:', plansError);
    // Usar planos padrão como fallback
    plans = [
      {
        id: '1',
        name: 'Básico',
        description: 'Ideal para quem está começando',
        price: 0,
        credits: 10,
        price_id: 'price_free',
        features: [
          '10 créditos iniciais',
          'Acesso básico',
          'Suporte por email'
        ],
        recommended: false
      },
      {
        id: '2',
        name: 'Premium',
        description: 'Para quem quer mais recursos',
        price: 29.90,
        credits: 100,
        price_id: 'price_premium',
        features: [
          '100 créditos por mês',
          'Suporte prioritário',
          'Acesso a todos os recursos',
          'Exportação em alta qualidade'
        ],
        recommended: true
      }
    ];
  } else if (plansData && plansData.length > 0) {
    // Mapear os dados do banco para o formato esperado
    // Usar um Set para garantir que não haja duplicatas por price_id
    const uniquePlans = new Map();
    
    plansData.forEach(plan => {
      if (!uniquePlans.has(plan.price_id)) {
        uniquePlans.set(plan.price_id, {
          ...plan as Omit<Plan, 'features' | 'recommended'>,
          features: Array.isArray(plan.features) ? plan.features : [],
          recommended: plan.is_popular || false
        });
      }
    });
    
    plans = Array.from(uniquePlans.values());
  }

  // Verifica se o usuário está autenticado
  if (!user) {
    redirect('/login');
  }

  let subscription = null;
  
  try {
    const { data, error } = await supabase
      .from("user_subscriptions")
      .select("plan_id, status")
      .eq("user_id", user.id)
      .in("status", ["trialing", "active"])
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar assinatura:', error);
      // Continua com subscription como null em caso de erro
    } else {
      subscription = data;
    }
  } catch (error) {
    console.error('Erro inesperado ao buscar assinatura:', error);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PlansClient user={user} plans={plans} subscription={subscription} />
    </div>
  );
}
