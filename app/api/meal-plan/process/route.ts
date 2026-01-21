import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateRecipe } from '@/lib/gemini';
import { MealPlanRequest, MealPlanResult } from '@/lib/schemas/meal-plan';
import { Recipe } from '@/lib/recipe-prompt';

export const maxDuration = 300;

/**
 * Fallback endpoint to manually process pending meal plan jobs.
 *
 * This endpoint is useful for:
 * - Manual testing
 * - Future cron job to process orphaned jobs
 * - Admin panel to manually trigger stuck jobs
 *
 * NOTE: In normal operation, jobs are automatically processed
 * server-side when created via POST /api/meal-plan
 */

interface MealPlanDay {
  day: number;
  meals: {
    type: string;
    recipe: Recipe;
  }[];
}

interface ShoppingItem {
  name: string;
  quantity: string;
  category: string;
}

// Meal type mapping based on meals per day
const getMealTypes = (mealsPerDay: number): string[] => {
  if (mealsPerDay === 2) return ['breakfast', 'dinner'];
  if (mealsPerDay === 3) return ['breakfast', 'lunch', 'dinner'];
  if (mealsPerDay === 4) return ['breakfast', 'lunch', 'snack', 'dinner'];
  if (mealsPerDay === 5) return ['breakfast', 'snack', 'lunch', 'snack', 'dinner'];
  return ['breakfast', 'lunch', 'dinner'];
};

// Convert Czech restrictions to English for AI
const convertRestrictions = (czechRestrictions: string[]): string[] => {
  const mapping: Record<string, string> = {
    'Vegetariánské': 'vegetarian',
    'Veganské': 'vegan',
    'Bezlepkové': 'gluten-free',
    'Bez laktózy': 'dairy-free',
    'Nízkosacharidové': 'low-carb',
    'Ketogenní': 'keto',
    'Paleo': 'paleo'
  };

  return czechRestrictions.map(r => mapping[r] || r.toLowerCase());
};

// Categorize ingredients for shopping list
const categorizeIngredient = (ingredientName: string): string => {
  const categories: Record<string, string[]> = {
    'Maso': [
      'kuřecí', 'kureci', 'kuře', 'kure', 'chicken',
      'hovězí', 'hovezi', 'beef',
      'vepřové', 'veprove', 'vepřová', 'veprova', 'pork',
      'mleté', 'mlete', 'mletý', 'mlety',
      'slanina', 'bacon', 'špek', 'spek',
      'šunka', 'sunka', 'ham',
      'klobása', 'klobasa', 'párek', 'parek',
      'krůtí', 'kruti', 'turkey',
      'jehněčí', 'jehneci', 'lamb'
    ],
    'Ryby': [
      'losos', 'salmon', 'tuňák', 'tunak', 'tuna',
      'treska', 'cod', 'ryba', 'fish', 'pstruh', 'kapr',
      'krevety', 'shrimp', 'mořské', 'morske'
    ],
    'Mléčné': [
      'mléko', 'mleko', 'milk',
      'smetana', 'cream', 'šlehačka', 'slehacka',
      'jogurt', 'yogurt',
      'tvaroh', 'cottage', 'ricotta',
      'máslo', 'maslo', 'butter',
      'sýr', 'syr', 'cheese', 'eidam', 'gouda', 'čedar', 'cedar',
      'parmazán', 'parmezan', 'parmezán', 'parmesan',
      'mozzarella', 'mozarela', 'feta', 'balkánský', 'balkansky'
    ],
    'Vejce': ['vejce', 'vajíčko', 'vajicko', 'egg', 'vaječný', 'vajecny'],
    'Zelenina': [
      'rajče', 'rajce', 'rajčata', 'rajcata', 'tomato',
      'cibule', 'onion',
      'česnek', 'cesnek', 'garlic',
      'brambor', 'potato',
      'mrkev', 'carrot',
      'paprika', 'pepper',
      'okurka', 'cucumber',
      'salát', 'salat', 'lettuce', 'hlávkový', 'hlavkovy',
      'špenát', 'spenat', 'spinach',
      'brokolice', 'broccoli',
      'květák', 'kvetак', 'cauliflower',
      'cuketa', 'zucchini',
      'lilek', 'eggplant', 'baklažán', 'baklazan',
      'zelí', 'zeli', 'cabbage', 'kapusta',
      'pórek', 'porek', 'leek',
      'celer', 'celery',
      'petržel', 'petrzel', 'parsley',
      'kopr', 'dill',
      'bazalka', 'basil',
      'žampion', 'zampion', 'mushroom', 'houby', 'houba',
      'avokádo', 'avokado', 'avocado'
    ],
    'Ovoce': [
      'jablko', 'apple', 'banán', 'banan', 'banana',
      'citron', 'citrón', 'lemon', 'limetka', 'lime',
      'pomeranč', 'pomeranc', 'orange',
      'jahody', 'strawberry', 'maliny', 'raspberry', 'borůvky', 'boruvky', 'blueberry'
    ],
    'Obiloviny': [
      'rýže', 'ryze', 'rice',
      'těstoviny', 'testoviny', 'pasta', 'špagety', 'spagety', 'penne', 'fusilli', 'makarony',
      'chléb', 'chleb', 'bread', 'pečivo', 'pecivo', 'rohlík', 'rohlik',
      'mouka', 'flour',
      'ovesné', 'ovesne', 'oats', 'vločky', 'vlocky',
      'kuskus', 'couscous', 'quinoa', 'quinua', 'bulgur'
    ],
    'Luštěniny': [
      'čočka', 'cocka', 'lentil',
      'fazole', 'beans',
      'cizrna', 'chickpea',
      'hrách', 'hrach', 'pea'
    ],
    'Oleje': [
      'olivový', 'olivovy', 'olive',
      'olej', 'oil',
      'slunečnicový', 'slunecnicovy',
      'řepkový', 'repkovy',
      'kokosový', 'kokosovy', 'coconut'
    ],
    'Koření': [
      'sůl', 'sul', 'salt',
      'pepř', 'pepr', 'pepper', 'černý pepř', 'cerny pepr',
      'paprika mletá', 'paprika mleta',
      'kmín', 'kmin', 'cumin',
      'oregano', 'tymián', 'tymian', 'thyme',
      'rozmarýn', 'rozmaryn', 'rosemary',
      'skořice', 'skorice', 'cinnamon',
      'curry', 'koření', 'koreni', 'spice'
    ],
    'Ostatní': []
  };

  const lowerName = ingredientName.toLowerCase();
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  return 'Ostatní';
};

