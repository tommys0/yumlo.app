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
      .select('stripe_subscription_id, subscription_plan, subscription_current_period_end')
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

    // Fetch the actual prices from Stripe to compare amounts
    const [currentPriceData, newPriceData] = await Promise.all([
      stripe.prices.retrieve(currentPrice),
      stripe.prices.retrieve(newPriceId),
    ]);

    const currentAmount = currentPriceData.unit_amount || 0;
    const newAmount = newPriceData.unit_amount || 0;
    const isUpgrade = newAmount > currentAmount;

    let updatedSubscription;

    if (isUpgrade) {
      // UPGRADE: Update subscription with billing cycle reset to charge full new price immediately
      updatedSubscription = await stripe.subscriptions.update(
        userData.stripe_subscription_id,
        {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'none', // Don't prorate - we're resetting billing cycle
          billing_cycle_anchor: 'now', // Reset billing cycle to today
          payment_behavior: 'default_incomplete',
          expand: ['latest_invoice', 'latest_invoice.payment_intent'],
        }
      ) as Stripe.Subscription;

      // Get the invoice from the subscription update response
      let invoice = updatedSubscription.latest_invoice as Stripe.Invoice | null;

      if (invoice && typeof invoice !== 'string') {
        // Finalize draft invoice first
        if (invoice.status === 'draft') {
          invoice = await stripe.invoices.finalizeInvoice(invoice.id);
        }

        // Pay the invoice
        if (invoice.status === 'open' && invoice.amount_due > 0) {
          await stripe.invoices.pay(invoice.id);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Plan upgraded successfully',
        newPlan: newPriceId,
      });
    } else {
      // DOWNGRADE: Schedule change for end of billing period using Subscription Schedules
      const currentPeriodEnd = (subscription as any).current_period_end ||
        Math.floor(new Date(userData.subscription_current_period_end || Date.now()).getTime() / 1000);

      // Check if subscription already has a schedule
      let schedule;
      if (subscription.schedule) {
        // Release the old schedule and create a new one
        const scheduleId = typeof subscription.schedule === 'string'
          ? subscription.schedule
          : subscription.schedule.id;
        await stripe.subscriptionSchedules.release(scheduleId);
      }

      // Create a new subscription schedule
      schedule = await stripe.subscriptionSchedules.create({
        from_subscription: userData.stripe_subscription_id,
      });

      // Update the schedule with two phases:
      // 1. Current phase (keep current price until period end)
      // 2. New phase (new price starting at period end)
      await stripe.subscriptionSchedules.update(schedule.id, {
        phases: [
          {
            items: [{ price: currentPrice, quantity: 1 }],
            start_date: schedule.phases[0].start_date,
            end_date: currentPeriodEnd,
          },
          {
            items: [{ price: newPriceId, quantity: 1 }],
            start_date: currentPeriodEnd,
          },
        ],
        end_behavior: 'release', // Release back to regular subscription after second phase starts
      });

      // Save scheduled downgrade to database for UI display
      const effectiveDateISO = new Date(currentPeriodEnd * 1000).toISOString();
      await supabase
        .from('users')
        .update({
          scheduled_plan_change: newPriceId,
          scheduled_change_date: effectiveDateISO,
        })
        .eq('id', user.id);

      // The subscription remains on the current plan until the schedule takes effect
      updatedSubscription = subscription;
    }

    return NextResponse.json({
      success: true,
      message: 'Plan changed successfully',
      newPlan: newPriceId,
    });
  } catch (error: any) {
    console.error('Error changing plan');
    return NextResponse.json(
      { error: 'Failed to change plan' },
      { status: 500 }
    );
  }
}
