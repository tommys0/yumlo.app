import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import Stripe from 'stripe';

// This is needed to allow raw body parsing for webhook signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
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
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const userId = subscription.metadata.userId;

        console.log('Processing subscription event:', {
          eventType: event.type,
          subscriptionId: subscription.id,
          customerId,
          userId,
          status: subscription.status,
          priceId: subscription.items.data[0]?.price.id,
        });

        if (!userId) {
          console.error('No userId in subscription metadata, trying to find by customer ID');
          // Try to find user by customer ID
          const { data: user } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('stripe_customer_id', customerId)
            .single();

          if (user) {
            console.log('Found user by customer ID:', user.id);
            const { error } = await supabaseAdmin
              .from('users')
              .update({
                stripe_subscription_id: subscription.id,
                subscription_status: subscription.status,
                subscription_plan: subscription.items.data[0]?.price.id,
                subscription_current_period_end: new Date(
                  subscription.current_period_end * 1000
                ).toISOString(),
              })
              .eq('id', user.id);

            if (error) {
              console.error('Error updating user subscription:', error);
            } else {
              console.log('Successfully updated subscription for user:', user.id);
            }
          } else {
            console.error('Could not find user with customer ID:', customerId);
          }
          break;
        }

        // Update user subscription status
        const { error } = await supabaseAdmin
          .from('users')
          .update({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            subscription_plan: subscription.items.data[0]?.price.id,
            subscription_current_period_end: new Date(
              subscription.current_period_end * 1000
            ).toISOString(),
          })
          .eq('id', userId);

        if (error) {
          console.error('Error updating user subscription:', error);
        } else {
          console.log('Successfully updated subscription for user:', userId);
        }

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.userId;

        // Update user to free tier
        await supabaseAdmin
          .from('users')
          .update({
            subscription_status: 'canceled',
            subscription_plan: null,
          })
          .eq('id', userId);

        break;
      }

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;

        if (userId && session.customer) {
          // Store customer ID
          await supabaseAdmin
            .from('users')
            .update({
              stripe_customer_id: session.customer as string,
            })
            .eq('id', userId);
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
