'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const dietaryOptions = [
  'None',
  'Vegetarian',
  'Vegan',
  'Pescatarian',
  'Keto',
  'Paleo',
  'Gluten-Free',
  'Dairy-Free',
  'Low-Carb',
];

const cuisineOptions = [
  'Italian',
  'Mexican',
  'Asian',
  'Mediterranean',
  'American',
  'Indian',
  'French',
  'Japanese',
  'Thai',
  'Middle Eastern',
];

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    dietary_restrictions: [] as string[],
    allergies: '',
    macro_goals: {
      protein: '',
      carbs: '',
      fats: '',
      calories: '',
    },
    cuisine_preferences: [] as string[],
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
      }
    };
    checkAuth();
  }, [router]);

  const handleDietaryToggle = (e: React.MouseEvent, option: string) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setFormData(prev => ({
      ...prev,
      dietary_restrictions: prev.dietary_restrictions.includes(option)
        ? prev.dietary_restrictions.filter(item => item !== option)
        : [...prev.dietary_restrictions, option],
    }));
  };

  const handleCuisineToggle = (e: React.MouseEvent, option: string) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling
    setFormData(prev => ({
      ...prev,
      cuisine_preferences: prev.cuisine_preferences.includes(option)
        ? prev.cuisine_preferences.filter(item => item !== option)
        : [...prev.cuisine_preferences, option],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert allergies string to array
      const allergiesArray = formData.allergies
        .split(',')
        .map(item => item.trim())
        .filter(item => item.length > 0);

      // Prepare macro goals (only include if provided)
      const macroGoals = (formData.macro_goals.protein || formData.macro_goals.carbs || formData.macro_goals.fats || formData.macro_goals.calories)
        ? {
            protein: formData.macro_goals.protein ? parseInt(formData.macro_goals.protein) : null,
            carbs: formData.macro_goals.carbs ? parseInt(formData.macro_goals.carbs) : null,
            fats: formData.macro_goals.fats ? parseInt(formData.macro_goals.fats) : null,
            calories: formData.macro_goals.calories ? parseInt(formData.macro_goals.calories) : null,
          }
        : null;

      const response = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          dietary_restrictions: formData.dietary_restrictions,
          allergies: allergiesArray,
          macro_goals: macroGoals,
          cuisine_preferences: formData.cuisine_preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save preferences');
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && !formData.name.trim()) {
      setError('Please enter your name');
      return;
    }
    setError('');
    setStep(step + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(step - 1);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', padding: '40px 20px' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        {/* Progress indicator */}
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px', color: '#fff' }}>
            Welcome to Yumlo!
          </h1>
          <p style={{ color: '#888', marginBottom: '20px' }}>
            Let&apos;s personalize your meal planning experience
          </p>
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            {[1, 2, 3, 4].map(num => (
              <div
                key={num}
                style={{
                  flex: 1,
                  height: '4px',
                  background: num <= step ? '#fff' : '#333',
                  borderRadius: '2px',
                }}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Name */}
          {step === 1 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>
                What&apos;s your name?
              </h2>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '8px',
                }}
              />
            </div>
          )}

          {/* Step 2: Dietary Restrictions */}
          {step === 2 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>
                Any dietary restrictions?
              </h2>
              <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
                Select all that apply
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {dietaryOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => handleDietaryToggle(e, option)}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      background: formData.dietary_restrictions.includes(option) ? '#fff' : '#1a1a1a',
                      color: formData.dietary_restrictions.includes(option) ? '#000' : '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Allergies & Macro Goals */}
          {step === 3 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>
                Allergies & Goals
              </h2>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>
                  Food Allergies (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  placeholder="e.g., peanuts, shellfish, soy"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '16px',
                    background: '#1a1a1a',
                    color: '#fff',
                    border: '1px solid #333',
                    borderRadius: '8px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', color: '#888', fontSize: '14px' }}>
                  Macro Goals (optional)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <input
                    type="number"
                    value={formData.macro_goals.protein}
                    onChange={(e) => setFormData({ ...formData, macro_goals: { ...formData.macro_goals, protein: e.target.value } })}
                    placeholder="Protein (g)"
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="number"
                    value={formData.macro_goals.carbs}
                    onChange={(e) => setFormData({ ...formData, macro_goals: { ...formData.macro_goals, carbs: e.target.value } })}
                    placeholder="Carbs (g)"
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="number"
                    value={formData.macro_goals.fats}
                    onChange={(e) => setFormData({ ...formData, macro_goals: { ...formData.macro_goals, fats: e.target.value } })}
                    placeholder="Fats (g)"
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                  <input
                    type="number"
                    value={formData.macro_goals.calories}
                    onChange={(e) => setFormData({ ...formData, macro_goals: { ...formData.macro_goals, calories: e.target.value } })}
                    placeholder="Calories"
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      background: '#1a1a1a',
                      color: '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Cuisine Preferences */}
          {step === 4 && (
            <div style={{ marginBottom: '32px' }}>
              <h2 style={{ fontSize: '24px', marginBottom: '16px', color: '#fff' }}>
                Favorite cuisines?
              </h2>
              <p style={{ color: '#888', marginBottom: '16px', fontSize: '14px' }}>
                Select your preferred cuisines
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
                {cuisineOptions.map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => handleCuisineToggle(e, option)}
                    style={{
                      padding: '12px',
                      fontSize: '14px',
                      background: formData.cuisine_preferences.includes(option) ? '#fff' : '#1a1a1a',
                      color: formData.cuisine_preferences.includes(option) ? '#000' : '#fff',
                      border: '1px solid #333',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div style={{ color: '#ff4444', marginBottom: '16px', fontSize: '14px' }}>
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  background: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Back
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: '#fff',
                  color: '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  background: loading ? '#555' : '#fff',
                  color: loading ? '#aaa' : '#000',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                }}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
