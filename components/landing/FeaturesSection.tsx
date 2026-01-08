"use client";

import { useDesign } from "@/lib/use-design";

export default function FeaturesSection() {
  const design = useDesign();

  return (
    <section
      id="funkce"
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
            Vaření, které dává smysl
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ ...design.getTextColor(), opacity: 0.8 }}
          >
            Odbouráváme stres z &quot;co mám dnes vařit&quot; a šetříme vaše peníze i přírodu.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* Card 1 */}
          <div
            className="p-8 rounded-3xl shadow-sm border transition-all hover:shadow-md bg-white flex flex-col items-start text-left h-full"
            style={{
              borderColor: design.colors.ui.border,
            }}
          >
            <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-7 h-7 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold mb-3" style={design.getTextColor()}>
              Váš vztah se změní
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Už žádný stres a rozhodovací paralýza. S Yumlo se na vaření budete těšit.
            </p>
          </div>

          {/* Card 2 - With Mini UI Mockup */}
          <div
            className="p-8 rounded-3xl shadow-sm border transition-all hover:shadow-md bg-white flex flex-col text-left h-full overflow-hidden relative"
            style={{
              borderColor: design.colors.ui.border,
            }}
          >
            <div className="absolute top-8 right-8 w-32 opacity-10">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-orange-200 rounded-full blur-2xl"></div>
            </div>

            <div className="mb-6 relative">
              {/* Mini List Mockup */}
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 w-full max-w-[200px] shadow-sm transform rotate-1">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full border border-orange-200 bg-white"></div>
                  <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full border border-orange-200 bg-white"></div>
                  <div className="h-2 w-24 bg-gray-200 rounded-full"></div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border border-orange-200 bg-white"></div>
                  <div className="h-2 w-12 bg-gray-200 rounded-full"></div>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-3" style={design.getTextColor()}>
              Nákupní seznam
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Chytrý seznam, který se tvoří sám podle vybraných receptů. Nic nezapomenete.
            </p>
          </div>

          {/* Card 3 - With Chart Visual */}
          <div
            className="p-8 rounded-3xl shadow-sm border transition-all hover:shadow-md bg-white flex flex-col text-left h-full"
            style={{
              borderColor: design.colors.ui.border,
            }}
          >
            <div className="mb-6 flex justify-start">
              <div className="relative w-14 h-14 flex items-center justify-center">
                {/* Simple Donut Chart */}
                <svg viewBox="0 0 36 36" className="w-14 h-14 transform -rotate-90">
                  <path
                    d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831
                                a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#ecfdf5"
                    strokeWidth="4"
                  />
                  <path
                    d="M18 2.0845
                                a 15.9155 15.9155 0 0 1 0 31.831"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="4"
                    strokeDasharray="75, 100"
                  />
                </svg>
                <span className="absolute text-[10px] font-bold text-emerald-600">0%</span>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-3" style={design.getTextColor()}>
              Udržitelný nákup
            </h3>
            <p className="text-sm leading-relaxed text-gray-600">
              Snižte plýtvání potravinami na minimum. Yumlo šetří vaši peněženku i planetu.
            </p>
          </div>
        </div>

        {/* Second Row Features (Benefits) */}
        <div className="grid md:grid-cols-2 gap-8 mt-8">
          <div
            className="p-8 rounded-3xl shadow-sm border bg-emerald-50 border-emerald-100 flex flex-col justify-between"
          >
            <div>
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-emerald-900">
                Cena
              </h3>
              <h4 className="text-3xl font-bold text-emerald-600 mb-2">až 0 Kč</h4>
              <p className="text-sm text-emerald-800 opacity-80">
                Základní verze je a vždy bude zdarma.
              </p>
            </div>
          </div>

          <div
            className="p-8 rounded-3xl shadow-sm border bg-white border-gray-100 flex flex-col justify-between relative overflow-hidden"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-blue-600">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold mb-2 text-gray-900">
                Zero Waste Challenge
              </h3>
              <h4 className="text-3xl font-bold text-gray-400 mb-2">-0%</h4>
              <p className="text-sm text-gray-500">
                Snížíte svůj odpad z potravin na absolutní minimum.
              </p>
            </div>
            {/* Decorative background circle */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-blue-50 rounded-full opacity-50"></div>
          </div>
        </div>

      </div>
    </section>
  );
}
