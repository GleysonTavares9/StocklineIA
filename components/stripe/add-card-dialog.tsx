'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AddPaymentMethod } from './add-payment-method';

export function AddCardDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    // Fechar o modal após 2 segundos
    setTimeout(() => {
      setIsOpen(false);
      setIsSuccess(false);
    }, 2000);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
      >
        Adicionar Cartão
      </button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isSuccess ? 'Sucesso!' : 'Adicionar Cartão'}</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            {isSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-6 w-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900">Cartão adicionado com sucesso!</h3>
                <p className="mt-2 text-sm text-gray-500">Seu método de pagamento foi atualizado.</p>
              </div>
            ) : (
              <AddPaymentMethod onSuccess={handleSuccess} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
