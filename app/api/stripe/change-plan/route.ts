import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClientFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const { newPriceId } = await req.json();

    if (!newPriceId) {
      return NextResponse.json(
        { error: 'New price ID is required' },
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the user's subscription data
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_subscription_id, subscription_plan')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Get the current subscription
    const subscription = await stripe.subscriptions.retrieve(
      userData.stripe_subscription_id
    );

    // Update the subscription with the new price
    const updatedSubscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: newPriceId,
          },
        ],
        proration_behavior: 'always_invoice', // Pro-rate the change
      }
    ) as Stripe.Subscription;

    console.log('Plan changed:', {
      subscriptionId: updatedSubscription.id,
      oldPrice: userData.subscription_plan,
      newPrice: newPriceId,
    });

    return NextResponse.json({
      success: true,
      message: 'Plan changed successfully',
      newPlan: newPriceId,
    });
  } catch (error: any) {
    console.error('Error changing plan:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to change plan' },
      { status: 500 }
    );
  }
}
