'use client';

import Link from 'next/link';

export default function Home() {

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 20px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
        {/* Navigation */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '60px' }}>
          <Link
            href="/pricing"
            style={{
              padding: '8px 16px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Pricing
          </Link>
          <Link
            href="/login"
            style={{
              padding: '8px 16px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px',
            }}
          >
            Login
          </Link>
        </div>

        {/* Hero Section */}
        <h1 style={{ fontSize: '64px', marginBottom: '24px', color: '#fff', fontWeight: 'bold' }}>
          Welcome to Yumlo
        </h1>
        <p style={{ fontSize: '24px', color: '#888', marginBottom: '48px', lineHeight: '1.5' }}>
          AI-powered meal planning tailored to your inventory, dietary needs, and macro goals
        </p>

        {/* CTA Buttons */}
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '80px' }}>
          <Link
            href="/register"
            style={{
              padding: '16px 32px',
              backgroundColor: '#fff',
              color: '#000',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 'bold',
            }}
          >
            Start Free Trial
          </Link>
          <Link
            href="/pricing"
            style={{
              padding: '16px 32px',
              backgroundColor: '#333',
              color: '#fff',
              textDecoration: 'none',
              borderRadius: '8px',
              fontSize: '16px',
            }}
          >
            View Pricing
          </Link>
        </div>

        {/* Features */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              AI-Powered Recipes
            </h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Generate personalized meal plans based on your preferences
            </p>
          </div>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              Dietary Tracking
            </h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Manage allergies, restrictions, and macro goals
            </p>
          </div>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              5 Free Generations
            </h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Try it out with no commitment required
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
