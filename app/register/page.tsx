'use client';

import { useState, useEffect, Suspense } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref) {
      setReferralCode(ref);
      console.log('Referral code detected:', ref);
    }
  }, [searchParams]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      console.log('Registration successful:', data);

      // If there's a referral code, save the referral relationship
      if (referralCode && data.user) {
        try {
          // Look up the referrer by their referral code
          const { data: referrer, error: referrerError } = await supabase
            .from('users')
            .select('id')
            .eq('referral_code', referralCode.toUpperCase())
            .single();

          if (referrerError) {
            console.error('Error looking up referrer:', referrerError);
          } else if (referrer) {
            // Wait for the user row to be created by the trigger (with retries)
            let userExists = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!userExists && attempts < maxAttempts) {
              const { data: userCheck } = await supabase
                .from('users')
                .select('id')
                .eq('id', data.user.id)
                .single();

              if (userCheck) {
                userExists = true;
              } else {
                await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
                attempts++;
              }
            }

            if (userExists) {
              // Update the new user's invited_by field
              const { error: updateError } = await supabase
                .from('users')
                .update({ invited_by: referrer.id })
                .eq('id', data.user.id);

              if (updateError) {
                console.error('Error saving referral relationship:', updateError);
              } else {
                console.log('Referral relationship saved:', {
                  newUserId: data.user.id,
                  referrerId: referrer.id,
                  referralCode: referralCode,
                });
              }
            } else {
              console.error('User row was not created in time');
            }
          } else {
            console.warn('Referral code not found:', referralCode);
          }
        } catch (refError) {
          console.error('Error processing referral:', refError);
          // Don't fail registration if referral processing fails
        }
      }

      setSuccess(true);

      setTimeout(() => {
        router.push('/onboarding');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError('');
    try {
      // If there's a referral code, pass it through the OAuth flow
      const redirectUrl = referralCode
        ? `${window.location.origin}/onboarding?ref=${referralCode}`
        : `${window.location.origin}/onboarding`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred with Google sign-up');
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px' }}>
      <h1>Register</h1>

      {/* Google Sign-Up */}
      <button
        onClick={handleGoogleSignup}
        type="button"
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: '#fff',
          color: '#333',
          border: '1px solid #ccc',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontWeight: '500',
        }}
      >
        <svg width="18" height="18" viewBox="0 0 18 18">
          <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"/>
          <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"/>
          <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18l2.67-2.07z"/>
          <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.3z"/>
        </svg>
        Continue with Google
      </button>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        marginBottom: '20px',
        color: '#888',
      }}>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }}></div>
        <span style={{ padding: '0 10px', fontSize: '14px' }}>OR</span>
        <div style={{ flex: 1, height: '1px', backgroundColor: '#ccc' }}></div>
      </div>

      <form onSubmit={handleRegister}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="email" style={{ display: 'block', marginBottom: '5px' }}>
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="password" style={{ display: 'block', marginBottom: '5px' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="confirmPassword" style={{ display: 'block', marginBottom: '5px' }}>
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>

        {error && (
          <div style={{ color: 'red', marginBottom: '15px' }}>{error}</div>
        )}

        {success && (
          <div style={{ color: 'green', marginBottom: '15px' }}>
            Registration successful! Taking you to onboarding...
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#0070f3',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Registering...' : 'Register'}
        </button>
      </form>

      <p style={{ marginTop: '20px', textAlign: 'center' }}>
        Already have an account? <a href="/login">Login</a>
      </p>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#333' }}>Loading...</div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
