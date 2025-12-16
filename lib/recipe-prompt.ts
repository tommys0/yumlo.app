/**
 * Recipe Generation Prompt Builder
 * Creates structured prompts for Gemini AI based on user preferences
 */

export interface GenerationRequest {
  ingredients: string[];           // Available ingredients
  dietaryRestrictions: string[];  // e.g., ["vegetarian", "gluten-free"]
  allergies: string[];            // e.g., ["nuts", "dairy"]
  macroGoals?: {                  // Optional macro targets
    protein?: number;
    carbs?: number;
    fats?: number;
    calories?: number;
  };
  cuisinePreferences?: string[];   // e.g., ["italian", "asian"]
  cookingTime?: number;           // Max cooking time in minutes
  servings?: number;              // Number of servings
  mealType?: string;              // breakfast, lunch, dinner, snack
  specialRequests?: string;       // Additional user requests
}

export interface Recipe {
  name: string;
  description: string;
  cookingTime: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  cuisine: string;
  mealType: string;
  ingredients: {
    name: string;
    amount: string;
    unit: string;
  }[];
  instructions: {
    step: number;
    instruction: string;
    timeMinutes?: number;
  }[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
  };
  tips?: string[];
  tags?: string[];
}

/**
 * Build a comprehensive prompt for recipe generation
 */
export function buildRecipePrompt(request: GenerationRequest): string {
  const {
    ingredients,
    dietaryRestrictions,
    allergies,
    macroGoals,
    cuisinePreferences,
    cookingTime = 30,
    servings = 2,
    mealType = 'dinner',
    specialRequests
  } = request;

  let prompt = `You are a professional chef and nutritionist. Generate a creative, delicious recipe based on the following requirements:

## AVAILABLE INGREDIENTS:
${ingredients.map(ing => `- ${ing}`).join('\n')}

## USER REQUIREMENTS:
- Meal type: ${mealType}
- Servings: ${servings}
- Maximum cooking time: ${cookingTime} minutes
`;

  if (dietaryRestrictions.length > 0) {
    prompt += `- Dietary restrictions: ${dietaryRestrictions.join(', ')}\n`;
  }

  if (allergies.length > 0) {
    prompt += `- Allergies (MUST AVOID): ${allergies.join(', ')}\n`;
  }

  if (cuisinePreferences && cuisinePreferences.length > 0) {
    prompt += `- Preferred cuisines: ${cuisinePreferences.join(', ')}\n`;
  }

  if (macroGoals) {
    prompt += `\n## NUTRITION TARGETS:
`;
    if (macroGoals.calories) prompt += `- Target calories: ${macroGoals.calories}\n`;
    if (macroGoals.protein) prompt += `- Target protein: ${macroGoals.protein}g\n`;
    if (macroGoals.carbs) prompt += `- Target carbs: ${macroGoals.carbs}g\n`;
    if (macroGoals.fats) prompt += `- Target fats: ${macroGoals.fats}g\n`;
  }

  if (specialRequests) {
    prompt += `\n## SPECIAL REQUESTS:
${specialRequests}
`;
  }

  prompt += `

## INSTRUCTIONS:
1. Create ONE complete recipe using primarily the available ingredients
2. You may suggest 1-2 basic pantry items (salt, pepper, oil) if needed
3. Ensure the recipe respects ALL dietary restrictions and allergies
4. Aim for the nutrition targets if provided
5. Keep cooking time under ${cookingTime} minutes
6. Make it delicious and creative!

## OUTPUT FORMAT:
Respond with a valid JSON object matching this exact structure:

\`\`\`json
{
  "name": "Recipe Name",
  "description": "Brief appetizing description",
  "cookingTime": 25,
  "servings": ${servings},
  "difficulty": "easy",
  "cuisine": "italian",
  "mealType": "${mealType}",
  "ingredients": [
    {
      "name": "ingredient name",
      "amount": "2",
      "unit": "pieces"
    }
  ],
  "instructions": [
    {
      "step": 1,
      "instruction": "Detailed instruction",
      "timeMinutes": 5
    }
  ],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 40,
    "fats": 20,
    "fiber": 8
  },
  "tips": ["Optional cooking tip"],
  "tags": ["quick", "healthy"]
}
\`\`\`

IMPORTANT: Return ONLY the JSON object, no additional text or markdown formatting.`;

  return prompt;
}

/**
 * Parse and validate the AI response
 */
export function parseRecipeResponse(response: string): Recipe {
  try {
    // Clean the response (remove markdown formatting if present)
    const cleanResponse = response
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim();

    const recipe = JSON.parse(cleanResponse);

    // Basic validation
    if (!recipe.name || !recipe.ingredients || !recipe.instructions) {
      throw new Error('Invalid recipe structure');
    }

    return recipe as Recipe;
  } catch (error) {
    console.error('Failed to parse recipe response:', error);
    console.error('Raw response:', response);

    throw new Error('Failed to parse recipe. Please try again.');
  }
}