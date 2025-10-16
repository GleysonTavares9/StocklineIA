import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single();

  const customerId = profile?.stripe_customer_id;

  if (!customerId) {
    return NextResponse.json({ error: 'Stripe customer not found' }, { status: 404 });
  }

  try {
    const { url } = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${new URL(req.url).origin}/plans`,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Stripe portal session error:', error);
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 });
  }
}
