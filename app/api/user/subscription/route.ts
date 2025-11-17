import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase-server';

// Enable edge runtime for faster response
export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req);

    // Get user - this is cached by Supabase
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = NextResponse.json({ subscription_plan: null });
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');
      return response;
    }

    // Optimized query - only essential fields
    const { data, error: dbError } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', user.id)
      .maybeSingle(); // Faster than .single() - doesn't throw on no results

    if (dbError) {
      console.error('DB error fetching subscription:', dbError);
    }

    const response = NextResponse.json({
      subscription_plan: data?.subscription_plan || null,
      subscription_status: data?.subscription_status || null,
    });

    // Aggressive caching for better performance
    response.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30');

    return response;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    const response = NextResponse.json({ subscription_plan: null });
    response.headers.set('Cache-Control', 'private, max-age=5');
    return response;
  }
}
