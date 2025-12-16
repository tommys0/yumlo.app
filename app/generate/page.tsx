"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Recipe } from '@/lib/recipe-prompt';
import {
  SparklesIcon,
  ClockIcon,
  UserIcon,
  FireIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function GeneratePage() {
  const [ingredients, setIngredients] = useState<string>('');
  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergies, setAllergies] = useState<string>('');
  const [cookingTime, setCookingTime] = useState<number>(30);
  const [servings, setServings] = useState<number>(2);
  const [mealType, setMealType] = useState<string>('dinner');
  const [specialRequests, setSpecialRequests] = useState<string>('');

  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string>('');

  const dietaryOptions = [
    'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
    'keto', 'paleo', 'low-carb', 'low-fat'
  ];

  const handleDietaryChange = (restriction: string) => {
    setDietaryRestrictions(prev =>
      prev.includes(restriction)
        ? prev.filter(r => r !== restriction)
        : [...prev, restriction]
    );
  };

  const generateRecipe = async () => {
    if (!ingredients.trim()) {
      setError('Please add some ingredients');
      return;
    }

    setIsGenerating(true);
    setError('');
    setRecipe(null);

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Please log in to generate recipes');
        return;
      }

      const requestBody = {
        ingredients: ingredients.split(',').map(i => i.trim()).filter(i => i),
        dietaryRestrictions,
        allergies: allergies.split(',').map(a => a.trim()).filter(a => a),
        cookingTime,
        servings,
        mealType,
        specialRequests
      };

      const response = await fetch('/api/generation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate recipe');
      }

      setRecipe(data.recipe);

    } catch (err: any) {
      setError(err.message || 'Failed to generate recipe');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🍳 AI Recipe Generator
          </h1>
          <p className="text-gray-600">
            Tell us what ingredients you have and we'll create a personalized recipe for you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Generation Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-6">Recipe Preferences</h2>

            {/* Ingredients */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Available Ingredients *
              </label>
              <textarea
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                placeholder="chicken, rice, broccoli, garlic, onion..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Separate ingredients with commas</p>
            </div>

            {/* Meal Type & Basic Settings */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meal Type
                </label>
                <select
                  value={mealType}
                  onChange={(e) => setMealType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <UserIcon className="h-4 w-4 inline mr-1" />
                  Servings
                </label>
                <input
                  type="number"
                  value={servings}
                  onChange={(e) => setServings(parseInt(e.target.value))}
                  min={1}
                  max={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Max Cooking Time: {cookingTime} minutes
              </label>
              <input
                type="range"
                value={cookingTime}
                onChange={(e) => setCookingTime(parseInt(e.target.value))}
                min={10}
                max={120}
                step={5}
                className="w-full"
              />
            </div>

            {/* Dietary Restrictions */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Dietary Restrictions
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    onClick={() => handleDietaryChange(option)}
                    className={`px-3 py-1 rounded-full text-sm font-medium border ${
                      dietaryRestrictions.includes(option)
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-blue-300'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* Allergies */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Allergies
              </label>
              <input
                type="text"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="nuts, dairy, shellfish..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Special Requests */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Requests
              </label>
              <textarea
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                placeholder="Make it spicy, use Mediterranean flavors, low sodium..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateRecipe}
              disabled={isGenerating || !ingredients.trim()}
              className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Generating Recipe...
                </>
              ) : (
                <>
                  <SparklesIcon className="h-5 w-5" />
                  Generate Recipe
                </>
              )}
            </button>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <span className="text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Recipe Display */}
          <div className="bg-white rounded-lg shadow-md p-6">
            {recipe ? (
              <div>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">{recipe.name}</h2>
                  <p className="text-gray-600 mb-4">{recipe.description}</p>

                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <ClockIcon className="h-4 w-4" />
                      {recipe.cookingTime} min
                    </span>
                    <span className="flex items-center gap-1">
                      <UserIcon className="h-4 w-4" />
                      {recipe.servings} servings
                    </span>
                    <span className="flex items-center gap-1">
                      <FireIcon className="h-4 w-4" />
                      {recipe.nutrition.calories} cal
                    </span>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {recipe.ingredients.map((ingredient, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <CheckCircleIcon className="h-4 w-4 text-green-500" />
                        <span>{ingredient.amount} {ingredient.unit} {ingredient.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Instructions</h3>
                  <ol className="space-y-3">
                    {recipe.instructions.map((instruction) => (
                      <li key={instruction.step} className="flex gap-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                          {instruction.step}
                        </span>
                        <div>
                          <p className="text-gray-900">{instruction.instruction}</p>
                          {instruction.timeMinutes && (
                            <p className="text-sm text-gray-500 mt-1">~{instruction.timeMinutes} minutes</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Nutrition (per serving)</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>Calories: {recipe.nutrition.calories}</div>
                    <div>Protein: {recipe.nutrition.protein}g</div>
                    <div>Carbs: {recipe.nutrition.carbs}g</div>
                    <div>Fats: {recipe.nutrition.fats}g</div>
                  </div>
                </div>

                {recipe.tips && recipe.tips.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Tips</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      {recipe.tips.map((tip, index) => (
                        <li key={index}>• {tip}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Recipe Yet</h3>
                <p className="text-gray-600">
                  Fill out the form on the left and generate your first AI-powered recipe!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}