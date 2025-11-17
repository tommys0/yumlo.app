import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase-server';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const response = NextResponse.json({ subscription_plan: null });
      // Cache for 5 minutes for unauthenticated users
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
      return response;
    }

    // Fetch user subscription data
    const { data } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    const response = NextResponse.json({
      subscription_plan: data?.subscription_plan || null,
      subscription_status: data?.subscription_status || null,
    });

    // Cache for 30 seconds for authenticated users (fresher data for active users)
    response.headers.set('Cache-Control', 'private, s-maxage=30, stale-while-revalidate=60');

    return response;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ subscription_plan: null });
  }
}
