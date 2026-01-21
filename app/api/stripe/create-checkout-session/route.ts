import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClientFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price ID is required' },
        { status: 400 }
      );
    }

    // Get the user from Supabase
    const supabase = createClientFromRequest(req);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first' },
        { status: 401 }
      );
    }

    // Check if user already has an active subscription (DB check + Stripe check)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_status, subscription_plan, stripe_customer_id')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user data');
      return NextResponse.json(
        { error: 'Failed to verify subscription status' },
        { status: 500 }
      );
    }

    // DB-level check for active subscription
    if (userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing') {
      return NextResponse.json(
        {
          error: 'You already have an active subscription. Please use the settings page to change your plan.',
          hasActiveSubscription: true
        },
        { status: 400 }
      );
    }

    // CRITICAL: Stripe-level check to prevent duplicate subscriptions even if DB is stale
    if (userData?.stripe_customer_id) {
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        limit: 10,
      });

      const activeSubscription = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSubscription) {
        return NextResponse.json(
          {
            error: 'You already have an active subscription in Stripe. Please contact support if you believe this is an error.',
            hasActiveSubscription: true
          },
          { status: 400 }
        );
      }
    }

    // Create checkout session - REUSE existing customer or let Stripe create one
    // CRITICAL: Use either customer OR customer_email, not both
    const checkoutParams: any = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      subscription_data: {
        metadata: {
          userId: user.id,
        },
      },
      metadata: {
        userId: user.id,
      },
    };

    // Add customer ID if exists, otherwise use email to create new customer
    if (userData?.stripe_customer_id) {
      checkoutParams.customer = userData.stripe_customer_id;
    } else {
      checkoutParams.customer_email = user.email;
    }

    const session = await stripe.checkout.sessions.create(checkoutParams);

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session');
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
