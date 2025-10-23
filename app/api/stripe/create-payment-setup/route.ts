import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export async function POST() {
  try {
    const supabase = createClient();
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }
    
    // Get user's profile to check for stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();
      
    if (profileError || !profile) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      );
    }
    
    // If user doesn't have a stripe_customer_id, create one first
    if (!profile.stripe_customer_id) {
      const createCustomerRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/create-customer`,
        { method: 'POST' }
      );
      
      if (!createCustomerRes.ok) {
        const error = await createCustomerRes.json();
        throw new Error(error.error || 'Falha ao criar cliente no Stripe');
      }
      
      const { customerId } = await createCustomerRes.json();
      profile.stripe_customer_id = customerId;
    }
    
    // Create a SetupIntent to collect payment details
    const setupIntent = await stripe.setupIntents.create({
      customer: profile.stripe_customer_id,
      payment_method_types: ['card'],
    });
    
    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      customerId: profile.stripe_customer_id
    });
    
  } catch (error: any) {
    console.error('Error creating payment setup:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao configurar método de pagamento',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
