'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: '$0',
    period: '/month',
    description: 'Perfect for trying out Yumlo',
    features: [
      '5 AI meal generations',
      'Basic recipe suggestions',
      'Standard support',
    ],
    priceId: null, // Free tier
    buttonText: 'Get Started',
    popular: false,
  },
  {
    name: 'Basic',
    price: '$7',
    period: '/month',
    description: 'Great for regular meal planning',
    features: [
      'Unlimited AI meal generations',
      'Advanced recipe customization',
      'Dietary restrictions & allergies',
      'Macro tracking',
      'Priority support',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID,
    buttonText: 'Subscribe',
    popular: true,
  },
  {
    name: 'Ultra',
    price: '$12',
    period: '/month',
    description: 'For the ultimate meal planning experience',
    features: [
      'Everything in Basic',
      'Meal prep scheduling',
      'Shopping list generation',
      'Nutrition analysis',
      'Family meal planning',
      'Premium support',
    ],
    priceId: process.env.NEXT_PUBLIC_STRIPE_ULTRA_PRICE_ID,
    buttonText: 'Subscribe',
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  const [planLoading, setPlanLoading] = useState(true);

  useEffect(() => {
    // Fetch user's current subscription in background (non-blocking)
    const fetchUserPlan = async () => {
      try {
        const response = await fetch('/api/user/subscription', {
          // Add cache headers for faster subsequent loads
          next: { revalidate: 60 }, // Cache for 60 seconds
        } as any);
        const data = await response.json();
        if (data.subscription_plan) {
          setCurrentPlan(data.subscription_plan);
        }
      } catch (error) {
        console.error('Error fetching user plan:', error);
      } finally {
        setPlanLoading(false);
      }
    };
    fetchUserPlan();
  }, []);

  const handleSubscribe = async (priceId: string | null | undefined, planName: string) => {
    if (!priceId) {
      // Free tier - redirect to register
      router.push('/register');
      return;
    }

    setLoading(planName);

    try {
      const response = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ priceId }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('API Error:', data);
        alert(`Error: ${data.error || 'Failed to create checkout session'}`);
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error('No checkout URL received:', data);
        alert('Failed to start checkout. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ minHeight: '100vh', padding: '40px 20px', background: '#0a0a0a' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Link
            href="/"
            style={{
              color: '#666',
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '20px',
              display: 'inline-block',
            }}
          >
            ← Back to home
          </Link>
          <h1 style={{ fontSize: '48px', marginBottom: '16px', color: '#fff' }}>
            Choose Your Plan
          </h1>
          <p style={{ fontSize: '18px', color: '#888' }}>
            Start with 5 free generations, then upgrade for unlimited AI meal planning
          </p>
        </div>

        {/* Pricing Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
            marginBottom: '40px',
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.popular ? '#1a1a1a' : '#111',
                border: plan.popular ? '2px solid #fff' : '1px solid #333',
                borderRadius: '12px',
                padding: '32px',
                position: 'relative',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {plan.popular && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-12px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#fff',
                    color: '#000',
                    padding: '4px 16px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  MOST POPULAR
                </div>
              )}

              <h3 style={{ fontSize: '24px', marginBottom: '8px', color: '#fff' }}>
                {plan.name}
              </h3>
              <div style={{ marginBottom: '16px' }}>
                <span style={{ fontSize: '48px', fontWeight: 'bold', color: '#fff' }}>
                  {plan.price}
                </span>
                <span style={{ fontSize: '18px', color: '#888' }}>{plan.period}</span>
              </div>
              <p style={{ color: '#888', marginBottom: '24px' }}>{plan.description}</p>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '32px' }}>
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    style={{
                      padding: '8px 0',
                      color: '#ccc',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ marginRight: '8px' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.priceId, plan.name)}
                disabled={loading === plan.name || (!planLoading && currentPlan === plan.priceId)}
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: (!planLoading && currentPlan === plan.priceId) ? '#555' : (plan.popular ? '#fff' : '#333'),
                  color: (!planLoading && currentPlan === plan.priceId) ? '#aaa' : (plan.popular ? '#000' : '#fff'),
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (loading === plan.name || (!planLoading && currentPlan === plan.priceId)) ? 'not-allowed' : 'pointer',
                  opacity: (loading === plan.name || (!planLoading && currentPlan === plan.priceId)) ? 0.7 : 1,
                }}
              >
                {loading === plan.name ? 'Loading...' : (!planLoading && currentPlan === plan.priceId) ? 'Current Plan' : plan.buttonText}
              </button>
            </div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
          <p>All plans include access to our AI-powered meal planning features.</p>
          <p>Cancel anytime. No hidden fees.</p>
        </div>
      </div>
    </div>
  );
}
