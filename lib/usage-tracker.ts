/**
 * Usage tracking service for meal plan generation limits
 */

import { SupabaseClient } from '@supabase/supabase-js';
import {
  getPlanConfig,
  GENERATION_PERIOD_DAYS,
  PlanTier,
  hasUnlimitedGenerations,
} from './subscription-plans';

export interface UsageData {
  generationsUsedThisPeriod: number;
  generationsToday: number;
  periodStart: Date;
  totalLifetime: number;
}

export interface UsageCheckResult {
  allowed: boolean;
  reason?: 'monthly_limit' | 'daily_limit' | 'period_reset_needed';
  currentUsage: number;
  limit: number | null;
  remaining: number | null;
  periodResetDate?: Date;
  planTier: PlanTier;
}

export interface UserSubscriptionData {
  id: string;
  subscription_status: string | null;
  subscription_plan: string | null;
  generations_used_this_period: number;
  generation_period_start: string | null;
  generations_today: number;
  generations_today_date: string | null;
  total_generations_lifetime: number;
}

/**
 * Check if period needs reset (30 days elapsed)
 */
function needsPeriodReset(periodStart: Date | null): boolean {
  if (!periodStart) return true;

  const now = new Date();
  const daysSincePeriodStart = Math.floor(
    (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  return daysSincePeriodStart >= GENERATION_PERIOD_DAYS;
}

/**
 * Calculate when period will reset
 */
function getNextResetDate(periodStart: Date | null): Date {
  if (!periodStart) return new Date();

  const resetDate = new Date(periodStart);
  resetDate.setDate(resetDate.getDate() + GENERATION_PERIOD_DAYS);
  return resetDate;
}

/**
 * Check if user can generate a meal plan
 * Returns detailed result with usage info
 */
export async function checkGenerationAllowed(
  supabase: SupabaseClient,
  userId: string
): Promise<UsageCheckResult> {
  // Fetch user data
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      id,
      subscription_status,
      subscription_plan,
      generations_used_this_period,
      generation_period_start,
      generations_today,
      generations_today_date,
      total_generations_lifetime
    `)
    .eq('id', userId)
    .single();

  if (error || !userData) {
    console.error('Error fetching user for usage check:', error);
    // Default to allowing (fail open) but log the error
    return {
      allowed: true,
      currentUsage: 0,
      limit: null,
      remaining: null,
      planTier: 'free',
    };
  }

  const user = userData as UserSubscriptionData;
  const planConfig = getPlanConfig(user.subscription_status, user.subscription_plan);
  const periodStart = user.generation_period_start
    ? new Date(user.generation_period_start)
    : null;

  // Check if period needs reset (for free users)
  if (!hasUnlimitedGenerations(planConfig.tier) && needsPeriodReset(periodStart)) {
    return {
      allowed: true, // Allow, but flag that reset is needed
      reason: 'period_reset_needed',
      currentUsage: 0,
      limit: planConfig.monthlyGenerationLimit,
      remaining: planConfig.monthlyGenerationLimit,
      periodResetDate: getNextResetDate(new Date()),
      planTier: planConfig.tier,
    };
  }

  // Check monthly limit (for free users)
  if (planConfig.monthlyGenerationLimit !== null) {
    const currentUsage = user.generations_used_this_period || 0;

    if (currentUsage >= planConfig.monthlyGenerationLimit) {
      return {
        allowed: false,
        reason: 'monthly_limit',
        currentUsage,
        limit: planConfig.monthlyGenerationLimit,
        remaining: 0,
        periodResetDate: getNextResetDate(periodStart),
        planTier: planConfig.tier,
      };
    }

    return {
      allowed: true,
      currentUsage,
      limit: planConfig.monthlyGenerationLimit,
      remaining: planConfig.monthlyGenerationLimit - currentUsage,
      periodResetDate: getNextResetDate(periodStart),
      planTier: planConfig.tier,
    };
  }

  // Check daily rate limit (for paid users)
  if (planConfig.dailyRateLimit !== null) {
    // Reset daily counter if date changed
    const today = new Date().toISOString().split('T')[0];
    const userDate = user.generations_today_date;
    const generationsToday = userDate === today ? (user.generations_today || 0) : 0;

    if (generationsToday >= planConfig.dailyRateLimit) {
      return {
        allowed: false,
        reason: 'daily_limit',
        currentUsage: generationsToday,
        limit: planConfig.dailyRateLimit,
        remaining: 0,
        planTier: planConfig.tier,
      };
    }

    return {
      allowed: true,
      currentUsage: generationsToday,
      limit: planConfig.dailyRateLimit,
      remaining: planConfig.dailyRateLimit - generationsToday,
      planTier: planConfig.tier,
    };
  }

  // Unlimited with no rate limit
  return {
    allowed: true,
    currentUsage: user.generations_used_this_period || 0,
    limit: null,
    remaining: null,
    planTier: planConfig.tier,
  };
}

/**
 * Increment generation count after successful generation
 * Should be called AFTER the generation completes successfully
 */
export async function incrementGenerationCount(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Use RPC function for atomic increment
    const { data, error } = await supabase.rpc('increment_generation_count', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error incrementing generation count:', error);
      return { success: false, error: error.message };
    }

    console.log('Generation count incremented:', data);
    return { success: true };
  } catch (err: any) {
    console.error('Exception incrementing generation count:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Reset generation period for a user
 * Called when subscription changes or period expires
 */
export async function resetGenerationPeriod(
  supabase: SupabaseClient,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.rpc('reset_generation_period', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error resetting generation period:', error);
      return { success: false, error: error.message };
    }

    console.log('Generation period reset for user:', userId);
    return { success: true };
  } catch (err: any) {
    console.error('Exception resetting generation period:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get usage statistics for display
 */
export async function getUsageStats(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  planTier: PlanTier;
  planName: string;
  generationsUsed: number;
  generationsLimit: number | null;
  generationsRemaining: number | null;
  dailyUsed: number;
  dailyLimit: number | null;
  periodResetDate: Date | null;
  totalLifetime: number;
} | null> {
  const { data: userData, error } = await supabase
    .from('users')
    .select(`
      subscription_status,
      subscription_plan,
      generations_used_this_period,
      generation_period_start,
      generations_today,
      generations_today_date,
      total_generations_lifetime
    `)
    .eq('id', userId)
    .single();

  if (error || !userData) {
    console.error('Error fetching usage stats:', error);
    return null;
  }

  const planConfig = getPlanConfig(userData.subscription_status, userData.subscription_plan);
  const periodStart = userData.generation_period_start
    ? new Date(userData.generation_period_start)
    : null;

  // Check if period needs reset
  let generationsUsed = userData.generations_used_this_period || 0;
  if (!hasUnlimitedGenerations(planConfig.tier) && needsPeriodReset(periodStart)) {
    generationsUsed = 0; // Will be reset on next generation
  }

  // Reset daily counter if date changed
  const today = new Date().toISOString().split('T')[0];
  const dailyUsed = userData.generations_today_date === today
    ? (userData.generations_today || 0)
    : 0;

  return {
    planTier: planConfig.tier,
    planName: planConfig.name,
    generationsUsed,
    generationsLimit: planConfig.monthlyGenerationLimit,
    generationsRemaining: planConfig.monthlyGenerationLimit !== null
      ? Math.max(0, planConfig.monthlyGenerationLimit - generationsUsed)
      : null,
    dailyUsed,
    dailyLimit: planConfig.dailyRateLimit,
    periodResetDate: periodStart ? getNextResetDate(periodStart) : null,
    totalLifetime: userData.total_generations_lifetime || 0,
  };
}
