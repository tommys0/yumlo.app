'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);

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
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPosition(data.position);
        setMessage(data.message);
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
              }}
            >
              We'll email you when we launch. 🚀
            </p>
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
