"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  BoltIcon,
  ClockIcon,
  SparklesIcon,
  ArrowPathIcon,
  FireIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";

interface Recipe {
  name: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  mealType: string;
  ingredients: { name: string; amount: string; unit: string }[];
  instructions: { step: number; instruction: string; timeMinutes?: number }[];
  nutrition: { calories: number; protein: number; carbs: number; fats: number };
  tips?: string[];
  tags?: string[];
}

const quickOptions = [
  {
    id: "super-fast",
    label: "Super rychlé",
    description: "Do 15 minut",
    icon: BoltIcon,
    time: 15,
  },
  {
    id: "easy",
    label: "Jednoduché",
    description: "Do 30 minut",
    icon: ClockIcon,
    time: 30,
  },
  {
    id: "healthy",
    label: "Zdravé",
    description: "Nízkokalorické",
    icon: HeartIcon,
    time: 30,
  },
  {
    id: "comfort",
    label: "Comfort food",
    description: "Klasická jídla",
    icon: FireIcon,
    time: 45,
  },
];

export default function QuickDinnerPage() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [error, setError] = useState<string>("");

  const generateQuickDinner = async (optionId: string) => {
    setSelectedOption(optionId);
    setIsGenerating(true);
    setError("");
    setRecipe(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setError("Přihlaste se prosím");
        return;
      }

      const option = quickOptions.find((o) => o.id === optionId);
      if (!option) return;

      const response = await fetch("/api/quick-dinner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          type: optionId,
          maxTime: option.time,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Nepodařilo se vygenerovat recept");
      }

      setRecipe(data.recipe);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Něco se pokazilo";
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerate = () => {
    if (selectedOption) {
      generateQuickDinner(selectedOption);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
            <BoltIcon className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Quick Dinner</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 ml-12">
          Nemáte čas? Vyberte si a dostanete okamžitý návrh večeře.
        </p>
      </div>

      {/* Quick options */}
      {!recipe && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {quickOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => generateQuickDinner(option.id)}
              disabled={isGenerating}
              className={`p-6 bg-white dark:bg-gray-900 rounded-xl border-2 text-left transition-all hover:shadow-md ${
                selectedOption === option.id && isGenerating
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                  : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
              } ${isGenerating ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg ${
                    selectedOption === option.id && isGenerating
                      ? "bg-green-100 dark:bg-green-900/30"
                      : "bg-gray-100 dark:bg-gray-800"
                  }`}
                >
                  <option.icon
                    className={`w-6 h-6 ${
                      selectedOption === option.id && isGenerating
                        ? "text-green-600 dark:text-green-400"
                        : "text-gray-600 dark:text-gray-400"
                    }`}
                  />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {option.label}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{option.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isGenerating && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Generuji recept...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Recipe result */}
      {recipe && !isGenerating && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
          {/* Recipe header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {recipe.name}
                </h2>
                <p className="text-gray-600 dark:text-gray-400">{recipe.description}</p>
              </div>
              <button
                onClick={regenerate}
                className="p-2 text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Vygenerovat jiný recept"
              >
                <ArrowPathIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <ClockIcon className="w-4 h-4" />
                <span>{recipe.cookingTime} min</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-medium">
                  {recipe.difficulty === "easy"
                    ? "Snadné"
                    : recipe.difficulty === "medium"
                      ? "Střední"
                      : "Náročné"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span>{recipe.servings} porce</span>
              </div>
            </div>
          </div>

          {/* Nutrition */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recipe.nutrition.calories}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">kcal</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recipe.nutrition.protein}g
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">bílkoviny</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recipe.nutrition.carbs}g
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">sacharidy</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recipe.nutrition.fats}g
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">tuky</p>
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Ingredience</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recipe.ingredients.map((ing, i) => (
                <li key={i} className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  <span>
                    {ing.amount} {ing.unit} {ing.name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Postup</h3>
            <ol className="space-y-4">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full flex items-center justify-center font-semibold text-sm">
                    {step.step}
                  </span>
                  <p className="text-gray-700 dark:text-gray-300 pt-1">{step.instruction}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* Tips */}
          {recipe.tips && recipe.tips.length > 0 && (
            <div className="p-6 bg-amber-50 dark:bg-amber-900/20 border-t border-amber-100 dark:border-amber-800">
              <h3 className="font-semibold text-amber-800 dark:text-amber-300 mb-2">Tipy</h3>
              <ul className="space-y-1">
                {recipe.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-amber-700 dark:text-amber-200 text-sm flex items-start gap-2"
                  >
                    <SparklesIcon className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Back button */}
          <div className="p-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setRecipe(null)}
              className="w-full py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
            >
              Zpět na výběr
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
