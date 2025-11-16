import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-10-29.clover',
  typescript: true,
});

// Price IDs - you'll need to create these in Stripe Dashboard
export const STRIPE_PLANS = {
  basic: process.env.STRIPE_BASIC_PRICE_ID || '',
  ultra: process.env.STRIPE_ULTRA_PRICE_ID || '',
};
