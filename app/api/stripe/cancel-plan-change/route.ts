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

    // Get the original plan from Stripe metadata (this is what we're reverting to)
    const originalPlan = subscription.metadata?.downgrade_from;

    if (!originalPlan) {
      console.error('No downgrade_from metadata found in subscription');
      return NextResponse.json(
        { error: 'Cannot determine original plan to revert to' },
        { status: 400 }
      );
    }

    console.log('Reverting to original plan:', {
      from: subscription.items.data[0].price.id,
      to: originalPlan,
    });

    // Revert the subscription back to the original plan (stored in metadata)
    const revertedSubscription = await stripe.subscriptions.update(
      userData.stripe_subscription_id,
      {
        items: [
          {
            id: subscription.items.data[0].id,
            price: originalPlan, // Revert to the plan stored in downgrade_from metadata
          },
        ],
        proration_behavior: 'none',
        billing_cycle_anchor: 'unchanged',
        metadata: {
          ...subscription.metadata,
          // Remove downgrade metadata
          downgrade_from: '',
          downgrade_effective_date: '',
        },
      }
    );

    // Clear scheduled change in database
    await supabase
      .from('users')
      .update({
        scheduled_plan_change: null,
        scheduled_change_date: null,
      })
      .eq('id', user.id);

    console.log('Successfully cancelled scheduled plan change:', {
      subscriptionId: revertedSubscription.id,
      revertedToPlan: userData.subscription_plan,
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