// Consolidate ingredients into shopping list
function generateShoppingList(allIngredients: { name: string; amount: string; unit: string; }[]): ShoppingItem[] {
  const consolidated: Record<string, { amount: number; unit: string; }> = {};

  allIngredients.forEach(ingredient => {
    const key = ingredient.name.toLowerCase();
    const amount = parseFloat(ingredient.amount) || 1;

    if (consolidated[key]) {
      consolidated[key].amount += amount;
    } else {
      consolidated[key] = {
        amount,
        unit: ingredient.unit
      };
    }
  });

  const shoppingList: ShoppingItem[] = Object.entries(consolidated).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    quantity: `${Math.ceil(data.amount)} ${data.unit}`,
    category: categorizeIngredient(name),
  }));

  return shoppingList.sort((a, b) => a.category.localeCompare(b.category));
}

// Build prompt for complete meal plan
function buildCompleteMealPlanPrompt(request: {
  days: number;
  mealsPerDay: number;
  people: number;
  targetCalories: number;
  dietaryRestrictions: string[];
  allergies: string[];
  macroGoals?: { protein?: number | null; carbs?: number | null; fats?: number | null; calories?: number | null } | null;
  mealTypes: string[];
  cuisinePreferences?: string[];
  inventory?: { name: string; priority?: boolean }[];
  inventoryMode?: 'all' | 'priority';
}): string {
  const {
    days,
    mealsPerDay,
    people,
    targetCalories,
    dietaryRestrictions,
    allergies,
    macroGoals,
    cuisinePreferences,
    inventory,
    inventoryMode,
  } = request;

  const caloriesPerMeal = Math.round(targetCalories / mealsPerDay);

  let prompt = `Jste domácí kuchař, který vaří jednoduché, chutné a praktické recepty pro běžnou domácnost.

## STYL RECEPTŮ - VELMI DŮLEŽITÉ:
- Názvy receptů musí být JEDNODUCHÉ a ČESKÉ (např. "Kuřecí steak s bramborovou kaší", "Těstoviny s rajčatovou omáčkou", "Smažená vejce se šunkou")
- ŽÁDNÉ fancy názvy jako "Buddha bowl", "fusion", "à la", "style" apod.
- Používejte běžné ingredience dostupné v českých obchodech
- Recepty by měly být rychlé (max 45 minut) a jednoduché na přípravu
- Preferujte tradiční českou a evropskou kuchyni

## POŽADAVKY NA JÍDELNÍČEK:
- Počet dní: ${days}
- Jídel denně: ${mealsPerDay}
- Počet porcí: ${people}
- Cílové kalorie denně: ${targetCalories} (přibližně ${caloriesPerMeal} na jídlo)`;

  if (macroGoals?.protein || macroGoals?.carbs || macroGoals?.fats) {
    prompt += `\n- Denní makroživiny:`;
    if (macroGoals.protein) prompt += ` ${macroGoals.protein}g bílkovin`;
    if (macroGoals.carbs) prompt += ` ${macroGoals.carbs}g sacharidů`;
    if (macroGoals.fats) prompt += ` ${macroGoals.fats}g tuků`;
  }

  if (dietaryRestrictions.length > 0) {
    prompt += `\n- Dietní omezení: ${dietaryRestrictions.join(', ')}`;
  }

  if (allergies && allergies.length > 0) {
    prompt += `\n- Alergie (MUSÍ SE VYHNOUT): ${allergies.join(', ')}`;
  }

  if (cuisinePreferences && cuisinePreferences.length > 0) {
    prompt += `\n- Preferované kuchyně: ${cuisinePreferences.join(', ')}`;
  }

  // Add inventory section if provided
  if (inventory && inventory.length > 0) {
    const priorityItems = inventory.filter(item => item.priority === true);
    const regularItems = inventory.filter(item => item.priority !== true);

    prompt += `\n\n## 🏠 INGREDIENCE, KTERÉ MÁM DOMA - MUSÍTE JE POUŽÍT:`;

    if (inventoryMode === 'priority') {
      if (priorityItems.length > 0) {
        prompt += `\n\n⭐ PRIORITNÍ INGREDIENCE (MUSÍ být použity):`;
        priorityItems.forEach(item => {
          prompt += `\n- ${item.name}`;
        });
        prompt += `\n\n🚨 KRITICKÉ: Vytvořte recepty VÝHRADNĚ z těchto prioritních ingrediencí! Každý recept MUSÍ obsahovat alespoň jednu z nich.`;
      }
    } else {
      prompt += `\n\nDostupné ingredience (POUŽIJTE JE v receptech):`;
      inventory.forEach(item => {
        prompt += `\n- ${item.name}${item.priority ? ' ⭐' : ''}`;
      });
      prompt += `\n\n🚨 KRITICKÉ: Recepty MUSÍ primárně využívat tyto ingredience! Minimalizujte nákup nových věcí.`;
    }
  }

  prompt += `

## INSTRUKCE:
1. Vytvořte kompletní jídelníček na ${days} dní s ${mealsPerDay} jídly denně
2. JEDNODUCHÉ názvy receptů v češtině (max 5 slov)
3. Respektujte všechna dietní omezení a alergie
4. Používejte české názvy ingrediencí
5. Recepty musí být praktické pro domácí vaření`;

  if (inventory && inventory.length > 0) {
    prompt += `
6. 🏠 POVINNĚ používejte ingredience ze seznamu "CO MÁM DOMA"
7. Každý recept by měl obsahovat alespoň 1-2 ingredience z mého inventáře
8. Nákupní seznam by měl být MINIMÁLNÍ - většinu věcí už mám`;
  }

  prompt += `

## VÝSTUPNÍ FORMÁT:
Vraťte platný JSON objekt s kompletním jídelníčkem - VŠECHNY texty v češtině:

\`\`\`json
{
  "daily_plans": [
    {
      "day": 1,
      "meals": [
        {
          "type": "breakfast",
          "recipe": {
            "name": "Název receptu v češtině",
            "description": "Popis v češtině",
            "cookingTime": 15,
            "servings": ${people},
            "difficulty": "easy",
            "cuisine": "česká",
            "mealType": "breakfast",
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
              "calories": ${caloriesPerMeal},
              "protein": 20,
              "carbs": 30,
              "fats": 15,
              "fiber": 5
            },
            "tips": ["Tip v češtině"],
            "tags": ["rychlé", "zdravé"]
          }
        }
      ]
    }
  ]
}
\`\`\`

DŮLEŽITÉ: Vraťte POUZE JSON objekt pro všechny ${days} dny s ${mealsPerDay} jídly každý den. Všechny texty v češtině.`;

  return prompt;
}

