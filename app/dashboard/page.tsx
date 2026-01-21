"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import {
  CameraIcon,
  CalendarDaysIcon,
  SparklesIcon,
  ArrowRightIcon,
  ChartBarIcon,
  ClockIcon,
  ArchiveBoxIcon,
  PlusIcon,
  PencilIcon,
} from "@heroicons/react/24/outline";
import { UsageDisplay } from "@/components/usage-display";

interface UserData {
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

interface ActivityItem {
  id: string;
  type: "inventory_add" | "inventory_update" | "meal_plan";
  title: string;
  description: string;
  timestamp: string;
  icon: "inventory" | "meal_plan";
}

interface WeeklyStats {
  inventoryItems: number;
  mealPlans: number;
  timeSaved: number; // in minutes
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    inventoryItems: 0,
    mealPlans: 0,
    timeSaved: 0,
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setUser(user);

        // Fetch user data
        const { data } = await supabase
          .from("users")
          .select(
            "name, dietary_restrictions, allergies, macro_goals, cuisine_preferences",
          )
          .eq("id", user.id)
          .single();

        setUserData(data);

        // Fetch recent activity and weekly stats
        await Promise.all([
          fetchRecentActivity(user.id),
          fetchWeeklyStats(user.id),
        ]);
      }
    };

    getUser();
  }, []);

  const fetchRecentActivity = async (userId: string) => {
    try {
      setActivityLoading(true);
      const activities: ActivityItem[] = [];

      // Fetch recent inventory items (last 10)
      const { data: inventoryData } = await supabase
        .from("inventory")
        .select("id, name, quantity, unit, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(10);

      if (inventoryData) {
        inventoryData.forEach((item) => {
          const isNew =
            new Date(item.created_at).getTime() ===
            new Date(item.updated_at).getTime();
          activities.push({
            id: `inv-${item.id}`,
            type: isNew ? "inventory_add" : "inventory_update",
            title: item.name,
            description: isNew
              ? `Přidáno do inventáře${item.quantity ? `: ${item.quantity} ${item.unit || ""}` : ""}`
              : `Upraveno${item.quantity ? `: ${item.quantity} ${item.unit || ""}` : ""}`,
            timestamp: item.updated_at,
            icon: "inventory",
          });
        });
      }

      // Fetch recent meal plans (last 5 completed)
      const { data: mealPlanData } = await supabase
        .from("meal_plan_jobs")
        .select("id, params, completed_at")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(5);

      if (mealPlanData) {
        mealPlanData.forEach((job) => {
          const params = job.params as { days?: number; meals_per_day?: number };
          activities.push({
            id: `mp-${job.id}`,
            type: "meal_plan",
            title: "Jídelníček vygenerován",
            description: `${params.days || 7} dní, ${params.meals_per_day || 3} jídla denně`,
            timestamp: job.completed_at,
            icon: "meal_plan",
          });
        });
      }

      // Sort by timestamp descending and take top 8
      activities.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentActivity(activities.slice(0, 8));
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    } finally {
      setActivityLoading(false);
    }
  };

  const fetchWeeklyStats = async (userId: string) => {
    try {
      // Get date 7 days ago
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoISO = weekAgo.toISOString();

      // Count inventory items added this week
      const { count: inventoryCount } = await supabase
        .from("inventory")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .gte("created_at", weekAgoISO);

      // Count meal plans generated this week
      const { count: mealPlanCount } = await supabase
        .from("meal_plan_jobs")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("completed_at", weekAgoISO);

      // Estimate time saved (30 min per meal plan for planning + 10 min per inventory item)
      const timeSaved =
        (mealPlanCount || 0) * 30 + (inventoryCount || 0) * 2;

      setWeeklyStats({
        inventoryItems: inventoryCount || 0,
        mealPlans: mealPlanCount || 0,
        timeSaved,
      });
    } catch (error) {
      console.error("Error fetching weekly stats:", error);
    }
  };

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "právě teď";
    if (diffMins < 60) return `před ${diffMins} min`;
    if (diffHours < 24) return `před ${diffHours} h`;
    if (diffDays === 1) return "včera";
    if (diffDays < 7) return `před ${diffDays} dny`;
    return date.toLocaleDateString("cs-CZ");
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Vítejte zpět{userData?.name ? `, ${userData.name}` : ""}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Začněte s AI skenováním nebo si naplánujte nový jídelníček
        </p>
      </div>

      {/* Usage Stats */}
      <div className="mb-8">
        <UsageDisplay showUpgradeButton={true} />
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* AI Scanner Card */}
        <Link
          href="/ai-scanner"
          className="group block bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border border-blue-200 dark:border-blue-800 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">
                AI Scanner
              </h3>
              <p className="text-blue-600 dark:text-blue-400">Naskenovat ingredience</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Nahrajte fotky z ledničky a AI automaticky rozpozná všechny
            ingredience pro vás
          </p>
          <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
            <span>Spustit skenování</span>
            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Meal Planner Card */}
        <Link
          href="/meal-planner"
          className="group block bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border border-green-200 dark:border-green-800 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white group-hover:text-green-700 dark:group-hover:text-green-400 transition-colors">
                Meal Planner
              </h3>
              <p className="text-green-600 dark:text-green-400">Naplánovat jídelníček</p>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Vygenerujte personalizovaný jídelníček s automaticky vytvořeným
            nákupním košíkem
          </p>
          <div className="flex items-center text-green-600 dark:text-green-400 font-medium">
            <span>Vytvořit plán</span>
            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Nedávná aktivita
            </h2>

            {activityLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12">
                <SparklesIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Zatím žádná aktivita
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  Začněte skenováním ingrediencí nebo vytvořením jídelníčku
                </p>
                <div className="space-x-3">
                  <Link
                    href="/ai-scanner"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <CameraIcon className="w-4 h-4 mr-2" />
                    AI Scanner
                  </Link>
                  <Link
                    href="/meal-planner"
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CalendarDaysIcon className="w-4 h-4 mr-2" />
                    Meal Planner
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className={`p-2 rounded-lg ${
                        activity.icon === "inventory"
                          ? "bg-green-100 dark:bg-green-900/30"
                          : "bg-blue-100 dark:bg-blue-900/30"
                      }`}
                    >
                      {activity.icon === "inventory" ? (
                        activity.type === "inventory_add" ? (
                          <PlusIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <PencilIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )
                      ) : (
                        <CalendarDaysIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap">
                      {formatRelativeTime(activity.timestamp)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            {recentActivity.length > 0 && (
              <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href="/inventory"
                  className="text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  Zobrazit inventář →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* User Preferences */}
          {userData?.dietary_restrictions &&
            userData.dietary_restrictions.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Vaše preference
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Dietní omezení:</p>
                  <div className="flex flex-wrap gap-2">
                    {userData.dietary_restrictions.map((restriction, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-full"
                      >
                        {restriction}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="inline-flex items-center mt-3 text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 font-medium"
                >
                  Upravit preference →
                </Link>
              </div>
            )}

          {/* Weekly Stats */}
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Tento týden
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                    <ArchiveBoxIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Položky v inventáři</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                      {weeklyStats.inventoryItems}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Jídelníčky</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                      {weeklyStats.mealPlans}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Čas ušetřený</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white tabular-nums">
                      {weeklyStats.timeSaved > 0
                        ? weeklyStats.timeSaved >= 60
                          ? `${Math.floor(weeklyStats.timeSaved / 60)} h ${weeklyStats.timeSaved % 60} min`
                          : `${weeklyStats.timeSaved} min`
                        : "0 min"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
