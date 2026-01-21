"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  HomeIcon,
  CameraIcon,
  CalendarDaysIcon,
  CogIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShoppingCartIcon,
  BoltIcon,
  ArchiveBoxIcon,
} from "@heroicons/react/24/outline";

interface SidebarProps {
  className?: string;
}

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
  { name: "AI Scanner", href: "/ai-scanner", icon: CameraIcon },
  { name: "Meal Planner", href: "/meal-planner", icon: CalendarDaysIcon },
  { name: "Shopping List", href: "/shopping-list", icon: ShoppingCartIcon },
  { name: "Inventory", href: "/inventory", icon: ArchiveBoxIcon },
  { name: "Quick Dinner", href: "/quick-dinner", icon: BoltIcon },
];

export default function Sidebar({ className = "" }: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  return (
    <>
      {/* Mobile menu button - only show when sidebar is closed */}
      {!mobileMenuOpen && (
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            aria-label="Otevřít menu"
          >
            <Bars3Icon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      )}

      {/* Overlay for mobile */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 transform transition-transform duration-300 ease-in-out ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:sticky lg:top-0 w-64 ${className}`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center">
              <img src="/Yumlo-Icon.png" alt="Y" className="h-8 w-auto -mr-1" />
              <span className="text-xl font-bold text-gray-900 dark:text-white">umlo</span>
            </div>
            {/* Close button for mobile */}
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Zavřít menu"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <item.icon
                    className={`w-5 h-5 ${isActive ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
                  />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Settings and Logout */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/settings"
                  ? "bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white"
              }`}
            >
              <CogIcon
                className={`w-5 h-5 ${pathname === "/settings" ? "text-green-600 dark:text-green-400" : "text-gray-400"}`}
              />
              <span>Nastavení</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 text-gray-400" />
              <span>Odhlásit se</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
