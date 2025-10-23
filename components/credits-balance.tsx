'use client'

import { useCredits } from '@/hooks/use-credits'
import { Loader2, Zap } from 'lucide-react'
import { Button } from './ui/button'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function CreditsBalance({ showBuyButton = true }: { showBuyButton?: boolean }) {
  const { balance, isLoading, error } = useCredits()
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Carregando créditos...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-sm text-red-500">
        Erro ao carregar créditos. Tente novamente mais tarde.
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <div className="flex items-center justify-center h-8 w-8 rounded-full bg-amber-100 text-amber-600">
          <Zap className="h-4 w-4" />
        </div>
        <div>
          <div className="text-sm font-medium text-gray-900">
            {balance.available} créditos
          </div>
          {balance.expires_at && (
            <div className="text-xs text-gray-500">
              Expira em {format(new Date(balance.expires_at), "dd 'de' MMMM", { locale: ptBR })}
            </div>
          )}
        </div>
      </div>
      
      {showBuyButton && (
        <Button 
          size="sm" 
          variant="outline" 
          className="border-amber-200 hover:bg-amber-50 text-amber-700"
          onClick={() => router.push('/plans')}
        >
          Comprar mais
        </Button>
      )}
    </div>
  )
}
