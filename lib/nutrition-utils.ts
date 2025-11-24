// Utility functions for nutrition calculations and validation

export interface MacroGoals {
  protein: number;  // grams
  carbs: number;    // grams
  fats: number;     // grams
  calories: number; // kcal
}

export interface MacroInputs {
  protein: string;
  carbs: string;
  fats: string;
  calories: string;
}

export interface ValidationResult {
  isValid: boolean;
  calculatedCalories: number;
  inputCalories: number;
  difference: number;
  tolerance: number;
  withinTolerance: boolean;
}

/**
 * Calculate calories from macros using the formula: kcal = 4(P + C) + 9F
 */
export function calculateCaloriesFromMacros(protein: number, carbs: number, fats: number): number {
  return Math.round(4 * (protein + carbs) + 9 * fats);
}

/**
 * Validate if calories and macros are consistent
 */
export function validateCaloriesMacros(
  calories: number,
  protein: number,
  carbs: number,
  fats: number,
  tolerance: number = 10
): ValidationResult {
  const calculatedCalories = calculateCaloriesFromMacros(protein, carbs, fats);
  const difference = Math.abs(calories - calculatedCalories);

  return {
    isValid: difference <= tolerance,
    calculatedCalories,
    inputCalories: calories,
    difference,
    tolerance,
    withinTolerance: difference <= tolerance
  };
}

/**
 * Adjust macros proportionally to fit target calories
 */
export function adjustMacrosToCalories(
  targetCalories: number,
  protein: number,
  carbs: number,
  fats: number
): { protein: number; carbs: number; fats: number } {
  const currentCalories = calculateCaloriesFromMacros(protein, carbs, fats);

  if (currentCalories === 0) {
    // If no macros set, distribute calories with a balanced ratio
    // 25% protein, 45% carbs, 30% fats (common recommendation)
    return {
      protein: Math.round((targetCalories * 0.25) / 4),
      carbs: Math.round((targetCalories * 0.45) / 4),
      fats: Math.round((targetCalories * 0.30) / 9)
    };
  }

  const ratio = targetCalories / currentCalories;

  return {
    protein: Math.round(protein * ratio),
    carbs: Math.round(carbs * ratio),
    fats: Math.round(fats * ratio)
  };
}

/**
 * Parse macro inputs to numbers, handling empty strings
 */
export function parseMacroInputs(inputs: MacroInputs): {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
  hasAnyValue: boolean;
} {
  const protein = parseFloat(inputs.protein) || 0;
  const carbs = parseFloat(inputs.carbs) || 0;
  const fats = parseFloat(inputs.fats) || 0;
  const calories = parseFloat(inputs.calories) || 0;

  const hasAnyValue = protein > 0 || carbs > 0 || fats > 0 || calories > 0;

  return { protein, carbs, fats, calories, hasAnyValue };
}

/**
 * Format number for display (remove trailing zeros)
 */
export function formatNumber(num: number): string {
  return num % 1 === 0 ? num.toString() : num.toFixed(1);
}