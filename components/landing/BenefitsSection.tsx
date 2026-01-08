"use client";

import { useDesign } from "@/lib/use-design";
import Link from "next/link";

export default function BenefitsSection() {
    const design = useDesign();

    return (
        <section
            className="py-16 md:py-24 px-5 relative overflow-hidden"
            style={{
                backgroundColor: design.colors.background.primary,
                ...design.getFontFamily(),
            }}
        >
            {/* Background Gradient */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-50 opacity-50 blur-3xl rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>

            <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                {/* Left Content */}
                <div>
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6"
                        style={{
                            backgroundColor: "#ecfdf5",
                            color: "#059669",
                            border: "1px solid #d1fae5"
                        }}
                    >
                        <span className="text-sm font-bold">Až 0 Kč / měsíc</span>
                    </div>

                    <h2
                        className="text-4xl md:text-5xl font-bold leading-tight mb-6"
                        style={design.getTextColor()}
                    >
                        Konec plýtvání.
                        <br />
                        <span className="text-emerald-500">Začátek chytrého vaření.</span>
                    </h2>

                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        Každý rok průměrná rodina vyhodí jídlo za tisíce. S Yumlo snížíte plýtvání na nulu.
                        Vaříme z toho, co máte, a nakupujeme jen to, co potřebujete.
                    </p>

                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        Naše komunita už zachránila přes 500+ ledniček plných jídla, které by jinak skončilo v koši.
                    </p>

                    <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                        Vaše vaření už bude navždy jiné - chytřejší, levnější a ekologičtější.
                    </p>

                </div>

                {/* Right Content - Cards */}
                <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 relative">
                    <div className="space-y-8">
                        {/* Benefit Item 1 */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 4.5ZM3 4.5v15c0 .414.336.75.75.75h.75m0-15.75h.75v6.75h-.75V4.5Zm0 15.75a.75.75 0 0 1-.75-.75v-.75m0 0V3.75m0 14.25a2.25 2.25 0 0 0 2.25-2.25V6m0 16.5h.75m-.75 0a2.25 2.25 0 0 1-2.25-2.25V3.75m16.5 0a2.25 2.25 0 0 0-2.25 2.25v2.684m0-4.934h-.75m.75 0h.75m0 17.25h.75a2.25 2.25 0 0 0 2.25-2.25V6a2.25 2.25 0 0 0-2.25-2.25H18.75" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">Až 0 Kč</h3>
                                <p className="text-gray-500 text-sm">
                                    Průměrná měsíční úspora pro 4člennou rodinu díky chytrému plánování.
                                </p>
                            </div>
                        </div>

                        <div className="w-full h-px bg-gray-100"></div>

                        {/* Benefit Item 2 */}
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-emerald-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-1">0 %</h3>
                                <p className="text-gray-500 text-sm">
                                    Zbytečně vyhozeného jídla. Využijeme vše do posledního kousku.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
