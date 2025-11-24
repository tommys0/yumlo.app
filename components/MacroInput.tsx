'use client';

import { useState, useEffect } from 'react';
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
}

export default function MacroInput({ value, onChange }: MacroInputProps) {
  const [inputMode, setInputMode] = useState<InputMode | null>(null);
  const [showMismatchDialog, setShowMismatchDialog] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Parse current inputs
  const { protein, carbs, fats, calories, hasAnyValue } = parseMacroInputs(value);

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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            onClick={() => handleInputModeSelect('calories-first')}
            style={{
              padding: '16px',
              fontSize: '14px',
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Nastavit cílové kalorie
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              Zadám kalorie a pak si rozdělím makra
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleInputModeSelect('macros-first')}
            style={{
              padding: '16px',
              fontSize: '14px',
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Nastavit makra přímo
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              Zadám gramy bílkovin, sacharidů a tuků
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleInputModeSelect('skip')}
            style={{
              padding: '16px',
              fontSize: '14px',
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left'
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
              Přeskočit zatím
            </div>
            <div style={{ color: '#888', fontSize: '12px' }}>
              Nastavím si to později v profilu
            </div>
          </button>
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
            Nutriční cíle
          </h3>
          <button
            type="button"
            onClick={() => setInputMode(null)}
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
            změnit
          </button>
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
            Nutriční cíle
          </h3>
          <button
            type="button"
            onClick={() => setInputMode(null)}
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
            změnit
          </button>
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

        {/* Optional manual calorie input */}
        <div>
          <label style={{ display: 'block', marginBottom: '6px', color: '#888', fontSize: '12px' }}>
            Nebo zadejte kalorie ručně (volitelné)
          </label>
          <input
            type="number"
            value={value.calories}
            onChange={(e) => onChange({ ...value, calories: e.target.value })}
            placeholder="např. 2000"
            style={{
              width: '100%',
              padding: '10px',
              fontSize: '14px',
              background: '#1a1a1a',
              color: '#fff',
              border: validation && !validation.withinTolerance ? '1px solid #f87171' : '1px solid #333',
              borderRadius: '6px'
            }}
          />
        </div>

        {/* Validation warning */}
        {validation && !validation.withinTolerance && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: '#2a1a1a',
            borderRadius: '6px',
            border: '1px solid #f87171'
          }}>
            <div style={{ color: '#f87171', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px' }}>
              Nesoulad mezi kaloriemi a makry!
            </div>
            <div style={{ color: '#ccc', fontSize: '12px', marginBottom: '8px' }}>
              Zadané kalorie: {validation.inputCalories} kcal<br />
              Vypočítané z maker: {validation.calculatedCalories} kcal<br />
              Rozdíl: {validation.difference} kcal
            </div>
          </div>
        )}

        {/* Mismatch resolution dialog */}
        {showMismatchDialog && validation && (
          <div style={{
            marginTop: '16px',
            padding: '16px',
            background: '#2a2a1a',
            borderRadius: '8px',
            border: '1px solid #eab308'
          }}>
            <div style={{ color: '#eab308', fontSize: '14px', fontWeight: 'bold', marginBottom: '12px' }}>
              Jak chcete vyřešit nesoulad?
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleMismatchResolve('adjust-calories')}
                style={{
                  padding: '10px',
                  fontSize: '12px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <strong>Upravit kalorie na {validation.calculatedCalories} kcal</strong><br />
                <span style={{ color: '#888' }}>Ponechat makra, změnit kalorie</span>
              </button>

              <button
                type="button"
                onClick={() => handleMismatchResolve('adjust-macros')}
                style={{
                  padding: '10px',
                  fontSize: '12px',
                  background: '#1a1a1a',
                  color: '#fff',
                  border: '1px solid #333',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left'
                }}
              >
                <strong>Upravit makra na {calories} kcal</strong><br />
                <span style={{ color: '#888' }}>Proporčně upravit makra podle kalorií</span>
              </button>

              <button
                type="button"
                onClick={() => setShowMismatchDialog(false)}
                style={{
                  padding: '8px',
                  fontSize: '11px',
                  background: 'transparent',
                  color: '#888',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Ponechat tak, upravím ručně
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}