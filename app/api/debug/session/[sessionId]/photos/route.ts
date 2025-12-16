import { NextRequest, NextResponse } from 'next/server';
import { HybridSessionManager } from '@/lib/hybrid-session-manager';

interface DebugLog {
  timestamp: string;
  step: string;
  data: any;
  success: boolean;
  error?: string;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const debugLogs: DebugLog[] = [];

  const addLog = (step: string, data: any, success = true, error?: string) => {
    debugLogs.push({
      timestamp: new Date().toISOString(),
      step,
      data,
      success,
      error
    });
    console.log(`🔧 [DEBUG UPLOAD] ${step}:`, { data, success, error });
  };

  try {
    const { sessionId } = await params;

    addLog('Upload request started', {
      sessionId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent')
    });

    // Parse request body
    addLog('Parsing request body', {});
    const body = await request.json();
    const { photo } = body;

    addLog('Request body parsed', {
      hasPhoto: !!photo,
      photoLength: photo?.length || 0,
      photoPrefix: photo?.substring(0, 50) + '...',
      photoType: photo?.startsWith('data:image/') ? 'base64' : 'unknown'
    });

    if (!photo) {
      addLog('Missing photo data', {}, false, 'Photo data is required');
      return NextResponse.json({
        error: 'Photo data is required',
        debug: { logs: debugLogs }
      }, { status: 400 });
    }

    // Check session before upload
    addLog('Checking session before upload', { sessionId });
    const sessionBefore = await HybridSessionManager.getSession(sessionId);

    if (!sessionBefore) {
      addLog('Session not found', { sessionId }, false, 'Session not found or expired');
      return NextResponse.json({
        error: 'Session not found or expired',
        debug: { logs: debugLogs }
      }, { status: 404 });
    }

    addLog('Session found before upload', {
      status: sessionBefore.status,
      photoCount: sessionBefore.photos.length,
      expiresAt: sessionBefore.expiresAt
    });

    // Add photo to session
    addLog('Adding photo to session', { sessionId });
    const uploadStartTime = Date.now();
    const success = await HybridSessionManager.addPhoto(sessionId, photo);
    const uploadDuration = Date.now() - uploadStartTime;

    addLog('Photo upload attempt completed', {
      success,
      duration: `${uploadDuration}ms`
    });

    if (!success) {
      addLog('Photo upload failed', { sessionId }, false, 'Failed to add photo to session');
      return NextResponse.json({
        error: 'Session not found or expired',
        debug: { logs: debugLogs }
      }, { status: 404 });
    }

    // Check session after upload
    addLog('Checking session after upload', { sessionId });
    const sessionAfter = await HybridSessionManager.getSession(sessionId);

    addLog('Session state after upload', {
      status: sessionAfter?.status,
      photoCount: sessionAfter?.photos.length,
      photosArray: sessionAfter?.photos?.map(p => p.substring(0, 50) + '...')
    });

    const response = {
      success: true,
      debug: {
        logs: debugLogs,
        sessionBefore: {
          status: sessionBefore.status,
          photoCount: sessionBefore.photos.length
        },
        sessionAfter: {
          status: sessionAfter?.status,
          photoCount: sessionAfter?.photos.length
        },
        uploadDuration
      }
    };

    addLog('Response prepared', response);

    return NextResponse.json(response);

  } catch (error: any) {
    addLog('Critical error in upload', {
      message: error.message,
      stack: error.stack
    }, false, error.message);

    console.error('🚨 [DEBUG UPLOAD] Critical error:', error);

    return NextResponse.json({
      error: 'Failed to upload photo',
      debug: { logs: debugLogs }
    }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const debugLogs: DebugLog[] = [];

  const addLog = (step: string, data: any, success = true, error?: string) => {
    debugLogs.push({
      timestamp: new Date().toISOString(),
      step,
      data,
      success,
      error
    });
    console.log(`🔧 [DEBUG GET] ${step}:`, { data, success, error });
  };

  try {
    const { sessionId } = await params;

    addLog('Get photos request started', {
      sessionId,
      method: request.method,
      url: request.url
    });

    // Get session
    addLog('Fetching session', { sessionId });
    const fetchStartTime = Date.now();
    const session = await HybridSessionManager.getSession(sessionId);
    const fetchDuration = Date.now() - fetchStartTime;

    if (!session) {
      addLog('Session not found', { sessionId }, false, 'Session not found or expired');
      return NextResponse.json({
        error: 'Session not found or expired',
        debug: { logs: debugLogs }
      }, { status: 404 });
    }

    addLog('Session fetched successfully', {
      status: session.status,
      photoCount: session.photos.length,
      fetchDuration: `${fetchDuration}ms`,
      expiresAt: session.expiresAt,
      createdAt: session.createdAt
    });

    const response = {
      photos: session.photos,
      status: session.status,
      photoCount: session.photos.length,
      debug: {
        logs: debugLogs,
        session: {
          id: session.id,
          status: session.status,
          photoCount: session.photos.length,
          expiresAt: session.expiresAt,
          createdAt: session.createdAt
        },
        fetchDuration
      }
    };

    addLog('Response prepared', {
      photoCount: response.photoCount,
      status: response.status
    });

    return NextResponse.json(response);

  } catch (error: any) {
    addLog('Critical error in get photos', {
      message: error.message,
      stack: error.stack
    }, false, error.message);

    console.error('🚨 [DEBUG GET] Critical error:', error);

    return NextResponse.json({
      error: 'Failed to get photos',
      debug: { logs: debugLogs }
    }, { status: 500 });
  }
}