import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const supabase = createClient();
  
  try {
    // Verifica se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login.' },
        { status: 401 }
      );
    }

    // Busca a assinatura ativa do usuário
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('stripe_subscription_id')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .single();

    if (subscriptionError || !subscription) {
      console.error('Erro ao buscar assinatura:', subscriptionError);
      return NextResponse.json(
        { error: 'Nenhuma assinatura ativa encontrada' },
        { status: 404 }
      );
    }

    // Cancela a assinatura no Stripe
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id);

    // Atualiza o status da assinatura no banco de dados
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscription.stripe_subscription_id);

    if (updateError) {
      console.error('Erro ao atualizar status da assinatura:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da assinatura' },
        { status: 500 }
      );
    }

    // Atualiza o perfil do usuário para remover a referência ao plano
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ 
        plan_id: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (profileError) {
      console.error('Erro ao atualizar perfil do usuário:', profileError);
      // Não interrompemos o fluxo aqui, pois o cancelamento já foi feito no Stripe
    }

    return NextResponse.json({ 
      success: true,
      message: 'Assinatura cancelada com sucesso.'
    });

  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao cancelar a assinatura. Por favor, tente novamente.' },
      { status: 500 }
    );
  }
}
