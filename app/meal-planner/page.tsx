"use client";

import { useState } from "react";
import {
  SparklesIcon,
  CalendarDaysIcon,
  ShoppingCartIcon,
  ClockIcon,
  UsersIcon,
  CogIcon,
  CheckCircleIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface MealPlanSettings {
  days: number;
  mealsPerDay: number;
  people: number;
  targetCalories: number;
  restrictions: string[];
}

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  estimated_cost: number;
}

interface GeneratedMealPlan {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  people: number;
  total_cost: number;
  shopping_list: ShoppingItem[];
  created_at: string;
}

export default function MealPlannerPage() {
  const [settings, setSettings] = useState<MealPlanSettings>({
    days: 7,
    mealsPerDay: 3,
    people: 2,
    targetCalories: 2000,
    restrictions: [],
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null);
  const [showSettings, setShowSettings] = useState(true);

  const dietaryRestrictions = [
    "Vegetariánské",
    "Veganské",
    "Bezlepkové",
    "Bez laktózy",
    "Nízkosacharidové",
    "Ketogenní",
    "Paleo",
  ];

  const handleRestrictionToggle = (restriction: string) => {
    setSettings(prev => ({
      ...prev,
      restrictions: prev.restrictions.includes(restriction)
        ? prev.restrictions.filter(r => r !== restriction)
        : [...prev.restrictions, restriction]
    }));
  };

  const generateMealPlan = async () => {
    setIsGenerating(true);

    // Simulace AI generování - v reálné implementaci by se volalo API
    setTimeout(() => {
      const mockPlan: GeneratedMealPlan = {
        id: `plan_${Date.now()}`,
        name: `Jídelníček ${settings.days} dní`,
        days: settings.days,
        mealsPerDay: settings.mealsPerDay,
        people: settings.people,
        total_cost: Math.round(settings.days * settings.people * 150 + Math.random() * 200),
        shopping_list: [
          { name: "Kuřecí prsa", quantity: "1kg", category: "Maso", estimated_cost: 180 },
          { name: "Brokolice", quantity: "500g", category: "Zelenina", estimated_cost: 45 },
          { name: "Rýže basmati", quantity: "1kg", category: "Obiloviny", estimated_cost: 85 },
          { name: "Rajčata cherry", quantity: "250g", category: "Zelenina", estimated_cost: 55 },
          { name: "Olivový olej", quantity: "500ml", category: "Oleje", estimated_cost: 120 },
          { name: "Mozzarella", quantity: "200g", category: "Mléčné", estimated_cost: 75 },
          { name: "Čerstvá bazalka", quantity: "1 svazek", category: "Bylinky", estimated_cost: 35 },
          { name: "Celozrnné těstoviny", quantity: "500g", category: "Obiloviny", estimated_cost: 65 },
        ],
        created_at: new Date().toISOString(),
      };

      setGeneratedPlan(mockPlan);
      setIsGenerating(false);
      setShowSettings(false);
    }, 3000);
  };

  const groupedShoppingList = generatedPlan?.shopping_list.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, ShoppingItem[]>) || {};

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Meal Planner</h1>
        <p className="text-gray-600">
          Vygenerujte personalizovaný jídelníček s automatickým nákupním košíkem
        </p>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Nastavení jídelníčku</h2>
            <CogIcon className="w-6 h-6 text-gray-400" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Days */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Počet dní
              </label>
              <select
                value={settings.days}
                onChange={(e) => setSettings(prev => ({ ...prev, days: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={3}>3 dny</option>
                <option value={5}>5 dní</option>
                <option value={7}>7 dní</option>
                <option value={14}>14 dní</option>
              </select>
            </div>

            {/* Meals per day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Jídel denně
              </label>
              <select
                value={settings.mealsPerDay}
                onChange={(e) => setSettings(prev => ({ ...prev, mealsPerDay: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={2}>2 jídla</option>
                <option value={3}>3 jídla</option>
                <option value={4}>4 jídla</option>
                <option value={5}>5 jídel</option>
              </select>
            </div>

            {/* People */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Počet lidí
              </label>
              <select
                value={settings.people}
                onChange={(e) => setSettings(prev => ({ ...prev, people: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={1}>1 osoba</option>
                <option value={2}>2 osoby</option>
                <option value={3}>3 osoby</option>
                <option value={4}>4 osoby</option>
                <option value={5}>5 osob</option>
                <option value={6}>6 osob</option>
              </select>
            </div>

            {/* Target calories */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cílové kalorie/den
              </label>
              <select
                value={settings.targetCalories}
                onChange={(e) => setSettings(prev => ({ ...prev, targetCalories: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value={1500}>1500 kal</option>
                <option value={1800}>1800 kal</option>
                <option value={2000}>2000 kal</option>
                <option value={2200}>2200 kal</option>
                <option value={2500}>2500 kal</option>
                <option value={3000}>3000 kal</option>
              </select>
            </div>
          </div>

          {/* Dietary Restrictions */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Dietní omezení (volitelné)
            </label>
            <div className="flex flex-wrap gap-3">
              {dietaryRestrictions.map((restriction) => (
                <button
                  key={restriction}
                  onClick={() => handleRestrictionToggle(restriction)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    settings.restrictions.includes(restriction)
                      ? "bg-green-100 text-green-700 border border-green-200"
                      : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
                  }`}
                >
                  {restriction}
                </button>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Souhrn nastavení:</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
                <span>{settings.days} dní</span>
              </div>
              <div className="flex items-center space-x-2">
                <ClockIcon className="w-4 h-4 text-gray-400" />
                <span>{settings.mealsPerDay}× denně</span>
              </div>
              <div className="flex items-center space-x-2">
                <UsersIcon className="w-4 h-4 text-gray-400" />
                <span>{settings.people} {settings.people === 1 ? 'osoba' : 'osob'}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-4 bg-orange-400 rounded-full"></span>
                <span>{settings.targetCalories} kal/den</span>
              </div>
            </div>
            {settings.restrictions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <span className="text-gray-600">Omezení: </span>
                <span className="text-gray-900">{settings.restrictions.join(", ")}</span>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateMealPlan}
            disabled={isGenerating}
            className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SparklesIcon className="w-5 h-5" />
            <span>
              {isGenerating ? "Generuje se jídelníček..." : "Vygenerovat jídelníček"}
            </span>
          </button>
        </div>
      )}

      {/* Loading State */}
      {isGenerating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <h3 className="text-lg font-semibold text-blue-900">
              AI generuje váš personalizovaný jídelníček...
            </h3>
          </div>
          <div className="space-y-2 text-blue-700">
            <p>• Analyzuji vaše preference a omezení</p>
            <p>• Vybírám vhodné recepty pro {settings.days} dní</p>
            <p>• Sestavuji nákupní seznam</p>
            <p>• Optimalizuji ceny a množství</p>
          </div>
        </div>
      )}

      {/* Generated Plan */}
      {generatedPlan && !isGenerating && (
        <div className="space-y-8">
          {/* Plan Summary */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <CheckCircleIcon className="w-8 h-8 text-green-600" />
              <div>
                <h3 className="text-xl font-semibold text-green-900">
                  Jídelníček úspěšně vygenerován!
                </h3>
                <p className="text-green-700">
                  {generatedPlan.name} • {generatedPlan.days} dní • {generatedPlan.people} {generatedPlan.people === 1 ? 'osoba' : 'osob'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CalendarDaysIcon className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">Celkem jídel</span>
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {generatedPlan.days * generatedPlan.mealsPerDay}
                </span>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <ShoppingCartIcon className="w-5 h-5 text-gray-400" />
                  <span className="font-medium text-gray-900">Položek v košíku</span>
                </div>
                <span className="text-2xl font-bold text-blue-600">
                  {generatedPlan.shopping_list.length}
                </span>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="w-5 h-5 bg-yellow-400 rounded-full"></span>
                  <span className="font-medium text-gray-900">Odhadované náklady</span>
                </div>
                <span className="text-2xl font-bold text-yellow-600">
                  {generatedPlan.total_cost} Kč
                </span>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-white text-green-700 border border-green-200 rounded-lg hover:bg-green-50 transition-colors"
              >
                <CogIcon className="w-4 h-4" />
                <span>Upravit nastavení</span>
              </button>

              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                <PlusIcon className="w-4 h-4" />
                <span>Vygenerovat nový</span>
              </button>
            </div>
          </div>

          {/* Shopping List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-6">
              <ShoppingCartIcon className="w-6 h-6 text-gray-600" />
              <h3 className="text-xl font-semibold text-gray-900">
                Nákupní seznam
              </h3>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                {generatedPlan.shopping_list.length} položek
              </span>
            </div>

            <div className="space-y-6">
              {Object.entries(groupedShoppingList).map(([category, items]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 mb-3 pb-2 border-b border-gray-200">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <div>
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-gray-500 ml-2">({item.quantity})</span>
                          </div>
                        </div>
                        <span className="font-medium text-gray-900">
                          {item.estimated_cost} Kč
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span className="text-gray-900">Celkové odhadované náklady:</span>
                <span className="text-green-600">{generatedPlan.total_cost} Kč</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Ceny jsou orientační a mohou se lišit dle obchodu
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}