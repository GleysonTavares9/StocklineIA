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

const planFeatures: { [key: string]: string[] } = {
    Básico: [
        '10 credits per month',
        'Access to standard music models',
        'Standard generation speed',
        'Email support',
    ],
    Pro: [
        '100 credits per month',
        'Access to all music styles',
        'Priority generation queue',
        'Priority email support',
    ],
    Premium: [
        '500 credits per month',
        'Access to all music styles',
        'Highest priority queue',
        '24/7 dedicated support',
        'Early access to new features',
    ],
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl text-gray-900">Planos de Assinatura</h1>
          <p className="mt-3 text-xl text-gray-600 sm:mt-4">
            Escolha o plano que melhor atende às suas necessidades. Desbloqueie mais créditos e gere músicas ilimitadas.
          </p>
          {subscription && (
            <div className="mt-8">
              <Button
                onClick={handleManageSubscription}
                disabled={loadingPlanId === 'portal'}
                variant="outline"
                className="border-gray-300 hover:bg-gray-100"
              >
                {loadingPlanId === 'portal' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Gerenciar Assinatura
              </Button>
            </div>
          )}
        </div>

        <div className="w-full max-w-5xl mx-auto px-2 sm:px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {plans.map((plan, index) => {
              const isHighlighted = index === 1;
              const features = planFeatures[plan.name] || [];
              return (
                <Card 
                  key={plan.id} 
                  className={cn(
                    "relative flex flex-col transform transition-all duration-300 hover:shadow-md h-full border-2",
                    {
                      "border-[#338d97] scale-[1.02] sm:scale-100 sm:hover:scale-[1.02]": isHighlighted,
                      "border-gray-200 bg-white": !isHighlighted,
                      "mt-6 sm:mt-0": isHighlighted
                    }
                  )}
                >
                  {isHighlighted && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-[#338d97] text-white text-xs font-semibold px-4 py-1.5 rounded-full whitespace-nowrap shadow-md">
                        Mais Popular
                      </div>
                    </div>
                  )}
                  <CardHeader className="text-center pt-7 pb-4 px-4 sm:px-6">
                    <CardTitle className="text-xl sm:text-2xl font-semibold text-gray-900">{plan.name}</CardTitle>
                    <CardDescription className="text-sm sm:text-base text-gray-600">{plan.credits} créditos/mês</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col items-center text-center px-4 sm:px-6 py-2">
                    <div className="mb-4">
                      <span className="text-3xl sm:text-4xl font-bold text-gray-900">R${plan.price.toFixed(2)}</span>
                      <span className="text-gray-500 text-sm sm:text-base">/mês</span>
                    </div>
                    <ul className="space-y-2.5 text-gray-600 text-sm sm:text-[0.9375rem] text-left w-full">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start group">
                          <CheckCircle className="mr-3 h-4 w-4 sm:h-5 sm:w-5 text-[#338d97] mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-sm sm:text-[0.9375rem] leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="p-4 sm:p-6 pt-0">
                    {subscription?.plan_id === plan.id ? (
                      <Button 
                        disabled 
                        className="w-full h-12 sm:h-11 text-sm sm:text-base font-medium"
                        variant="outline"
                      >
                        Plano Atual
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleSubscribe(plan.price_id)}
                        disabled={loadingPlanId === plan.price_id}
                        className={cn("w-full h-12 sm:h-11 text-sm sm:text-base font-medium transition-all duration-200", {
                          "bg-[#338d97] hover:bg-[#2a7a83] text-white shadow-md hover:shadow-lg": isHighlighted,
                          "text-[#338d97] border-2 border-[#338d97] hover:bg-gray-50 hover:border-[#2a7a83]": !isHighlighted
                        })}
                        variant={isHighlighted ? 'default' : 'outline'}
                      >
                        {loadingPlanId === plan.price_id ? (
                          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        ) : null}
                        {loadingPlanId === plan.price_id ? 'Processando...' : 'Assinar Agora'}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              )
            })}
          </div>
        </div>
        
        <div className="mt-12 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Perguntas Frequentes</h3>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900">Posso cancelar a qualquer momento?</h4>
              <p className="text-gray-600 mt-1">Sim, você pode cancelar sua assinatura a qualquer momento. Seu acesso permanecerá ativo até o final do período atual.</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Como são cobrados os créditos não utilizados?</h4>
              <p className="text-gray-600 mt-1">Os créditos não são acumulativos. Eles são renovados a cada ciclo de faturamento.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
