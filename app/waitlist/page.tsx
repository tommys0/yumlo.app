"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useDesign, getColorToken, getFontToken } from "@/lib/use-design";

function WaitlistForm() {
  const searchParams = useSearchParams();
  const design = useDesign();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [myReferralCode, setMyReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Capture referral code from URL
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      setReferralCode(ref);
      console.log("Waitlist referral code detected:", ref);
    }
  }, [searchParams]);

  const copyReferralLink = async () => {
    if (!myReferralCode) return;

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || window.location.origin;
    const referralLink = `${baseUrl}/waitlist?ref=${myReferralCode}`;

    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, referralCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setPosition(data.position);
        setMessage(data.message);
        setMyReferralCode(data.referralCode);
        setName("");
        setEmail("");
      } else {
        setMessage(data.error || "Failed to join waitlist");
      }
    } catch (error) {
      setMessage("An error occurred. Please try again.");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-12 px-5"
      style={{
        backgroundColor: design.colors.background.primary,
        ...design.getFontFamily(),
      }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="text-center">
          {/* Logo/Title */}
          <div className="mb-12">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-lg"
              style={{ backgroundColor: design.colors.brand.primary }}
            >
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: design.colors.brand.primary }}
                ></div>
              </div>
            </div>
            <h1
              className="text-6xl font-bold italic mb-4"
              style={design.getTextColor()}
            >
              Yumlo
            </h1>
            <p className="text-xl font-medium" style={design.getTextColor()}>
              Chytré plánování jídel s umělou inteligencí
            </p>
          </div>

          {/* Hero Section */}
          <div className="mb-16">
            <h2
              className="text-3xl font-bold mb-6"
              style={design.getTextColor()}
            >
              Revoluce ve vašem stravování
            </h2>
            <p
              className="text-lg leading-relaxed mb-8 max-w-xl mx-auto"
              style={design.getTextColor()}
            >
              Yumlo využívá pokročilou umělou inteligenci k vytvoření
              personalizovaných jídelníčků, které perfektně odpovídají vašim
              nutričním cílům, dietním omezením a chuťovým preferencím.
            </p>
          </div>

          {/* Features Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div
              className="p-6 rounded-2xl shadow-md border"
              style={{
                backgroundColor: design.colors.background.secondary,
                borderColor: design.colors.ui.border,
              }}
            >
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: design.colors.brand.primary }}
                ></div>
              </div>
              <h3
                className="text-lg font-bold mb-3"
                style={design.getTextColor()}
              >
                Personalizované recepty
              </h3>
              <p className="text-sm" style={design.getTextColor()}>
                AI analyzuje vaše preference a vytvoří recepty přesně podle
                vašich makro cílů a dietních potřeb.
              </p>
            </div>

            <div
              className="p-6 rounded-2xl shadow-md border"
              style={{
                backgroundColor: design.colors.background.secondary,
                borderColor: design.colors.ui.border,
              }}
            >
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: design.colors.brand.secondary }}
                ></div>
              </div>
              <h3
                className="text-lg font-bold mb-3"
                style={design.getTextColor()}
              >
                Chytré nákupní seznamy
              </h3>
              <p className="text-sm" style={design.getTextColor()}>
                Automaticky generované seznamy s přesnými množstvími ingrediencí
                optimalizované pro minimální odpad.
              </p>
            </div>

            <div
              className="p-6 rounded-2xl shadow-md border"
              style={{
                backgroundColor: design.colors.background.secondary,
                borderColor: design.colors.ui.border,
              }}
            >
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                <div
                  className="w-6 h-6 rounded-full"
                  style={{ backgroundColor: design.colors.brand.tertiary }}
                ></div>
              </div>
              <h3
                className="text-lg font-bold mb-3"
                style={design.getTextColor()}
              >
                Úspora času
              </h3>
              <p className="text-sm" style={design.getTextColor()}>
                Žádné více hodin strávených plánováním. AI vše vyřeší za pár
                sekund podle vašich preferencí.
              </p>
            </div>
          </div>

          {success ? (
            // Success state
            <div className="bg-white rounded-2xl p-8 shadow-xl border border-emerald-200 max-w-md mx-auto">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mb-6 mx-auto">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <h2
                className="text-2xl font-bold mb-4"
                style={design.getTextColor()}
              >
                Jste na waitlistu!
              </h2>
              <p className="text-lg mb-6" style={design.getTextColor()}>
                {message}
              </p>
              <p className="mb-8" style={design.getTextColor()}>
                Pošleme vám email, až launchujeme a budete mezi prvními, kdo
                získá přístup k Yumlo.
              </p>

              {/* Referral Section */}
              {myReferralCode && (
                <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200">
                  <h3
                    className="text-lg font-bold mb-3"
                    style={{ color: "#374337" }}
                  >
                    Pozvěte přátele
                  </h3>
                  <p className="text-sm mb-4" style={{ color: "#374337" }}>
                    Sdílejte svůj odkaz a posuňte se nahoru na waitlistu! Za
                    každého přítele, který se přidá, se posunete o jedno místo
                    výš.
                  </p>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      readOnly
                      value={`${process.env.NEXT_PUBLIC_BASE_URL || typeof window !== "undefined" ? window.location.origin : ""}/waitlist?ref=${myReferralCode}`}
                      className="flex-1 px-4 py-3 text-sm bg-white border border-emerald-300 rounded-lg font-mono text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      onClick={copyReferralLink}
                      className={`px-6 py-3 text-sm font-bold rounded-lg transition-all ${copied
                        ? "bg-green-500 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white"
                        }`}
                    >
                      {copied ? "Zkopírováno!" : "Kopírovat"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Form state
            <div
              className="rounded-2xl p-8 shadow-xl border max-w-md mx-auto"
              style={{
                backgroundColor: design.colors.background.secondary,
                borderColor: design.colors.ui.borderAccent,
              }}
            >
              <div className="mb-8">
                <h3
                  className="text-2xl font-bold mb-4"
                  style={design.getTextColor()}
                >
                  Buďte mezi prvními
                </h3>
                <p
                  className="leading-relaxed mb-6"
                  style={design.getTextColor()}
                >
                  Yumlo je momentálně ve vývoji. Přidejte se na waitlist a
                  získejte early access k revoluci ve stravování ještě před
                  oficiálním launchem.
                </p>

                <div
                  className="space-y-3 text-sm"
                  style={design.getTextColor()}
                >
                  <div className="flex items-start">
                    <div
                      className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                      style={{ backgroundColor: design.colors.brand.primary }}
                    ></div>
                    <span>Získáte přístup mezi prvními 1000 uživateli</span>
                  </div>
                  <div className="flex items-start">
                    <div
                      className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                      style={{ backgroundColor: design.colors.brand.primary }}
                    ></div>
                    <span>Speciální launch cena s 50% slevou</span>
                  </div>
                  <div className="flex items-start">
                    <div
                      className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0"
                      style={{ backgroundColor: design.colors.brand.primary }}
                    ></div>
                    <span>Možnost ovlivnit finální podobu aplikace</span>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Zadejte své jméno"
                  required
                  className="w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none transition-colors"
                  style={{
                    backgroundColor: design.colors.background.secondary,
                    borderColor: design.colors.ui.borderAccent,
                    color: design.colors.text.primary,

                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = design.colors.brand.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = design.colors.ui.borderAccent;
                  }}
                />

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Zadejte svůj email"
                  required
                  className="w-full px-4 py-4 text-lg border-2 rounded-xl focus:outline-none transition-colors"
                  style={{
                    backgroundColor: design.colors.background.secondary,
                    borderColor: design.colors.ui.borderAccent,
                    color: design.colors.text.primary,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = design.colors.brand.primary;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = design.colors.ui.borderAccent;
                  }}
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  style={
                    loading
                      ? {
                        backgroundColor: design.colors.ui.border,
                        color: design.colors.text.muted,
                        cursor: "not-allowed",
                        transform: "none",
                      }
                      : design.getButtonStyle("primary")
                  }
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor =
                        design.colors.button.primaryHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor =
                        design.colors.button.primary;
                    }
                  }}
                >
                  {loading ? "Přidávání..." : "Přidat se na waitlist"}
                </button>

                {message && !success && (
                  <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-2">
                    {message}
                  </p>
                )}
              </form>

              <div
                className="mt-8 pt-6 border-t"
                style={{ borderColor: design.colors.ui.border }}
              >
                <p className="text-sm mb-2" style={design.getTextColor()}>
                  Už máte přístup?{" "}
                  <Link
                    href="/login"
                    className="font-semibold underline hover:opacity-70 transition-opacity"
                    style={design.getTextColor()}
                  >
                    Přihlásit se
                  </Link>
                </p>
                <p className="text-xs opacity-70" style={design.getTextColor()}>
                  Registrací souhlasíte s našimi podmínkami použití a zásadami
                  ochrany osobních údajů.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <Suspense
      fallback={
        <div
          className="min-h-screen flex items-center justify-center"
          style={{
            backgroundColor: getColorToken("background.primary"),
            fontFamily: getFontToken("fontFamily.primary"),
          }}
        >
          <div className="text-center">
            <div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 animate-pulse"
              style={{ backgroundColor: getColorToken("brand.primary") }}
            >
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getColorToken("brand.primary") }}
                ></div>
              </div>
            </div>
            <div
              className="font-medium"
              style={{ color: getColorToken("text.primary") }}
            >
              Načítání...
            </div>
          </div>
        </div>
      }
    >
      <WaitlistForm />
    </Suspense>
  );
}
