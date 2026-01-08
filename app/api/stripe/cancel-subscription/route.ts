import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createClientFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
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

    // Get the user's subscription data including current period end
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_subscription_id, subscription_current_period_end')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel the subscription at period end
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Access current_period_end using bracket notation to avoid TypeScript errors
    const currentPeriodEnd = (subscription as any).current_period_end;

    // WORKAROUND: If Stripe has corrupted data (null period end), use database value
    let cancelAtDate: Date;
    if (currentPeriodEnd) {
      cancelAtDate = new Date(currentPeriodEnd * 1000);
    } else if (userData.subscription_current_period_end) {
      console.log('⚠️ Stripe subscription has corrupted period end, using database value');
      cancelAtDate = new Date(userData.subscription_current_period_end);
    } else {
      console.log('⚠️ No valid period end found in Stripe or database, using current date');
      cancelAtDate = new Date();
    }

    // Immediately update the database to reflect the cancellation status
    // Note: subscription is still "active" until period end, but cancel_at_period_end is true
    const { error: updateError } = await supabase
      .from('users')
      .update({
        subscription_status: subscription.status, // Still "active" but with cancel_at_period_end
        // DON'T update subscription_current_period_end - keep the original period end date
        // Store the fact that it's scheduled for cancellation
        scheduled_plan_change: 'cancel',
        scheduled_change_date: cancelAtDate.toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating database after cancellation:', updateError);
      // Don't fail the request - webhook will eventually sync
    } else {
      console.log('✅ Database updated immediately after cancellation');
    }

    console.log('Subscription cancelled:', {
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: cancelAtDate,
      databaseUpdated: !updateError,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the billing period',
      cancelAt: cancelAtDate.toISOString(),
    });
  } catch (error: any) {
    console.error('Error cancelling subscription:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel subscription' },
      { status: 500 }
    );
  }
}
