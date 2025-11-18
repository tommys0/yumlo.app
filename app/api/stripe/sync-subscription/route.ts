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

    // Get user's Stripe data from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('id', user.id)
      .single();

    console.log('User data from DB:', {
      userId: user.id,
      email: user.email,
      customerId: userData?.stripe_customer_id,
      subscriptionId: userData?.stripe_subscription_id
    });

    let activeSubscription = null;
    let customerId = userData?.stripe_customer_id;

    // Strategy 1: If we have a subscription ID, retrieve it directly (most efficient)
    if (userData?.stripe_subscription_id) {
      try {
        console.log('Retrieving subscription directly:', userData.stripe_subscription_id);
        const subscription = await stripe.subscriptions.retrieve(userData.stripe_subscription_id);

        console.log('Retrieved subscription:', {
          id: subscription.id,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
        });

        // Check if it's still active
        if (subscription.status === 'active' || subscription.status === 'trialing') {
          activeSubscription = subscription;
          customerId = subscription.customer as string;
        } else {
          console.log('Subscription is no longer active, status:', subscription.status);
        }
      } catch (error: any) {
        console.log('Failed to retrieve subscription by ID:', error.message);
        // Continue to fallback strategies
      }
    }

    // Strategy 2: If no active subscription yet, search by customer ID
    if (!activeSubscription && customerId) {
      console.log('Searching subscriptions by customer ID:', customerId);
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 10,
      });

      activeSubscription = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSubscription) {
        console.log('Found active subscription via customer ID:', activeSubscription.id);
      }
    }

    // Strategy 3: If still nothing, search by email
    if (!activeSubscription && !customerId) {
      console.log('No customer ID, searching Stripe by email:', user.email);
      const customers = await stripe.customers.list({
        email: user.email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        console.log('Found customer in Stripe:', customerId);

        const subscriptions = await stripe.subscriptions.list({
          customer: customerId,
          limit: 10,
        });

        activeSubscription = subscriptions.data.find(
          sub => sub.status === 'active' || sub.status === 'trialing'
        );

        if (activeSubscription) {
          console.log('Found active subscription via email search:', activeSubscription.id);
        }
      } else {
        console.log('No customer found in Stripe for email:', user.email);
      }
    }

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
      console.log('No active subscription found, resetting to free tier');

      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          stripe_customer_id: customerId || null, // Save customer ID if we found one
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
        message: 'No active subscription found',
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
