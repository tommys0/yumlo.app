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

    // Create checkout session
    console.log('Creating Stripe checkout session...');
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
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
    });

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
