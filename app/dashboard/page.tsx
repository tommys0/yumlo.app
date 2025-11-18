"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { isSubscribed } from "@/lib/subscription";

interface UserData {
  subscription_status?: string;
  subscription_plan?: string;
  generation_count: number;
  generation_limit: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      // Fetch user subscription data
      const { data } = await supabase
        .from("users")
        .select(
          "subscription_status, subscription_plan, generation_count, generation_limit",
        )
        .eq("id", user.id)
        .single();

      setUser(user);
      setUserData(data);
      setLoading(false);
    };

    const syncInBackground = async () => {
      try {
        await fetch('/api/stripe/sync-subscription', {
          method: 'POST',
        });
        // Silently refresh data after sync
        setTimeout(() => getUser(), 500);
      } catch (error) {
        // Fail silently - this is just a background sync
        console.log('Background sync failed:', error);
      }
    };

    getUser();
    syncInBackground();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const getPlanName = () => {
    if (
      !userData?.subscription_status ||
      userData.subscription_status === "canceled"
    ) {
      return "Free";
    }
    // Check against actual Stripe price IDs
    if (userData.subscription_plan === "price_1SU4aiQzCEmOXTX6mnfngIiz") {
      return "Basic";
    }
    if (userData.subscription_plan === "price_1SU4bwQzCEmOXTX6YKLtsHLH") {
      return "Ultra";
    }
    return "Free";
  };

  const canGenerate = () => {
    if (isSubscribed(userData)) return true;
    return (
      (userData?.generation_count || 0) < (userData?.generation_limit || 5)
    );
  };

  const generationsRemaining = () => {
    if (isSubscribed(userData)) return "Unlimited";
    const remaining =
      (userData?.generation_limit || 5) - (userData?.generation_count || 0);
    return Math.max(0, remaining);
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
        }}
      >
        <p style={{ color: "#fff" }}>Loading...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        background: "#0a0a0a",
      }}
    >
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "40px",
          }}
        >
          <h1 style={{ fontSize: "36px", color: "#fff" }}>Dashboard</h1>
          <div style={{ display: "flex", gap: "12px" }}>
            <Link
              href="/settings"
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                background: "#333",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "8px",
              }}
            >
              Settings
            </Link>
            <button
              onClick={handleLogout}
              style={{
                padding: "10px 20px",
                fontSize: "14px",
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Welcome Section */}
        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "24px",
            marginBottom: "24px",
          }}
        >
          <h2 style={{ fontSize: "24px", marginBottom: "8px", color: "#fff" }}>
            Welcome back, {user?.email}!
          </h2>
          <p style={{ color: "#888" }}>
            Current Plan:{" "}
            <span style={{ color: "#fff", fontWeight: "bold" }}>
              {getPlanName()}
            </span>
          </p>
        </div>

        {/* Stats Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "24px",
          }}
        >
          {/* Generations Remaining */}
          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
              Generations Remaining
            </p>
            <p style={{ fontSize: "32px", fontWeight: "bold", color: "#fff" }}>
              {generationsRemaining()}
            </p>
            {!isSubscribed(userData) && generationsRemaining() === 0 && (
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  background: "#fff",
                  color: "#000",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontWeight: "bold",
                }}
              >
                Upgrade Now
              </Link>
            )}
          </div>

          {/* Subscription Status */}
          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "24px",
            }}
          >
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
              Subscription Status
            </p>
            <p
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: isSubscribed(userData) ? "#44ff44" : "#888",
              }}
            >
              {isSubscribed(userData) ? "Active" : "Free Tier"}
            </p>
            {!isSubscribed(userData) && (
              <Link
                href="/pricing"
                style={{
                  display: "inline-block",
                  marginTop: "12px",
                  padding: "8px 16px",
                  fontSize: "12px",
                  background: "#333",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "6px",
                }}
              >
                View Plans
              </Link>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div
          style={{
            background: "#111",
            border: "1px solid #333",
            borderRadius: "12px",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h3 style={{ fontSize: "20px", marginBottom: "16px", color: "#fff" }}>
            AI Meal Generation
          </h3>
          <p style={{ color: "#888", marginBottom: "24px" }}>
            Generate personalized meal plans based on your preferences and
            dietary needs
          </p>
          <button
            disabled={!canGenerate()}
            style={{
              padding: "12px 32px",
              fontSize: "16px",
              fontWeight: "bold",
              background: canGenerate() ? "#fff" : "#333",
              color: canGenerate() ? "#000" : "#666",
              border: "none",
              borderRadius: "8px",
              cursor: canGenerate() ? "pointer" : "not-allowed",
              opacity: canGenerate() ? 1 : 0.5,
            }}
          >
            {canGenerate() ? "Generate Meal Plan" : "No Generations Remaining"}
          </button>
          {!canGenerate() && (
            <p
              style={{ marginTop: "16px", color: "#ff4444", fontSize: "14px" }}
            >
              You&apos;ve used all your free generations.{" "}
              <Link
                href="/pricing"
                style={{ color: "#fff", textDecoration: "underline" }}
              >
                Upgrade to continue
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
