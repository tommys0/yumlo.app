'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function WaitlistForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      console.log('Waitlist referral code detected:', ref);
    }
  }, [searchParams]);

  const copyReferralLink = async () => {
    if (!myReferralCode) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const referralLink = `${baseUrl}/waitlist?ref=${myReferralCode}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, referralCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPosition(data.position);
        setMessage(data.message);
        setMyReferralCode(data.referralCode);
        setName('');
        setEmail('');
      } else {
        setMessage(data.error || 'Failed to join waitlist');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div style={{ maxWidth: '500px', width: '100%', textAlign: 'center' }}>
        {/* Logo/Title */}
        <h1
          style={{
            fontSize: '48px',
            fontWeight: 'bold',
            color: '#fff',
            marginBottom: '16px',
          }}
        >
          Yumlo
        </h1>

        {success ? (
          // Success state
          <div>
            <div
              style={{
                fontSize: '48px',
                marginBottom: '24px',
              }}
            >
              ✅
            </div>
            <h2
              style={{
                fontSize: '24px',
                color: '#fff',
                marginBottom: '16px',
              }}
            >
              You're on the list!
            </h2>
            <p
              style={{
                fontSize: '16px',
                color: '#888',
                marginBottom: '8px',
              }}
            >
              {message}
            </p>
            {position && (
              <p
                style={{
                  fontSize: '14px',
                  color: '#666',
                  marginBottom: '32px',
                }}
              >
                You're #{position} in line
              </p>
            )}
            <p
              style={{
                fontSize: '14px',
                color: '#888',
                marginBottom: '32px',
              }}
            >
              We'll email you when we launch. 🚀
            </p>

            {/* Referral Section */}
            {myReferralCode && (
              <div
                style={{
                  background: '#111',
                  border: '1px solid #333',
                  borderRadius: '12px',
                  padding: '24px',
                  textAlign: 'left',
                }}
              >
                <h3
                  style={{
                    fontSize: '18px',
                    color: '#fff',
                    marginBottom: '12px',
                  }}
                >
                  Invite Friends
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    color: '#888',
                    marginBottom: '16px',
                  }}
                >
                  Share your referral link and move up the waitlist!
                </p>
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                  }}
                >
                  <input
                    type="text"
                    readOnly
                    value={`${process.env.NEXT_PUBLIC_BASE_URL || typeof window !== 'undefined' ? window.location.origin : ''}/waitlist?ref=${myReferralCode}`}
                    style={{
                      flex: 1,
                      padding: '12px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                    }}
                  />
                  <button
                    onClick={copyReferralLink}
                    style={{
                      padding: '12px 24px',
                      fontSize: '14px',
                      fontWeight: 'bold',
                      background: copied ? '#44ff44' : '#fff',
                      color: '#000',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'background 0.2s',
                    }}
                  >
                    {copied ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Form state
          <div>
            <p
              style={{
                fontSize: '18px',
                color: '#888',
                marginBottom: '32px',
                lineHeight: '1.6',
              }}
            >
              AI-powered meal planning tailored to your dietary needs, preferences, and macro goals.
            </p>

            <form onSubmit={handleSubmit}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  background: '#111',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  marginBottom: '12px',
                  outline: 'none',
                }}
              />

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  background: '#111',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  outline: 'none',
                }}
              />

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: loading ? '#333' : '#fff',
                  color: loading ? '#666' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                }}
              >
                {loading ? 'Joining...' : 'Join the Waitlist'}
              </button>

              {message && !success && (
                <p
                  style={{
                    fontSize: '14px',
                    color: '#ff4444',
                    marginBottom: '16px',
                  }}
                >
                  {message}
                </p>
              )}
            </form>

            <p
              style={{
                fontSize: '12px',
                color: '#666',
                marginTop: '32px',
              }}
            >
              Already have access?{' '}
              <Link
                href="/login"
                style={{
                  color: '#fff',
                  textDecoration: 'underline',
                }}
              >
                Sign in
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#fff' }}>Loading...</div>
      </div>
    }>
      <WaitlistForm />
    </Suspense>
  );
}
