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

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [portalLoading, setPortalLoading] = useState(false);
  const [prices, setPrices] = useState<StripePrices | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    checkUser();
    fetchPrices();
  }, []);

  const fetchPrices = async () => {
    try {
      const response = await fetch('/api/stripe/prices');
      const data = await response.json();
      if (response.ok) {
        console.log('Prices loaded:', data);
        setPrices(data);
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
      .select('subscription_status, subscription_plan, subscription_current_period_end')
      .eq('id', user.id)
      .single();

    const newUserData = {
      email: user.email || '',
      subscription_status: data?.subscription_status,
      subscription_plan: data?.subscription_plan,
      subscription_current_period_end: data?.subscription_current_period_end,
    };

    console.log('User data loaded:', newUserData);
    setUserData(newUserData);
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

  const handleSyncWithStripe = async () => {
    setSyncing(true);
    setMessage('');
    try {
      const response = await fetch('/api/stripe/sync-subscription', {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Synced with Stripe! Refreshing...');
        // Refresh user data
        await checkUser();
      } else {
        setMessage(`❌ Sync failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      setMessage('❌ Error syncing with Stripe');
      console.error(error);
    } finally {
      setSyncing(false);
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading...</p>
      </div>
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
            ← Back to dashboard
          </Link>
          <h1 style={{ fontSize: '36px', marginBottom: '8px', color: '#fff' }}>Settings</h1>
        </div>

        {/* Subscription Section */}
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

          {/* Sync button - helpful if webhooks fail or manual changes in Stripe */}
          <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #222' }}>
            <button
              onClick={handleSyncWithStripe}
              disabled={syncing}
              style={{
                padding: '8px 16px',
                fontSize: '13px',
                background: 'transparent',
                color: '#888',
                border: '1px solid #333',
                borderRadius: '6px',
                cursor: syncing ? 'not-allowed' : 'pointer',
                opacity: syncing ? 0.6 : 1,
              }}
            >
              {syncing ? '🔄 Syncing...' : '🔄 Refresh from Stripe'}
            </button>
            <p style={{ fontSize: '11px', color: '#555', marginTop: '6px' }}>
              Click if subscription doesn't match Stripe dashboard
            </p>
          </div>

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

        {/* Account Section */}
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
