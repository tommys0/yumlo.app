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

    console.log('User data from DB:', { userId: user.id, email: user.email, customerId: userData?.stripe_customer_id });

    let customerId = userData?.stripe_customer_id;

    // If no customer ID in database, try to find by email in Stripe
    if (!customerId) {
      console.log('No customer ID in DB, searching Stripe by email:', user.email);
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found customer in Stripe:', customerId);
      } else {
        console.log('No customer found in Stripe for email:', user.email);
        return NextResponse.json(
          { error: 'No Stripe customer found for your account' },
          { status: 404 }
        );
      }
    }

    // Fetch all subscriptions from Stripe for this customer
    console.log('Fetching subscriptions for customer:', customerId);
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    console.log('Found subscriptions:', {
      count: subscriptions.data.length,
      subscriptions: subscriptions.data.map(s => ({
        id: s.id,
        status: s.status,
        priceId: s.items.data[0]?.price.id,
      })),
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

      console.log('Updating DB with active subscription:', {
        subscriptionId: activeSubscription.id,
        status: activeSubscription.status,
        priceId,
      });

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          stripe_customer_id: customerId, // Save customer ID if it was missing
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
