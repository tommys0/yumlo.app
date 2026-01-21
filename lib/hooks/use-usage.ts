"use client";

import { useState, useEffect, useCallback } from "react";

export interface UsageStats {
  planTier: "free" | "basic" | "ultra";
  planName: string;
  generations: {
    used: number;
    limit: number | null;
    remaining: number | null;
    isUnlimited: boolean;
  };
  daily: {
    used: number;
    limit: number | null;
    isUnlimited: boolean;
  };
  periodResetDate: string | null;
  totalLifetime: number;
}

export function useUsage() {
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/usage", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch usage stats");
      }

      const data = await response.json();
      setUsage(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching usage:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, error, refetch: fetchUsage };
}

/**
 * Format remaining generations for display
 */
export function formatGenerationsRemaining(usage: UsageStats | null): string {
  if (!usage) return "Loading...";

  if (usage.generations.isUnlimited) {
    return "Unlimited";
  }

  if (usage.generations.remaining === 0) {
    return "0 remaining";
  }

  return `${usage.generations.remaining} of ${usage.generations.limit} remaining`;
}

/**
 * Get color class based on remaining generations
 */
export function getUsageColorClass(usage: UsageStats | null): string {
  if (!usage) return "text-gray-500";

  if (usage.generations.isUnlimited) {
    return "text-green-600";
  }

  const remaining = usage.generations.remaining ?? 0;
  const limit = usage.generations.limit ?? 5;
  const percentUsed = ((limit - remaining) / limit) * 100;

  if (percentUsed >= 100) return "text-red-600";
  if (percentUsed >= 80) return "text-orange-500";
  if (percentUsed >= 60) return "text-yellow-500";
  return "text-green-600";
}

/**
 * Check if user can generate (for UI purposes)
 */
export function canGenerate(usage: UsageStats | null): boolean {
  if (!usage) return true; // Default to allowing while loading

  // Unlimited monthly
  if (usage.generations.isUnlimited) {
    // Check daily limit for paid users
    if (!usage.daily.isUnlimited && usage.daily.used >= (usage.daily.limit ?? 0)) {
      return false;
    }
    return true;
  }

  // Monthly limit check for free users
  return (usage.generations.remaining ?? 0) > 0;
}
