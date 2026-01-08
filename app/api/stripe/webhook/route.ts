import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

// This is needed to allow raw body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  console.log('🔔 Webhook received at:', new Date().toISOString());

  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  console.log('Webhook signature present:', !!signature);
  console.log('Webhook secret configured:', !!process.env.STRIPE_WEBHOOK_SECRET);

  if (!signature) {
    console.error('❌ No signature provided in webhook request');
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
    console.log('✅ Webhook signature verified successfully');
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    console.log('=== WEBHOOK EVENT RECEIVED ===');
    console.log('Event type:', event.type);
    console.log('Event ID:', event.id);
    console.log('Event created:', new Date((event as any).created * 1000).toISOString());

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        let userId = subscription.metadata?.userId;

        // Access current_period_end using any assertion to avoid TypeScript errors
        const currentPeriodEnd = (subscription as any).current_period_end;
        const periodEndDate = currentPeriodEnd
          ? new Date(currentPeriodEnd * 1000).toISOString()
          : null;

        const priceId = subscription.items.data[0]?.price.id;

        console.log('📦 Subscription Event Details:', {
          eventType: event.type,
          subscriptionId: subscription.id,
          customerId,
          userId: userId || 'MISSING',
          status: subscription.status,
          priceId,
          periodEnd: periodEndDate,
        });

        // CRITICAL: Metadata fallback - find user by customer ID if userId is missing
        if (!userId) {
          console.warn('⚠️ No userId in metadata, attempting fallback lookup by customer ID');
          const { data: user, error: lookupError } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (lookupError) {
            console.error('❌ Customer ID lookup error:', lookupError);
          }

          if (user) {
            userId = user.id;
            console.log('✅ Found user by customer ID:', userId);
          } else {
            console.error('❌ Could not find user with customer ID:', customerId);
            console.error('   This subscription cannot be linked to a user!');
            // Still try to continue in case we can link it later
          }
        }

        // If we still don't have a userId, we cannot proceed
        if (!userId) {
          console.error('❌ CRITICAL: No userId available, cannot update database');
          return NextResponse.json({ received: true, warning: 'No userId' });
        }

        // Check if there was a scheduled change and if it has now taken effect
        // If the subscription plan changed, clear the scheduled change fields
        const { data: currentUserData } = await supabaseAdmin
          .from('users')
          .select('subscription_plan, scheduled_plan_change')
          .eq('id', userId)
          .single();

        const clearScheduledChange = currentUserData?.scheduled_plan_change &&
          currentUserData?.subscription_plan !== priceId;

        // Update user subscription status in database
        console.log('💾 Updating database for user:', userId);
        const updateData: any = {
          stripe_customer_id: customerId,
          stripe_subscription_id: subscription.id,
          subscription_status: subscription.status,
          subscription_plan: priceId,
          subscription_current_period_end: periodEndDate,
        };

        // Clear scheduled change if the plan actually changed
        if (clearScheduledChange) {
          console.log('🔄 Scheduled plan change has taken effect, clearing scheduled fields');
          updateData.scheduled_plan_change = null;
          updateData.scheduled_change_date = null;
        }

        const { error, data: updateResult } = await supabaseAdmin
          .from('users')
          .update(updateData)
          .eq('id', userId)
          .select();

        if (error) {
          console.error('❌ Database update error:', error);
          console.error('   Error details:', JSON.stringify(error, null, 2));
        } else {
          console.log('✅ Successfully updated subscription in database');
          console.log('   Updated data:', updateResult);
        }

        // Track referral if this is a new subscription (created event only)
        if (event.type === 'customer.subscription.created') {
          console.log('🔍 Checking for referral relationship...');
          const { data: userData } = await supabaseAdmin
            .from('users')
            .select('invited_by')
            .eq('id', userId)
            .single();

          if (userData?.invited_by) {
            console.log('👥 User was referred by:', userData.invited_by);

            // Atomic increment using RPC (fixes race condition)
            // This uses a single UPDATE statement: SET referrals_count = referrals_count + 1
            const { error: incrementError } = await supabaseAdmin.rpc(
              'increment_referrals_count',
              { user_id: userData.invited_by }
            );

            if (incrementError) {
              console.error('❌ Failed to increment referrals_count:', incrementError);
              console.error('   Error details:', JSON.stringify(incrementError, null, 2));
            } else {
              console.log('✅ Referral tracked atomically for referrer:', userData.invited_by);
              console.log('   🎉 User', userId, 'subscribed via referral!');
            }
          } else {
            console.log('ℹ️ No referral relationship found');
          }
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        let userId = subscription.metadata?.userId;

        console.log('🗑️ Subscription Deletion Event:', {
          subscriptionId: subscription.id,
          customerId,
          userId: userId || 'MISSING',
        });

        // CRITICAL: Metadata fallback for deletion events too
        if (!userId) {
          console.warn('⚠️ No userId in deletion metadata, attempting fallback');
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (user) {
            userId = user.id;
            console.log('✅ Found user by customer ID:', userId);
          } else {
            console.error('❌ Could not find user for deletion event');
            return NextResponse.json({ received: true, warning: 'No userId for deletion' });
          }
        }

        // CRITICAL: Reset ALL subscription fields, not just status and plan
        console.log('💾 Resetting subscription to free tier for user:', userId);
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            stripe_subscription_id: null,
            subscription_status: 'canceled',
            subscription_plan: null,
            subscription_current_period_end: null,
            scheduled_plan_change: null,
            scheduled_change_date: null,
          })
          .eq('id', userId);

        if (error) {
          console.error('❌ Error resetting subscription:', error);
        } else {
          console.log('✅ Successfully reset subscription to free tier');
        }

        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const customerId = session.customer as string;

        console.log('🛒 Checkout Session Completed:', {
          sessionId: session.id,
          userId: userId || 'MISSING',
          customerId,
          mode: session.mode,
        });

        if (userId && customerId) {
          console.log('💾 Saving customer ID to database');
          const { error } = await supabaseAdmin
            .from('users')
            .update({
              stripe_customer_id: customerId,
            })
            .eq('id', userId);

          if (error) {
            console.error('❌ Error saving customer ID:', error);
          } else {
            console.log('✅ Customer ID saved successfully');
          }
        } else {
          console.warn('⚠️ Missing userId or customerId in checkout.session.completed');
        }

        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
