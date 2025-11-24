'use client';

import React, { useState, useEffect } from 'react';
import {
  calculateCaloriesFromMacros,
  validateCaloriesMacros,
  adjustMacrosToCalories,
  parseMacroInputs,
  formatNumber,
  MacroInputs,
  ValidationResult
} from '@/lib/nutrition-utils';

export type InputMode = 'calories-first' | 'macros-first' | 'skip';

interface MacroInputProps {
  value: MacroInputs;
  onChange: (value: MacroInputs) => void;
  isSettingsContext?: boolean; // When true, behaves differently for settings
  initialMode?: InputMode; // Force a specific initial mode
}

export default function MacroInput({ value, onChange, isSettingsContext = false, initialMode }: MacroInputProps) {
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [userRequestedModeChange, setUserRequestedModeChange] = useState(false);

  // Parse current inputs
  const { protein, carbs, fats, calories, hasAnyValue } = parseMacroInputs(value);

  // Auto-detect mode for settings context (only on initial load, not when user requests change)
  React.useEffect(() => {
    if (isSettingsContext && inputMode === null && hasAnyValue && !userRequestedModeChange) {
      // If we have an initial mode specified, use that
      if (initialMode) {
        setInputMode(initialMode);
        return;
      }

      // Auto-detect based on existing data
      // If user has macros but no calories, or if calculated calories match input calories closely, assume macros-first
      const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fats);
      const caloriesDiff = Math.abs(calories - calculatedCalories);

      if (calories === 0 || caloriesDiff <= 10) {
        setInputMode('macros-first');
      } else {
        setInputMode('calories-first');
      }
    } else if (initialMode && inputMode === null && !userRequestedModeChange) {
      setInputMode(initialMode);
    }
  }, [isSettingsContext, hasAnyValue, protein, carbs, fats, calories, initialMode, inputMode, userRequestedModeChange]);

  // Calculate validation when inputs change
  useEffect(() => {
    if (hasAnyValue && inputMode === 'macros-first') {
      const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fats);

      if (calories > 0) {
        // User entered both macros and calories - validate consistency
        const validationResult = validateCaloriesMacros(calories, protein, carbs, fats);
        setValidation(validationResult);

        // Show mismatch dialog for significant differences
        if (!validationResult.withinTolerance && validationResult.difference > 50) {
          setShowMismatchDialog(true);
        }
      } else {
        // Only macros entered - just update calories
        onChange({
          ...value,
          calories: calculatedCalories > 0 ? calculatedCalories.toString() : ''
        });
      }
    }
  }, [protein, carbs, fats, calories, hasAnyValue, inputMode, value, onChange]);

  const handleInputModeSelect = (mode: InputMode) => {
    setInputMode(mode);
    setShowMismatchDialog(false);
    setUserRequestedModeChange(false); // Reset the flag when mode is selected

    if (mode === 'skip') {
      onChange({ protein: '', carbs: '', fats: '', calories: '' });
    }
  };

  const handleMismatchResolve = (action: 'adjust-calories' | 'adjust-macros') => {
    if (!validation) return;

    if (action === 'adjust-calories') {
      // Update calories to match macros
      onChange({
        ...value,
        calories: validation.calculatedCalories.toString()
      });
    } else {
      // Adjust macros to fit calories
      const adjusted = adjustMacrosToCalories(calories, protein, carbs, fats);
      onChange({
        ...value,
        protein: adjusted.protein.toString(),
        carbs: adjusted.carbs.toString(),
        fats: adjusted.fats.toString()
      });
    }

    setShowMismatchDialog(false);
    setValidation(null);
  };

  // Show mode selection if no mode chosen
  if (!inputMode) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', marginBottom: '12px', color: '#fff' }}>
          Jak chcete nastavit nutriční cíle?
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Calories-first mode preview */}
          <button
            type="button"
            onClick={() => handleInputModeSelect('calories-first')}
            style={{
              padding: '16px',
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
              🎯 Nastavit cílové kalorie
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
              Zadám kalorie a pak si rozdělím makra
            </div>

            {/* Preview mockup */}
            <div style={{
              padding: '8px',
              background: '#0f0f0f',
              borderRadius: '6px',
              border: '1px solid #222'
            }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Náhled:</div>
              <div style={{
                padding: '6px 8px',
                background: '#1a1a1a',
                border: '1px solid #333',
                borderRadius: '4px',
                fontSize: '11px',
                color: '#ccc',
                marginBottom: '6px'
              }}>
                Cílové kalorie: 2000 kcal
              </div>
              <div style={{ display: 'flex', gap: '4px' }}>
                {['Bílkoviny', 'Sacharidy', 'Tuky'].map((macro, i) => (
                  <div key={macro} style={{
                    flex: 1,
                    padding: '3px 6px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '3px',
                    fontSize: '9px',
                    color: '#888',
                    textAlign: 'center'
                  }}>
                    {macro}
                  </div>
                ))}
              </div>
              <div style={{
                fontSize: '9px',
                color: '#4ade80',
                marginTop: '4px',
                textAlign: 'center'
              }}>
                Zbývá: 1200 kcal
              </div>
            </div>
          </button>

          {/* Macros-first mode preview */}
          <button
            type="button"
            onClick={() => handleInputModeSelect('macros-first')}
            style={{
              padding: '16px',
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'border-color 0.2s'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#555'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#333'; }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '8px', fontSize: '14px' }}>
              ⚖️ Nastavit makra přímo
            </div>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '12px' }}>
              Zadám gramy bílkovin, sacharidů a tuků
            </div>

            {/* Preview mockup */}
            <div style={{
              padding: '8px',
              background: '#0f0f0f',
              borderRadius: '6px',
              border: '1px solid #222'
            }}>
              <div style={{ fontSize: '10px', color: '#666', marginBottom: '4px' }}>Náhled:</div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '6px' }}>
                {[
                  { name: 'Bílkoviny', value: '150g' },
                  { name: 'Sacharidy', value: '200g' },
                  { name: 'Tuky', value: '80g' }
                ].map((macro) => (
                  <div key={macro.name} style={{
                    flex: 1,
                    padding: '3px 6px',
                    background: '#1a1a1a',
                    border: '1px solid #333',
                    borderRadius: '3px',
                    fontSize: '9px',
                    color: '#ccc',
                    textAlign: 'center'
                  }}>
                    {macro.value}
                  </div>
                ))}
              </div>
              <div style={{
                padding: '4px 6px',
                background: '#1a2a2a',
                borderRadius: '3px',
                fontSize: '9px',
                color: '#4ade80',
                textAlign: 'center'
              }}>
                ✓ Kalorie: 2120 kcal
              </div>
              <div style={{
                fontSize: '8px',
                color: '#666',
                textAlign: 'center',
                marginTop: '2px',
                fontFamily: 'monospace'
              }}>
                4×(150+200) + 9×80
              </div>
            </div>
          </button>

          {!isSettingsContext && (
            <button
              type="button"
              onClick={() => handleInputModeSelect('skip')}
              style={{
                padding: '12px 16px',
                fontSize: '13px',
                background: 'transparent',
                color: '#888',
                border: '1px solid #333',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#555';
                e.currentTarget.style.color = '#ccc';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#333';
                e.currentTarget.style.color = '#888';
              }}
            >
              ⏭️ Přeskočit zatím - nastavím si to později v profilu
            </button>
          )}
        </div>
      </div>
    );
  }

  // Skip mode - show nothing
  if (inputMode === 'skip') {
    return (
      <div style={{ marginBottom: '16px' }}>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>
          Nutriční cíle přeskočeny. Můžete je nastavit později v profilu.
        </p>
        <button
          type="button"
          onClick={() => setInputMode(null)}
          style={{
            padding: '8px 16px',
            fontSize: '12px',
            background: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          Změnit
        </button>
      </div>
    );
  }

  // Calories-first mode
  if (inputMode === 'calories-first') {
    const remainingCalories = calories - calculateCaloriesFromMacros(protein, carbs, fats);

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', color: '#fff', margin: 0 }}>
            🎯 Nutriční cíle (kalorie první)
          </h3>
          {isSettingsContext && (
            <button
              type="button"
              onClick={() => {
                setUserRequestedModeChange(true);
                setInputMode(null);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: '#333',
                color: '#888',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              změnit způsob
            </button>
          )}
        </div>

        {/* Calorie target input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '14px' }}>
            Cílové kalorie
          </label>
          <input
            type="number"
            value={value.calories}
            onChange={(e) => onChange({ ...value, calories: e.target.value })}
            placeholder="např. 2000"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px'
            }}
          />
        </div>

        {/* Show remaining calories */}
        {calories > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: remainingCalories >= 0 ? '#1a2a1a' : '#2a1a1a',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              Zbývající kalorie:
            </div>
            <div style={{
              fontSize: '18px',
              color: remainingCalories >= 0 ? '#4ade80' : '#f87171',
              fontWeight: 'bold'
            }}>
              {remainingCalories} kcal
            </div>
          </div>
        )}

        {/* Macro distribution */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
              Bílkoviny (g)
            </label>
            <input
              type="number"
              value={value.protein}
              onChange={(e) => onChange({ ...value, protein: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '6px'
              }}
            />
            {protein > 0 && (
              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                {protein * 4} kcal
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
              Sacharidy (g)
            </label>
            <input
              type="number"
              value={value.carbs}
              onChange={(e) => onChange({ ...value, carbs: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '6px'
              }}
            />
            {carbs > 0 && (
              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                {carbs * 4} kcal
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
              Tuky (g)
            </label>
            <input
              type="number"
              value={value.fats}
              onChange={(e) => onChange({ ...value, fats: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '6px'
              }}
            />
            {fats > 0 && (
              <div style={{ fontSize: '10px', color: '#888', marginTop: '2px' }}>
                {fats * 9} kcal
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Macros-first mode
  if (inputMode === 'macros-first') {
    const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fats);

    return (
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '18px', color: '#fff', margin: 0 }}>
            ⚖️ Nutriční cíle (makra první)
          </h3>
          {isSettingsContext && (
            <button
              type="button"
              onClick={() => {
                setUserRequestedModeChange(true);
                setInputMode(null);
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: '#333',
                color: '#888',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              změnit způsob
            </button>
          )}
        </div>

        {/* Macro inputs */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
              Bílkoviny (g)
            </label>
            <input
              type="number"
              value={value.protein}
              onChange={(e) => onChange({ ...value, protein: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
              Sacharidy (g)
            </label>
            <input
              type="number"
              value={value.carbs}
              onChange={(e) => onChange({ ...value, carbs: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '6px'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
              Tuky (g)
            </label>
            <input
              type="number"
              value={value.fats}
              onChange={(e) => onChange({ ...value, fats: e.target.value })}
              placeholder="0"
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '14px',
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #333',
                borderRadius: '6px'
              }}
            />
          </div>
        </div>

        {/* Calculated calories */}
        {calculatedCalories > 0 && (
          <div style={{
            marginBottom: '16px',
            padding: '12px',
            background: '#1a2a2a',
            borderRadius: '6px'
          }}>
            <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
              Vypočítané kalorie:
            </div>
            <div style={{ fontSize: '18px', color: '#4ade80', fontWeight: 'bold' }}>
              {calculatedCalories} kcal
            </div>
            <div style={{ fontSize: '10px', color: '#666', marginTop: '4px' }}>
              4×({protein}+{carbs}) + 9×{fats}
            </div>
          </div>
        )}

        {/* Formula explanation */}
        {calculatedCalories > 0 && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#1a1a2a',
            borderRadius: '6px',
            border: '1px solid #333'
          }}>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '6px' }}>
              ℹ️ Jak se počítají kalorie:
            </div>
            <div style={{ color: '#ccc', fontSize: '11px', fontFamily: 'monospace' }}>
              Kalorie = 4 × (Bílkoviny + Sacharidy) + 9 × Tuky<br />
              {calculatedCalories} = 4 × ({protein} + {carbs}) + 9 × {fats}
            </div>
            <div style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>
              Bílkoviny a sacharidy mají 4 kcal/g, tuky mají 9 kcal/g
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}