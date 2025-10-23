import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { cookies } from 'next/headers';

// Inicializa o cliente do Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient();
    
    // Verifica se o usuário está autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user || !user.email) {
      return NextResponse.json(
        { error: 'Não autorizado. Por favor, faça login.' }, 
        { status: 401 }
      );
    }

    // Obtém o price_id do corpo da requisição
    const { price_id } = await req.json();

    if (!price_id) {
      return NextResponse.json(
        { error: 'ID do preço é obrigatório' }, 
        { status: 400 }
      );
    }

    // Busca o perfil do usuário
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, username, credits, plan_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Erro ao buscar perfil:', profileError);
      return NextResponse.json(
        { error: 'Erro ao buscar informações do perfil' },
        { status: 500 }
      );
    }

    let customerId = profile?.stripe_customer_id;

    // Se o usuário ainda não tem um ID de cliente no Stripe, cria um
    if (!customerId) {
      try {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: {
            userId: user.id,
            email: user.email,
          },
        });
        
        customerId = customer.id;

        // Atualiza o perfil do usuário com o ID do cliente no Stripe
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ 
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString() 
          })
          .eq('id', user.id);

        if (updateError) {
          console.error('Erro ao atualizar perfil:', updateError);
          return NextResponse.json(
            { error: 'Erro ao atualizar perfil com ID do cliente Stripe' },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Erro ao criar cliente no Stripe:', error);
        return NextResponse.json(
          { error: 'Erro ao configurar o pagamento. Por favor, tente novamente.' }, 
          { status: 500 }
        );
      }
    }

    // Verifica se já existe uma assinatura ativa
    const { data: existingSubscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .in('status', ['trialing', 'active'])
      .maybeSingle();

    if (subscriptionError) {
      console.error('Erro ao verificar assinatura existente:', subscriptionError);
      return NextResponse.json(
        { error: 'Erro ao verificar assinatura existente' },
        { status: 500 }
      );
    }

    // Se já existe uma assinatura ativa, redireciona para o portal de gerenciamento
    if (existingSubscription) {
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${new URL(req.url).origin}/billing`,
      });
      
      return NextResponse.json({ url: portalSession.url });
    }

    // Cria a sessão de checkout no Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: price_id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${new URL(req.url).origin}/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${new URL(req.url).origin}/plans`,
      metadata: {
        userId: user.id,
      },
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
    });

    if (!session.url) {
      throw new Error('Não foi possível criar a sessão de checkout');
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Erro no processo de assinatura:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ocorreu um erro ao processar sua assinatura. Por favor, tente novamente.' }, 
      { status: 500 }
    );
  }
}
