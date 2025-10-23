'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

interface SubscribeButtonProps {
  plan: {
    id: string
    price_id: string
    price: number
    recommended?: boolean
  }
  isCurrentPlan: boolean
}

export function SubscribeButton({ 
  plan, 
  isCurrentPlan
}: SubscribeButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (isCurrentPlan || !('fetch' in window)) return
    
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ price_id: plan.price_id }),
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
      console.error('Subscription error:', error);
      toast({
        title: 'Error',
        description: (error as Error).message || 'An error occurred while processing your subscription.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isCurrentPlan}
      className={cn(
        'w-full h-12 sm:h-11 text-sm sm:text-base font-medium transition-all duration-200',
        plan.recommended 
          ? 'bg-[#338d97] hover:bg-[#2a7a83] text-white shadow-md hover:shadow-lg' 
          : 'text-[#338d97] border-2 border-[#338d97] hover:bg-gray-50 hover:border-[#2a7a83]',
        isCurrentPlan && 'opacity-70 cursor-not-allowed'
      )}
      variant={plan.recommended ? 'default' : 'outline'}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
          Processando...
        </>
      ) : isCurrentPlan ? (
        'Plano Atual'
      ) : (
        `Assinar por ${new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL',
          minimumFractionDigits: 2
        }).format(plan.price)}/mês`
      )}
    </Button>
  )
}
