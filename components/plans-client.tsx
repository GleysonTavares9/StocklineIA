'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Loader2, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from "@/lib/utils"

interface Plan {
  id: string
  name: string
  price: number
  credits: number
  price_id: string
}

interface PlansClientProps {
  user: User
  plans: Plan[]
  subscription: { plan_id: string; status: string } | null
}

const planFeatures: { [key: string]: { features: string[], pricePerSong: string, savings?: string } } = {
  'Básico': {
    features: [
      '1.000 créditos por mês',
      '12 créditos por música gerada',
      'Créditos não acumulam no mês seguinte',
      'Suporte por e-mail',
      'Acesso a todos os estilos',
      'Sem fidelidade',
      '7 dias de garantia',
      'Cobrança mensal recorrente',
      'Cancele a qualquer momento'
    ],
    pricePerSong: 'R$ 0,66 por música',
    savings: 'Melhor para testar'
  },
  'Avançado': {
    features: [
      '10.000 créditos por mês',
      '12 créditos por música gerada',
      'Créditos não acumulam no mês seguinte',
      'Suporte prioritário',
      'Acesso a todos os estilos',
      '14 dias de garantia',
      'Cobrança mensal recorrente',
      'Cancele a qualquer momento',
      '11% de desconto'
    ],
    pricePerSong: 'R$ 0,59 por música',
    savings: 'Economize 11%'
  },
  'Profissional': {
    features: [
      '105.000 créditos por mês',
      '12 créditos por música gerada',
      'Créditos não acumulam no mês seguinte',
      'Suporte prioritário 24/7',
      'Acesso a todos os estilos',
      'Acesso antecipado a novos recursos',
      '30 dias de garantia',
      'Cobrança mensal recorrente',
      'Cancele a qualquer momento',
      '20% de desconto'
    ],
    pricePerSong: 'R$ 0,53 por música',
    savings: 'Economize 20%'
  },
  'Empresarial': {
    features: [
      '275.000 créditos por mês',
      '12 créditos por música gerada',
      'Créditos não acumulam no mês seguinte',
      'Suporte dedicado 24/7',
      'Acesso a todos os estilos',
      'Acesso antecipado a novos recursos',
      'Conta gerencial dedicada',
      '60 dias de garantia',
      'Cobrança mensal recorrente',
      'Cancele a qualquer momento',
      '27% de desconto'
    ],
    pricePerSong: 'R$ 0,48 por música',
    savings: 'Melhor custo-benefício (27% off)'
  }
};

export default function PlansClient({ user, plans, subscription }: PlansClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null)

  const handleSubscribe = async (price_id: string) => {
    setLoadingPlanId(price_id)
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price_id }),
      })

      const { url, error } = await response.json()

      if (error) {
        throw new Error(error)
      }

      if (url) {
        window.location.href = url
      } else {
        throw new Error('Could not get subscription link.')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      })
      setLoadingPlanId(null)
    }
  }

  const handleManageSubscription = async () => {
    setLoadingPlanId('portal');
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });

      const { url, error } = await response.json();

      if (error) {
        throw new Error(error);
      }

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Could not get management link.');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setLoadingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl">
            Planos de Assinatura
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Escolha o plano que melhor atende às suas necessidades. Desbloqueie mais créditos e gere músicas ilimitadas.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => {
            const isPopular = index === 1;
            const features = planFeatures[plan.name] || [];
            const isCurrentPlan = subscription?.plan_id === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "group relative bg-white rounded-xl overflow-hidden border-2 transition-all duration-300",
                  "hover:shadow-xl hover:-translate-y-1",
                  "transform hover:scale-[1.02] will-change-transform",
                  "before:absolute before:inset-0 before:bg-gradient-to-br before:from-transparent before:to-transparent",
                  "hover:before:from-[#338d9710] hover:before:to-[#2a7a8310]",
                  "before:transition-all before:duration-300 before:opacity-0 hover:before:opacity-100",
                  {
                    "border-[#338d97] scale-105 z-10 shadow-lg": isPopular,
                    "border-gray-200 hover:border-[#338d97]/50": !isPopular && !isCurrentPlan,
                    "border-green-500 border-2 hover:border-green-500": isCurrentPlan
                  }
                )}
              >
                {isPopular && (
                  <div className="bg-gradient-to-r from-[#338d97] to-[#2a7a83] text-white text-sm font-bold text-center py-2 transform transition-transform duration-300 group-hover:scale-105">
                    MAIS POPULAR
                  </div>
                )}

                <div className="p-6 relative z-10">
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                    <div className="mt-2">
                      <span className="text-4xl font-extrabold text-gray-900">
                        R${plan.price.toFixed(2).replace('.', ',')}
                      </span>
                      <span className="text-gray-500">/mês</span>
                    </div>
                    <p className="text-gray-500 mt-2">{plan.credits.toLocaleString('pt-BR')} créditos/mês</p>
                    <p className="text-sm text-green-600 font-medium mt-1">Assinatura mensal - Renovação automática</p>
                  </div>

                  <div className="mt-6">
                    <p className="text-sm text-green-600 font-medium mb-3">
                      {planFeatures[plan.name]?.savings}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {planFeatures[plan.name]?.pricePerSong}
                    </p>
                    <ul className="space-y-3">
                      {planFeatures[plan.name]?.features.map((feature: string, i: number) => (
                        <li key={i} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-8">
                    {isCurrentPlan ? (
                      <Button
                        onClick={handleManageSubscription}
                        disabled={loadingPlanId === 'portal'}
                        className="w-full py-3 text-base font-medium bg-gray-100 text-gray-700 hover:bg-gray-200"
                      >
                        {loadingPlanId === 'portal' ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Gerenciar Assinatura'
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(plan.price_id)}
                        disabled={loadingPlanId === plan.price_id}
                        className={cn(
                          "w-full py-3 text-base font-medium text-white relative overflow-hidden",
                          "transform transition-all duration-300",
                          "hover:shadow-md hover:-translate-y-0.5",
                          "before:absolute before:inset-0 before:bg-white/10 before:opacity-0",
                          "hover:before:opacity-100 before:transition-opacity before:duration-300",
                          {
                            "bg-gradient-to-r from-[#338d97] to-[#2a7a83] hover:from-[#2a7a83] hover:to-[#1f5f66]": isPopular,
                            "bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900": !isPopular,
                            "opacity-75 cursor-not-allowed hover:translate-y-0 hover:shadow-none": loadingPlanId === plan.price_id
                          }
                        )}
                      >
                        {loadingPlanId === plan.price_id ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Processando...
                          </>
                        ) : (
                          'Assinar Agora'
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16 bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-3xl mx-auto">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-6">Perguntas Frequentes</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Posso cancelar a qualquer momento?</h4>
              <p className="mt-2 text-gray-600">Sim, você pode cancelar sua assinatura a qualquer momento. Seu acesso permanecerá ativo até o final do período atual.</p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900">Como são cobrados os créditos não utilizados?</h4>
              <p className="mt-2 text-gray-600">Os créditos não são acumulativos. Eles são renovados a cada ciclo de faturamento.</p>
            </div>
            
            <div>
              <h4 className="text-lg font-medium text-gray-900">Posso mudar de plano a qualquer momento?</h4>
              <p className="mt-2 text-gray-600">Sim, você pode atualizar seu plano a qualquer momento. O valor será ajustado proporcionalmente.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
