'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingClientProps {
  user: User;
  subscription: any;
}

export default function BillingClient({ user, subscription }: BillingClientProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/portal', {
        method: 'POST',
      });
      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('Could not get subscription management link.');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: (error as Error).message,
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8 text-[#338d97]">Faturamento</h1>
        
        <Card className="bg-white border border-gray-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-gray-900">Sua Assinatura</CardTitle>
            <CardDescription className="text-gray-600">Gerencie sua assinatura e detalhes de pagamento.</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <p className="font-bold text-lg text-gray-900">Plano {subscription.plan_id.name}</p>
                    <p className={`text-sm font-semibold mt-1 ${
                      subscription.status === 'active' ? 'text-[#338d97]' : 'text-amber-500'
                    }`}>
                      Status: {subscription.status === 'active' ? 'Ativo' : subscription.status}
                    </p>
                    {subscription.cancel_at_period_end && (
                      <p className="text-sm text-amber-600 mt-1">
                        Sua assinatura será cancelada no final do período atual.
                      </p>
                    )}
                  </div>
                  <div className="p-2 bg-[#e6f4f5] rounded-full">
                    <ShieldCheck className="w-8 h-8 text-[#338d97]" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900">Próxima cobrança</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-600 text-sm">
                      Seu próximo pagamento de R${subscription.plan_id.price?.toFixed(2) || '0.00'} 
                      será processado em {new Date(subscription.current_period_end * 1000).toLocaleDateString('pt-BR')}.
                    </p>
                  </div>
                </div>
                
                <Button 
                  onClick={handleManageSubscription}
                  disabled={loading}
                  className="w-full bg-[#338d97] text-white hover:bg-[#2a7a83] disabled:opacity-50 h-11"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Carregando...
                    </>
                  ) : (
                    'Gerenciar Assinatura'
                  )}
                </Button>
                
                <p className="text-sm text-gray-500 text-center">
                  Precisa de ajuda?{' '}
                  <a 
                    href="mailto:suporte@stocklineia.com" 
                    className="text-[#338d97] hover:underline font-medium"
                  >
                    Entre em contato com o suporte
                  </a>
                </p>
              </div>
            ) : (
              <div className="text-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <div className="mx-auto h-12 w-12 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <ShieldCheck className="h-6 w-6 text-[#338d97]" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma assinatura ativa</h3>
                <p className="text-gray-600 mb-6">Você ainda não possui uma assinatura ativa.</p>
                <Button 
                  onClick={() => router.push('/plans')} 
                  className="bg-[#338d97] text-white hover:bg-[#2a7a83] px-6 h-11"
                >
                  Ver Planos
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="mt-8 p-6 bg-white rounded-lg border border-gray-200">
          <h3 className="font-medium text-gray-900 mb-4">Métodos de Pagamento</h3>
          <p className="text-gray-600 text-sm">
            Gerencie seus métodos de pagamento e histórico de faturas diretamente no portal do cliente.
          </p>
          <Button 
            onClick={handleManageSubscription}
            disabled={loading}
            variant="outline"
            className="mt-4 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Gerenciar Pagamentos
          </Button>
        </div>
      </div>
    </div>
  );
}
