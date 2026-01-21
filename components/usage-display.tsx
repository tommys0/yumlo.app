"use client";

import { useUsage, formatGenerationsRemaining, getUsageColorClass, canGenerate } from "@/lib/hooks/use-usage";
import Link from "next/link";

interface UsageDisplayProps {
  showUpgradeButton?: boolean;
  compact?: boolean;
}

export function UsageDisplay({ showUpgradeButton = true, compact = false }: UsageDisplayProps) {
  const { usage, loading, error } = useUsage();

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail - don't block UI
  }

  if (!usage) return null;

  const canGenerateNow = canGenerate(usage);
  const colorClass = getUsageColorClass(usage);

  if (compact) {
    return (
      <div className={`text-sm ${colorClass}`}>
        {usage.generations.isUnlimited ? (
          <span>✓ Unlimited generations</span>
        ) : (
          <span>
            {usage.generations.remaining}/{usage.generations.limit} generations
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Meal Plan Generations</h3>
          <p className={`text-lg font-semibold ${colorClass}`}>
            {formatGenerationsRemaining(usage)}
          </p>
          {!usage.generations.isUnlimited && usage.periodResetDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Resets {new Date(usage.periodResetDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {showUpgradeButton && !usage.generations.isUnlimited && (
          <Link
            href="/pricing"
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Upgrade
          </Link>
        )}
      </div>

      {/* Warning when low on generations */}
      {!usage.generations.isUnlimited && (usage.generations.remaining ?? 0) <= 1 && (
        <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <p className="text-sm text-orange-800 dark:text-orange-300">
            {usage.generations.remaining === 0 ? (
              <>
                You've used all your free generations this month.{" "}
                <Link href="/pricing" className="font-semibold underline">
                  Upgrade to Basic or Ultra
                </Link>{" "}
                for unlimited meal plans.
              </>
            ) : (
              <>
                You have only {usage.generations.remaining} generation left.{" "}
                <Link href="/pricing" className="font-semibold underline">
                  Upgrade
                </Link>{" "}
                to continue creating meal plans.
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Inline usage indicator for headers/navbars
 */
export function UsageIndicator() {
  const { usage, loading } = useUsage();

  if (loading || !usage) return null;

  const colorClass = getUsageColorClass(usage);

  return (
    <span className={`text-xs ${colorClass}`}>
      {usage.generations.isUnlimited
        ? "∞"
        : `${usage.generations.remaining}/${usage.generations.limit}`}
    </span>
  );
}

/**
 * Banner shown when limit is reached
 */
export function LimitReachedBanner() {
  const { usage } = useUsage();

  if (!usage || canGenerate(usage)) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-red-600 dark:bg-red-700 text-white p-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div>
          <p className="font-semibold">Generation Limit Reached</p>
          <p className="text-sm opacity-90">
            {usage.generations.isUnlimited
              ? "You've reached your daily rate limit. Please try again tomorrow."
              : `You've used all ${usage.generations.limit} free generations this month.`}
          </p>
        </div>
        {!usage.generations.isUnlimited && (
          <Link
            href="/pricing"
            className="px-6 py-2 bg-white text-red-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            Upgrade Now
          </Link>
        )}
      </div>
    </div>
  );
}
