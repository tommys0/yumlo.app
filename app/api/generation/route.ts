import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { generateRecipe } from '@/lib/gemini';
import { buildRecipePrompt, parseRecipeResponse, GenerationRequest, Recipe } from '@/lib/recipe-prompt';

export async function POST(request: NextRequest) {
  try {
    // Get user authentication
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

    // Parse request body
    const body = await request.json() as GenerationRequest;

    // Validate required fields
    if (!body.ingredients || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'At least one ingredient is required' },
        { status: 400 }
      );
    }

    // TODO: Check user's generation limit (freemium model)
    // For now, skip this check

    // Build the prompt for AI generation
    const prompt = buildRecipePrompt(body);

    console.log('🍳 Generating recipe with prompt length:', prompt.length);

    // Generate recipe using Gemini AI
    const aiResponse = await generateRecipe(prompt);

    console.log('🤖 Received AI response length:', aiResponse.length);

    // Parse and validate the response
    const recipe = parseRecipeResponse(aiResponse);

    console.log('✅ Recipe generated successfully:', recipe.name);

    // TODO: Save the recipe to database for future reference
    // For now, return the recipe directly

    return NextResponse.json({
      success: true,
      recipe,
      generatedAt: new Date().toISOString(),
      userId: user.id
    });

  } catch (error: any) {
    console.error('❌ Recipe generation failed:', error);

    // Handle different types of errors
    if (error.message?.includes('API key')) {
      return NextResponse.json(
        { error: 'AI service configuration error. Please try again later.' },
        { status: 503 }
      );
    }

    if (error.message?.includes('parse')) {
      return NextResponse.json(
        { error: 'Failed to generate recipe in correct format. Please try again.' },
        { status: 422 }
      );
    }

    if (error.message?.includes('quota') || error.message?.includes('limit')) {
      return NextResponse.json(
        { error: 'AI service temporarily unavailable. Please try again later.' },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to generate recipe. Please try again.' },
      { status: 500 }
    );
  }
}