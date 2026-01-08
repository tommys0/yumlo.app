import { NextRequest, NextResponse } from 'next/server';
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

    // Get the user's subscription data
    const { data: userData } = await supabase
      .from('users')
      .select('stripe_subscription_id, scheduled_plan_change')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (userData?.scheduled_plan_change !== 'cancel') {
      return NextResponse.json(
        { error: 'Subscription is not scheduled for cancellation' },
        { status: 400 }
      );
    }

    console.log('Reactivating subscription:', {
      subscriptionId: userData.stripe_subscription_id,
    });

    // Remove the cancel_at_period_end flag from Stripe
    const subscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        cancel_at_period_end: false,
      }
    );

    // Clear the scheduled cancellation from database
    const { error: updateError } = await supabase
      .from('users')
      .update({
        scheduled_plan_change: null,
        scheduled_change_date: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating database after reactivation:', updateError);
      // Don't fail the request - webhook will eventually sync
    } else {
      console.log('✅ Database updated after reactivation');
    }

    console.log('Subscription reactivated:', {
      subscriptionId: subscription.id,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    });

    return NextResponse.json({
      success: true,
      message: 'Subscription reactivated successfully. Your subscription will continue.',
    });
  } catch (error: any) {
    console.error('Error reactivating subscription:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to reactivate subscription' },
      { status: 500 }
    );
  }
}