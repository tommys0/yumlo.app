import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { generateRecipe } from "@/lib/gemini";

export const maxDuration = 60;

interface QuickDinnerRequest {
  type: "super-fast" | "easy" | "healthy" | "comfort";
  maxTime: number;
}

function buildQuickDinnerPrompt(type: string, maxTime: number): string {
  const typeDescriptions: Record<string, string> = {
    "super-fast": "velmi rychlé a jednoduché jídlo s minimální přípravou",
    easy: "jednoduché jídlo pro běžný večer",
    healthy: "zdravé a nízkokalorickí jídlo bohaté na zeleninu a bílkoviny",
    comfort: "klasické české nebo mezinárodní comfort food jídlo",
  };

  const description = typeDescriptions[type] || typeDescriptions["easy"];

  return `Jste profesionální kuchař. Navrhněte ${description}.

POŽADAVKY:
- Maximální čas přípravy: ${maxTime} minut
- Jídlo pro 1 osobu
- Použijte běžně dostupné ingredience
- Všechny texty v češtině

Vraťte platný JSON objekt:

\`\`\`json
{
  "name": "Název receptu v češtině",
  "description": "Krátký popis jídla",
  "cookingTime": ${maxTime},
  "servings": 2,
  "difficulty": "easy",
  "cuisine": "česká",
  "mealType": "dinner",
  "ingredients": [
    {
      "name": "ingredience v češtině",
      "amount": "2",
      "unit": "kusy"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Postup v češtině",
      "timeMinutes": 5
    }
  ],
  "nutrition": {
    "calories": 500,
    "protein": 25,
    "carbs": 40,
    "fats": 20
  },
  "tips": ["Tip v češtině"],
  "tags": ["rychlé", "večeře"]
}
\`\`\`

DŮLEŽITÉ: Vraťte POUZE JSON objekt. Všechny texty v češtině.`;
}

function parseRecipeResponse(response: string) {
  const cleanResponse = response
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  return JSON.parse(cleanResponse);
}

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: "Invalid authentication" },
        { status: 401 },
      );
    }

    // Parse request body
    const body: QuickDinnerRequest = await request.json();
    const { type, maxTime } = body;

    if (!type || !maxTime) {
      return NextResponse.json(
        { error: "Missing type or maxTime" },
        { status: 400 },
      );
    }

    console.log(`⚡ Generating quick dinner: ${type} (max ${maxTime} min)`);

    // Generate recipe
    const prompt = buildQuickDinnerPrompt(type, maxTime);
    const aiResponse = await generateRecipe(prompt);
    const recipe = parseRecipeResponse(aiResponse);

    console.log(`✅ Quick dinner generated: ${recipe.name}`);

    return NextResponse.json({ recipe });
  } catch (error) {
    console.error("❌ Quick dinner failed:", error);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: "Nepodařilo se vygenerovat recept. Zkuste to znovu." },
      { status: 500 },
    );
  }
}
