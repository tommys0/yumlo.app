import { NextRequest, NextResponse } from 'next/server';
import { HybridSessionManager } from '@/lib/hybrid-session-manager';
import { supabase } from '@/lib/supabase';

interface DebugLog {
  timestamp: string;
  step: string;
  data: any;
  success: boolean;
  error?: string;
}

export async function POST(request: NextRequest) {
  const debugLogs: DebugLog[] = [];

  const addLog = (step: string, data: any, success = true, error?: string) => {
    debugLogs.push({
      timestamp: new Date().toISOString(),
      step,
      data,
      success,
      error
    });
    console.log(`🔧 [DEBUG CREATE] ${step}:`, { data, success, error });
  };

  try {
    addLog('Request started', {
      method: request.method,
      url: request.url,
      headers: {
        'user-agent': request.headers.get('user-agent'),
        'content-type': request.headers.get('content-type'),
        'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        'host': request.headers.get('host')
      }
    });

    // Get user ID from auth headers
    addLog('Checking auth headers', {
      hasAuthHeader: !!request.headers.get('authorization')
    });

    const authHeader = request.headers.get('authorization');
    let userId: string | undefined;

    if (authHeader) {
      addLog('Processing auth header', { hasToken: true });
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (authError) {
        addLog('Auth failed', { error: authError.message }, false, authError.message);
      } else {
        userId = user?.id;
        addLog('Auth success', { userId });
      }
    }

    // Create session
    addLog('Creating session with HybridSessionManager', { userId });

    const sessionStartTime = Date.now();
    const session = await HybridSessionManager.createSession(userId);
    const sessionDuration = Date.now() - sessionStartTime;

    addLog('Session created', {
      sessionId: session.id,
      status: session.status,
      expiresAt: session.expiresAt,
      duration: `${sessionDuration}ms`
    });

    // Get base URL from request headers
    const protocol = request.headers.get('x-forwarded-proto') || 'http';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    addLog('Generated URLs', {
      protocol,
      host,
      baseUrl,
      qrUrl: `${baseUrl}/mobile/${session.id}`
    });

    const response = {
      sessionId: session.id,
      expiresAt: session.expiresAt,
      qrUrl: `${baseUrl}/mobile/${session.id}`,
      debug: {
        logs: debugLogs,
        totalDuration: Date.now() - sessionStartTime,
        timestamp: new Date().toISOString()
      }
    };

    addLog('Response prepared', {
      sessionId: response.sessionId,
      qrUrl: response.qrUrl,
      hasDebugLogs: !!response.debug
    });

    return NextResponse.json(response);

  } catch (error: any) {
    addLog('Critical error', {
      message: error.message,
      stack: error.stack,
      name: error.constructor.name
    }, false, error.message);

    console.error('🚨 [DEBUG CREATE] Critical error:', error);

    return NextResponse.json({
      error: 'Failed to create session',
      debug: {
        logs: debugLogs,
        timestamp: new Date().toISOString()
      }
    }, { status: 500 });
  }
}