import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    // Získat user ID z auth headers
    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    const session = SessionManager.createSession(userId);

    return NextResponse.json({
      sessionId: session.id,
      expiresAt: session.expiresAt,
      qrUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/mobile/${session.id}`
    });

  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}