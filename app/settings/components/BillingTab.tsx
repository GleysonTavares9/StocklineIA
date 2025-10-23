'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

type Subscription = {
  id: string
  status: 'active' | 'canceled' | 'past_due' | 'unpaid'
  plan_name: string
  current_period_end: string
}

type BillingTabProps = {
  subscription: Subscription | null
}

export function BillingTab({ subscription }: BillingTabProps) {
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClient()
  const { toast } = useToast()
  const router = useRouter()

  const handleBillingPortal = async () => {
    setIsLoading(true)
    try {
      const { data, error } = await supabase.functions.invoke('stripe-create-portal', {
        body: { returnUrl: window.location.origin + '/settings' }
      })

      if (error) throw error
      if (data?.url) {
        window.location.href = data.url
      } else {
        throw new Error('No URL returned from billing portal')
      }
    } catch (error) {
      console.error('Error creating billing portal:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível acessar o portal de cobrança.',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Assinatura</CardTitle>
        <CardDescription>
          Gerencie sua assinatura e pagamentos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Plano Atual</p>
              <p className="text-sm text-muted-foreground">
                {subscription.plan_name}
              </p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
              {subscription.status === 'active' ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          
          {subscription.status === 'active' && (
            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                Próxima cobrança: {new Date(subscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
          )}

          <Button 
            onClick={handleBillingPortal}
            variant="outline"
            className="w-full mt-4"
            disabled={isLoading}
          >
            {isLoading ? 'Carregando...' : 'Gerenciar assinatura'}
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p>Você não possui uma assinatura ativa.</p>
          <Button 
            onClick={() => router.push('/plans')}
            className="w-full"
          >
            Ver planos
          </Button>
        </div>
      )}
      </CardContent>
    </Card>
  )
}
