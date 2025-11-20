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
  scheduled_plan_change?: string;
  scheduled_change_date?: string;
  referral_code?: string;
  referrals_count?: number;
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
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
          "subscription_status, subscription_plan, generation_count, generation_limit, scheduled_plan_change, scheduled_change_date, onboarding_completed, referral_code, referrals_count",
        )
        .eq("id", user.id)
        .single();

      // Check if onboarding is completed
      if (data && !data.onboarding_completed) {
        console.log('Onboarding not completed, redirecting...');
        router.push("/onboarding");
        return;
      }

      setUser(user);
      setUserData(data);
      setLoading(false);

      // Set up real-time subscription to listen for DB changes
      const subscription = supabase
        .channel('dashboard-subscription-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 Dashboard: Real-time update detected:', payload);
            // Automatically update user data when DB changes
            const newData = payload.new as any;
            setUserData({
              subscription_status: newData.subscription_status,
              subscription_plan: newData.subscription_plan,
              generation_count: newData.generation_count,
              generation_limit: newData.generation_limit,
              scheduled_plan_change: newData.scheduled_plan_change,
              scheduled_change_date: newData.scheduled_change_date,
              referral_code: newData.referral_code,
              referrals_count: newData.referrals_count,
            });
          }
        )
        .subscribe();

      console.log('✅ Dashboard: Real-time sync enabled');

      // Cleanup on unmount
      return () => {
        subscription.unsubscribe();
        console.log('🔕 Dashboard: Real-time sync disabled');
      };
    };

    getUser();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const copyReferralLink = async () => {
    if (!userData?.referral_code) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const referralLink = `${baseUrl}/register?ref=${userData.referral_code}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
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

  // Skeleton shimmer animation styles
  const shimmerStyles = `
    @keyframes shimmer {
      0% { background-position: -1000px 0; }
      100% { background-position: 1000px 0; }
    }
  `;

  const skeletonStyle: React.CSSProperties = {
    background: 'linear-gradient(90deg, #1a1a1a 25%, #2a2a2a 50%, #1a1a1a 75%)',
    backgroundSize: '1000px 100%',
    animation: 'shimmer 2s infinite',
    borderRadius: '6px',
  };

  if (loading) {
    return (
      <>
        <style>{shimmerStyles}</style>
        <div style={{ minHeight: "100vh", padding: "40px 20px", background: "#0a0a0a" }}>
          <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
            {/* Header skeleton */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
              <div style={{ ...skeletonStyle, width: "150px", height: "36px" }} />
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ ...skeletonStyle, width: "80px", height: "40px" }} />
                <div style={{ ...skeletonStyle, width: "80px", height: "40px" }} />
              </div>
            </div>

            {/* Welcome section skeleton */}
            <div style={{ background: "#111", border: "1px solid #333", borderRadius: "12px", padding: "24px", marginBottom: "24px" }}>
              <div style={{ ...skeletonStyle, width: "200px", height: "24px", marginBottom: "8px" }} />
              <div style={{ ...skeletonStyle, width: "150px", height: "16px" }} />
            </div>

            {/* Stats grid skeleton */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "24px" }}>
              {[1, 2].map((i) => (
                <div key={i} style={{ background: "#111", border: "1px solid #333", borderRadius: "12px", padding: "24px" }}>
                  <div style={{ ...skeletonStyle, width: "140px", height: "14px", marginBottom: "8px" }} />
                  <div style={{ ...skeletonStyle, width: "100px", height: "32px" }} />
                </div>
              ))}
            </div>

            {/* Main content skeleton */}
            <div style={{ background: "#111", border: "1px solid #333", borderRadius: "12px", padding: "32px", textAlign: "center" }}>
              <div style={{ ...skeletonStyle, width: "200px", height: "20px", margin: "0 auto 16px" }} />
              <div style={{ ...skeletonStyle, width: "300px", height: "16px", margin: "0 auto 24px" }} />
              <div style={{ ...skeletonStyle, width: "180px", height: "40px", margin: "0 auto" }} />
            </div>
          </div>
        </div>
      </>
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

        {/* Referral Section */}
        {userData?.referral_code && (
          <div
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: "12px",
              padding: "24px",
              marginBottom: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ fontSize: "18px", color: "#fff" }}>
                Invite Friends
              </h3>
              <p style={{ color: "#888", fontSize: "14px" }}>
                {userData.referrals_count || 0} referrals
              </p>
            </div>
            <p style={{ color: "#888", fontSize: "14px", marginBottom: "16px" }}>
              Share your referral link and get rewarded when your friends subscribe!
            </p>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <input
                type="text"
                readOnly
                value={`${process.env.NEXT_PUBLIC_BASE_URL || typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${userData.referral_code}`}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "14px",
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "8px",
                  fontFamily: "monospace",
                }}
              />
              <button
                onClick={copyReferralLink}
                style={{
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  background: copied ? "#44ff44" : "#fff",
                  color: copied ? "#000" : "#000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "✓ Copied!" : "Copy Link"}
              </button>
            </div>
          </div>
        )}

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
