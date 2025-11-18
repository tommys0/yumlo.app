import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req);

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const {
      name,
      dietary_restrictions,
      allergies,
      macro_goals,
      cuisine_preferences,
    } = await req.json();

    // Validate required fields
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Update user record
    const { error: updateError } = await supabase
      .from('users')
      .update({
        name: name.trim(),
        dietary_restrictions: dietary_restrictions || [],
        allergies: allergies || [],
        macro_goals: macro_goals || null,
        cuisine_preferences: cuisine_preferences || [],
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating user onboarding:', updateError);
      return NextResponse.json(
        { error: 'Failed to save preferences' },
        { status: 500 }
      );
    }

    console.log('Onboarding completed for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Preferences saved successfully',
    });
  } catch (error: any) {
    console.error('Error in onboarding API:', error);
    return NextResponse.json(
      { error: error?.message || 'An error occurred' },
      { status: 500 }
    );
  }
}
