"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

const dietaryOptions = [
  "None",
  "Vegetarian",
  "Vegan",
  "Pescatarian",
  "Keto",
  "Paleo",
  "Gluten-Free",
  "Dairy-Free",
  "Low-Carb",
];

const cuisineOptions = [
  "None",
  "Italian",
  "Mexican",
  "Asian",
  "Mediterranean",
  "American",
  "Indian",
  "French",
  "Japanese",
  "Thai",
  "Middle Eastern",
];

function OnboardingForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    dietary_restrictions: [] as string[],
    allergies: "",
    macro_goals: {
      protein: "",
      carbs: "",
      fats: "",
      calories: "",
    },
    cuisine_preferences: [] as string[],
  });
  const [error, setError] = useState("");

  useEffect(() => {
    // Check if user is authenticated and capture referral code
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Capture referral code from URL (for OAuth flow)
      const ref = searchParams.get('ref');
      if (ref) {
        setReferralCode(ref);
        console.log('Referral code detected in onboarding:', ref);
      }
    };
    checkAuth();
  }, [router, searchParams]);

  const handleDietaryToggle = (e: React.MouseEvent, option: string) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling

    setFormData((prev) => {
      const isCurrentlySelected = prev.dietary_restrictions.includes(option);

      // If deselecting, just remove it
      if (isCurrentlySelected) {
        return {
          ...prev,
          dietary_restrictions: prev.dietary_restrictions.filter(
            (item) => item !== option
          ),
        };
      }

      // If selecting "None", clear all other selections
      if (option === "None") {
        if (prev.dietary_restrictions.length > 0) {
          setError("Cleared other dietary restrictions to select 'None'");
          setTimeout(() => setError(""), 3000);
        }
        return {
          ...prev,
          dietary_restrictions: ["None"],
        };
      }

      // If selecting something else while "None" is selected, remove "None"
      if (prev.dietary_restrictions.includes("None")) {
        setError("Removed 'None' to select specific dietary restrictions");
        setTimeout(() => setError(""), 3000);
        return {
          ...prev,
          dietary_restrictions: [option],
        };
      }

      // Normal selection
      return {
        ...prev,
        dietary_restrictions: [...prev.dietary_restrictions, option],
      };
    });
  };

  const handleCuisineToggle = (e: React.MouseEvent, option: string) => {
    e.preventDefault(); // Prevent form submission
    e.stopPropagation(); // Stop event bubbling

    setFormData((prev) => {
      const isCurrentlySelected = prev.cuisine_preferences.includes(option);

      // If deselecting, just remove it
      if (isCurrentlySelected) {
        return {
          ...prev,
          cuisine_preferences: prev.cuisine_preferences.filter(
            (item) => item !== option
          ),
        };
      }

      // If selecting "None", clear all other selections
      if (option === "None") {
        if (prev.cuisine_preferences.length > 0) {
          setError("Cleared other cuisine preferences to select 'None'");
          setTimeout(() => setError(""), 3000);
        }
        return {
          ...prev,
          cuisine_preferences: ["None"],
        };
      }

      // If selecting something else while "None" is selected, remove "None"
      if (prev.cuisine_preferences.includes("None")) {
        setError("Removed 'None' to select specific cuisine preferences");
        setTimeout(() => setError(""), 3000);
        return {
          ...prev,
          cuisine_preferences: [option],
        };
      }

      // Normal selection
      return {
        ...prev,
        cuisine_preferences: [...prev.cuisine_preferences, option],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // IMPORTANT: Only allow submission on step 4
    if (step !== 4) {
      console.log("Form submission blocked - not on step 4");
      return;
    }

    setError("");
    setLoading(true);

    console.log("Submitting onboarding form...", formData);

    try {
      // Convert allergies string to array
      const allergiesArray = formData.allergies
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);

      // Prepare macro goals (only include if provided)
      const macroGoals =
        formData.macro_goals.protein ||
        formData.macro_goals.carbs ||
        formData.macro_goals.fats ||
        formData.macro_goals.calories
          ? {
              protein: formData.macro_goals.protein
                ? parseInt(formData.macro_goals.protein)
                : null,
              carbs: formData.macro_goals.carbs
                ? parseInt(formData.macro_goals.carbs)
                : null,
              fats: formData.macro_goals.fats
                ? parseInt(formData.macro_goals.fats)
                : null,
              calories: formData.macro_goals.calories
                ? parseInt(formData.macro_goals.calories)
                : null,
            }
          : null;

      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          dietary_restrictions: formData.dietary_restrictions,
          allergies: allergiesArray,
          macro_goals: macroGoals,
          cuisine_preferences: formData.cuisine_preferences,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save preferences");
      }

      // If there's a referral code, save the referral relationship
      if (referralCode) {
        try {
          const {
            data: { user },
          } = await supabase.auth.getUser();

          if (user) {
            // Look up the referrer by their referral code
            const { data: referrer, error: referrerError } = await supabase
              .from('users')
              .select('id')
              .eq('referral_code', referralCode.toUpperCase())
              .single();

            if (referrerError) {
              console.error('Error looking up referrer:', referrerError);
            } else if (referrer) {
              // Wait for the user row to be created by the trigger (with retries)
              let userExists = false;
              let attempts = 0;
              const maxAttempts = 10;

              while (!userExists && attempts < maxAttempts) {
                const { data: userCheck } = await supabase
                  .from('users')
                  .select('id')
                  .eq('id', user.id)
                  .single();

                if (userCheck) {
                  userExists = true;
                } else {
                  await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms
                  attempts++;
                }
              }

              if (userExists) {
                // Update the new user's invited_by field
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ invited_by: referrer.id })
                  .eq('id', user.id);

                if (updateError) {
                  console.error('Error saving referral relationship:', updateError);
                } else {
                  console.log('Referral relationship saved (OAuth flow):', {
                    newUserId: user.id,
                    referrerId: referrer.id,
                    referralCode: referralCode,
                  });
                }
              } else {
                console.error('User row was not created in time');
              }
            } else {
              console.warn('Referral code not found:', referralCode);
            }
          }
        } catch (refError) {
          console.error('Error processing referral:', refError);
          // Don't fail onboarding if referral processing fails
        }
      }

      // Redirect to dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const nextStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (step === 1 && !formData.name.trim()) {
      setError("Please enter your name");
      return;
    }
    setError("");
    setStep(step + 1);
  };

  const prevStep = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError("");
    setStep(step - 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Prevent Enter from submitting form on steps 1-3
    if (e.key === "Enter" && step < 4) {
      e.preventDefault();
      console.log("Enter key blocked on step", step);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        padding: "40px 20px",
      }}
    >
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>
        {/* Progress indicator */}
        <div style={{ marginBottom: "40px" }}>
          <h1 style={{ fontSize: "32px", marginBottom: "8px", color: "#fff" }}>
            Vítejte v Yumlo!
          </h1>
          <p style={{ color: "#888", marginBottom: "20px" }}>
            Přizpůsobme váš zážitek z plánování jídel
          </p>
          <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
            {[1, 2, 3, 4].map((num) => (
              <div
                key={num}
                style={{
                  flex: 1,
                  height: "4px",
                  background: num <= step ? "#fff" : "#333",
                  borderRadius: "2px",
                }}
              />
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} onKeyDown={handleKeyDown}>
          {/* Step 1: Name */}
          {step === 1 && (
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "16px",
                  color: "#fff",
                }}
              >
                Jak se jmenujete?
              </h2>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Zadejte své jméno"
                style={{
                  width: "100%",
                  padding: "12px",
                  fontSize: "16px",
                  background: "#1a1a1a",
                  color: "#fff",
                  border: "1px solid #333",
                  borderRadius: "8px",
                }}
              />
            </div>
          )}

          {/* Step 2: Dietary Restrictions */}
          {step === 2 && (
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "16px",
                  color: "#fff",
                }}
              >
                Máte nějaká stravovací omezení?
              </h2>
              <p
                style={{
                  color: "#888",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                Vyberte vše, co platí
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {dietaryOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => handleDietaryToggle(e, option)}
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      background: formData.dietary_restrictions.includes(option)
                        ? "#fff"
                        : "#1a1a1a",
                      color: formData.dietary_restrictions.includes(option)
                        ? "#000"
                        : "#fff",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Allergies & Macro Goals */}
          {step === 3 && (
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "16px",
                  color: "#fff",
                }}
              >
                Alergie a cíle
              </h2>

              <div style={{ marginBottom: "24px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#888",
                    fontSize: "14px",
                  }}
                >
                  Potravinové alergie (oddělené čárkami)
                </label>
                <input
                  type="text"
                  value={formData.allergies}
                  onChange={(e) =>
                    setFormData({ ...formData, allergies: e.target.value })
                  }
                  placeholder="např. arašídy, korýši, sója"
                  style={{
                    width: "100%",
                    padding: "12px",
                    fontSize: "16px",
                    background: "#1a1a1a",
                    color: "#fff",
                    border: "1px solid #333",
                    borderRadius: "8px",
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label
                  style={{
                    display: "block",
                    marginBottom: "8px",
                    color: "#888",
                    fontSize: "14px",
                  }}
                >
                  Makro cíle (volitelné)
                </label>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "12px",
                  }}
                >
                  <input
                    type="number"
                    value={formData.macro_goals.protein}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        macro_goals: {
                          ...formData.macro_goals,
                          protein: e.target.value,
                        },
                      })
                    }
                    placeholder="Bílkoviny (g)"
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      background: "#1a1a1a",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <input
                    type="number"
                    value={formData.macro_goals.carbs}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        macro_goals: {
                          ...formData.macro_goals,
                          carbs: e.target.value,
                        },
                      })
                    }
                    placeholder="Sacharidy (g)"
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      background: "#1a1a1a",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <input
                    type="number"
                    value={formData.macro_goals.fats}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        macro_goals: {
                          ...formData.macro_goals,
                          fats: e.target.value,
                        },
                      })
                    }
                    placeholder="Tuky (g)"
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      background: "#1a1a1a",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                  <input
                    type="number"
                    value={formData.macro_goals.calories}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        macro_goals: {
                          ...formData.macro_goals,
                          calories: e.target.value,
                        },
                      })
                    }
                    placeholder="Kalorie"
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      background: "#1a1a1a",
                      color: "#fff",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Cuisine Preferences */}
          {step === 4 && (
            <div style={{ marginBottom: "32px" }}>
              <h2
                style={{
                  fontSize: "24px",
                  marginBottom: "16px",
                  color: "#fff",
                }}
              >
                Oblíbené kuchyně?
              </h2>
              <p
                style={{
                  color: "#888",
                  marginBottom: "16px",
                  fontSize: "14px",
                }}
              >
                Vyberte vaše preferované kuchyně
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                  gap: "12px",
                }}
              >
                {cuisineOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={(e) => handleCuisineToggle(e, option)}
                    style={{
                      padding: "12px",
                      fontSize: "14px",
                      background: formData.cuisine_preferences.includes(option)
                        ? "#fff"
                        : "#1a1a1a",
                      color: formData.cuisine_preferences.includes(option)
                        ? "#000"
                        : "#fff",
                      border: "1px solid #333",
                      borderRadius: "8px",
                      cursor: "pointer",
                    }}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div
              style={{
                color: "#ff4444",
                marginBottom: "16px",
                fontSize: "14px",
              }}
            >
              {error}
            </div>
          )}

          {/* Navigation buttons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
            {step > 1 && (
              <button
                type="button"
                onClick={(e) => prevStep(e)}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  background: "#333",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Zpět
              </button>
            )}
            {step < 4 ? (
              <button
                type="button"
                onClick={(e) => nextStep(e)}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  background: "#fff",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                }}
              >
                Další
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "12px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  background: loading ? "#555" : "#fff",
                  color: loading ? "#aaa" : "#000",
                  border: "none",
                  borderRadius: "8px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Ukládání..." : "Dokončit nastavení"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "#fff" }}>Loading...</div>
      </div>
    }>
      <OnboardingForm />
    </Suspense>
  );
}
