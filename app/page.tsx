'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  Leaf,
  Clock,
  ChefHat,
  ListChecks,
  Target,
  TrendingDown,
  ShoppingBasket,
  CheckCircle,
  ArrowRight,
  Star,
  Play
} from 'lucide-react';

export default function Home() {
  const [email, setEmail] = useState('');
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [savingsAmount, setSavingsAmount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const statsRef = useRef<HTMLElement>(null);

  const commonIngredients = [
    '🥕 Mrkev', '🍚 Rýže', '🥖 Chléb', '🥛 Mléko',
    '🥩 Kuře', '🍅 Rajčata', '🥔 Brambory', '🧅 Cibule',
    '🥬 Salát', '🧀 Sýr', '🥚 Vejce', '🐟 Ryba'
  ];

  useEffect(() => {
    setIsVisible(true);

    // Animate savings counter (Czech crowns)
    const animateSavings = () => {
      const target = 6200; // Czech crowns equivalent
      let current = 0;
      const increment = target / 60;
      const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
          setSavingsAmount(target);
          clearInterval(timer);
        } else {
          setSavingsAmount(Math.floor(current));
        }
      }, 50);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.target === statsRef.current) {
            animateSavings();
          }
        });
      },
      { threshold: 0.5 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-mint-50 font-sans text-slate-600 selection:bg-mint selection:text-white overflow-x-hidden">
      {/* A. Navigation Bar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex justify-between items-center h-20">
            {/* Left: Yumlo Logo */}
            <div className="flex items-center gap-2">
              <Image src="/icon.png" alt="Yumlo" width={32} height={32} />
              <span className="font-bold text-xl text-gray-900 tracking-tight">Yumlo</span>
            </div>

            {/* Right: Links & CTA */}
            <div className="hidden md:flex items-center gap-8">
              <Link href="#funkce" className="text-sm font-medium text-gray-600 hover:text-green-primary transition-colors">Funkce</Link>
              <Link href="#cennik" className="text-sm font-medium text-gray-600 hover:text-green-primary transition-colors">Ceník</Link>
              <Link href="#demo" className="text-sm font-medium text-gray-600 hover:text-green-primary transition-colors">Demo</Link>
              <Link
                href="/registrace"
                className="bg-green-primary text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-green-dark transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                Zkusit zdarma
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* B. Hero Section - High Conversion */}
      <section className="bg-gradient-to-b from-green-lightest to-white pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-6xl">

          {/* Small badge */}
          <div className={`inline-flex items-center gap-2 bg-white border border-green-light px-4 py-2 rounded-full mb-6 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="w-2 h-2 bg-green-primary rounded-full animate-pulse"></div>
            <span className="text-green-darker font-medium">AI plánování jídel</span>
          </div>

          {/* Main headline */}
          <h1 className={`text-5xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            Proměňte nákupy <br />v <span className="text-green-primary">úspory</span>
          </h1>

          {/* Subheadline */}
          <p className={`text-xl text-gray-600 mb-8 max-w-2xl transition-all duration-700 delay-400 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            AI plánovač jídel, který vytváří recepty z toho, co už máte doma.
            Ušetřete až <span className="font-semibold text-gray-900">6000 Kč měsíčně</span> a už nikdy neplýtvejte jídlem.
          </p>

          {/* Single, strong CTA */}
          <div className={`flex flex-col sm:flex-row gap-4 mb-8 transition-all duration-700 delay-600 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <button className="group bg-green-primary hover:bg-green-dark text-white px-8 py-4 rounded-lg font-semibold text-lg transition-all hover:scale-105 shadow-lg hover:shadow-green-primary/30 flex items-center justify-center gap-2">
              Zkusit 7 dní zdarma
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="group bg-white text-green-darker border-2 border-gray-200 px-8 py-4 rounded-lg font-semibold hover:border-green-primary transition-all flex items-center justify-center gap-2">
              <Play className="w-5 h-5" />
              Podívat se na demo (2 min)
            </button>
          </div>

          {/* Trust indicators */}
          <div className={`flex flex-wrap items-center gap-6 text-sm text-gray-600 transition-all duration-700 delay-800 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-primary" />
              <span>7 dní zdarma</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-primary" />
              <span>Bez platební karty</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-primary" />
              <span>Kdykoli zrušit</span>
            </div>
          </div>

          {/* Star rating and testimonial preview */}
          <div className={`mt-8 flex items-center gap-4 transition-all duration-700 delay-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
              ))}
            </div>
            <span className="text-gray-600 font-medium">4.9/5 od 2 847+ českých rodin</span>
          </div>

          {/* Launch special urgency banner */}
          <div className={`mt-8 inline-flex items-center gap-2 bg-yellow-50 border border-yellow-200 px-4 py-2 rounded-lg transition-all duration-700 delay-1200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <span className="text-yellow-600">🔥</span>
            <span className="text-yellow-800 font-medium">
              Spuštění: Prvních 1000 uživatelů získá 50% slevu na 3 měsíce
            </span>
          </div>

        </div>
      </section>

      {/* C. Positive Food Waste Solutions Section */}
      <section className="bg-gradient-to-br from-emerald-700 via-green-primary to-teal-600 py-20">
        <div className="container mx-auto px-4 max-w-6xl">

          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-white mb-4">
              České rodiny plýtvají penězi
            </h2>
            <p className="text-xl text-emerald-100 max-w-2xl mx-auto">
              Každý rok průměrná domácnost vyhodí perfektní jídlo za tisíce korun.
              <span className="text-white font-semibold"> Toto můžete ušetřit:</span>
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">

            {/* Card 1 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200 hover:border-emerald-400 transition-all group">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">{savingsAmount.toLocaleString()} Kč</div>
              <p className="text-gray-600">
                Průměrné měsíční plýtvání jídlem v české domácnosti
              </p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200 hover:border-emerald-400 transition-all group">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <TrendingDown className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">30%</div>
              <p className="text-gray-600">
                Nákupů skončí v koši, než se stihne využít
              </p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-emerald-200 hover:border-emerald-400 transition-all group">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="text-4xl font-bold text-gray-900 mb-2">15 hodin</div>
              <p className="text-gray-600">
                Měsíčně promarněných přemýšlením "co na oběd?"
              </p>
            </div>

          </div>

          {/* CTA below stats */}
          <div className="text-center mt-12">
            <button className="bg-white text-emerald-700 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-all shadow-lg flex items-center gap-2 mx-auto">
              Přestat plýtvat, začít šetřit
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      </section>

      {/* D. Features Section with Clear Value Props */}
      <section className="py-20 bg-white" id="funkce">
        <div className="container mx-auto px-4 max-w-6xl">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proč si rodiny vybírají Yumlo
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Nejsme jen další aplikace na plánování jídel. Jsme váš partner při
              vytváření chytřejší a udržitelnější kuchyně.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">

            {/* Feature 1 */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-green-primary hover:shadow-xl transition-all group">

              <div className="w-16 h-16 bg-green-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Wallet className="w-9 h-9 text-green-primary" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ušetříte 6000+ Kč měsíčně
              </h3>

              <p className="text-gray-600 mb-6">
                Přestaňte nakupovat potraviny, které nepotřebujete. Naše AI upřednostňuje
                to, co už máte v lednici, takže nakupujete chytřeji a hodně ušetříte.
              </p>

              <a href="#" className="text-green-primary font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Zjistit více
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 2 */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-green-primary hover:shadow-xl transition-all group">

              <div className="w-16 h-16 bg-green-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Leaf className="w-9 h-9 text-green-primary" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Méně plýtvání jídlem
              </h3>

              <p className="text-gray-600 mb-6">
                Využijte co máte, než se to zkazí. Sledujte spotřebu, dostávejte
                připomínky a proměňte "skoro zkažené" suroviny ve skvělá jídla.
              </p>

              <a href="#" className="text-green-primary font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Zjistit více
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

            {/* Feature 3 */}
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-green-primary hover:shadow-xl transition-all group">

              <div className="w-16 h-16 bg-green-light rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-9 h-9 text-green-primary" />
              </div>

              <h3 className="text-2xl font-bold text-gray-900 mb-3">
                Ušetříte 15+ hodin
              </h3>

              <p className="text-gray-600 mb-6">
                Konec stresu "co na oběd?". Získejte personalizované jídelní plány
                během sekund podle vašich zásob, preferencí a rozvrhu.
              </p>

              <a href="#" className="text-green-primary font-semibold inline-flex items-center gap-2 group-hover:gap-3 transition-all">
                Zjistit více
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-20 bg-green-lightest" id="demo">
        <div className="container mx-auto px-4 max-w-4xl">

          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Vyzkoušejte si to teď - uvidíte kouzlo
            </h2>
            <p className="text-xl text-gray-600">
              Vyberte suroviny, které máte doma, a sledujte, jak Yumlo vytvoří recepty na míru
            </p>
          </div>

          {/* Interactive Ingredient Selector - Moved from hero */}
          <div className="relative bg-white rounded-3xl border border-white/50 shadow-2xl shadow-gray-200/20 p-8">
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Co máte v lednici?</h3>
              <p className="text-gray-600">Klikněte na suroviny, které máte k dispozici:</p>
            </div>

            {/* Ingredient Grid */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-6">
              {commonIngredients.map((ingredient, index) => (
                <button
                  key={ingredient}
                  onClick={() => toggleIngredient(ingredient)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 border-2 ${selectedIngredients.includes(ingredient)
                    ? 'bg-green-primary text-white border-green-primary shadow-lg shadow-green-primary/25'
                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-green-primary/50 hover:bg-green-primary/5'
                    }`}
                >
                  {ingredient}
                </button>
              ))}
            </div>

            {/* Generated Recipe Preview */}
            {selectedIngredients.length > 0 && (
              <div className="bg-gradient-to-r from-green-primary/10 to-emerald-500/10 rounded-2xl p-6 border border-green-primary/20">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-primary to-emerald-600 rounded-xl flex items-center justify-center">
                    <ChefHat className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-gray-900 text-lg mb-1">
                      {selectedIngredients.length > 2
                        ? 'Středozemní miska'
                        : selectedIngredients.length > 1
                          ? 'Rychlé restované'
                          : 'Jednoduchá příprava'}
                    </h4>
                    <p className="text-sm text-gray-600 mb-3">
                      Využívá {selectedIngredients.length} z vašich vybraných surovin
                    </p>
                    <div className="flex gap-2">
                      <span className="px-3 py-1 bg-green-primary text-white text-xs rounded-full font-medium">
                        Hotové za 15 min
                      </span>
                      <span className="px-3 py-1 bg-green-primary text-white text-xs rounded-full font-medium">
                        80 Kč za porci
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* CTA for Demo */}
            <div className="mt-8 text-center">
              <button className="bg-green-primary hover:bg-green-dark text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 hover:scale-105 shadow-lg flex items-center gap-2 mx-auto">
                Získat kompletní jídelní plán
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* E. Social Proof Section - Ready for Launch */}
      <section className="py-20 bg-green-lightest">
        <div className="container mx-auto px-4 max-w-6xl">

          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Milují nás české rodiny
            </h2>
            <p className="text-xl text-gray-600">
              Podívejte se, jak Yumlo mění kuchyně po celé zemi
            </p>
          </div>

          {/* Early Access CTA - Shows before testimonials exist */}
          <div className="text-center p-8 bg-white rounded-2xl border-2 border-dashed border-green-primary">
            <ChefHat className="w-12 h-12 text-green-primary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Buďte mezi prvními
            </h3>
            <p className="text-gray-600 mb-6">
              Připojte se k tisícům českých rodin, které jsou připravené transformovat své kuchyně
            </p>
            <button className="bg-green-primary hover:bg-green-dark text-white px-6 py-3 rounded-lg font-semibold transition-all">
              Začít zdarma
            </button>
          </div>

          {/* Template for future testimonials - ready to populate */}
          <div className="grid md:grid-cols-3 gap-6 mt-16 opacity-50">

            {/* Testimonial Card Template 1 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Tento týden jsem ušetřila 450 Kč jen tím, že jsem použila suroviny,
                na které jsem zapomněla. AI recepty jsou opravdu dobré!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-semibold">JN</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Jana Novákova</div>
                  <div className="text-sm text-gray-500">Praha, 2 děti</div>
                </div>
              </div>
            </div>

            {/* Testimonial Card Template 2 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Konečně žádná zelenina do koše! Aplikace mi připomíná, abych
                věci použila, než se zkazí. Geniální."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-semibold">MP</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Martin Procházka</div>
                  <div className="text-sm text-gray-500">Brno, sám</div>
                </div>
              </div>
            </div>

            {/* Testimonial Card Template 3 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "Plánování jídel mi dříve trvalo hodiny. Teď je to za 5 minut hotové.
                Rodina miluje rozmanitost receptů."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-500 font-semibold">AV</span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">Anna Svobodová</div>
                  <div className="text-sm text-gray-500">Ostrava, 3 děti</div>
                </div>
              </div>
            </div>

          </div>

          <div className="text-center mt-8">
            <p className="text-sm text-gray-500">
              * Ohlasy od beta testerů. Výsledky se mohou lišit.
            </p>
          </div>

        </div>
      </section>

      {/* F. Final Strong CTA Section */}
      <section className="py-20 bg-gradient-to-br from-green-primary to-emerald-600" id="cennik">
        <div className="container mx-auto px-4 max-w-4xl text-center">

          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Připraveni přestat plýtvat penězi?
          </h2>

          <p className="text-xl text-emerald-100 mb-8 max-w-2xl mx-auto">
            Připojte se k tisícům českých rodin, které šetří 6000+ Kč měsíčně s chytrým plánováním jídel.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <button className="bg-white text-green-primary px-8 py-4 rounded-lg font-semibold text-lg hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-2">
              Začít 7denní zdarma
              <ArrowRight className="w-5 h-5" />
            </button>
            <button className="bg-transparent text-white border-2 border-white px-8 py-4 rounded-lg font-semibold hover:bg-white/10 transition-all">
              Zobrazit ceník
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-emerald-100 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>7 dní zdarma</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Bez platební karty</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>Kdykoli zrušit</span>
            </div>
          </div>

        </div>
      </section>

      {/* G. Feature Deep Dive (Bento Grid) */}
      <section className="py-24 bg-slate-50" style={{ display: 'none' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Box 1 (Large - Left): The "Brain" */}
            <div className="md:col-span-2 bg-white rounded-3xl p-8 sm:p-12 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden relative group">
              <div className="relative z-10 max-w-md">
                <h3 className="text-2xl sm:text-3xl font-bold text-navy mb-4">Always know what to cook.</h3>
                <p className="text-slate-600 text-lg mb-8">
                  Our AI analyzes your inventory and suggests recipes you will actually love.
                </p>
                <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex items-center gap-4 max-w-sm">
                  <div className="w-16 h-16 bg-orange-100 rounded-lg flex items-center justify-center text-2xl">🥘</div>
                  <div>
                    <div className="text-xs text-mint font-bold uppercase tracking-wider mb-1">Recipe of the Day</div>
                    <div className="font-bold text-navy">Spicy Lentil Curry</div>
                  </div>
                  <button className="ml-auto bg-navy text-white px-4 py-2 rounded-lg text-sm font-bold">Cook Now</button>
                </div>
              </div>
              <div className="absolute right-0 bottom-0 w-64 h-64 bg-mint/5 rounded-tl-[100px] -mr-10 -mb-10 group-hover:scale-110 transition-transform duration-500"></div>
            </div>

            {/* Box 2 (Medium - Top Right): Smart Shopping */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative group overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-navy mb-2">Auto-Generated Lists.</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Missing an ingredient? It’s automatically added to your smart cart.
                </p>
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded border-2 border-mint flex items-center justify-center text-mint">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="2 6 4.5 9 10 3"></polyline></svg>
                      </div>
                      <div className="h-2 w-24 bg-slate-100 rounded"></div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-mint/5 rounded-bl-[60px] -mt-4 -mr-4 group-hover:scale-110 transition-transform duration-500"></div>
            </div>

            {/* Box 3 (Medium - Bottom Right): Health & Macros */}
            <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-200/50 border border-slate-100 relative group overflow-hidden">
              <div className="relative z-10">
                <h3 className="text-xl font-bold text-navy mb-2">Hit Your Goals.</h3>
                <p className="text-slate-600 text-sm mb-6">
                  Whether losing, gaining, or maintaining weight, track every calorie effortlessly.
                </p>
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" />
                      <path className="text-mint" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="75, 100" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-navy">75%</div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs"><div className="w-2 h-2 rounded-full bg-mint"></div> Protein</div>
                    <div className="flex items-center gap-2 text-xs"><div className="w-2 h-2 rounded-full bg-slate-300"></div> Carbs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* F. Final Call to Action */}
      <section className="py-24 px-4 bg-navy text-white text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">Be the first to cook smarter.</h2>
          <p className="text-slate-400 text-lg mb-10">
            Join the waitlist for exclusive early access and a special launch discount.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-5 py-3.5 rounded-xl border border-slate-700 bg-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-mint focus:ring-1 focus:ring-mint transition-all"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <button className="bg-mint text-white px-8 py-3.5 rounded-xl font-bold hover:bg-mint-600 transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
              Notify Me
            </button>
          </div>
        </div>
      </section>

      {/* G. Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-8">
          <div className="text-slate-400 text-sm">
            © {new Date().getFullYear()} Yumlo. All rights reserved.
          </div>

          <div className="flex gap-6">
            <a href="#" className="text-slate-400 hover:text-navy transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-12.7 12.5S.2 5.3 7.8 4.5c2.1-.1 3.2.4 3.2.4l2.1-3.2c.3-.5 1.6-.6 2 .2 1.3 2 2 3.2 2 4.5 0 0 1-.2 2.1-.9.6-.4 1.1-.9 1.1-.9s-.4 2.8-2.3 3.8c2-.2 3.6-.9 3.6-.9s-1.4 2.5-3.4 3.5" /></svg>
            </a>
            <a href="#" className="text-slate-400 hover:text-navy transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
            </a>
            <a href="#" className="text-slate-400 hover:text-navy transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
            </a>
          </div>

          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/privacy" className="hover:text-navy transition-colors">Privacy Policy</Link>
            <Link href="/contact" className="hover:text-navy transition-colors">Contact Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}