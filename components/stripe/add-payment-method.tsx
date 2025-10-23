'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2, X } from 'lucide-react';

export function AddPaymentMethod({ onSuccess, onCancel }: { onSuccess?: () => void; onCancel?: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      // Stripe.js hasn't loaded yet
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create a setup intent
      const response = await fetch('/api/stripe/create-payment-setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { clientSecret, error: setupError } = await response.json();

      if (setupError || !clientSecret) {
        throw new Error(setupError || 'Falha ao configurar o pagamento');
      }

      // Confirm the setup with the card element
      const { error: confirmError, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        },
      });

      if (confirmError) {
        throw confirmError;
      }

      if (setupIntent.status === 'succeeded') {
        // Payment method added successfully
        if (onSuccess) {
          onSuccess();
        } else {
          // Default success behavior
          router.refresh();
        }
      }
    } catch (err: any) {
      console.error('Error adding payment method:', err);
      setError(err.message || 'Ocorreu um erro ao adicionar o método de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
      {onCancel && (
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          disabled={isLoading}
        >
          <X className="w-5 h-5" />
        </button>
      )}
      
      <h3 className="text-lg font-medium mb-4">Adicionar Cartão de Crédito</h3>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-md mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <div className="border border-gray-300 p-3 rounded-md">
            <CardElement
              options={{
                style: {
                  base: {
                    fontSize: '16px',
                    color: '#424770',
                    '::placeholder': {
                      color: '#aab7c4',
                    },
                  },
                  invalid: {
                    color: '#9e2146',
                  },
                },
              }}
            />
          </div>
        </div>
        
        <div className="flex justify-end space-x-3">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          
          <Button type="submit" disabled={!stripe || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Adicionar Cartão'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
