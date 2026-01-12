import { z } from 'zod';

// Request schema for creating a meal plan job
export const MealPlanRequestSchema = z.object({
  days: z.number().int().min(1).max(14),
  mealsPerDay: z.number().int().min(2).max(5),
  people: z.number().int().min(1).max(10),
  targetCalories: z.number().int().min(500).max(5000),
  restrictions: z.array(z.string()).optional().default([]),
  allergies: z.array(z.string()).optional().default([]),
  macroGoals: z.object({
    protein: z.number().nullish(),
    carbs: z.number().nullish(),
    fats: z.number().nullish(),
    calories: z.number().nullish(),
  }).nullish(),
});

export type MealPlanRequest = z.infer<typeof MealPlanRequestSchema>;

// Job status enum
export const MealPlanJobStatusSchema = z.enum(['pending', 'processing', 'completed', 'failed']);
export type MealPlanJobStatus = z.infer<typeof MealPlanJobStatusSchema>;

// Recipe schema
export const RecipeSchema = z.object({
  name: z.string(),
  description: z.string(),
  cookingTime: z.number(),
  servings: z.number(),
  difficulty: z.string(),
  cuisine: z.string(),
  mealType: z.string(),
  ingredients: z.array(z.object({
    name: z.string(),
    amount: z.string(),
    unit: z.string(),
  })),
  instructions: z.array(z.object({
    step: z.number(),
    instruction: z.string(),
    timeMinutes: z.number().optional(),
  })),
  nutrition: z.object({
    calories: z.number(),
    protein: z.number(),
    carbs: z.number(),
    fats: z.number(),
    fiber: z.number().optional(),
  }),
  tips: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
});

export type Recipe = z.infer<typeof RecipeSchema>;

// Meal plan day schema
export const MealPlanDaySchema = z.object({
  day: z.number(),
  meals: z.array(z.object({
    type: z.string(),
    recipe: RecipeSchema,
  })),
});

export type MealPlanDay = z.infer<typeof MealPlanDaySchema>;

// Shopping item schema
export const ShoppingItemSchema = z.object({
  name: z.string(),
  quantity: z.string(),
  category: z.string(),
  estimated_cost: z.number(),
});

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;

// Complete meal plan schema (result)
export const MealPlanResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  days: z.number(),
  mealsPerDay: z.number(),
  people: z.number(),
  total_cost: z.number(),
  daily_plans: z.array(MealPlanDaySchema),
  shopping_list: z.array(ShoppingItemSchema),
  created_at: z.string(),
});

export type MealPlanResult = z.infer<typeof MealPlanResultSchema>;

// Job record schema (from database)
export const MealPlanJobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: MealPlanJobStatusSchema,
  params: MealPlanRequestSchema,
  result: MealPlanResultSchema.nullable(),
  error: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  processing_started_at: z.string().nullable(),
  completed_at: z.string().nullable(),
});

export type MealPlanJob = z.infer<typeof MealPlanJobSchema>;

// API response schemas
export const JobCreatedResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: z.literal('pending'),
  message: z.string(),
});

export type JobCreatedResponse = z.infer<typeof JobCreatedResponseSchema>;

export const JobStatusResponseSchema = z.object({
  jobId: z.string().uuid(),
  status: MealPlanJobStatusSchema,
  result: MealPlanResultSchema.optional(),
  error: z.string().optional(),
  startedAt: z.string().optional(),
});

export type JobStatusResponse = z.infer<typeof JobStatusResponseSchema>;
