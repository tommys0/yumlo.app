import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClientFromRequest } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    // Get the authenticated user
    const supabase = createClientFromRequest(req);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's Stripe customer ID
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.stripe_customer_id) {
      return NextResponse.json(
        { error: 'No Stripe customer found' },
        { status: 404 }
      );
    }

    // Fetch all subscriptions from Stripe for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripe_customer_id,
      limit: 10,
    });

    // Find the active subscription (if any)
    const activeSubscription = subscriptions.data.find(
      sub => sub.status === 'active' || sub.status === 'trialing'
    );

    // Use service role to update the database
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    if (activeSubscription) {
      // Update database with active subscription
      const priceId = activeSubscription.items.data[0]?.price.id;
      const currentPeriodEnd = (activeSubscription as any).current_period_end;

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          stripe_subscription_id: activeSubscription.id,
          subscription_status: activeSubscription.status,
          subscription_plan: priceId,
          subscription_current_period_end: currentPeriodEnd
            ? new Date(currentPeriodEnd * 1000).toISOString()
            : null,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: {
          id: activeSubscription.id,
          status: activeSubscription.status,
          plan: priceId,
          current_period_end: currentPeriodEnd,
        },
      });
    } else {
      // No active subscription - reset to free tier
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          stripe_subscription_id: null,
          subscription_status: null,
          subscription_plan: null,
          subscription_current_period_end: null,
        })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating user:', updateError);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        subscription: null,
      });
    }
  } catch (error: any) {
    console.error('Error syncing subscription:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync subscription' },
      { status: 500 }
    );
  }
}
