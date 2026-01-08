"use client";

import Link from "next/link";
import { useDesign } from "@/lib/use-design";

export default function CTASection() {
  const design = useDesign();

  return (
    <section
      className="py-16 md:py-24 px-5"
      style={{
        background: `linear-gradient(135deg, ${design.colors.brand.primary} 0%, #047857 100%)`,
        ...design.getFontFamily(),
      }}
    >
      <div className="max-w-4xl mx-auto text-center">
        {/* Headline */}
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
          Připraveni změnit způsob, jak plánujete jídlo?
        </h2>

        {/* Subheadline */}
        <p className="text-lg md:text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          Přidejte se k tisícům spokojených uživatelů a začněte šetřit čas i
          peníze ještě dnes.
        </p>

        {/* CTA Button */}
        <Link
          href="/register"
          className="inline-block px-10 py-4 text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          style={{
            backgroundColor: design.colors.background.secondary,
            color: design.colors.brand.primary,
          }}
        >
          Začít zdarma
        </Link>

        {/* Trust text */}
        <p className="text-white/70 text-sm mt-6">
          7 dní zdarma. Bez kreditní karty.
        </p>

        {/* Decorative elements */}
        <div className="relative mt-8">
          <div className="absolute -top-16 left-1/4 w-20 h-20 rounded-full bg-white/10 animate-float" />
          <div
            className="absolute -top-12 right-1/4 w-16 h-16 rounded-full bg-white/5 animate-float"
            style={{ animationDelay: "1s" }}
          />
          <div
            className="absolute -top-8 right-1/3 w-10 h-10 rounded-full bg-white/5 animate-float"
            style={{ animationDelay: "2s" }}
          />
        </div>
      </div>
    </section>
  );
}
