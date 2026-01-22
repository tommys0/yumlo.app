"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  ShoppingCartIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
  checked?: boolean;
}

interface MealPlanJob {
  id: string;
  result: {
    shopping_list: ShoppingItem[];
    name: string;
  } | null;
  created_at: string;
}

const categoryOrder = ['Maso', 'Ryby', 'Mléčné', 'Vejce', 'Zelenina', 'Ovoce', 'Obiloviny', 'Luštěniny', 'Oleje', 'Koření', 'Ostatní'];

export default function ShoppingListPage() {
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [planName, setPlanName] = useState<string>("");

  useEffect(() => {
    loadLatestShoppingList();
  }, []);

  const loadLatestShoppingList = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get the most recent completed meal plan
      const { data, error } = await supabase
        .from("meal_plan_jobs")
        .select("id, result, created_at")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error || !data?.result?.shopping_list) {
        setShoppingItems([]);
        setLoading(false);
        return;
      }

      const itemsWithChecked = data.result.shopping_list.map((item: ShoppingItem) => ({
        ...item,
        checked: false,
      }));

      setShoppingItems(itemsWithChecked);
      setPlanName(data.result.name || "Jídelníček");
    } catch (err) {
      console.error("Error loading shopping list:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = (index: number) => {
    setShoppingItems(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const groupedItems = shoppingItems.reduce((acc, item, index) => {
    const category = item.category || 'Ostatní';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push({ ...item, originalIndex: index });
    return acc;
  }, {} as Record<string, (ShoppingItem & { originalIndex: number })[]>);

  const sortedCategories = Object.keys(groupedItems).sort((a, b) => {
    const aIndex = categoryOrder.indexOf(a);
    const bIndex = categoryOrder.indexOf(b);
    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  const checkedCount = shoppingItems.filter(item => item.checked).length;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <ShoppingCartIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nákupní seznam</h1>
        </div>
        {planName && (
          <p className="text-gray-600 dark:text-gray-400 ml-12">z plánu: {planName}</p>
        )}
      </div>

      {shoppingItems.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-12 text-center">
          <ShoppingCartIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Zatím nemáte nákupní seznam
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Vygenerujte jídelníček v Meal Planner a váš nákupní seznam se zde automaticky zobrazí.
          </p>
          <a
            href="/meal-planner"
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
            Vytvořit jídelníček
          </a>
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {checkedCount} z {shoppingItems.length} položek
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(checkedCount / shoppingItems.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Shopping list by category */}
          <div className="space-y-6">
            {sortedCategories.map(category => (
              <div key={category} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{category}</h3>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                  {groupedItems[category].map((item) => (
                    <li
                      key={item.originalIndex}
                      onClick={() => toggleItem(item.originalIndex)}
                      className={`flex items-center gap-4 px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                        item.checked ? "bg-green-50 dark:bg-green-900/20" : ""
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                          item.checked
                            ? "bg-green-600 border-green-600"
                            : "border-gray-300 dark:border-gray-600"
                        }`}
                      >
                        {item.checked && <CheckIcon className="w-4 h-4 text-white" />}
                      </div>
                      <div className="flex-1">
                        <span
                          className={`font-medium ${
                            item.checked ? "text-gray-400 dark:text-gray-500 line-through" : "text-gray-900 dark:text-white"
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                      <span
                        className={`text-sm ${
                          item.checked ? "text-gray-400 dark:text-gray-500" : "text-gray-600 dark:text-gray-400"
                        }`}
                      >
                        {item.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
