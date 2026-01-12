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
} from "@heroicons/react/24/outline";

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

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);

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
      }
    };

    getUser();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Vítejte zpět{userData?.name ? `, ${userData.name}` : ""}!
        </h1>
        <p className="text-gray-600">
          Začněte s AI skenováním nebo si naplánujte nový jídelníček
        </p>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* AI Scanner Card */}
        <Link
          href="/ai-scanner"
          className="group block bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
              <CameraIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                AI Scanner
              </h3>
              <p className="text-blue-600">Naskenovat ingredience</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Nahrajte fotky z ledničky a AI automaticky rozpozná všechny
            ingredience pro vás
          </p>
          <div className="flex items-center text-blue-600 font-medium">
            <span>Spustit skenování</span>
            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>

        {/* Meal Planner Card */}
        <Link
          href="/meal-planner"
          className="group block bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
              <CalendarDaysIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 group-hover:text-green-700 transition-colors">
                Meal Planner
              </h3>
              <p className="text-green-600">Naplánovat jídelníček</p>
            </div>
          </div>
          <p className="text-gray-600 mb-4">
            Vygenerujte personalizovaný jídelníček s automaticky vytvořeným
            nákupním košíkem
          </p>
          <div className="flex items-center text-green-600 font-medium">
            <span>Vytvořit plán</span>
            <ArrowRightIcon className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              Nedávná aktivita
            </h2>

            <div className="space-y-4">
              <div className="text-center py-12">
                <SparklesIcon className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Zatím žádná aktivita
                </h3>
                <p className="text-gray-500 mb-4">
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
            </div>
          </div>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          {/* User Preferences */}
          {userData?.dietary_restrictions &&
            userData.dietary_restrictions.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Vaše preference
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Dietní omezení:</p>
                  <div className="flex flex-wrap gap-2">
                    {userData.dietary_restrictions.map((restriction, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full"
                      >
                        {restriction}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  href="/settings"
                  className="inline-flex items-center mt-3 text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Upravit preference →
                </Link>
              </div>
            )}

          {/* Weekly Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Tento týden
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <CameraIcon className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Naskenované fotky</p>
                    <p className="text-lg font-semibold text-gray-900">
                      0
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <CalendarDaysIcon className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Jídelníčky</p>
                    <p className="text-lg font-semibold text-gray-900">0</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <ClockIcon className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Čas ušetřený</p>
                    <p className="text-lg font-semibold text-gray-900">0 min</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">💡 Tip</h3>
            <p className="text-sm text-gray-600">
              Pro nejlepší výsledky AI skenování fotografujte ingredience při
              dobrém osvětlení a v přehledném uspořádání.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
