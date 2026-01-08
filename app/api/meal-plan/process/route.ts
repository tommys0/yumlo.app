import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateRecipe } from '@/lib/gemini';
import { MealPlanRequest, MealPlanResult } from '@/lib/schemas/meal-plan';
import { Recipe } from '@/lib/recipe-prompt';

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
  estimated_cost: number;
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
    'Maso': ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'fish', 'salmon', 'tuna'],
    'Zelenina': ['broccoli', 'carrot', 'onion', 'garlic', 'tomato', 'potato', 'pepper', 'spinach'],
    'Obiloviny': ['rice', 'pasta', 'bread', 'flour', 'oats', 'quinoa'],
    'Mléčné': ['milk', 'cheese', 'yogurt', 'butter', 'cream'],
    'Oleje': ['oil', 'olive oil', 'coconut oil'],
    'Koření': ['salt', 'pepper', 'herbs', 'spices', 'basil', 'oregano'],
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

// Estimate cost for ingredient
const estimateCost = (ingredient: { name: string; amount: string; unit: string }): number => {
  const baseCosts: Record<string, number> = {
    'chicken': 200, 'beef': 300, 'pork': 180, 'fish': 250,
    'rice': 50, 'pasta': 40, 'bread': 30,
    'cheese': 150, 'milk': 25, 'yogurt': 35,
    'tomato': 40, 'onion': 20, 'garlic': 15, 'potato': 25,
    'oil': 80, 'salt': 10, 'pepper': 20
  };

  const lowerName = ingredient.name.toLowerCase();
  let baseCost = 50;

  for (const [name, cost] of Object.entries(baseCosts)) {
    if (lowerName.includes(name)) {
      baseCost = cost;
      break;
    }
  }

  const amount = parseFloat(ingredient.amount) || 1;
  return Math.round(baseCost * amount * 0.1) + Math.random() * 20;
};

// Consolidate ingredients into shopping list
function generateShoppingList(allIngredients: { name: string; amount: string; unit: string; }[], people: number): ShoppingItem[] {
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

  const shoppingList: ShoppingItem[] = Object.entries(consolidated).map(([name, data]) => {
    const ingredient = {
      name: name.charAt(0).toUpperCase() + name.slice(1),
      amount: data.amount.toString(),
      unit: data.unit
    };

    return {
      name: ingredient.name,
      quantity: `${Math.ceil(data.amount)} ${data.unit}`,
      category: categorizeIngredient(name),
      estimated_cost: estimateCost(ingredient)
    };
  });

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
  macroGoals?: { protein?: number; carbs?: number; fats?: number; calories?: number };
  mealTypes: string[];
}): string {
  const {
    days,
    mealsPerDay,
    people,
    targetCalories,
    dietaryRestrictions,
    allergies,
    macroGoals,
  } = request;

  const caloriesPerMeal = Math.round(targetCalories / mealsPerDay);

  let prompt = `Jste profesionální kuchař a nutričník. Vytvořte kompletní jídelníček na ${days} dní podle následujících požadavků:

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

  prompt += `

## INSTRUKCE:
1. Vytvořte kompletní jídelníček na ${days} dní s ${mealsPerDay} jídly denně
2. Každé jídlo musí obsahovat kompletní recept s ingrediencemi a postupem
3. Respektujte všechna dietní omezení a alergie
4. Používejte české názvy ingrediencí a postupy
5. Cílte na stanovené kalorie a makroživiny
6. Každý den by měl být pestrý a vyvážený

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
    mealTypes
  });

  const aiResponse = await generateRecipe(completePlanPrompt);
  const completeMealPlan = parseCompleteMealPlanResponse(aiResponse);

  completeMealPlan.daily_plans.forEach(dayPlan => {
    dayPlan.meals.forEach(meal => {
      allIngredients.push(...meal.recipe.ingredients);
    });
  });

  const shoppingList = generateShoppingList(allIngredients, params.people);
  const totalCost = shoppingList.reduce((sum, item) => sum + item.estimated_cost, 0);

  const mealPlan: MealPlanResult = {
    id: `plan_${Date.now()}`,
    name: `Jídelníček ${params.days} dní`,
    days: params.days,
    mealsPerDay: params.mealsPerDay,
    people: params.people,
    total_cost: Math.round(totalCost),
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
