'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { Zap } from 'lucide-react'

interface InsufficientCreditsModalProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  requiredCredits: number
  actionName?: string
}

export function InsufficientCreditsModal({
  isOpen,
  onOpenChange,
  requiredCredits,
  actionName = 'esta ação'
}: InsufficientCreditsModalProps) {
  const router = useRouter()

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-full bg-amber-100">
              <Zap className="h-6 w-6 text-amber-600" />
            </div>
            <DialogTitle>Créditos Insuficientes</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Você precisa de {requiredCredits} créditos para {actionName}. Atualmente você não tem créditos suficientes.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <p className="text-sm text-gray-600 mb-4">
            Adquira mais créditos para continuar aproveitando todos os recursos da plataforma.
          </p>
          
          <div className="bg-amber-50 p-4 rounded-lg border border-amber-100">
            <h4 className="font-medium text-amber-800 mb-2">Por que preciso de créditos?</h4>
            <p className="text-sm text-amber-700">
              Os créditos são usados para gerar músicas de alta qualidade. 
              Cada geração consome uma quantidade específica de créditos, dependendo 
              do tipo de música e recursos utilizados.
            </p>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="text-gray-700"
          >
            Fechar
          </Button>
          <Button 
            onClick={() => {
              onOpenChange(false)
              router.push('/plans')
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <Zap className="mr-2 h-4 w-4" />
            Ver Planos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
