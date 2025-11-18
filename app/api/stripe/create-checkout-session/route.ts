import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClientFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { priceId } = await req.json();
    console.log('Checkout session request - Price ID:', priceId);

    // Debug: Check cookies
    const allCookies = req.cookies.getAll();
    console.log('Cookies received:', allCookies.map(c => c.name));
    const supabaseCookies = allCookies.filter(c =>
      c.name.includes('sb-') || c.name.includes('supabase')
    );
    console.log('Supabase cookies:', supabaseCookies.length);

    if (!priceId) {
      console.error('No price ID provided');
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

    console.log('Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('Auth error:', authError);
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

    console.log('User data from DB:', {
      status: userData?.subscription_status,
      plan: userData?.subscription_plan,
      customerId: userData?.stripe_customer_id
    });

    if (userError) {
      console.error('Error fetching user data:', userError);
      return NextResponse.json(
        { error: 'Failed to verify subscription status' },
        { status: 500 }
      );
    }

    // DB-level check for active subscription
    if (userData?.subscription_status === 'active' || userData?.subscription_status === 'trialing') {
      console.log('DB shows active subscription, rejecting new checkout');
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
      console.log('Checking Stripe for existing subscriptions...');
      const subscriptions = await stripe.subscriptions.list({
        customer: userData.stripe_customer_id,
        limit: 10,
      });

      const activeSubscription = subscriptions.data.find(
        sub => sub.status === 'active' || sub.status === 'trialing'
      );

      if (activeSubscription) {
        console.log('Found active subscription in Stripe, blocking checkout:', {
          subscriptionId: activeSubscription.id,
          status: activeSubscription.status,
          priceId: activeSubscription.items.data[0]?.price.id,
        });
        return NextResponse.json(
          {
            error: 'You already have an active subscription in Stripe. Please contact support if you believe this is an error.',
            hasActiveSubscription: true
          },
          { status: 400 }
        );
      }
      console.log('No active subscriptions found in Stripe, proceeding with checkout');
    }

    // Create checkout session - REUSE existing customer or let Stripe create one
    console.log('Creating Stripe checkout session...', {
      reusingCustomer: !!userData?.stripe_customer_id,
      customerId: userData?.stripe_customer_id,
    });

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

    console.log('Checkout session created:', {
      sessionId: session.id,
      hasUrl: !!session.url
    });

    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
