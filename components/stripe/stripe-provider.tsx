'use client';

import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { ReactNode, useMemo } from 'react';

// Make sure to call `loadStripe` outside of a component’s render to avoid
// recreating the `Stripe` object on every render.
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

export function StripeProvider({ 
  children,
  options = {}
}: { 
  children: ReactNode;
  options?: StripeElementsOptions;
}) {
  // Use a memo to prevent recreating the options object on every render
  const stripeOptions = useMemo<StripeElementsOptions>(() => ({
    // Stripe Elements options
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#338d97',
        colorBackground: '#ffffff',
        colorText: '#30313d',
        colorDanger: '#df1b41',
        fontFamily: 'Inter, system-ui, sans-serif',
        spacingUnit: '4px',
        borderRadius: '4px',
      },
      rules: {
        '.Input': {
          padding: '10px 12px',
          border: '1px solid #d1d5db',
          borderRadius: '4px',
          fontSize: '16px',
        },
        '.Input:focus': {
          borderColor: '#338d97',
          boxShadow: '0 0 0 1px #338d97',
        },
        '.Input::placeholder': {
          color: '#9ca3af',
        },
        '.Label': {
          fontSize: '14px',
          fontWeight: '500',
          marginBottom: '4px',
        },
      } as any, // Usando 'any' temporariamente para contornar limitações de tipagem
    },
    // Merge with any provided options
    ...options,
  }), [options]);

  return (
    <Elements stripe={stripePromise} options={stripeOptions}>
      {children}
    </Elements>
  );
}
