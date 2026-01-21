/**
 * Subscription plan configuration
 * Defines limits and features for each plan tier
 */

export type PlanTier = 'free' | 'basic' | 'ultra';

export interface PlanConfig {
  name: string;
  tier: PlanTier;
  monthlyGenerationLimit: number | null; // null = unlimited
  dailyRateLimit: number | null; // null = no daily limit
  features: string[];
}

export const PLAN_CONFIGS: Record<PlanTier, PlanConfig> = {
  free: {
    name: 'Free',
    tier: 'free',
    monthlyGenerationLimit: 5,
    dailyRateLimit: null, // No daily limit needed since monthly is low
    features: [
      'Up to 5 meal plans per month',
      'Basic recipes',
      'Shopping list generation',
    ],
  },
  basic: {
    name: 'Basic',
    tier: 'basic',
    monthlyGenerationLimit: null, // Unlimited
    dailyRateLimit: 50,
    features: [
      'Unlimited meal plans',
      'Advanced recipes',
      'Shopping list generation',
      'Inventory tracking',
      'Priority support',
    ],
  },
  ultra: {
    name: 'Ultra',
    tier: 'ultra',
    monthlyGenerationLimit: null, // Unlimited
    dailyRateLimit: 100,
    features: [
      'Unlimited meal plans',
      'Premium recipes',
      'Shopping list generation',
      'Inventory tracking',
      'AI Chef Chat',
      'Dietary analysis',
      'Meal prep guides',
      'Priority support',
    ],
  },
};

/**
 * Get plan tier from Stripe price ID
 */
export function getPlanTierFromPriceId(priceId: string | null | undefined): PlanTier {
  if (!priceId) return 'free';

  const basicPriceId = process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID;
  const ultraPriceId = process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID;

  if (priceId === basicPriceId) return 'basic';
  if (priceId === ultraPriceId) return 'ultra';

  // If price ID doesn't match known IDs but user has it, assume basic
  // This handles legacy/migrated subscriptions
  return 'basic';
}

/**
 * Get plan config from subscription status and plan
 */
export function getPlanConfig(
  subscriptionStatus: string | null | undefined,
  subscriptionPlan: string | null | undefined
): PlanConfig {
  // Not subscribed = free tier
  if (!subscriptionStatus || subscriptionStatus === 'canceled' || !subscriptionPlan) {
    return PLAN_CONFIGS.free;
  }

  // Active or trialing subscription
  if (subscriptionStatus === 'active' || subscriptionStatus === 'trialing') {
    const tier = getPlanTierFromPriceId(subscriptionPlan);
    return PLAN_CONFIGS[tier];
  }

  // Any other status (past_due, etc.) - treat as free for safety
  return PLAN_CONFIGS.free;
}

/**
 * Check if a plan has unlimited generations
 */
export function hasUnlimitedGenerations(tier: PlanTier): boolean {
  return PLAN_CONFIGS[tier].monthlyGenerationLimit === null;
}

/**
 * Get generation period duration in days
 */
export const GENERATION_PERIOD_DAYS = 30;
