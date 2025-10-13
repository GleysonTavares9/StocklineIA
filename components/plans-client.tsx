"use client"

import { useState } from "react"
import { Check, Zap, Crown, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"

interface Plan {
  id: string
  name: string
  description: string
  price: number
  credits_per_month: number
  features: string[]
}

interface PlansClientProps {
  plans: Plan[]
  currentSubscription: any
  currentCredits: number
}

export default function PlansClient({ plans, currentSubscription, currentCredits }: PlansClientProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubscribe = async (planId: string) => {
    setLoading(planId)

    // TODO: Integrate with Stripe when available
    toast({
      title: "Em breve!",
      description: "A integração com pagamentos estará disponível em breve.",
    })

    setLoading(null)
  }

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case "free":
        return <Zap className="w-8 h-8 text-[#00ff00]" />
      case "pro":
        return <Sparkles className="w-8 h-8 text-[#00ff00]" />
      case "premium":
        return <Crown className="w-8 h-8 text-[#00ff00]" />
      default:
        return <Zap className="w-8 h-8 text-[#00ff00]" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="text-[#00ff00] text-2xl">🎵</div>
            <span className="text-xl font-bold">StocklineIA</span>
          </div>
          <div className="text-sm text-gray-400">
            Créditos atuais: <span className="text-[#00ff00] font-bold">{currentCredits}</span>
          </div>
        </div>
      </header>

      {/* Plans Section */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
          <p className="text-gray-400 text-lg">Crie músicas incríveis com IA. Escolha o plano perfeito para você.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription?.plan_id === plan.id
            const isPremium = plan.name.toLowerCase() === "premium"

            return (
              <Card
                key={plan.id}
                className={`relative bg-gray-900 border-2 p-8 ${isPremium ? "border-[#00ff00]" : "border-gray-800"}`}
              >
                {isPremium && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#00ff00] text-black px-4 py-1 rounded-full text-sm font-bold">
                    POPULAR
                  </div>
                )}

                <div className="flex flex-col items-center text-center mb-6">
                  {getPlanIcon(plan.name)}
                  <h3 className="text-2xl font-bold mt-4">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mt-2">{plan.description}</p>
                </div>

                <div className="text-center mb-6">
                  <div className="text-4xl font-bold">
                    {plan.price === 0 ? (
                      "Grátis"
                    ) : (
                      <>
                        R$ {plan.price.toFixed(2)}
                        <span className="text-lg text-gray-400">/mês</span>
                      </>
                    )}
                  </div>
                  <div className="text-[#00ff00] text-sm mt-2">{plan.credits_per_month} créditos/mês</div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#00ff00] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={isCurrentPlan || loading === plan.id}
                  className={`w-full ${
                    isPremium ? "bg-[#00ff00] text-black hover:bg-[#00dd00]" : "bg-gray-800 hover:bg-gray-700"
                  }`}
                >
                  {isCurrentPlan ? "Plano Atual" : loading === plan.id ? "Processando..." : "Assinar"}
                </Button>
              </Card>
            )
          })}
        </div>

        {/* Credits Purchase Section */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center mb-8">Comprar Créditos Avulsos</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { credits: 10, price: 9.99, bonus: 0 },
              { credits: 25, price: 19.99, bonus: 5 },
              { credits: 50, price: 34.99, bonus: 15 },
              { credits: 100, price: 59.99, bonus: 40 },
            ].map((pack) => (
              <Card key={pack.credits} className="bg-gray-900 border-gray-800 p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-[#00ff00] mb-2">{pack.credits + pack.bonus}</div>
                  <div className="text-sm text-gray-400 mb-4">créditos</div>
                  {pack.bonus > 0 && <div className="text-xs text-[#00ff00] mb-4">+{pack.bonus} bônus!</div>}
                  <div className="text-2xl font-bold mb-4">R$ {pack.price.toFixed(2)}</div>
                  <Button
                    onClick={() => handleSubscribe(`credits-${pack.credits}`)}
                    className="w-full bg-gray-800 hover:bg-gray-700"
                  >
                    Comprar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
