"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useDesign } from "@/lib/use-design";
import { supabase } from "@/lib/supabase";
import { Bars3Icon, XMarkIcon } from "@heroicons/react/24/outline";

const navLinks = [
  { href: "#funkce", label: "Funkce" },
  { href: "#jak-to-funguje", label: "Jak to funguje" },
  { href: "#cenik", label: "Ceník" },
];

export default function Header() {
  const design = useDesign();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setCheckingAuth(false);
    };
    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "shadow-md" : ""
        }`}
        style={{
          backgroundColor: scrolled
            ? design.colors.background.secondary
            : "transparent",
          ...design.getFontFamily(),
        }}
      >
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/Yumlo-Icon.png"
                alt="Yumlo"
                width={40}
                height={40}
                className="rounded-lg"
              />
              <span
                className="text-2xl font-bold italic"
                style={design.getTextColor()}
              >
                Yumlo
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="font-medium transition-opacity hover:opacity-70"
                  style={design.getTextColor()}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            {/* Desktop CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {checkingAuth ? (
                <div className="w-24 h-10 bg-gray-200 animate-pulse rounded-lg" />
              ) : isLoggedIn ? (
                <Link
                  href="/dashboard"
                  className="px-4 py-2 font-bold rounded-lg transition-all hover:opacity-90"
                  style={design.getButtonStyle("primary")}
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 font-medium rounded-lg transition-all hover:opacity-80"
                    style={{
                      color: design.colors.text.primary,
                      border: `1px solid ${design.colors.ui.border}`,
                    }}
                  >
                    Přihlásit se
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 font-bold rounded-lg transition-all hover:opacity-90"
                    style={design.getButtonStyle("primary")}
                  >
                    Registrovat
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg"
              style={{ color: design.colors.text.primary }}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div
            className="md:hidden border-t"
            style={{
              backgroundColor: design.colors.background.secondary,
              borderColor: design.colors.ui.border,
            }}
          >
            <div className="px-5 py-4 space-y-4">
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  className="block font-medium py-2"
                  style={design.getTextColor()}
                >
                  {link.label}
                </a>
              ))}
              <div className="pt-4 space-y-3 border-t" style={{ borderColor: design.colors.ui.border }}>
                {isLoggedIn ? (
                  <Link
                    href="/dashboard"
                    className="block w-full text-center px-4 py-3 font-bold rounded-lg"
                    style={design.getButtonStyle("primary")}
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="block w-full text-center px-4 py-3 font-medium rounded-lg"
                      style={{
                        color: design.colors.text.primary,
                        border: `1px solid ${design.colors.ui.border}`,
                      }}
                    >
                      Přihlásit se
                    </Link>
                    <Link
                      href="/register"
                      className="block w-full text-center px-4 py-3 font-bold rounded-lg"
                      style={design.getButtonStyle("primary")}
                    >
                      Registrovat
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />
    </>
  );
}
