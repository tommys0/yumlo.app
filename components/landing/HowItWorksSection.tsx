"use client";

import { useDesign } from "@/lib/use-design";

const steps = [
  {
    number: 1,
    title: "Zaregistrujte se",
    description: "Vytvořte si účet zdarma za méně než minutu",
  },
  {
    number: 2,
    title: "Nastavte preference",
    description: "Zadejte dietní omezení, alergie a makro cíle",
  },
  {
    number: 3,
    title: "Naskenujte ingredience",
    description: "Vyfoťte svou lednici a AI rozpozná suroviny",
  },
  {
    number: 4,
    title: "Získejte recepty",
    description: "Vygenerujte personalizovaný jídelníček",
  },
];

export default function HowItWorksSection() {
  const design = useDesign();

  return (
    <section
      id="jak-to-funguje"
      className="py-16 md:py-24 px-5"
      style={{
        backgroundColor: design.colors.background.primary,
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
            Jak to funguje
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ ...design.getTextColor(), opacity: 0.8 }}
          >
            Začněte používat Yumlo ve čtyřech jednoduchých krocích
          </p>
        </div>

        {/* Steps */}
        <div className="relative">
          {/* Connecting line - desktop only */}
          <div
            className="hidden md:block absolute top-12 left-0 right-0 h-0.5"
            style={{
              backgroundColor: design.colors.ui.border,
              marginLeft: "12.5%",
              marginRight: "12.5%",
            }}
          />

          <div className="grid md:grid-cols-4 gap-8 md:gap-6">
            {steps.map((step, index) => (
              <div key={step.number} className="relative text-center">
                {/* Step number */}
                <div
                  className="relative z-10 w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center shadow-lg"
                  style={{
                    backgroundColor: design.colors.brand.primary,
                  }}
                >
                  <span className="text-4xl font-bold text-white">
                    {step.number}
                  </span>
                </div>

                {/* Content */}
                <h3
                  className="text-xl font-bold mb-2"
                  style={design.getTextColor()}
                >
                  {step.title}
                </h3>
                <p
                  className="text-sm leading-relaxed"
                  style={{ ...design.getTextColor(), opacity: 0.8 }}
                >
                  {step.description}
                </p>

                {/* Mobile connector */}
                {index < steps.length - 1 && (
                  <div
                    className="md:hidden w-0.5 h-8 mx-auto mt-6"
                    style={{ backgroundColor: design.colors.ui.border }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
