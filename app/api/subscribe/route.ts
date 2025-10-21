import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { cookies } from 'next/headers';

// Inicializa o cliente do Stripe com a chave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-09-30.clover',
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
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') { // PGRST116 é o código para nenhuma linha retornada
      console.error('Erro ao buscar perfil:', profileError);
      throw new Error('Erro ao buscar informações do perfil');
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
          .upsert({
            id: user.id,
            stripe_customer_id: customerId,
            updated_at: new Date().toISOString(),
          });

        if (updateError) {
          console.error('Erro ao atualizar perfil:', updateError);
          throw new Error('Falha ao atualizar perfil com ID do cliente Stripe');
        }
      } catch (error) {
        console.error('Erro ao criar cliente no Stripe:', error);
        return NextResponse.json(
          { error: 'Erro ao configurar o pagamento. Por favor, tente novamente.' }, 
          { status: 500 }
        );
      }
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
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Erro no processo de assinatura:', error);
    return NextResponse.json(
      { error: 'Ocorreu um erro ao processar sua assinatura. Por favor, tente novamente.' }, 
      { status: 500 }
    );
  }
}