// Parse complete meal plan response
function parseCompleteMealPlanResponse(response: string): { daily_plans: MealPlanDay[] } {
  try {
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const mealPlan = JSON.parse(cleanResponse);

    if (!mealPlan.daily_plans || !Array.isArray(mealPlan.daily_plans)) {
      throw new Error('Invalid meal plan structure');
    }

    return mealPlan;
  } catch (error) {
    console.error('Failed to parse complete meal plan:', error);
    throw new Error('Failed to parse meal plan. Please try again.');
  }
}

// Generate complete meal plan
async function generateCompleteMealPlan(params: MealPlanRequest): Promise<MealPlanResult> {
  const mealTypes = getMealTypes(params.mealsPerDay);
  const englishRestrictions = convertRestrictions(params.restrictions || []);
  const allIngredients: { name: string; amount: string; unit: string; }[] = [];

  console.log(`🍳 Generating complete ${params.days}-day meal plan...`);

  const completePlanPrompt = buildCompleteMealPlanPrompt({
    days: params.days,
    mealsPerDay: params.mealsPerDay,
    people: params.people,
    targetCalories: params.targetCalories,
    dietaryRestrictions: englishRestrictions,
    allergies: params.allergies || [],
    macroGoals: params.macroGoals,
    mealTypes,
    cuisinePreferences: params.cuisinePreferences || [],
    inventory: params.inventory || [],
    inventoryMode: params.inventoryMode || 'all'
  });

  const aiResponse = await generateRecipe(completePlanPrompt);
  const completeMealPlan = parseCompleteMealPlanResponse(aiResponse);

  completeMealPlan.daily_plans.forEach(dayPlan => {
    dayPlan.meals.forEach(meal => {
      allIngredients.push(...meal.recipe.ingredients);
    });
  });

  const shoppingList = generateShoppingList(allIngredients);

  const mealPlan: MealPlanResult = {
    id: `plan_${Date.now()}`,
    name: `Jídelníček ${params.days} dní`,
    days: params.days,
    mealsPerDay: params.mealsPerDay,
    people: params.people,
    daily_plans: completeMealPlan.daily_plans,
    shopping_list: shoppingList,
    created_at: new Date().toISOString()
  };

  console.log('✅ Meal plan generated successfully:', mealPlan.name);

  return mealPlan;
}

