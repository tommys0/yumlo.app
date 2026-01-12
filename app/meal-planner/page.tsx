"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from '@/lib/supabase';
import {
  SparklesIcon,
  CalendarDaysIcon,
  ShoppingCartIcon,
  ClockIcon,
  UsersIcon,
  UserIcon,
  CogIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface MealPlanSettings {
  days: number;
  mealsPerDay: number;
  people: number;
  targetCalories: number;
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
  ingredients: { name: string; amount: string; unit: string; }[];
  instructions: { step: number; instruction: string; timeMinutes?: number; }[];
  nutrition: { calories: number; protein: number; carbs: number; fats: number; };
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

interface GeneratedMealPlan {
  id: string;
  name: string;
  days: number;
  mealsPerDay: number;
  people: number;
  total_cost: number;
  daily_plans: MealPlanDay[];
  shopping_list: ShoppingItem[];
  created_at: string;
}

// Job status response type
interface JobStatusResponse {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
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
    people: 2,
    targetCalories: 2000,
  });

  const [userPreferences, setUserPreferences] = useState<UserPreferences>({});
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedMealPlan | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [error, setError] = useState<string>('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [generationStartTime, setGenerationStartTime] = useState<number | null>(null);

  // Load user preferences on component mount
  useEffect(() => {
    loadUserPreferences();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('users')
          .select('name, dietary_restrictions, allergies, macro_goals, cuisine_preferences')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error loading user preferences:', error);
        } else if (data) {
          setUserPreferences(data);
          if (data.macro_goals?.calories) {
            setSettings(prev => ({
              ...prev,
              targetCalories: data.macro_goals.calories
            }));
          }
        }
      }
    } catch (err) {
      console.error('Error loading preferences:', err);
    } finally {
      setIsLoadingPreferences(false);
    }
  };

  // Check for active job from localStorage on page load
  const checkActiveJob = async () => {
    try {
      const storedJobId = localStorage.getItem('mealPlanJobId');
      const storedStartTime = localStorage.getItem('mealPlanStartTime');

      if (!storedJobId) {
        // No active job, check for recent completed jobs
        checkRecentJobs();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        localStorage.removeItem('mealPlanJobId');
        localStorage.removeItem('mealPlanStartTime');
        return;
      }

      // Check job status
      const response = await fetch(`/api/meal-plan/status/${storedJobId}`, {
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (!response.ok) {
        // Job not found or error - clean up localStorage
        localStorage.removeItem('mealPlanJobId');
        localStorage.removeItem('mealPlanStartTime');
        checkRecentJobs();
        return;
      }

      const data: JobStatusResponse = await response.json();

      if (data.status === 'completed' && data.result) {
        // Job completed while away - show result
        setGeneratedPlan(data.result);
        setShowSettings(false);
        // Do NOT clear localStorage - keep it for persistence across navigation
        // localStorage.removeItem('mealPlanJobId');
        // localStorage.removeItem('mealPlanStartTime');
        console.log('✅ Loaded completed job from background');
        return;
      }

      if (data.status === 'failed') {
        // Job failed - show error and clean up
        setError(data.error || 'Generování selhalo');
        localStorage.removeItem('mealPlanJobId');
        localStorage.removeItem('mealPlanStartTime');
        return;
      }

      // Job is still pending or processing - resume polling
      if (data.status === 'pending' || data.status === 'processing') {
        console.log('🔄 Resuming job polling:', storedJobId);
        setCurrentJobId(storedJobId);
        setIsGenerating(true);
        const startTime = storedStartTime ? parseInt(storedStartTime) : Date.now();
        setGenerationStartTime(startTime);
        setGenerationStatus('Generování jídelníčku...');

        // Resume polling
        pollJobStatus(storedJobId, session.access_token)
          .then(result => {
            setGeneratedPlan(result);
            setShowSettings(false);
            console.log('✅ Job completed:', result.name);
          })
          .catch(err => {
            setError(err.message);
            console.error('Job failed:', err);
            // Only clear on failure
            localStorage.removeItem('mealPlanJobId');
            localStorage.removeItem('mealPlanStartTime');
          })
          .finally(() => {
            setIsGenerating(false);
            setCurrentJobId(null);
            setGenerationStatus('');
            setElapsedTime(0);
            setGenerationStartTime(null);
            // Don't clear localStorage here to allow persistence
          });
      }
    } catch (err) {
      console.log('Could not check active job:', err);
      localStorage.removeItem('mealPlanJobId');
      localStorage.removeItem('mealPlanStartTime');
    }
  };

  // Check for recent completed jobs (fallback)
  const checkRecentJobs = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      const response = await fetch(`/api/meal-plan/recent?since=${encodeURIComponent(tenMinutesAgo)}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        console.log('Recent jobs endpoint not available');
        return;
      }

      const data = await response.json();
      if (data.result) {
        setGeneratedPlan(data.result);
        setShowSettings(false);
        console.log('✅ Loaded recent meal plan');
      }
    } catch (err) {
      console.log('Could not check recent jobs:', err);
    }
  };

  // Cancel current job
  const cancelJob = async () => {
    if (!currentJobId) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`/api/meal-plan/${currentJobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        console.log('🗑️ Job cancelled');
      }
    } catch (err) {
      console.error('Failed to cancel job:', err);
    } finally {
      // Clean up state regardless of API success
      setIsGenerating(false);
      setCurrentJobId(null);
      setGenerationStatus('');
      setElapsedTime(0);
      setGenerationStartTime(null);
      setError('');
      localStorage.removeItem('mealPlanJobId');
      localStorage.removeItem('mealPlanStartTime');
    }
  };

  // Poll for job status
  const pollJobStatus = useCallback(async (jobId: string, token: string): Promise<GeneratedMealPlan> => {
    for (let i = 0; i < MAX_POLLS; i++) {
      try {
        const response = await fetch(`/api/meal-plan/status/${jobId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
          // Network/Server error - retry
          throw new Error('Failed to fetch job status');
        }

        const data: JobStatusResponse = await response.json();

        if (data.status === 'completed' && data.result) {
          setGenerationStatus('Hotovo!');
          return data.result;
        }

        if (data.status === 'failed') {
          // Job failed explicitly - STOP POLLING
          const errorMsg = data.error || 'Generování selhalo';
          // We throw a special error object or just message to distinguish? 
          // Actually, if we throw here, we need to make sure the catch block below doesn't swallow it.
          // Let's modify the catch block logic or throw a non-recoverable error.
          throw new Error(`JOB_FAILED: ${errorMsg}`);
        }

        // Update status message
        if (data.status === 'processing') {
          setGenerationStatus('Generování jídelníčku...');
        } else {
          setGenerationStatus('Čekání na zahájení...');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';

        // If it's the explicit job failure, stop polling and propagate it
        if (errorMessage.startsWith('JOB_FAILED:')) {
          throw new Error(errorMessage.replace('JOB_FAILED: ', ''));
        }

        // On network error or other transient issues, continue polling
        console.error('Poll error (retrying):', err);
        // Only wait if we are continuing
        if (i < MAX_POLLS - 1) {
          await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
        }
      }
    }

    throw new Error('Generování trvá déle než obvykle. Zkuste obnovit stránku.');
  }, []);

  const generateMealPlan = async () => {
    setIsGenerating(true);
    setError('');
    setGeneratedPlan(null);
    setGenerationStatus('Zahajování generování...');

    try {
      // Get user session
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('Přihlaste se prosím pro generování jídelníčků');
        return;
      }

      const requestBody = {
        days: settings.days,
        mealsPerDay: settings.mealsPerDay,
        people: settings.people,
        targetCalories: settings.targetCalories,
        restrictions: userPreferences.dietary_restrictions || [],
        allergies: userPreferences.allergies || [],
        macroGoals: userPreferences.macro_goals
      };

      console.log('🚀 Creating meal plan job:', requestBody);

      // Step 1: Create job (processing starts automatically server-side)
      const response = await fetch('/api/meal-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(requestBody)
      });

      const createData = await response.json();

      if (!response.ok) {
        console.error('API Error Response:', createData);
        if (createData.details) {
          console.error('Validation errors:', JSON.stringify(createData.details, null, 2));
        }
        throw new Error(createData.error || 'Nepodařilo se vytvořit úlohu');
      }

      const { jobId } = createData;
      const startTime = Date.now();
      setCurrentJobId(jobId);
      setGenerationStartTime(startTime);

      // Store in localStorage for persistence across navigation
      localStorage.setItem('mealPlanJobId', jobId);
      localStorage.setItem('mealPlanStartTime', startTime.toString());

      console.log('✅ Job created:', jobId);

      // Trigger explicit processing to ensure it runs (fix for serverless background process issues)
      // We don't await this to keep the UI snappy - polling will pick up the status change
      fetch('/api/meal-plan/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ jobId })
      }).catch(err => console.error('Failed to trigger explicit processing:', err));

      // Step 2: Poll for completion (processing already started server-side)
      setGenerationStatus('Generování jídelníčku...');
      const result = await pollJobStatus(jobId, session.access_token);

      setGeneratedPlan(result);
      setShowSettings(false);
      console.log('✅ Meal plan generated:', result.name);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Nepodařilo se vygenerovat jídelníček';
      setError(errorMessage);
      console.error('Generation failed:', err);
      // Clear localStorage only on error so user can try again
      localStorage.removeItem('mealPlanJobId');
      localStorage.removeItem('mealPlanStartTime');
    } finally {
      setIsGenerating(false);
      setCurrentJobId(null);
      setGenerationStatus('');
      setElapsedTime(0);
      setGenerationStartTime(null);
      // Removed localStorage cleanup from here to persist successful jobs
    }
  };


  // Dynamic loading message
  const getLoadingMessage = (seconds: number) => {
    // If backend reports specific status, prioritize that if it's meaningful
    // if (generationStatus && generationStatus !== 'Generování jídelníčku...') return generationStatus;

    if (seconds < 2) return "Čekání na zahájení...";
    if (seconds < 12) return "Analyzuji vaše preference a omezení...";
    if (seconds < 35) return `Generuji ${settings.days * settings.mealsPerDay} personalizovaných receptů...`;
    if (seconds < 50) return "Sestavuji inteligentní nákupní seznam...";
    return "Počítám nutriční hodnoty a náklady...";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Simple Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Meal Planner</h1>
        </div>

        {/* Modern Settings Panel */}
        {showSettings && (
          <div className="bg-white/70 backdrop-blur-sm rounded-3xl shadow-xl border border-white/50 p-8 mb-12">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Přizpůsobte si jídelníček</h2>
              <p className="text-gray-600">Nastavte parametry pro generování AI jídelníčku</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
              {/* Days */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <CalendarDaysIcon className="w-4 h-4 mr-2 text-green-600" />
                  Počet dní
                </label>
                <select
                  value={settings.days}
                  onChange={(e) => {
                    const newDays = Number(e.target.value);
                    console.log('🔍 Days selected:', newDays);
                    setSettings(prev => ({ ...prev, days: newDays }));
                  }}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 font-medium"
                >
                  <option value={2}>2 dny</option>
                  <option value={3}>3 dny</option>
                  <option value={5}>5 dní</option>
                  <option value={7}>7 dní</option>
                  <option value={14}>14 dní</option>
                </select>
              </div>

              {/* Meals per day */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <ClockIcon className="w-4 h-4 mr-2 text-blue-600" />
                  Jídel denně
                </label>
                <select
                  value={settings.mealsPerDay}
                  onChange={(e) => setSettings(prev => ({ ...prev, mealsPerDay: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 font-medium"
                >
                  <option value={2}>2 jídla</option>
                  <option value={3}>3 jídla</option>
                  <option value={4}>4 jídla</option>
                  <option value={5}>5 jídel</option>
                </select>
              </div>

              {/* People */}
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <UsersIcon className="w-4 h-4 mr-2 text-purple-600" />
                  Počet lidí
                </label>
                <select
                  value={settings.people}
                  onChange={(e) => setSettings(prev => ({ ...prev, people: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 font-medium"
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
              <div className="group">
                <label className="block text-sm font-semibold text-gray-800 mb-3 flex items-center">
                  <span className="w-4 h-4 mr-2 bg-orange-500 rounded-full"></span>
                  Cílové kalorie/den
                </label>
                <select
                  value={settings.targetCalories}
                  onChange={(e) => setSettings(prev => ({ ...prev, targetCalories: Number(e.target.value) }))}
                  className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-green-100 focus:border-green-500 transition-all duration-200 font-medium"
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

            {/* User Preferences Display */}
            {!isLoadingPreferences && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-200/50 p-6 mb-8">
                <div className="flex items-center mb-4">
                  <UserIcon className="w-5 h-5 text-blue-600 mr-2" />
                  <h3 className="font-semibold text-blue-900">Vaše osobní preference</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {userPreferences.dietary_restrictions && userPreferences.dietary_restrictions.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-medium text-gray-800 block mb-1">Dietní omezení</span>
                      <span className="text-sm text-gray-700">{userPreferences.dietary_restrictions.join(', ')}</span>
                    </div>
                  )}
                  {userPreferences.allergies && userPreferences.allergies.length > 0 && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-medium text-gray-800 block mb-1">Alergie</span>
                      <span className="text-sm text-gray-700">{userPreferences.allergies.join(', ')}</span>
                    </div>
                  )}
                  {userPreferences.macro_goals?.calories && (
                    <div className="bg-white/60 rounded-lg p-3">
                      <span className="font-medium text-gray-800 block mb-1">Cílové kalorie</span>
                      <span className="text-sm text-gray-700">{userPreferences.macro_goals.calories} kal/den</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => window.location.href = '/settings'}
                  className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center group"
                >
                  <CogIcon className="w-4 h-4 mr-1 group-hover:rotate-12 transition-transform" />
                  Upravit nastavení
                </button>
              </div>
            )}

            {/* Generate Button */}
            <div className="text-center">
              <button
                onClick={generateMealPlan}
                disabled={isGenerating}
                className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold text-lg rounded-2xl hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none"
              >
                <SparklesIcon className="w-6 h-6 mr-3" />
                <span>
                  {isGenerating ? "Generuje se jídelníček..." : "Vygenerovat AI jídelníček"}
                </span>
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-center">
                <ExclamationTriangleIcon className="h-6 w-6 text-red-500 flex-shrink-0" />
                <span className="text-red-700 font-medium">{error}</span>
              </div>
            )}
          </div>
        )}

        {/* Modern Loading State */}
        {isGenerating && (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-3xl p-8 mb-12 text-center">
            <div className="relative inline-block mb-6">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
            {/* <h3 className="text-2xl font-bold text-gray-800 mb-4">
              AI vytváří váš jídelníček...
            </h3> */}

            {/* Dynamic Status Message */}
            <div className="min-h-[80px] flex items-center justify-center mb-6">
              <h3 className="text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 animate-pulse text-center px-4">
                {getLoadingMessage(elapsedTime)}
              </h3>
            </div>

            {/* Timer display */}
            <div className="text-3xl font-mono font-bold text-blue-600 mb-6">
              {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}
            </div>

            {/* Removed static list */}
            <div className="text-gray-600 bg-white/60 rounded-lg p-3 inline-block mb-6">
              Proces může trvat 1-2 minuty pro komplexní jídelníčky
            </div>
            {/* Cancel button */}
            <div>
              <button
                onClick={cancelJob}
                className="inline-flex items-center px-6 py-3 bg-red-100 text-red-700 font-medium rounded-xl hover:bg-red-200 transition-all duration-200 border border-red-200"
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
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                Jídelníček je připraven!
              </h2>
              <p className="text-xl text-gray-600 mb-8">
                {generatedPlan.name} • {generatedPlan.days} dní • {generatedPlan.people} {generatedPlan.people === 1 ? 'osoba' : 'osob'}
              </p>
            </div>

            {/* Modern Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-500 rounded-xl p-3">
                    <CalendarDaysIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-black text-green-600">
                    {generatedPlan.days * generatedPlan.mealsPerDay}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800">Celkem jídel</h3>
                <p className="text-sm text-gray-600">Personalizovaných receptů</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-500 rounded-xl p-3">
                    <ShoppingCartIcon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-3xl font-black text-blue-600">
                    {generatedPlan.shopping_list.length}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800">Nákupní seznam</h3>
                <p className="text-sm text-gray-600">Položek k nákupu</p>
              </div>

              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-6 border border-yellow-200/50">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-yellow-500 rounded-xl p-3">
                    <span className="text-white font-bold text-lg">Kč</span>
                  </div>
                  <span className="text-3xl font-black text-yellow-600">
                    {generatedPlan.total_cost}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800">Odhadované náklady</h3>
                <p className="text-sm text-gray-600">Celková částka</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowSettings(true)}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-white text-gray-700 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 font-medium"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-6">
                <CalendarDaysIcon className="w-6 h-6 text-gray-600" />
                <h3 className="text-xl font-semibold text-gray-900">
                  Jídelníček po dnech
                </h3>
              </div>

              <div className="space-y-8">
                {generatedPlan.daily_plans.map((dayPlan, dayIndex) => (
                  <div key={`day-${dayIndex}-${dayPlan.day}`} className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
                      <h4 className="text-xl font-semibold text-gray-900">
                        Den {dayPlan.day}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {dayPlan.meals.length} jídel • {dayPlan.meals.reduce((sum, meal) => sum + meal.recipe.nutrition.calories, 0)} celkem kalorií
                      </p>
                    </div>

                    <div className="divide-y divide-gray-100">
                      {dayPlan.meals.map((meal, index) => (
                        <div key={index} className="p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                                  {meal.type === 'breakfast' ? 'Snídaně' :
                                    meal.type === 'lunch' ? 'Oběd' :
                                      meal.type === 'dinner' ? 'Večeře' :
                                        meal.type === 'snack' ? 'Svačina' : meal.type}
                                </span>
                                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                  {meal.recipe.difficulty}
                                </span>
                              </div>
                              <h5 className="text-2xl font-bold text-gray-900 mb-2">
                                {meal.recipe.name}
                              </h5>
                              <p className="text-gray-700 text-base leading-relaxed mb-4">
                                {meal.recipe.description}
                              </p>
                            </div>

                            <div className="ml-6 text-right">
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center justify-end space-x-2">
                                  <ClockIcon className="w-4 h-4 text-gray-400" />
                                  <span className="font-medium">{meal.recipe.cookingTime} min</span>
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                  <UserIcon className="w-4 h-4 text-gray-400" />
                                  <span>{meal.recipe.servings} porcí</span>
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                  <span className="w-4 h-4 bg-orange-400 rounded-full"></span>
                                  <span className="font-semibold text-orange-600">{meal.recipe.nutrition.calories} kal</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Nutrition Info */}
                          <div className="bg-gray-50 rounded-lg p-4 mb-4">
                            <h6 className="font-medium text-gray-900 mb-2">Nutriční hodnoty (na porci)</h6>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div className="text-center">
                                <div className="text-xl font-bold text-blue-600">{meal.recipe.nutrition.protein}g</div>
                                <div className="text-gray-600">Bílkoviny</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-green-600">{meal.recipe.nutrition.carbs}g</div>
                                <div className="text-gray-600">Sacharidy</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-yellow-600">{meal.recipe.nutrition.fats}g</div>
                                <div className="text-gray-600">Tuky</div>
                              </div>
                              <div className="text-center">
                                <div className="text-xl font-bold text-orange-600">{meal.recipe.nutrition.calories}</div>
                                <div className="text-gray-600">Kalorie</div>
                              </div>
                            </div>
                          </div>

                          {/* Ingredients */}
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                              <h6 className="font-semibold text-gray-900 mb-3 flex items-center">
                                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                                Ingredience
                              </h6>
                              <div className="space-y-2">
                                {meal.recipe.ingredients.map((ingredient, i) => (
                                  <div key={i} className="flex items-center justify-between py-1 px-3 bg-gray-50 rounded-lg">
                                    <span className="text-gray-900 font-medium">{ingredient.name}</span>
                                    <span className="text-gray-600 text-sm">{ingredient.amount} {ingredient.unit}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div>
                              <h6 className="font-semibold text-gray-900 mb-3 flex items-center">
                                Postup přípravy
                              </h6>
                              <div className="space-y-3">
                                {meal.recipe.instructions.map((instruction) => (
                                  <div key={instruction.step} className="flex gap-3">
                                    <div className="flex-shrink-0 w-7 h-7 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-medium">
                                      {instruction.step}
                                    </div>
                                    <div className="flex-1">
                                      <p className="text-gray-700 text-sm leading-relaxed">
                                        {instruction.instruction}
                                      </p>
                                      {instruction.timeMinutes && (
                                        <p className="text-xs text-gray-500 mt-1">
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
                            <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <h6 className="font-medium text-blue-900 mb-2">Tipy</h6>
                              <ul className="text-sm text-blue-800 space-y-1">
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
    </div>
  );
}
