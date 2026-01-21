import { NextRequest, NextResponse } from 'next/server';
import { createClientFromRequest } from '@/lib/supabase-server';
import { getUsageStats } from '@/lib/usage-tracker';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClientFromRequest(req);

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

    const stats = await getUsageStats(supabase, user.id);

    if (!stats) {
      return NextResponse.json(
        { error: 'Failed to fetch usage stats' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      planTier: stats.planTier,
      planName: stats.planName,
      generations: {
        used: stats.generationsUsed,
        limit: stats.generationsLimit,
        remaining: stats.generationsRemaining,
        isUnlimited: stats.generationsLimit === null,
      },
      daily: {
        used: stats.dailyUsed,
        limit: stats.dailyLimit,
        isUnlimited: stats.dailyLimit === null,
      },
      periodResetDate: stats.periodResetDate?.toISOString() || null,
      totalLifetime: stats.totalLifetime,
    });
  } catch (error: any) {
    console.error('Error fetching usage stats:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch usage stats' },
      { status: 500 }
    );
  }
}
