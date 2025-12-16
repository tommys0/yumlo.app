import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const { sessionId } = params;
    const session = SessionManager.completeSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      status: session.status,
      photoCount: session.photos.length
    });

  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { error: 'Failed to complete session' },
      { status: 500 }
    );
  }
}