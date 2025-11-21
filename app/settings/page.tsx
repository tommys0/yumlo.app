'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface UserData {
  email: string;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_current_period_end?: string;
  scheduled_plan_change?: string;
  scheduled_change_date?: string;
  name?: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  macro_goals?: {
    protein?: number;
    carbs?: number;
    fats?: number;
    calories?: number;
  };
  cuisine_preferences?: string[];
}

interface PriceData {
  id: string;
  amount: number | null;
  currency: string;
  interval: string;
}

interface StripePrices {
  basic: PriceData;
  ultra: PriceData;
}

const formatPrice = (amount: number | null, currency: string) => {
  if (!amount) return '0';
  const price = amount / 100;
  if (currency.toLowerCase() === 'czk') {
    return `${Math.round(price)} Kč`;
  }
  return `${price} ${currency.toUpperCase()}`;
};

const dietaryOptions = [
  'None', 'Vegetarian', 'Vegan', 'Pescatarian', 'Keto', 'Paleo',
  'Gluten-Free', 'Dairy-Free', 'Low-Carb',
];

const cuisineOptions = [
  'None', 'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American',
  'Indian', 'French', 'Japanese', 'Thai', 'Middle Eastern',
];

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [activeSection, setActiveSection] = useState<'user' | 'subscription' | 'security'>('subscription');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Preferences editing state
  const [editingPreferences, setEditingPreferences] = useState(false);
  const [preferenceData, setPreferenceData] = useState({
    name: '',
    dietary_restrictions: [] as string[],
    allergies: '',
    macro_goals: { protein: '', carbs: '', fats: '', calories: '' },
    cuisine_preferences: [] as string[],
  });

  const [message, setMessage] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [prices, setPrices] = useState<StripePrices | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  useEffect(() => {
    let subscription: any;

    // Check for upgrade success/cancel in URL params
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('upgrade') === 'success') {
      setMessage('✅ Upgrade successful! Your new plan is now active.');
      // Remove the URL parameter
      window.history.replaceState({}, '', '/settings');
    } else if (urlParams.get('upgrade') === 'canceled') {
      setMessage('❌ Upgrade canceled. You can try again anytime.');
      window.history.replaceState({}, '', '/settings');
    }

    const init = async () => {
      // Get user and prices in parallel
      const [authResult] = await Promise.all([
        supabase.auth.getUser(),
        fetchPrices(),
      ]);

      const { data: { user } } = authResult;

      if (!user) {
        router.push('/login');
        return;
      }

      // Fetch user data from database
      const { data } = await supabase
        .from('users')
        .select('subscription_status, subscription_plan, subscription_current_period_end, scheduled_plan_change, scheduled_change_date, onboarding_completed, name, dietary_restrictions, allergies, macro_goals, cuisine_preferences')
        .eq('id', user.id)
        .single();

      // Check if onboarding is completed
      if (data && !data.onboarding_completed) {
        console.log('Onboarding not completed, redirecting...');
        router.push('/onboarding');
        return;
      }

      const newUserData = {
        email: user.email || '',
        subscription_status: data?.subscription_status,
        subscription_plan: data?.subscription_plan,
        subscription_current_period_end: data?.subscription_current_period_end,
        scheduled_plan_change: data?.scheduled_plan_change,
        scheduled_change_date: data?.scheduled_change_date,
        name: data?.name,
        dietary_restrictions: data?.dietary_restrictions || [],
        allergies: data?.allergies || [],
        macro_goals: data?.macro_goals,
        cuisine_preferences: data?.cuisine_preferences || [],
      };

      console.log('User data loaded:', newUserData);
      setUserData(newUserData);

      // Initialize preference data for editing
      setPreferenceData({
        name: data?.name || '',
        dietary_restrictions: data?.dietary_restrictions || [],
        allergies: (data?.allergies || []).join(', '),
        macro_goals: {
          protein: data?.macro_goals?.protein?.toString() || '',
          carbs: data?.macro_goals?.carbs?.toString() || '',
          fats: data?.macro_goals?.fats?.toString() || '',
          calories: data?.macro_goals?.calories?.toString() || '',
        },
        cuisine_preferences: data?.cuisine_preferences || [],
      });

      setLoading(false);

      // Set up real-time subscription using the user we already have
      subscription = supabase
        .channel('subscription-changes')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'users',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('🔔 Real-time update detected:', payload);
            // Automatically refresh user data when DB changes
            checkUser();
          }
        )
        .subscribe();

      console.log('✅ Real-time sync enabled');
    };

    init();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        subscription.unsubscribe();
        console.log('🔕 Real-time sync disabled');
      }
    };
  }, [router]);

  const fetchPrices = async () => {
    try {
      // Check if prices are cached in sessionStorage
      const cachedPrices = sessionStorage.getItem('stripe_prices');
      const cacheTimestamp = sessionStorage.getItem('stripe_prices_timestamp');
      const now = Date.now();

      // Use cached prices if they exist and are less than 1 hour old
      if (cachedPrices && cacheTimestamp && (now - parseInt(cacheTimestamp)) < 3600000) {
        console.log('Using cached prices');
        setPrices(JSON.parse(cachedPrices));
        return;
      }

      // Fetch fresh prices from API
      console.log('Fetching fresh prices from API');
      const response = await fetch('/api/stripe/prices');
      const data = await response.json();
      if (response.ok) {
        console.log('Prices loaded:', data);
        setPrices(data);

        // Cache the prices in sessionStorage
        sessionStorage.setItem('stripe_prices', JSON.stringify(data));
        sessionStorage.setItem('stripe_prices_timestamp', now.toString());
      }
    } catch (error) {
      console.error('Error fetching prices:', error);
    }
  };

  const checkUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch user data from database
    const { data } = await supabase
      .from('users')
      .select('subscription_status, subscription_plan, subscription_current_period_end, scheduled_plan_change, scheduled_change_date, onboarding_completed, name, dietary_restrictions, allergies, macro_goals, cuisine_preferences')
      .eq('id', user.id)
      .single();

    // Check if onboarding is completed
    if (data && !data.onboarding_completed) {
      console.log('Onboarding not completed, redirecting...');
      router.push('/onboarding');
      return;
    }

    const newUserData = {
      email: user.email || '',
      subscription_status: data?.subscription_status,
      subscription_plan: data?.subscription_plan,
      subscription_current_period_end: data?.subscription_current_period_end,
      scheduled_plan_change: data?.scheduled_plan_change,
      scheduled_change_date: data?.scheduled_change_date,
      name: data?.name,
      dietary_restrictions: data?.dietary_restrictions || [],
      allergies: data?.allergies || [],
      macro_goals: data?.macro_goals,
      cuisine_preferences: data?.cuisine_preferences || [],
    };

    console.log('User data loaded:', newUserData);
    setUserData(newUserData);

    // Initialize preference data for editing
    setPreferenceData({
      name: data?.name || '',
      dietary_restrictions: data?.dietary_restrictions || [],
      allergies: (data?.allergies || []).join(', '),
      macro_goals: {
        protein: data?.macro_goals?.protein?.toString() || '',
        carbs: data?.macro_goals?.carbs?.toString() || '',
        fats: data?.macro_goals?.fats?.toString() || '',
        calories: data?.macro_goals?.calories?.toString() || '',
      },
      cuisine_preferences: data?.cuisine_preferences || [],
    });

    setLoading(false);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      setMessage('Error updating password: ' + error.message);
    } else {
      setMessage('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleCancelSubscription = async () => {
    setConfirmModalData({
      title: 'Cancel Subscription?',
      message: 'You will lose access to unlimited generations at the end of your billing period.',
      onConfirm: async () => {
        setShowConfirmModal(false);
        setPortalLoading(true);
        try {
          const response = await fetch('/api/stripe/cancel-subscription', {
            method: 'POST',
          });

          const data = await response.json();

          if (response.ok) {
            setMessage('Subscription cancelled successfully. You can still use your plan until the end of the billing period.');
            // Refresh user data
            await checkUser();
          } else {
            setMessage(data.error || 'Failed to cancel subscription');
          }
        } catch (error) {
          setMessage('Error cancelling subscription');
          console.error(error);
        } finally {
          setPortalLoading(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleCancelPlanChange = async () => {
    setConfirmModalData({
      title: 'Cancel Scheduled Plan Change?',
      message: 'Your plan will remain on the current tier and you will not be downgraded.',
      onConfirm: async () => {
        setShowConfirmModal(false);
        setPortalLoading(true);
        try {
          const response = await fetch('/api/stripe/cancel-plan-change', {
            method: 'POST',
          });

          const data = await response.json();

          if (response.ok) {
            setMessage('✅ Scheduled plan change cancelled! You will stay on your current plan.');
            // Refresh user data
            await checkUser();
          } else {
            setMessage(data.error || 'Failed to cancel plan change');
          }
        } catch (error) {
          setMessage('Error cancelling plan change');
          console.error(error);
        } finally {
          setPortalLoading(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleChangePlan = async (newPriceId: string, planName: string, isDowngrade: boolean) => {
    console.log('handleChangePlan called:', { newPriceId, planName, isDowngrade });

    const action = isDowngrade ? 'downgrade' : 'upgrade';
    const title = isDowngrade ? `Downgrade to ${planName}?` : `Upgrade to ${planName}?`;
    const modalMessage = isDowngrade
      ? `You'll keep your current plan until the end of this billing period, then automatically switch to ${planName}.`
      : `You'll be charged the full price immediately and your billing cycle will reset to today.`;

    console.log('Showing confirmation modal:', modalMessage);

    // Show custom modal and wait for user confirmation
    setConfirmModalData({
      title,
      message: modalMessage,
      onConfirm: async () => {
        console.log('User confirmed, proceeding with plan change');
        setShowConfirmModal(false);
        setPortalLoading(true);
        try {
          const response = await fetch('/api/stripe/change-plan', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ newPriceId }),
          });

          const data = await response.json();

          if (response.ok) {
            // If upgrade requires checkout, redirect to Stripe
            if (data.requiresCheckout && data.checkoutUrl) {
              console.log('Redirecting to Stripe checkout:', data.checkoutUrl);
              window.location.href = data.checkoutUrl;
              return; // Don't show message or stop loading - we're redirecting
            }

            if (isDowngrade) {
              const periodEnd = userData?.subscription_current_period_end
                ? new Date(userData.subscription_current_period_end).toLocaleDateString()
                : 'the end of your billing period';
              setMessage(`✅ Downgrade scheduled! You'll keep your current Ultra plan and features until ${periodEnd}. After that, you'll be switched to ${planName} and charged accordingly.`);
            } else {
              setMessage(`✅ Plan upgraded! You now have access to ${planName} features. Your billing cycle has been reset to today.`);
            }
            // Refresh user data
            await checkUser();
          } else {
            setMessage(data.error || `Failed to ${action} plan`);
          }
        } catch (error) {
          setMessage(`Error ${action}ing plan`);
          console.error(error);
        } finally {
          setPortalLoading(false);
        }
      },
    });
    setShowConfirmModal(true);
  };

  const handleDietaryToggle = (option: string) => {
    setPreferenceData((prev) => {
      const isSelected = prev.dietary_restrictions.includes(option);
      if (isSelected) {
        return { ...prev, dietary_restrictions: prev.dietary_restrictions.filter((item) => item !== option) };
      }
      if (option === 'None') {
        return { ...prev, dietary_restrictions: ['None'] };
      }
      return {
        ...prev,
        dietary_restrictions: prev.dietary_restrictions.filter((item) => item !== 'None').concat(option),
      };
    });
  };

  const handleCuisineToggle = (option: string) => {
    setPreferenceData((prev) => {
      const isSelected = prev.cuisine_preferences.includes(option);
      if (isSelected) {
        return { ...prev, cuisine_preferences: prev.cuisine_preferences.filter((item) => item !== option) };
      }
      if (option === 'None') {
        return { ...prev, cuisine_preferences: ['None'] };
      }
      return {
        ...prev,
        cuisine_preferences: prev.cuisine_preferences.filter((item) => item !== 'None').concat(option),
      };
    });
  };

  const handleSavePreferences = async () => {
    setMessage('');
    setPortalLoading(true);

    try {
      const allergiesArray = preferenceData.allergies
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      const macroGoals =
        preferenceData.macro_goals.protein ||
        preferenceData.macro_goals.carbs ||
        preferenceData.macro_goals.fats ||
        preferenceData.macro_goals.calories
          ? {
              protein: preferenceData.macro_goals.protein ? parseInt(preferenceData.macro_goals.protein) : null,
              carbs: preferenceData.macro_goals.carbs ? parseInt(preferenceData.macro_goals.carbs) : null,
              fats: preferenceData.macro_goals.fats ? parseInt(preferenceData.macro_goals.fats) : null,
              calories: preferenceData.macro_goals.calories ? parseInt(preferenceData.macro_goals.calories) : null,
            }
          : null;

      const response = await fetch('/api/user/update-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: preferenceData.name,
          dietary_restrictions: preferenceData.dietary_restrictions,
          allergies: allergiesArray,
          macro_goals: macroGoals,
          cuisine_preferences: preferenceData.cuisine_preferences,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Preferences updated successfully!');
        setEditingPreferences(false);
        await checkUser();
      } else {
        setMessage(data.error || 'Failed to update preferences');
      }
    } catch (error) {
      setMessage('Error updating preferences');
      console.error(error);
    } finally {
      setPortalLoading(false);
    }
  };

  const getPlanName = (planId?: string) => {
    if (!planId) return 'Free';

    if (!prices) return 'Loading...';

    // Check against fetched Stripe price IDs
    if (planId === prices.basic.id) {
      return `Basic (${formatPrice(prices.basic.amount, prices.basic.currency)}/month)`;
    }
    if (planId === prices.ultra.id) {
      return `Ultra (${formatPrice(prices.ultra.amount, prices.ultra.currency)}/month)`;
    }

    return 'Free';
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
        <div style={{ minHeight: '100vh', padding: '40px 20px', background: '#0a0a0a' }}>
          <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            {/* Header skeleton */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ ...skeletonStyle, width: '120px', height: '14px', marginBottom: '20px' }} />
              <div style={{ ...skeletonStyle, width: '150px', height: '36px', marginBottom: '8px' }} />
            </div>

            {/* Tabs skeleton */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
              {[1, 2, 3].map((i) => (
                <div key={i} style={{ ...skeletonStyle, width: '100px', height: '32px' }} />
              ))}
            </div>

            {/* Content skeleton */}
            <div style={{ background: '#111', border: '1px solid #333', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
              <div style={{ ...skeletonStyle, width: '200px', height: '24px', marginBottom: '16px' }} />
              <div style={{ marginBottom: '16px' }}>
                <div style={{ ...skeletonStyle, width: '100px', height: '14px', marginBottom: '8px' }} />
                <div style={{ ...skeletonStyle, width: '250px', height: '18px' }} />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <div style={{ ...skeletonStyle, width: '100px', height: '14px', marginBottom: '8px' }} />
                <div style={{ ...skeletonStyle, width: '180px', height: '18px' }} />
              </div>
              <div style={{ ...skeletonStyle, width: '140px', height: '40px', marginTop: '16px' }} />
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <Link
            href="/dashboard"
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'inline-block',
            }}
          >
            ← Zpět na dashboard
          </Link>
          <h1 style={{ fontSize: '36px', marginBottom: '8px', color: '#fff' }}>Nastavení</h1>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', borderBottom: '1px solid #333', paddingBottom: '12px' }}>
          {['subscription', 'user', 'security'].map((section) => (
            <button
              key={section}
              onClick={() => setActiveSection(section as any)}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                background: activeSection === section ? '#fff' : 'transparent',
                color: activeSection === section ? '#000' : '#888',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: activeSection === section ? 'bold' : 'normal',
                textTransform: 'capitalize',
              }}
            >
              {section}
            </button>
          ))}
        </div>

        {/* Subscription Section */}
        {activeSection === 'subscription' && (
        <div
          style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>Subscription</h2>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Current Plan</p>
            <p style={{ fontSize: '18px', fontWeight: 'bold', color: '#fff' }}>
              {getPlanName(userData?.subscription_plan)}
            </p>
            {userData?.subscription_status && userData.subscription_status !== 'canceled' && (
              <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Status: {userData.subscription_status}
              </p>
            )}
            {userData?.subscription_current_period_end && (
              <p style={{ fontSize: '14px', color: '#666', marginTop: '4px' }}>
                Renews on: {new Date(userData.subscription_current_period_end).toLocaleDateString()}
              </p>
            )}
          </div>

          {/* Scheduled Plan Change Notice */}
          {userData?.scheduled_plan_change && userData?.scheduled_change_date && (
            <div
              style={{
                background: '#1a1a1a',
                border: '1px solid #ff9800',
                borderRadius: '8px',
                padding: '12px 16px',
                marginTop: '16px',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '14px', color: '#ff9800', fontWeight: 'bold', marginBottom: '4px' }}>
                    ⚠️ Scheduled Plan Change
                  </p>
                  <p style={{ fontSize: '14px', color: '#ccc' }}>
                    Your plan will change to <strong>{getPlanName(userData.scheduled_plan_change)}</strong> on{' '}
                    <strong>{new Date(userData.scheduled_change_date).toLocaleDateString()}</strong>
                  </p>
                </div>
                <button
                  onClick={handleCancelPlanChange}
                  disabled={portalLoading}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    background: 'transparent',
                    color: '#ff9800',
                    border: '1px solid #ff9800',
                    borderRadius: '6px',
                    cursor: portalLoading ? 'not-allowed' : 'pointer',
                    opacity: portalLoading ? 0.7 : 1,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {portalLoading ? 'Canceling...' : 'Cancel Change'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '16px' }}>
            {userData?.subscription_status && userData.subscription_status !== 'canceled' ? (
              <>
                {/* Upgrade button - show if not on Ultra */}
                {prices && userData.subscription_plan !== prices.ultra.id && (
                  <button
                    onClick={() => {
                      console.log('Upgrade button clicked!', { ultraId: prices.ultra.id });
                      handleChangePlan(prices.ultra.id, 'Ultra', false);
                    }}
                    disabled={portalLoading}
                    style={{
                      padding: '10px 20px',
                      fontSize: '14px',
                      background: '#fff',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: portalLoading ? 'not-allowed' : 'pointer',
                      opacity: portalLoading ? 0.7 : 1,
                    }}
                  >
                    {portalLoading ? 'Processing...' : 'Upgrade to Ultra'}
                  </button>
                )}
                {/* Downgrade button - show ONLY if currently on Ultra in DB */}
                {/* Don't show if already downgraded (plan shows as Basic but still have Ultra access) */}
                {prices && userData.subscription_plan === prices.ultra.id && userData.subscription_status === 'active' && (
                  <button
                    onClick={() => handleChangePlan(prices.basic.id, 'Basic', true)}
                    disabled={portalLoading}
                    style={{
                      padding: '10px 20px',
                      fontSize: '13px',
                      background: 'transparent',
                      color: '#666',
                      border: '1px solid #444',
                      borderRadius: '8px',
                      cursor: portalLoading ? 'not-allowed' : 'pointer',
                      opacity: portalLoading ? 0.7 : 1,
                    }}
                  >
                    {portalLoading ? 'Processing...' : 'Downgrade to Basic'}
                  </button>
                )}
                <button
                  onClick={handleCancelSubscription}
                  disabled={portalLoading}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    background: '#dc3545',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: portalLoading ? 'not-allowed' : 'pointer',
                    opacity: portalLoading ? 0.7 : 1,
                  }}
                >
                  {portalLoading ? 'Canceling...' : 'Cancel Subscription'}
                </button>
              </>
            ) : (
              <Link
                href="/pricing"
                style={{
                  display: 'inline-block',
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: '#fff',
                  color: '#000',
                  textDecoration: 'none',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                }}
              >
                Upgrade Plan
              </Link>
            )}
          </div>
        </div>
        )}

        {/* User Preferences Section */}
        {activeSection === 'user' && (
        <div
          style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>User Preferences</h2>

          {!editingPreferences ? (
            <>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#888', marginBottom: '8px' }}>Name</p>
                <p style={{ fontSize: '16px', color: '#fff' }}>{userData?.name || 'Not set'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#888', marginBottom: '8px' }}>Dietary Restrictions</p>
                <p style={{ fontSize: '16px', color: '#fff' }}>
                  {userData?.dietary_restrictions && userData.dietary_restrictions.length > 0
                    ? userData.dietary_restrictions.join(', ')
                    : 'None set'}
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#888', marginBottom: '8px' }}>Allergies</p>
                <p style={{ fontSize: '16px', color: '#fff' }}>
                  {userData?.allergies && userData.allergies.length > 0
                    ? userData.allergies.join(', ')
                    : 'None set'}
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#888', marginBottom: '8px' }}>Macro Goals</p>
                <p style={{ fontSize: '16px', color: '#fff' }}>
                  {userData?.macro_goals
                    ? `Protein: ${userData.macro_goals.protein || '-'}g, Carbs: ${userData.macro_goals.carbs || '-'}g, Fats: ${userData.macro_goals.fats || '-'}g, Calories: ${userData.macro_goals.calories || '-'}`
                    : 'None set'}
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <p style={{ color: '#888', marginBottom: '8px' }}>Cuisine Preferences</p>
                <p style={{ fontSize: '16px', color: '#fff' }}>
                  {userData?.cuisine_preferences && userData.cuisine_preferences.length > 0
                    ? userData.cuisine_preferences.join(', ')
                    : 'None set'}
                </p>
              </div>
              <button
                onClick={() => setEditingPreferences(true)}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Edit Preferences
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Name</label>
                <input
                  type="text"
                  value={preferenceData.name}
                  onChange={(e) => setPreferenceData({ ...preferenceData, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Dietary Restrictions</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {dietaryOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleDietaryToggle(option)}
                      style={{
                        padding: '8px',
                        fontSize: '13px',
                        background: preferenceData.dietary_restrictions.includes(option) ? '#fff' : '#1a1a1a',
                        color: preferenceData.dietary_restrictions.includes(option) ? '#000' : '#fff',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Allergies (comma-separated)</label>
                <input
                  type="text"
                  value={preferenceData.allergies}
                  onChange={(e) => setPreferenceData({ ...preferenceData, allergies: e.target.value })}
                  placeholder="e.g., peanuts, shellfish, soy"
                  style={{
                    width: '100%',
                    padding: '10px',
                    fontSize: '14px',
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Macro Goals (optional)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <input
                    type="number"
                    value={preferenceData.macro_goals.protein}
                    onChange={(e) =>
                      setPreferenceData({
                        ...preferenceData,
                        macro_goals: { ...preferenceData.macro_goals, protein: e.target.value },
                      })
                    }
                    placeholder="Protein (g)"
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="number"
                    value={preferenceData.macro_goals.carbs}
                    onChange={(e) =>
                      setPreferenceData({
                        ...preferenceData,
                        macro_goals: { ...preferenceData.macro_goals, carbs: e.target.value },
                      })
                    }
                    placeholder="Carbs (g)"
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="number"
                    value={preferenceData.macro_goals.fats}
                    onChange={(e) =>
                      setPreferenceData({
                        ...preferenceData,
                        macro_goals: { ...preferenceData.macro_goals, fats: e.target.value },
                      })
                    }
                    placeholder="Fats (g)"
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="number"
                    value={preferenceData.macro_goals.calories}
                    onChange={(e) =>
                      setPreferenceData({
                        ...preferenceData,
                        macro_goals: { ...preferenceData.macro_goals, calories: e.target.value },
                      })
                    }
                    placeholder="Calories"
                    style={{
                      padding: '10px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>Cuisine Preferences</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '8px' }}>
                  {cuisineOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleCuisineToggle(option)}
                      style={{
                        padding: '8px',
                        fontSize: '13px',
                        background: preferenceData.cuisine_preferences.includes(option) ? '#fff' : '#1a1a1a',
                        color: preferenceData.cuisine_preferences.includes(option) ? '#000' : '#fff',
                        border: '1px solid #333',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={handleSavePreferences}
                  disabled={portalLoading}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    background: portalLoading ? '#555' : '#fff',
                    color: portalLoading ? '#aaa' : '#000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: portalLoading ? 'not-allowed' : 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {portalLoading ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  onClick={() => setEditingPreferences(false)}
                  disabled={portalLoading}
                  style={{
                    padding: '10px 20px',
                    fontSize: '14px',
                    background: 'transparent',
                    color: '#888',
                    border: '1px solid #444',
                    borderRadius: '8px',
                    cursor: portalLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
        <>
        <div
          style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
            marginBottom: '24px',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>Account</h2>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: '#888', marginBottom: '8px' }}>Email</p>
            <p style={{ fontSize: '16px', color: '#fff' }}>{userData?.email}</p>
          </div>
        </div>

        {/* Password Section */}
        <div
          style={{
            background: '#111',
            border: '1px solid #333',
            borderRadius: '12px',
            padding: '24px',
          }}
        >
          <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>Change Password</h2>
          <form onSubmit={handlePasswordChange}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#888' }}>
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '14px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
                required
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                background: '#333',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
              }}
            >
              Update Password
            </button>
          </form>
          {message && (
            <p
              style={{
                marginTop: '16px',
                color: message.includes('Error') ? '#ff4444' : '#44ff44',
              }}
            >
              {message}
            </p>
          )}
        </div>
        </>
        )}
      </div>

      {/* Custom Confirmation Modal */}
      {showConfirmModal && confirmModalData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => {
            setShowConfirmModal(false);
            console.log('User cancelled modal by clicking backdrop');
          }}
        >
          <div
            style={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '12px',
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>
              {confirmModalData.title}
            </h2>
            <p style={{ fontSize: '16px', color: '#ccc', marginBottom: '32px', lineHeight: '1.5' }}>
              {confirmModalData.message}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  console.log('User cancelled modal');
                }}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  background: 'transparent',
                  color: '#888',
                  border: '1px solid #444',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmModalData.onConfirm}
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
