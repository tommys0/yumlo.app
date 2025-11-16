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
      return NextResponse.json({ subscription_plan: null });
    }

    // Fetch user subscription data
    const { data } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      subscription_plan: data?.subscription_plan || null,
      subscription_status: data?.subscription_status || null,
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return NextResponse.json({ subscription_plan: null });
  }
}
