import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const cookieStore = cookies();
  const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse(
      JSON.stringify({ error: 'You must be logged in to do this.' }),
      { status: 401 }
    );
  }

  try {
    const { data: subscription, error } = await supabase
        .from('user_subscriptions')
        .select('generations_used')
        .eq('user_id', user.id)
        .single();

    if (error || !subscription) {
        console.error('Error fetching subscription or subscription not found:', error);
        return new NextResponse(
            JSON.stringify({ error: 'Could not find your subscription.' }),
            { status: 404 }
        );
    }

    const newGenerationsUsed = subscription.generations_used + 1;

    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ generations_used: newGenerationsUsed })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Error updating generations count:', updateError);
      throw new Error('Failed to update generations count. Please try again.');
    }

    return new NextResponse(
      JSON.stringify({ message: 'Generations count updated successfully' }),
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error) {
        return new NextResponse(
            JSON.stringify({
                error: error.message
            }),
            { status: 500 }
        );
    }
  }
}