export async function POST(request: NextRequest) {
  try {
    // Basic auth check - any authenticated user can trigger processing
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    console.log('🔄 Manual process trigger by user:', user.id);

    // Check if a specific jobId was provided in the request body
    let targetJobId: string | null = null;
    try {
      const body = await request.json();
      if (body && body.jobId) {
        targetJobId = body.jobId;
        console.log('🎯 Targeting specific job:', targetJobId);
      }
    } catch (e) {
      // Body might be empty, which is fine for the default "oldest job" behavior
    }

    let claimedJob;

    if (targetJobId) {
      // Try to process specific job
      const { data: job, error: fetchError } = await supabaseAdmin
        .from('meal_plan_jobs')
        .select('*')
        .eq('id', targetJobId)
        .eq('status', 'pending') // Only pending jobs
        .single();

      if (fetchError || !job) {
        return NextResponse.json({
          message: 'Job not found or not pending',
          processed: false
        }, { status: 404 });
      }

      // Verify ownership
      if (job.user_id !== user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
      }

      // Claim it
      const { data: updated, error: updateError } = await supabaseAdmin
        .from('meal_plan_jobs')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString()
        })
        .eq('id', targetJobId)
        .select()
        .single();

      if (updateError || !updated) {
        return NextResponse.json({ error: 'Failed to claim job' }, { status: 500 });
      }
      claimedJob = updated;

    } else {
      // Default behavior: Claim oldest pending job atomically
      const { data: pendingJob, error: findError } = await supabaseAdmin
        .from('meal_plan_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (findError || !pendingJob) {
        return NextResponse.json({
          message: 'No pending jobs',
          processed: false
        }, { status: 204 });
      }

      // Try to claim it by updating status
      const { data: updated, error: claimError } = await supabaseAdmin
        .from('meal_plan_jobs')
        .update({
          status: 'processing',
          processing_started_at: new Date().toISOString()
        })
        .eq('id', pendingJob.id)
        .eq('status', 'pending') // Only if still pending (prevents race condition)
        .select()
        .single();

      if (claimError || !updated) {
        return NextResponse.json({
          message: 'Job already being processed',
          processed: false
        }, { status: 409 });
      }
      claimedJob = updated;
    }

    if (!claimedJob) {
      return NextResponse.json({ error: 'Failed to claim any job' }, { status: 500 });
    }

    console.log(`⏳ Processing job ${claimedJob.id}...`);

    try {
      // Generate meal plan
      const result = await generateCompleteMealPlan(claimedJob.params as MealPlanRequest);

      // Save success
      await supabaseAdmin
        .from('meal_plan_jobs')
        .update({
          status: 'completed',
          result: result,
          completed_at: new Date().toISOString()
        })
        .eq('id', claimedJob.id);

      console.log(`✅ Job ${claimedJob.id} completed successfully`);

      return NextResponse.json({
        processed: true,
        jobId: claimedJob.id,
        status: 'completed'
      });

    } catch (error) {
      console.error(`❌ Job ${claimedJob.id} failed:`, error);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Save failure
      await supabaseAdmin
        .from('meal_plan_jobs')
        .update({
          status: 'failed',
          error: errorMessage,
          completed_at: new Date().toISOString()
        })
        .eq('id', claimedJob.id);

      return NextResponse.json({
        processed: true,
        jobId: claimedJob.id,
        status: 'failed',
        error: errorMessage
      });
    }

  } catch (error) {
    console.error('❌ Process endpoint failed:', error);
    return NextResponse.json(
      { error: 'Failed to process jobs' },
      { status: 500 }
    );
  }
}
