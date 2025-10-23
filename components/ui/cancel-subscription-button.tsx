'use client'

import { Button } from '@/components/ui/button'
import { Loader2, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

export function CancelSubscriptionButton() {
  const [isLoading, setIsLoading] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const { toast } = useToast()

  const handleCancel = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Falha ao cancelar assinatura')
      }

      toast({
        title: 'Assinatura cancelada',
        description: 'Sua assinatura foi cancelada com sucesso.',
        variant: 'default',
      })

      // Recarrega a página para atualizar o estado
      window.location.reload()
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error)
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Ocorreu um erro ao cancelar sua assinatura.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
      setIsConfirmOpen(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setIsConfirmOpen(true)}
        disabled={isLoading}
        variant="destructive"
        className="mt-2 bg-red-600 hover:bg-red-700"
      >
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Cancelar Assinatura
      </Button>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              <AlertDialogTitle>Cancelar Assinatura</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="pt-4">
              <p className="mb-4">Tem certeza que deseja cancelar sua assinatura?</p>
              <ul className="list-disc pl-5 space-y-2 text-sm text-amber-700 dark:text-amber-300">
                <li>Você continuará com acesso até o final do período atual.</li>
                <li>Não haverá reembolso para o período atual.</li>
                <li>Você pode reativar sua assinatura a qualquer momento.</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Voltar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCancel}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sim, cancelar assinatura
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
