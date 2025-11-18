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

    // Determine if this is an upgrade or downgrade based on price
    const currentPrice = subscription.items.data[0].price.id;
    const priceMap: { [key: string]: number } = {
      'price_1SU4aiQzCEmOXTX6mnfngIiz': 7, // Basic
      'price_1SU4bwQzCEmOXTX6YKLtsHLH': 12, // Ultra
    };
    const isUpgrade = (priceMap[newPriceId] || 0) > (priceMap[currentPrice] || 0);

    let updatedSubscription;

    if (isUpgrade) {
      // UPGRADE: Charge full price immediately, reset billing cycle
      updatedSubscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'none', // No proration - charge full price
          billing_cycle_anchor: 'now', // Reset billing cycle to today
        }
      ) as Stripe.Subscription;
    } else {
      // DOWNGRADE: Change takes effect at end of billing period
      // Stripe updates the subscription immediately but user keeps current access until period ends
      updatedSubscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'none', // No proration - no refund
          billing_cycle_anchor: 'unchanged', // Keep same billing date
          metadata: {
            ...subscription.metadata,
            downgrade_from: currentPrice, // Track what they're downgrading from
            downgrade_effective_date: new Date((subscription as any).current_period_end * 1000).toISOString(),
          },
        }
      ) as Stripe.Subscription;
    }

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
