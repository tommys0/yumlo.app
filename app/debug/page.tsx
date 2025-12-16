"use client";

import { useState, useRef } from "react";
import QRCode from 'qrcode';
import {
  PlayIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface DebugLog {
  timestamp: string;
  step: string;
  data: any;
  success: boolean;
  error?: string;
}

interface DebugResponse {
  debug?: {
    logs: DebugLog[];
    [key: string]: any;
  };
  [key: string]: any;
}

export default function DebugPage() {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [sessionId, setSessionId] = useState<string>("");
  const [qrCode, setQrCode] = useState<string>("");
  const [polling, setPolling] = useState(false);
  const [testPhoto] = useState('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A==');
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const addLog = (step: string, data: any, success = true, error?: string) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      step,
      data,
      success,
      error
    };
    setLogs(prev => [...prev, log]);
  };

  const extractDebugLogs = (response: DebugResponse) => {
    if (response.debug?.logs) {
      response.debug.logs.forEach(log => {
        setLogs(prev => [...prev, log]);
      });
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const createDebugSession = async () => {
    addLog('Starting debug session creation', {});

    try {
      const response = await fetch('/api/debug/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      extractDebugLogs(data);

      if (!response.ok) {
        addLog('Session creation failed', { status: response.status, data }, false);
        return;
      }

      setSessionId(data.sessionId);
      addLog('Session ID received', { sessionId: data.sessionId });

      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(data.qrUrl, {
        width: 256,
        margin: 2,
      });
      setQrCode(qrCodeData);
      addLog('QR Code generated', { qrUrl: data.qrUrl });

    } catch (error: any) {
      addLog('Error in session creation', { error: error.message }, false, error.message);
    }
  };

  const uploadTestPhoto = async () => {
    if (!sessionId) {
      addLog('Cannot upload photo', {}, false, 'No session ID');
      return;
    }

    addLog('Starting test photo upload', { sessionId });

    try {
      const response = await fetch(`/api/debug/session/${sessionId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: testPhoto }),
      });

      const data = await response.json();
      extractDebugLogs(data);

      if (!response.ok) {
        addLog('Photo upload failed', { status: response.status, data }, false);
        return;
      }

      addLog('Photo upload successful', data);

    } catch (error: any) {
      addLog('Error in photo upload', { error: error.message }, false, error.message);
    }
  };

  const checkPhotos = async () => {
    if (!sessionId) {
      addLog('Cannot check photos', {}, false, 'No session ID');
      return;
    }

    addLog('Checking for photos', { sessionId });

    try {
      const response = await fetch(`/api/debug/session/${sessionId}/photos`);
      const data = await response.json();
      extractDebugLogs(data);

      if (!response.ok) {
        addLog('Photo check failed', { status: response.status, data }, false);
        return;
      }

      addLog('Photo check successful', {
        photoCount: data.photoCount,
        status: data.status
      });

    } catch (error: any) {
      addLog('Error checking photos', { error: error.message }, false, error.message);
    }
  };

  const startPolling = () => {
    if (!sessionId) {
      addLog('Cannot start polling', {}, false, 'No session ID');
      return;
    }

    setPolling(true);
    addLog('Starting polling', { sessionId });

    const poll = async () => {
      try {
        await checkPhotos();
        pollingRef.current = setTimeout(poll, 2000);
      } catch (error) {
        addLog('Polling error', { error }, false);
        setPolling(false);
      }
    };

    poll();
  };

  const stopPolling = () => {
    if (pollingRef.current) {
      clearTimeout(pollingRef.current);
      pollingRef.current = null;
    }
    setPolling(false);
    addLog('Polling stopped', {});
  };

  const formatLogData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            🔧 Yumlo Photo Workflow Debugger
          </h1>
          <p className="text-gray-600">
            Detailed logging for session creation, photo upload, and polling
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Control Panel */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Control Panel</h2>

            <div className="space-y-4">
              <button
                onClick={createDebugSession}
                className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <PlayIcon className="h-5 w-5" />
                1. Create Debug Session
              </button>

              {sessionId && (
                <>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-800">
                      <strong>Session ID:</strong> {sessionId}
                    </p>
                  </div>

                  {qrCode && (
                    <div className="text-center">
                      <h3 className="font-semibold mb-2">QR Code for Mobile:</h3>
                      <img src={qrCode} alt="QR Code" className="mx-auto mb-2" />
                      <p className="text-xs text-gray-600">
                        Scan with mobile to access upload page
                      </p>
                    </div>
                  )}

                  <button
                    onClick={uploadTestPhoto}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    2. Upload Test Photo
                  </button>

                  <button
                    onClick={checkPhotos}
                    className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                  >
                    3. Check Photos
                  </button>

                  <div className="flex gap-2">
                    <button
                      onClick={startPolling}
                      disabled={polling}
                      className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {polling ? <ClockIcon className="h-5 w-5 animate-pulse" /> : <PlayIcon className="h-5 w-5" />}
                      {polling ? 'Polling...' : '4. Start Polling'}
                    </button>

                    {polling && (
                      <button
                        onClick={stopPolling}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        Stop
                      </button>
                    )}
                  </div>
                </>
              )}

              <button
                onClick={clearLogs}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
              >
                <DocumentTextIcon className="h-5 w-5" />
                Clear Logs
              </button>
            </div>
          </div>

          {/* Debug Logs */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Debug Logs ({logs.length})
            </h2>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {logs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No logs yet. Start debugging!</p>
              ) : (
                logs.map((log, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border-l-4 ${
                      log.success
                        ? 'bg-green-50 border-green-400'
                        : 'bg-red-50 border-red-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {log.success ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      ) : (
                        <ExclamationTriangleIcon className="h-4 w-4 text-red-600" />
                      )}
                      <span className="font-medium text-sm">
                        {log.step}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    {log.error && (
                      <div className="text-red-600 text-sm mb-2">
                        <strong>Error:</strong> {log.error}
                      </div>
                    )}

                    <details className="text-xs">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        View Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {formatLogData(log.data)}
                      </pre>
                    </details>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>
            This debug page uses special debug API endpoints (/api/debug/*) that provide detailed logging.
            Use this to trace exactly what happens during the photo upload workflow.
          </p>
        </div>
      </div>
    </div>
  );
}