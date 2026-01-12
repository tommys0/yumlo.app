"use client";

import { useState, useEffect } from "react";

export interface PriceData {
  id: string;
  amount: number | null;
  currency: string;
  interval: string;
}

export interface StripePrices {
  basic: PriceData;
  ultra: PriceData;
}

// Cache prices in memory to avoid refetching on every component mount
let cachedPrices: StripePrices | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function formatPrice(amount: number | null, currency: string): string {
  if (!amount) return "0";
  const price = amount / 100; // Stripe amounts are in cents
  if (currency.toLowerCase() === "czk") {
    return `${Math.round(price)} Kč`;
  }
  return `${price} ${currency.toUpperCase()}`;
}

export function usePrices() {
  const [prices, setPrices] = useState<StripePrices | null>(cachedPrices);
  const [loading, setLoading] = useState(!cachedPrices);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      // Check if cache is still valid
      if (cachedPrices && Date.now() - cacheTimestamp < CACHE_DURATION) {
        setPrices(cachedPrices);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch("/api/stripe/prices");
        const data = await response.json();

        if (response.ok) {
          cachedPrices = data;
          cacheTimestamp = Date.now();
          setPrices(data);
          setError(null);
        } else {
          setError(data.error || "Failed to fetch prices");
        }
      } catch (err) {
        console.error("Error fetching prices:", err);
        setError("Failed to fetch prices");
      } finally {
        setLoading(false);
      }
    };

    fetchPrices();
  }, []);

  return { prices, loading, error, formatPrice };
}
