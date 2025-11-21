'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Quick auth check in background (non-blocking)
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user);
    });
  }, []);

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
            Ceník
          </Link>
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              style={{
                padding: '8px 16px',
                backgroundColor: '#fff',
                color: '#000',
                textDecoration: 'none',
                fontSize: '14px',
                borderRadius: '4px',
                fontWeight: 'bold',
              }}
            >
              Přejít na Dashboard
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                padding: '8px 16px',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '14px',
              }}
            >
              Přihlásit se
            </Link>
          )}
        </div>

        {/* Hero Section */}
        <h1 style={{ fontSize: '64px', marginBottom: '24px', color: '#fff', fontWeight: 'bold' }}>
          Vítejte v Yumlo
        </h1>
        <p style={{ fontSize: '24px', color: '#888', marginBottom: '48px', lineHeight: '1.5' }}>
          Plánování jídel s umělou inteligencí přizpůsobené vaší zásobě, stravovacím potřebám a makro cílům
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
            Začít zdarma
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
            Zobrazit ceník
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
              Recepty s umělou inteligencí
            </h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Vytvářejte personalizované jídelníčky podle vašich preferencí
            </p>
          </div>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              Sledování stravy
            </h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Spravujte alergie, omezení a makro cíle
            </p>
          </div>
          <div style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '20px', marginBottom: '8px', color: '#fff' }}>
              5 generování zdarma
            </h3>
            <p style={{ color: '#888', fontSize: '14px' }}>
              Vyzkoušejte bez závazků
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
