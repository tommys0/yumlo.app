"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";
import {
  SparklesIcon,
  CalendarDaysIcon,
  ShoppingCartIcon,
  ClockIcon,
  UserIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  HomeIcon,
  FireIcon,
  GlobeAltIcon,
  ExclamationCircleIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";
import { UsageDisplay, LimitReachedBanner } from "@/components/usage-display";

interface MealPlanSettings {
  days: number;
  mealsPerDay: number;
}

interface UserPreferences {
  name?: string;
  dietary_restrictions?: string[];
  allergies?: string[];
  macro_goals?: {
    protein?: number;
    carbs?: number;
    fats?: number;
    calories?: number;
  };
  cuisine_preferences?: string[];
}

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

interface MealPlanDay {
  day: number;
  meals: {
    type: string;
    recipe: Recipe;
  }[];
}

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
}

interface GeneratedMealPlan {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  people: number;
  daily_plans: MealPlanDay[];
  shopping_list: ShoppingItem[];
  created_at: string;
}

// Job status response type
interface JobStatusResponse {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  result?: GeneratedMealPlan;
  error?: string;
  startedAt?: string;
}

// Polling configuration
const POLL_INTERVAL = 3000; // 3 seconds
const MAX_POLLS = 60; // 3 minutes max

export default function MealPlannerPage() {
  const [settings, setSettings] = useState<MealPlanSettings>({
    days: 2,
    mealsPerDay: 3,
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(
    null,
  );
  const [showSettings, setShowSettings] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(
    null,
  );
  const abortControllerRef = useRef<AbortController | null>(null);

  // Inventory state
  const [inventoryMode, setInventoryMode] = useState<"all" | "priority">("all");
  const [inventory, setInventory] = useState<
    {
      id: string;
      name: string;
      quantity?: number;
      unit?: string;
      category?: string;
      expiration_date?: string;
      priority?: boolean;
    }[]
  >([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [newItemExpiration, setNewItemExpiration] = useState("");
  const [isAddingItem, setIsAddingItem] = useState(false);

  // Load user preferences and inventory on component mount
  useEffect(() => {
    loadUserPreferences();
    loadInventory();
    checkActiveJob();
  }, []);

  // Timer effect - updates elapsed time every second while generating
  useEffect(() => {
    if (!isGenerating || !generationStartTime) return;

    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - generationStartTime) / 1000));
    }, 1000);

    return () => clearInterval(interval);
  }, [isGenerating, generationStartTime]);

  const loadUserPreferences = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from("users")
          .select(
            "name, dietary_restrictions, allergies, macro_goals, cuisine_preferences",
          )
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading user preferences:", error);
        } else if (data) {
          setUserPreferences(data);
        }
      }
    } catch (err) {
      console.error("Error loading preferences:", err);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Load inventory items
  const loadInventory = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        setIsLoadingInventory(false);
        return;
      }

      const response = await fetch("/api/inventory", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setInventory(data.items || []);
      }
    } catch (err) {
      console.error("Error loading inventory:", err);
    } finally {
      setIsLoadingInventory(false);
    }
  };

  // Add inventory item
  const addInventoryItem = async () => {
    if (!newItemName.trim()) return;

    setIsAddingItem(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch("/api/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          name: newItemName.trim(),
          expiration_date: newItemExpiration || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setInventory((prev) =>
          [...prev, data.item].sort((a, b) => {
            // Sort by expiration date (soonest first), then by name
            if (a.expiration_date && b.expiration_date) {
              return (
                new Date(a.expiration_date).getTime() -
                new Date(b.expiration_date).getTime()
              );
            }
            if (a.expiration_date) return -1;
            if (b.expiration_date) return 1;
            return a.name.localeCompare(b.name);
          }),
        );
        setNewItemName("");
        setNewItemExpiration("");
      }
    } catch (err) {
      console.error("Error adding inventory item:", err);
    } finally {
      setIsAddingItem(false);
    }
  };

  // Remove inventory item
  const removeInventoryItem = async (id: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/inventory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        setInventory((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err) {
      console.error("Error removing inventory item:", err);
    }
  };

  // Check if item expires soon (within 3 days)
  const expiresSoon = (expirationDate?: string): boolean => {
    if (!expirationDate) return false;
    const expDate = new Date(expirationDate);
    const now = new Date();
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    return expDate <= threeDaysFromNow;
  };

  // Check for active job from localStorage on page load
  const checkActiveJob = async () => {
    try {
      const storedJobId = localStorage.getItem("mealPlanJobId");
      const storedStartTime = localStorage.getItem("mealPlanStartTime");

      if (!storedJobId) {
        // No active job, check for recent completed jobs
        checkRecentJobs();
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem("mealPlanJobId");
        localStorage.removeItem("mealPlanStartTime");
        return;
      }

      // Check job status
      const response = await fetch(`/api/meal-plan/status/${storedJobId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (!response.ok) {
        // Job not found or error - clean up localStorage
        localStorage.removeItem("mealPlanJobId");
        localStorage.removeItem("mealPlanStartTime");
        checkRecentJobs();
        return;
      }

      const data: JobStatusResponse = await response.json();

      if (data.status === "completed" && data.result) {
        // Job completed while away - show result
        setGeneratedPlan(data.result);
        setShowSettings(false);
        // Do NOT clear localStorage - keep it for persistence across navigation
        // localStorage.removeItem('mealPlanJobId');
        // localStorage.removeItem('mealPlanStartTime');
        console.log("✅ Loaded completed job from background");
        return;
      }

      if (data.status === "failed") {
        // Job failed - show error and clean up
        setError(data.error || "Generování selhalo");
        localStorage.removeItem("mealPlanJobId");
        localStorage.removeItem("mealPlanStartTime");
        return;
      }

      // Job is still pending or processing - resume polling
      if (data.status === "pending" || data.status === "processing") {
        console.log("🔄 Resuming job polling:", storedJobId);

        // Create AbortController for resumed polling
        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        setCurrentJobId(storedJobId);
        setIsGenerating(true);
        const startTime = storedStartTime
          ? parseInt(storedStartTime)
          : Date.now();
        setGenerationStartTime(startTime);
        setGenerationStatus("Generování jídelníčku...");

        // Resume polling
        pollJobStatus(storedJobId, session.access_token, abortController.signal)
          .then((result) => {
            setGeneratedPlan(result);
            setShowSettings(false);
            console.log("✅ Job completed:", result.name);
          })
          .catch((err) => {
            // Don't show error for user-initiated cancellation
            if (err.message === "CANCELLED") {
              console.log("🛑 Resumed job polling cancelled");
              return;
            }
            setError(err.message);
            console.error("Job failed:", err);
            // Only clear on failure
            localStorage.removeItem("mealPlanJobId");
            localStorage.removeItem("mealPlanStartTime");
          })
          .finally(() => {
            setIsGenerating(false);
            setCurrentJobId(null);
            setGenerationStatus("");
            setElapsedTime(0);
            setGenerationStartTime(null);
            abortControllerRef.current = null;
            // Don't clear localStorage here to allow persistence
          });
      }
    } catch (err) {
      console.log("Could not check active job:", err);
      localStorage.removeItem("mealPlanJobId");
      localStorage.removeItem("mealPlanStartTime");
    }
  };

  // Check for recent completed jobs (fallback)
  const checkRecentJobs = async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const response = await fetch(
        `/api/meal-plan/recent?since=${encodeURIComponent(tenMinutesAgo)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );

      if (!response.ok) {
        console.log("Recent jobs endpoint not available");
        return;
      }

      const data = await response.json();
      if (data.result) {
        setGeneratedPlan(data.result);
        setShowSettings(false);
        console.log("✅ Loaded recent meal plan");
      }
    } catch (err) {
      console.log("Could not check recent jobs:", err);
    }
  };

  // Cancel current job
  const cancelJob = async () => {
    if (!currentJobId) return;

    // Abort any ongoing polling
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/meal-plan/${currentJobId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        console.log("🗑️ Job cancelled");
      }
    } catch (err) {
      console.error("Failed to cancel job:", err);
    } finally {
      // Clean up state regardless of API success
      setIsGenerating(false);
      setCurrentJobId(null);
      setGenerationStatus("");
      setElapsedTime(0);
      setGenerationStartTime(null);
      setError("");
      localStorage.removeItem("mealPlanJobId");
      localStorage.removeItem("mealPlanStartTime");
    }
  };

  // Poll for job status
  const pollJobStatus = useCallback(
    async (
      jobId: string,
      token: string,
      signal: AbortSignal,
    ): Promise<GeneratedMealPlan> => {
      for (let i = 0; i < MAX_POLLS; i++) {
        // Check if cancelled before each poll
        if (signal.aborted) {
          throw new Error("CANCELLED");
        }

        try {
          const response = await fetch(`/api/meal-plan/status/${jobId}`, {
            headers: { Authorization: `Bearer ${token}` },
            signal,
          });

          if (!response.ok) {
            // Network/Server error - retry
            throw new Error("Failed to fetch job status");
          }

          const data: JobStatusResponse = await response.json();

          if (data.status === "completed" && data.result) {
            setGenerationStatus("Hotovo!");
            return data.result;
          }

          if (data.status === "failed") {
            // Job failed explicitly - STOP POLLING
            const errorMsg = data.error || "Generování selhalo";
            throw new Error(`JOB_FAILED: ${errorMsg}`);
          }

          // Update status message
          if (data.status === "processing") {
            setGenerationStatus("Generování jídelníčku...");
          } else {
            setGenerationStatus("Čekání na zahájení...");
          }

          // Wait before next poll (with abort check)
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(resolve, POLL_INTERVAL);
            signal.addEventListener(
              "abort",
              () => {
                clearTimeout(timeout);
                reject(new Error("CANCELLED"));
              },
              { once: true },
            );
          });
        } catch (err) {
          // Check if this is an abort
          if (
            err instanceof Error &&
            (err.name === "AbortError" || err.message === "CANCELLED")
          ) {
            throw new Error("CANCELLED");
          }

          const errorMessage =
            err instanceof Error ? err.message : "Unknown error";

          // If it's the explicit job failure, stop polling and propagate it
          if (errorMessage.startsWith("JOB_FAILED:")) {
            throw new Error(errorMessage.replace("JOB_FAILED: ", ""));
          }

          // On network error or other transient issues, continue polling
          console.error("Poll error (retrying):", err);
          // Only wait if we are continuing
          if (i < MAX_POLLS - 1) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
          }
        }
      }

      throw new Error(
        "Generování trvá déle než obvykle. Zkuste obnovit stránku.",
      );
    },
    [],
  );

  const generateMealPlan = async () => {
    // Create new AbortController for this generation
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsGenerating(true);
    setError("");
    setGeneratedPlan(null);
    setGenerationStatus("Zahajování generování...");

    try {
      // Get user session
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setError("Přihlaste se prosím pro generování jídelníčků");
        return;
      }

      // Prepare inventory for AI - filter to priority items if mode is 'priority'
      const inventoryForAI =
        inventoryMode === "priority"
          ? inventory.filter((item) => item.priority)
          : inventory;

      const requestBody = {
        days: settings.days,
        mealsPerDay: settings.mealsPerDay,
        people: 1,
        targetCalories: userPreferences.macro_goals?.calories || 2000,
        restrictions: userPreferences.dietary_restrictions || [],
        allergies: userPreferences.allergies || [],
        macroGoals: userPreferences.macro_goals,
        cuisinePreferences: userPreferences.cuisine_preferences || [],
        inventory: inventoryForAI.map((item) => ({
          name: item.name,
          priority: item.priority || false,
        })),
        inventoryMode,
      };

      console.log("🚀 Creating meal plan job:", requestBody);

      // Step 1: Create job (processing starts automatically server-side)
      const response = await fetch("/api/meal-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const createData = await response.json();

      if (!response.ok) {
        console.error("API Error Response:", createData);
        if (createData.details) {
          console.error(
            "Validation errors:",
            JSON.stringify(createData.details, null, 2),
          );
        }
        throw new Error(createData.error || "Nepodařilo se vytvořit úlohu");
      }

      const { jobId } = createData;
      const startTime = Date.now();
      setCurrentJobId(jobId);
      setGenerationStartTime(startTime);

      // Store in localStorage for persistence across navigation
      localStorage.setItem("mealPlanJobId", jobId);
      localStorage.setItem("mealPlanStartTime", startTime.toString());

      console.log("✅ Job created:", jobId);

      // Trigger explicit processing to ensure it runs (fix for serverless background process issues)
      // We don't await this to keep the UI snappy - polling will pick up the status change
      fetch("/api/meal-plan/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ jobId }),
      }).catch((err) =>
        console.error("Failed to trigger explicit processing:", err),
      );

      // Step 2: Poll for completion (processing already started server-side)
      setGenerationStatus("Generování jídelníčku...");
      const result = await pollJobStatus(
        jobId,
        session.access_token,
        abortController.signal,
      );

      setGeneratedPlan(result);
      setShowSettings(false);
      console.log("✅ Meal plan generated:", result.name);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Nepodařilo se vygenerovat jídelníček";

      // Don't show error for user-initiated cancellation
      if (errorMessage === "CANCELLED") {
        console.log("🛑 Generation cancelled by user");
        return;
      }

      setError(errorMessage);
      console.error("Generation failed:", err);
      // Clear localStorage only on error so user can try again
      localStorage.removeItem("mealPlanJobId");
      localStorage.removeItem("mealPlanStartTime");
    } finally {
      setIsGenerating(false);
      setCurrentJobId(null);
      setGenerationStatus("");
      setElapsedTime(0);
      setGenerationStartTime(null);
      abortControllerRef.current = null;
      // Removed localStorage cleanup from here to persist successful jobs
    }
  };

  // Dynamic loading message
  const getLoadingMessage = (seconds: number) => {
    // If backend reports specific status, prioritize that if it's meaningful
    // if (generationStatus && generationStatus !== 'Generování jídelníčku...') return generationStatus;

    if (seconds < 2) return "Čekání na zahájení...";
    if (seconds < 12) return "Analyzuji vaše preference a omezení...";
    if (seconds < 35)
      return `Generuji ${settings.days * settings.mealsPerDay} personalizovaných receptů...`;
    if (seconds < 50) return "Sestavuji inteligentní nákupní seznam...";
    return "Počítám nutriční hodnoty a náklady...";
  };

  return (
    <div className="min-h-screen max-w-full max-h-full bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meal Planner</h1>
        </div>

        {/* Usage Stats */}
        <div className="mb-6">
          <UsageDisplay showUpgradeButton={true} compact={false} />
        </div>

        {/* Main Settings Panel */}
        {showSettings && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-12">
            {/* Section 1: Generation Settings + Button */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6 h-full">
                <div className="flex items-center gap-2 mb-6">
                  <SparklesIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <h3 className="font-bold text-gray-800 dark:text-white">
                    Generovat jídelníček
                  </h3>
                </div>

                <div className="space-y-4 mb-6">
                  {/* Days */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <CalendarDaysIcon className="w-4 h-4 mr-2 text-green-600 dark:text-green-400" />
                      Počet dní
                    </label>
                    <select
                      value={settings.days}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          days: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900 focus:border-green-500 transition-all font-medium text-gray-900 dark:text-white"
                    >
                      <option value={1}>1 den</option>
                      <option value={2}>2 dny</option>
                      <option value={3}>3 dny</option>
                      <option value={4}>4 dny</option>
                      <option value={5}>5 dní</option>
                      <option value={6}>6 dní</option>
                      <option value={7}>7 dní</option>
                    </select>
                  </div>

                  {/* Meals per day */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                      <ClockIcon className="w-4 h-4 mr-2 text-blue-600 dark:text-blue-400" />
                      Jídel denně
                    </label>
                    <select
                      value={settings.mealsPerDay}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          mealsPerDay: Number(e.target.value),
                        }))
                      }
                      className="w-full px-4 py-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-green-100 dark:focus:ring-green-900 focus:border-green-500 transition-all font-medium text-gray-900 dark:text-white"
                    >
                      <option value={1}>1 jídlo</option>
                      <option value={2}>2 jídla</option>
                      <option value={3}>3 jídla</option>
                      <option value={4}>4 jídla</option>
                      <option value={5}>5 jídel</option>
                    </select>
                  </div>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateMealPlan}
                  disabled={isGenerating}
                  className="w-full inline-flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none"
                >
                  <SparklesIcon className="w-5 h-5 mr-2" />
                  {isGenerating ? "Generuji..." : "Vygenerovat"}
                </button>

                {/* Error Message */}
                {error && (
                  <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Section 2: User Preferences from Settings */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-gray-800 dark:text-white">Vaše preference</h3>
                  </div>
                  <button
                    onClick={() => (window.location.href = "/settings")}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <CogIcon className="w-3.5 h-3.5" />
                    Upravit
                  </button>
                </div>

                {isLoadingPreferences ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                    <div className="h-16 bg-gray-100 dark:bg-gray-800 rounded-lg"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Dietary Restrictions */}
                    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
                      <div className="flex items-center gap-2 mb-1">
                        <ExclamationCircleIcon className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                        <span className="text-xs font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wide">
                          Dietní omezení
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {userPreferences.dietary_restrictions &&
                        userPreferences.dietary_restrictions.length > 0 ? (
                          userPreferences.dietary_restrictions.join(", ")
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">
                            Žádná omezení
                          </span>
                        )}
                      </p>
                      {userPreferences.allergies &&
                        userPreferences.allergies.length > 0 && (
                          <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            Alergie: {userPreferences.allergies.join(", ")}
                          </p>
                        )}
                    </div>

                    {/* Calories or Macros */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-3 border border-green-100 dark:border-green-800">
                      <div className="flex items-center gap-2 mb-1">
                        <FireIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-green-800 dark:text-green-300 uppercase tracking-wide">
                          {userPreferences.macro_goals?.protein ||
                          userPreferences.macro_goals?.carbs ||
                          userPreferences.macro_goals?.fats
                            ? "Makra"
                            : "Kalorie"}
                        </span>
                      </div>
                      {userPreferences.macro_goals?.protein ||
                      userPreferences.macro_goals?.carbs ||
                      userPreferences.macro_goals?.fats ? (
                        <div className="flex flex-wrap gap-2 text-sm">
                          {userPreferences.macro_goals?.protein && (
                            <span className="bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                              B: {userPreferences.macro_goals.protein}g
                            </span>
                          )}
                          {userPreferences.macro_goals?.carbs && (
                            <span className="bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                              S: {userPreferences.macro_goals.carbs}g
                            </span>
                          )}
                          {userPreferences.macro_goals?.fats && (
                            <span className="bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                              T: {userPreferences.macro_goals.fats}g
                            </span>
                          )}
                          {userPreferences.macro_goals?.calories && (
                            <span className="bg-white/60 dark:bg-gray-800/60 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">
                              {userPreferences.macro_goals.calories} kcal
                            </span>
                          )}
                        </div>
                      ) : userPreferences.macro_goals?.calories ? (
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {userPreferences.macro_goals.calories} kcal/den
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                          Nenastaveno
                        </p>
                      )}
                    </div>

                    {/* Cuisine Preferences */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-3 border border-purple-100 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-1">
                        <GlobeAltIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span className="text-xs font-semibold text-purple-800 dark:text-purple-300 uppercase tracking-wide">
                          Oblíbené kuchyně
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {userPreferences.cuisine_preferences &&
                        userPreferences.cuisine_preferences.length > 0 ? (
                          userPreferences.cuisine_preferences.join(", ")
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 italic">
                            Všechny kuchyně
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 3: Inventory */}
            <div className="lg:col-span-1">
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-700/50 p-6 h-full flex flex-col">
                <div className="flex items-center gap-2 mb-4">
                  <HomeIcon className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <h3 className="font-bold text-gray-800 dark:text-white">Co máte doma</h3>
                </div>

                {/* Inventory Mode Toggle */}
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => setInventoryMode("all")}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      inventoryMode === "all"
                        ? "bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border-2 border-amber-300 dark:border-amber-700"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Použít vše
                  </button>
                  <button
                    onClick={() => setInventoryMode("priority")}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                      inventoryMode === "priority"
                        ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border-2 border-red-300 dark:border-red-700"
                        : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    Prioritně spotřebovat
                  </button>
                </div>

                <div className="flex justify-center mb-3">
                  <input
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addInventoryItem()}
                    placeholder="Přidat ingredienci..."
                    className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 focus:border-amber-400 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>

                {/* Add Item Form */}
                <div className="flex gap-2 mb-3 justify-center">
                  <input
                    type="date"
                    value={newItemExpiration}
                    onChange={(e) => setNewItemExpiration(e.target.value)}
                    className="w-32 px-2 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-amber-200 dark:focus:ring-amber-900 focus:border-amber-400 outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    title="Datum expirace (volitelné)"
                  />
                  <button
                    onClick={addInventoryItem}
                    disabled={!newItemName.trim() || isAddingItem}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isAddingItem ? "..." : "+"}
                  </button>
                </div>

                {/* Inventory List */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex-1 overflow-y-auto max-h-[200px]">
                  {isLoadingInventory ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                      <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </div>
                  ) : inventory.length === 0 ? (
                    <div className="text-center py-6">
                      <ArchiveBoxIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">
                        Zatím nemáte přidané ingredience
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {inventory.map((item) => (
                        <div
                          key={item.id}
                          className={`flex items-center justify-between p-2 rounded-lg group ${
                            expiresSoon(item.expiration_date)
                              ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                              : "bg-white dark:bg-gray-700 border border-gray-100 dark:border-gray-600"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-700 dark:text-gray-200 block truncate">
                              {item.name}
                            </span>
                            {item.expiration_date && (
                              <span
                                className={`text-xs ${expiresSoon(item.expiration_date) ? "text-red-600 dark:text-red-400 font-medium" : "text-gray-400 dark:text-gray-500"}`}
                              >
                                {expiresSoon(item.expiration_date)
                                  ? "Brzy vyprší: "
                                  : "Vyprší: "}
                                {new Date(
                                  item.expiration_date,
                                ).toLocaleDateString("cs-CZ")}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => removeInventoryItem(item.id)}
                            className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Odebrat"
                          >
                            <XMarkIcon className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
                  {inventory.length > 0 && (
                    <span className="block mb-1 font-medium text-gray-500 dark:text-gray-400">
                      {inventoryMode === "priority" ? (
                        <>
                          {inventory.filter((i) => i.priority).length} prioritních z {inventory.length} ingrediencí
                        </>
                      ) : (
                        <>
                          {inventory.length}{" "}
                          {inventory.length === 1
                            ? "ingredience"
                            : inventory.length < 5
                              ? "ingredience"
                              : "ingrediencí"}
                        </>
                      )}
                    </span>
                  )}
                  {inventoryMode === "priority"
                    ? "AI bude vařit pouze z prioritních ingrediencí (označených ⭐)"
                    : "AI bude vařit ze všech dostupných ingrediencí"}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Loading State */}
        {isGenerating && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border border-blue-200/50 dark:border-blue-800/50 rounded-3xl p-8 mb-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
              </div>
            </div>

            {/* Dynamic Status Message */}
            <div className="min-h-[80px] flex items-center justify-center mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 animate-pulse text-center px-4">
                {getLoadingMessage(elapsedTime)}
              </h3>
            </div>

            {/* Timer display */}
            <div className="text-3xl font-mono font-bold text-blue-600 dark:text-blue-400 mb-6">
              {Math.floor(elapsedTime / 60)}:
              {(elapsedTime % 60).toString().padStart(2, "0")}
            </div>

            {/* Removed static list */}
            <div className="text-gray-600 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 inline-block mb-6">
              Proces může trvat 1-2 minuty pro komplexní jídelníčky
            </div>
            {/* Cancel button */}
            <div>
              <button
                onClick={cancelJob}
                className="inline-flex items-center px-6 py-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium rounded-xl hover:bg-red-200 dark:hover:bg-red-900/50 transition-all duration-200 border border-red-200 dark:border-red-800"
              >
                <XMarkIcon className="w-5 h-5 mr-2" />
                Zrušit generování
              </button>
            </div>
          </div>
        )}

        {/* Generated Plan */}
        {generatedPlan && !isGenerating && (
          <div className="space-y-12">
            {/* Success Header */}
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-green-600 rounded-full mb-6 shadow-lg">
                <CheckCircleIcon className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-white mb-2">
                Jídelníček je připraven!
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
                {generatedPlan.name} • {generatedPlan.days} dní •{" "}
                {generatedPlan.people}{" "}
                {generatedPlan.people === 1 ? "osoba" : "osob"}
              </p>
            </div>

            {/* Modern Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-2xl p-6 border border-green-200/50 dark:border-green-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500 rounded-xl p-3">
                    <CalendarDaysIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-black text-green-600 dark:text-green-400">
                    {generatedPlan.days * generatedPlan.mealsPerDay}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white">Celkem jídel</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Personalizovaných receptů
                </p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-2xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 rounded-xl p-3">
                    <ShoppingCartIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-black text-blue-600 dark:text-blue-400">
                    {generatedPlan.shopping_list.length}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 dark:text-white">Nákupní seznam</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Položek k nákupu</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 font-medium"
              >
                <CogIcon className="w-5 h-5" />
                <span>Upravit nastavení</span>
              </button>

              <button
                onClick={generateMealPlan}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>Vygenerovat nový</span>
              </button>
            </div>

            {/* Daily Meal Plans */}
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CalendarDaysIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Jídelníček po dnech
                </h3>
              </div>

              <div className="space-y-8">
                {generatedPlan.daily_plans.map((dayPlan, dayIndex) => (
                  <div
                    key={`day-${dayIndex}-${dayPlan.day}`}
                    className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden"
                  >
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                      <h4 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Den {dayPlan.day}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {dayPlan.meals.length} jídel •{" "}
                        {dayPlan.meals.reduce(
                          (sum, meal) => sum + meal.recipe.nutrition.calories,
                          0,
                        )}{" "}
                        celkem kalorií
                      </p>
                    </div>

                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {dayPlan.meals.map((meal, index) => (
                        <div key={index} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                                  {meal.type === "breakfast"
                                    ? "Snídaně"
                                    : meal.type === "lunch"
                                      ? "Oběd"
                                      : meal.type === "dinner"
                                        ? "Večeře"
                                        : meal.type === "snack"
                                          ? "Svačina"
                                          : meal.type}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">
                                  {meal.recipe.difficulty}
                                </span>
                              </div>
                              <h5 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {meal.recipe.name}
                              </h5>
                              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
                                {meal.recipe.description}
                              </p>
                            </div>

                            <div className="ml-6 text-right">
                              <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                                <div className="flex items-center justify-end space-x-2">
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">
                                    {meal.recipe.cookingTime} min
                                  </span>
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                  <UserIcon className="w-4 h-4 text-gray-400" />
                                  <span>{meal.recipe.servings} porcí</span>
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="w-4 h-4 bg-orange-400 rounded-full"></span>
                                  <span className="font-semibold text-orange-600 dark:text-orange-400">
                                    {meal.recipe.nutrition.calories} kal
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Nutrition Info */}
                          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <h6 className="font-medium text-gray-900 dark:text-white mb-2">
                              Nutriční hodnoty (na porci)
                            </h6>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                                  {meal.recipe.nutrition.protein}g
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Bílkoviny</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-green-600 dark:text-green-400">
                                  {meal.recipe.nutrition.carbs}g
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Sacharidy</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-yellow-600 dark:text-yellow-400">
                                  {meal.recipe.nutrition.fats}g
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Tuky</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-orange-600 dark:text-orange-400">
                                  {meal.recipe.nutrition.calories}
                                </div>
                                <div className="text-gray-600 dark:text-gray-400">Kalorie</div>
                              </div>
                            </div>
                          </div>

                          {/* Ingredients */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h6 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                                Ingredience
                              </h6>
                              <div className="space-y-2">
                                {meal.recipe.ingredients.map(
                                  (ingredient, i) => (
                                    <div
                                      key={i}
                                      className="flex items-center justify-between py-1 px-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                    >
                                      <span className="text-gray-900 dark:text-white font-medium">
                                        {ingredient.name}
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400 text-sm">
                                        {ingredient.amount} {ingredient.unit}
                                      </span>
                                    </div>
                                  ),
                                )}
                              </div>
                            </div>

                            <div>
                              <h6 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                Postup přípravy
                              </h6>
                              <div className="space-y-3">
                                {meal.recipe.instructions.map((instruction) => (
                                  <div
                                    key={instruction.step}
                                    className="flex gap-3"
                                  >
                                    <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                      {instruction.step}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                        {instruction.instruction}
                                      </p>
                                      {instruction.timeMinutes && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                          ~{instruction.timeMinutes} minut
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          {/* Tips */}
                          {meal.recipe.tips && meal.recipe.tips.length > 0 && (
                            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                              <h6 className="font-medium text-blue-900 dark:text-blue-300 mb-2">
                                Tipy
                              </h6>
                              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                                {meal.recipe.tips.map((tip, i) => (
                                  <li key={i} className="flex items-start">
                                    <span className="mr-2">•</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Limit Reached Banner - shows at bottom when user hits their limit */}
      <LimitReachedBanner />
    </div>
  );
}
