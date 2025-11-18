/**
 * Universal subscription helper utilities
 * Use these functions consistently across the entire app
 */

export interface SubscriptionData {
  subscription_status?: string | null;
  subscription_plan?: string | null;
}

/**
 * Check if a user has an active subscription
 * Returns true if status is 'active' or 'trialing'
 */
export const isSubscribed = (user: SubscriptionData | null | undefined): boolean => {
  if (!user) return false;
  return user.subscription_status === 'active' || user.subscription_status === 'trialing';
};

/**
 * Check if a user has a specific plan
 */
export const hasPlan = (user: SubscriptionData | null | undefined, priceId: string): boolean => {
  if (!user || !isSubscribed(user)) return false;
  return user.subscription_plan === priceId;
};

/**
 * Check if user is on free tier
 */
export const isFree = (user: SubscriptionData | null | undefined): boolean => {
  return !isSubscribed(user);
};

/**
 * Get subscription tier name from price ID
 */
export const getPlanTier = (priceId: string | null | undefined): 'free' | 'basic' | 'ultra' => {
  if (!priceId) return 'free';

  // Check against environment variables
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID) {
    return 'basic';
  }
  if (priceId === process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID) {
    return 'ultra';
  }

  return 'free';
};
