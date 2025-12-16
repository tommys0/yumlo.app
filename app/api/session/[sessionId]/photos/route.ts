import { NextRequest, NextResponse } from 'next/server';
import { PersistentSessionManager } from '@/lib/persistent-session-manager';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();
    const { photo } = body;

    if (!photo) {
      return NextResponse.json(
        { error: 'Photo data is required' },
        { status: 400 }
      );
    }

    const success = await PersistentSessionManager.addPhoto(sessionId, photo);

    if (!success) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Failed to upload photo' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const session = await PersistentSessionManager.getSession(sessionId);

    if (!session) {
      return NextResponse.json(
        { error: 'Session not found or expired' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      photos: session.photos,
      status: session.status,
      photoCount: session.photos.length
    });

  } catch (error) {
    console.error('Error getting session photos:', error);
    return NextResponse.json(
      { error: 'Failed to get photos' },
      { status: 500 }
    );
  }
}