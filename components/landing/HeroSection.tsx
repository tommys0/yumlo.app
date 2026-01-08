"use client";

import Link from "next/link";
import { useDesign } from "@/lib/use-design";

export default function HeroSection() {
  const design = useDesign();

  const scrollToFeatures = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.querySelector("#funkce");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="pt-16 pb-0 md:pt-24 px-5 overflow-hidden"
      style={{
        backgroundColor: design.colors.background.primary,
        ...design.getFontFamily(),
      }}
    >
      <div className="max-w-6xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 animate-fade-in"
          style={{
            backgroundColor: design.colors.background.secondary,
            border: `1px solid ${design.colors.ui.border}`,
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ backgroundColor: design.colors.brand.primary }}
          />
          <span className="text-sm font-medium" style={design.getTextColor()}>
            Zachraňme jídlo pro příští generace
          </span>
        </div>

        {/* Headline */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 animate-fade-in-up"
          style={design.getTextColor()}
        >
          Přestaň vyhazovat jídlo.{" "}
          <span
            className="block mt-2"
            style={{ color: design.colors.brand.primary }}
          >
            Nech AI vařit z toho, co máš.
          </span>
        </h1>

        {/* Subheadline */}
        <p
          className="text-lg md:text-xl leading-relaxed mb-10 max-w-2xl mx-auto animate-fade-in"
          style={{
            ...design.getTextColor(),
            opacity: 0.8,
            animationDelay: "0.2s",
          }}
        >
          Yumlo sestaví jídelníček na míru tvým chutím, surovinám, co už máš doma a ušetříš až 2 000+ Kč měsíčně.
        </p>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/register"
            className="w-full sm:w-auto px-10 py-4 text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            style={design.getButtonStyle("primary")}
          >
            Přestat vyhazovat →
          </Link>
        </div>

        {/* App Interface Visual */}
        <div
          className="relative mx-auto rounded-t-3xl shadow-2xl border-t border-x border-gray-200 overflow-hidden animate-slide-up"
          style={{
            maxWidth: '1000px',
            backgroundColor: '#fff',
            height: '500px', // Placeholder height
            background: 'linear-gradient(to bottom, #fff 0%, #f9fafb 100%)',
            animationDelay: "0.5s",
          }}
        >
          {/* Mockup Content / Placeholder */}
          <div className="absolute inset-0 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <p className="mb-4 text-xl font-medium">Ukázka aplikace</p>
              <div className="w-64 h-4 bg-gray-200 rounded-full mx-auto mb-2 opacity-50"></div>
              <div className="w-48 h-4 bg-gray-200 rounded-full mx-auto opacity-50"></div>
            </div>
          </div>

          {/* Decorative abstract UI elements to mimic screenshot */}
          <div className="absolute top-8 left-8 right-8 bottom-0 bg-white rounded-t-xl shadow-inner border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-8">
              <div className="w-32 h-8 bg-gray-100 rounded-lg"></div>
              <div className="w-10 h-10 bg-emerald-100 rounded-full"></div>
            </div>
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="h-32 bg-emerald-50 rounded-2xl border border-emerald-100 p-4 relative overflow-hidden">
                  <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-xl shadow-sm"></div>
                </div>
                <div className="h-24 bg-gray-50 rounded-2xl"></div>
              </div>
              <div className="col-span-1 space-y-4">
                <div className="h-40 bg-gray-50 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
