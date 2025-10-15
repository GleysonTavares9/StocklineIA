import { NextResponse } from 'next/server';
import { Stripe } from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

// This is a webhook that receives updates from Stripe
// It is not secured with a signature, which is not recommended for production
export async function POST(req: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  const event = await req.json();

  console.log('Stripe event received:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = await stripe.checkout.sessions.retrieve(event.data.object.id, { expand: ['line_items'] });
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;
        const priceId = session.line_items?.data[0]?.price?.id;

        if (!priceId) {
          throw new Error('Price ID not found in checkout session');
        }
        
        const { data: user, error: userError } = await supabase.from('profiles').select('id, credits').eq('stripe_customer_id', customerId).single();
        if (userError || !user) {
          throw new Error(`User not found for customer ID: ${customerId}`);
        }

        const { data: plan, error: planError } = await supabase.from('plans').select('id, credits').eq('price_id', priceId).single();
        if (planError || !plan) {
          throw new Error(`Plan not found for price ID: ${priceId}`);
        }

        await supabase.from('user_subscriptions').upsert({
          user_id: user.id,
          plan_id: plan.id,
          stripe_subscription_id: subscriptionId,
          status: 'active',
        });

        await supabase.from('profiles').update({ credits: user.credits + plan.credits }).eq('id', user.id);
        console.log(`Subscription created for user ${user.id} with plan ${plan.id}`);
        break;

      case 'customer.subscription.updated':
        const subscription = await stripe.subscriptions.retrieve(event.data.object.id);
        const updatedPriceId = subscription.items.data[0].price.id;
        const updatedCustomerId = subscription.customer as string;
        const status = subscription.status;

        const { data: updatedUser, error: updatedUserError } = await supabase.from('profiles').select('id, credits').eq('stripe_customer_id', updatedCustomerId).single();
        if (updatedUserError || !updatedUser) {
          throw new Error(`User not found for customer ID: ${updatedCustomerId}`);
        }

        const { data: updatedPlan, error: updatedPlanError } = await supabase.from('plans').select('id, credits').eq('price_id', updatedPriceId).single();
        if (updatedPlanError || !updatedPlan) {
          throw new Error(`Plan not found for price ID: ${updatedPriceId}`);
        }

        await supabase.from('user_subscriptions').update({ status }).eq('stripe_subscription_id', subscription.id);

        if (status === 'active' && event.data.previous_attributes?.status !== 'active') {
          await supabase.from('profiles').update({ credits: updatedUser.credits + updatedPlan.credits }).eq('id', updatedUser.id);
          console.log(`Subscription renewed for user ${updatedUser.id}. Credits added.`);
        } else {
          console.log(`Subscription status updated to ${status} for user ${updatedUser.id}`);
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Stripe webhook error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
