import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';

/**
 * GET /api/meal-plan/recent
 *
 * Returns the most recent completed meal plan job for the authenticated user.
 * Used to recover results if the user closes the browser during generation.
 *
 * Query params:
 * - since: ISO timestamp to filter jobs (e.g., only jobs completed in last 10 minutes)
 */
export async function GET(request: NextRequest) {
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

    // Get the 'since' query parameter
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since');

    // Build query
    let query = supabaseAdmin
      .from('meal_plan_jobs')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1);

    // Filter by time if 'since' is provided
    if (since) {
      query = query.gte('completed_at', since);
    }

    const { data: recentJobs, error: fetchError } = await query;

    if (fetchError) {
      console.error('Failed to fetch recent jobs:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch recent jobs' },
        { status: 500 }
      );
    }

    if (!recentJobs || recentJobs.length === 0) {
      return NextResponse.json({ result: null });
    }

    // Return the most recent completed job's result
    return NextResponse.json({
      jobId: recentJobs[0].id,
      result: recentJobs[0].result,
      completedAt: recentJobs[0].completed_at
    });

  } catch (error) {
    console.error('❌ Failed to fetch recent jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent jobs' },
      { status: 500 }
    );
  }
}
