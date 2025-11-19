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

    // Type assertion to access current_period_end
    const subscriptionData = subscription as any;

    console.log('Retrieved subscription:', {
      id: subscription.id,
      status: subscription.status,
      current_period_end: subscriptionData.current_period_end,
      items: subscription.items.data.map(item => item.price.id),
    });

    // Determine if this is an upgrade or downgrade based on price
    const currentPrice = subscription.items.data[0].price.id;
    const priceMap: { [key: string]: number } = {
      'price_1SU4aiQzCEmOXTX6mnfngIiz': 7, // Basic
      'price_1SU4bwQzCEmOXTX6YKLtsHLH': 12, // Ultra
    };
    const isUpgrade = (priceMap[newPriceId] || 0) > (priceMap[currentPrice] || 0);

    let updatedSubscription;

    if (isUpgrade) {
      // UPGRADE: Redirect to checkout to collect payment
      console.log('Creating checkout session for upgrade');

      // First, cancel the current subscription
      await stripe.subscriptions.cancel(userData.stripe_subscription_id);

      // Create checkout session for the new plan
      const checkoutSession = await stripe.checkout.sessions.create({
        customer: subscription.customer as string,
        line_items: [
          {
            price: newPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?upgrade=success`,
        cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/settings?upgrade=canceled`,
        subscription_data: {
          metadata: {
            userId: user.id,
          },
        },
        metadata: {
          userId: user.id,
        },
      });

      console.log('Checkout session created:', checkoutSession.id);

      return NextResponse.json({
        success: true,
        requiresCheckout: true,
        checkoutUrl: checkoutSession.url,
      });
    } else {
      // DOWNGRADE: Change takes effect at end of billing period
      // Stripe updates the subscription immediately but user keeps current access until period ends
      const periodEnd = subscriptionData.current_period_end;
      const effectiveDate = periodEnd
        ? new Date(periodEnd * 1000).toISOString()
        : new Date().toISOString();

      console.log('Downgrade metadata:', {
        current_period_end: periodEnd,
        effective_date: effectiveDate,
      });

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
            downgrade_effective_date: effectiveDate,
          },
        }
      ) as Stripe.Subscription;

      // Save scheduled downgrade to database for UI display
      await supabase
        .from('users')
        .update({
          scheduled_plan_change: newPriceId,
          scheduled_change_date: effectiveDate,
        })
        .eq('id', user.id);

      console.log('Scheduled downgrade saved to database:', {
        scheduled_plan_change: newPriceId,
        scheduled_change_date: effectiveDate,
      });
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
