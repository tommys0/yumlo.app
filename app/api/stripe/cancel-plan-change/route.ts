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
      .select('stripe_subscription_id, subscription_plan, scheduled_plan_change')
      .eq('id', user.id)
      .single();

    if (!userData?.stripe_subscription_id) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    if (!userData?.scheduled_plan_change) {
      return NextResponse.json(
        { error: 'No scheduled plan change to cancel' },
        { status: 400 }
      );
    }

    console.log('Canceling scheduled plan change:', {
      subscriptionId: userData.stripe_subscription_id,
      currentPlan: userData.subscription_plan,
      scheduledPlan: userData.scheduled_plan_change,
    });

    // Get the current subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      userData.stripe_subscription_id
    );

    // If subscription has a schedule, release it to cancel the scheduled downgrade
    if (subscription.schedule) {
      const scheduleId = typeof subscription.schedule === 'string'
        ? subscription.schedule
        : subscription.schedule.id;

      console.log('Releasing subscription schedule:', scheduleId);

      // Release the schedule - this keeps the subscription on its current plan
      await stripe.subscriptionSchedules.release(scheduleId);

      console.log('Schedule released successfully');
    } else {
      console.log('No schedule found on subscription, clearing database only');
    }

    // Clear scheduled change in database
    await supabase
      .from('users')
      .update({
        scheduled_plan_change: null,
        scheduled_change_date: null,
      })
      .eq('id', user.id);

    console.log('Successfully cancelled scheduled plan change:', {
      subscriptionId: subscription.id,
      currentPlan: userData.subscription_plan,
    });

    return NextResponse.json({
      success: true,
      message: 'Scheduled plan change cancelled successfully',
    });
  } catch (error: any) {
    console.error('Error cancelling plan change:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to cancel plan change' },
      { status: 500 }
    );
  }
}
