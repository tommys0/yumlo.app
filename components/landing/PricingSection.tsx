"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useDesign } from "@/lib/use-design";
import { CheckIcon } from "@heroicons/react/24/outline";

interface PriceData {
  id: string;
  amount: number | null;
  currency: string;
  interval: string;
}

interface StripePrices {
  basic: PriceData;
  ultra: PriceData;
}

const formatPrice = (amount: number | null, currency: string) => {
  if (!amount) return "0";
  const price = amount / 100;
  if (currency.toLowerCase() === "czk") {
    return `${Math.round(price)} Kč`;
  }
  return `${price} ${currency.toUpperCase()}`;
};

export default function PricingSection() {
  const design = useDesign();

  const plans = [
    {
      name: "Denní",
      price: "Zdarma",
      period: "",
      description: "Vyzkoušejte si, jak chutná vaření bez starostí.",
      features: [
        "Jídelníček na 1 den",
        "Spíž (až 20 položek)",
        "Základní nákupní seznam",
      ],
      href: "/register",
      buttonText: "Vyzkoušet",
      popular: false,
      color: "gray"
    },
    {
      name: "Plus",
      price: "199 Kč",
      period: "/měsíc",
      description: "Kompletní řešení pro vaše stravování.",
      features: [
        "Jídelníček na celý týden",
        "Neomezená spíž",
        "Chytrý nákupní seznam",
        "Recepty pro 4+ osob",
        "Sledování makroživin"
      ],
      href: "/register",
      buttonText: "Předplatit",
      popular: true,
      color: "emerald"
    },
    {
      name: "Ultra",
      price: "???",
      period: "",
      description: "To nejlepší, co pro vás chystáme.",
      features: [
        "Vše co v Plus",
        "Objednávka potravin domů",
        "Video recepty",
        "Telefonická podpora"
      ],
      href: "#",
      buttonText: "Již brzy",
      popular: false,
      color: "gray",
      disabled: true
    },
  ];

  return (
    <section
      id="cenik"
      className="py-16 md:py-24 px-5"
      style={{
        backgroundColor: design.colors.background.secondary,
        ...design.getFontFamily(),
      }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2
            className="text-3xl md:text-4xl font-bold mb-4"
            style={design.getTextColor()}
          >
            Plánujeme 3 jednoduché tarify
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ ...design.getTextColor(), opacity: 0.8 }}
          >
            Úspora času a peněz, která se vyplatí.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative p-6 lg:p-8 rounded-3xl border transition-all ${plan.popular ? "shadow-xl transform md:-translate-y-4" : "shadow-md"
                } ${plan.disabled ? "opacity-70 grayscale-[0.5]" : ""}`}
              style={{
                backgroundColor: "white",
                borderColor: plan.popular
                  ? design.colors.brand.primary
                  : design.colors.ui.border,
                borderWidth: plan.popular ? "2px" : "1px",
              }}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div
                  className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-lg"
                  style={{ backgroundColor: design.colors.brand.primary }}
                >
                  Nejoblíbenější
                </div>
              )}

              {/* Plan name */}
              <div className="mb-4">
                <span className="text-sm uppercase tracking-wider font-semibold text-gray-500">{plan.name}</span>
              </div>

              {/* Price */}
              <div className="mb-4 flex items-baseline gap-1">
                <span
                  className="text-4xl lg:text-5xl font-bold"
                  style={design.getTextColor()}
                >
                  {plan.price}
                </span>
                <span
                  className="text-lg text-gray-500"
                >
                  {plan.period}
                </span>
              </div>

              {/* Description */}
              <p
                className="mb-8 text-sm leading-relaxed"
                style={{ ...design.getTextColor(), opacity: 0.8 }}
              >
                {plan.description}
              </p>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={`mt-0.5 rounded-full p-0.5 ${plan.popular ? 'bg-emerald-100' : 'bg-gray-100'}`}>
                      <CheckIcon
                        className={`w-3 h-3 ${plan.popular ? 'text-emerald-600' : 'text-gray-500'}`}
                      />
                    </div>
                    <span
                      className="text-sm font-medium"
                      style={{ ...design.getTextColor(), opacity: 0.9 }}
                    >
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <Link
                href={plan.href}
                className={`block w-full py-4 text-center font-bold rounded-xl transition-all ${plan.disabled ? "cursor-not-allowed" : "hover:shadow-lg hover:-translate-y-0.5"
                  }`}
                style={
                  plan.popular
                    ? design.getButtonStyle("primary")
                    : {
                      color: plan.disabled ? "#9ca3af" : design.colors.text.primary,
                      border: `1px solid ${design.colors.ui.border}`,
                      backgroundColor: plan.disabled ? "#f3f4f6" : "white",
                    }
                }
                onClick={(e) => plan.disabled && e.preventDefault()}
              >
                {plan.buttonText}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
