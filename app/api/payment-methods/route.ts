import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getPaymentMethods } from '@/lib/stripe';
import Stripe from 'stripe';

export const dynamic = 'force-dynamic'; // Impede a renderização estática

// Habilita logs detalhados em desenvolvimento
const isDev = process.env.NODE_ENV === 'development';

export async function GET() {
  try {
    // Inicializa o cliente Supabase
    const supabase = createClient();

    // Obtém o usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obtém o perfil do usuário para pegar o customer_id do Stripe
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'Cliente não encontrado no Stripe' },
        { status: 404 }
      );
    }

    if (isDev) console.log('Buscando métodos de pagamento para o cliente:', profile.stripe_customer_id);
    
    // Busca os métodos de pagamento no Stripe
    let paymentMethods = [];
    try {
      paymentMethods = await getPaymentMethods(profile.stripe_customer_id);
      if (isDev) console.log('Métodos de pagamento encontrados:', paymentMethods.length);
    } catch (error: any) {
      console.error('Erro ao buscar métodos de pagamento:', error);
      return NextResponse.json(
        { 
          error: 'Erro ao buscar métodos de pagamento', 
          details: error?.message || 'Erro desconhecido' 
        },
        { status: 500 }
      );
    }

    // Formata os métodos de pagamento para o formato esperado pelo frontend
    const formattedMethods = paymentMethods.map((method, index) => {
      // Usando type assertion para o tipo correto do cartão
      const card = method.card as any; // Usando 'any' temporariamente para evitar erros de tipo
      
      return {
        id: method.id,
        type: card?.brand,
        last4: card?.last4,
        exp_month: card?.exp_month,
        exp_year: card?.exp_year,
        is_default: index === 0 // O primeiro método é considerado o padrão
      };
    });

    return NextResponse.json({ paymentMethods: formattedMethods });
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar métodos de pagamento' },
      { status: 500 }
    );
  }
}
