import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe';

export const dynamic = 'force-dynamic'; // Impede a renderização estática

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
    
    // Check if user already has a stripe_customer_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single();
      
    if (profileError) {
      console.error('Error fetching profile:', profileError);
      return NextResponse.json(
        { error: 'Erro ao buscar perfil do usuário' },
        { status: 500 }
      );
    }
    
    // If user already has a stripe_customer_id, return it
    if (profile?.stripe_customer_id) {
      return NextResponse.json({
        customerId: profile.stripe_customer_id,
        message: 'Cliente já existe no Stripe'
      });
    }
    
    // Create a new customer in Stripe
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: profile?.full_name || undefined,
      metadata: {
        supabase_id: user.id
      }
    });
    
    // Update the user's profile with the new stripe_customer_id
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ stripe_customer_id: customer.id })
      .eq('id', user.id);
      
    if (updateError) {
      console.error('Error updating profile with stripe_customer_id:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar perfil do usuário' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      customerId: customer.id,
      message: 'Cliente criado com sucesso no Stripe'
    });
    
  } catch (error: any) {
    console.error('Error creating Stripe customer:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao criar cliente no Stripe',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
