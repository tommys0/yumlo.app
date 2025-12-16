"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CameraIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";

interface DebugLog {
  timestamp: string;
  step: string;
  data: any;
  success: boolean;
  error?: string;
}

interface UploadedPhoto {
  id: string;
  file: File | null;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
}

export default function DebugMobileUploadPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addLog = (step: string, data: any, success = true, error?: string) => {
    const log: DebugLog = {
      timestamp: new Date().toISOString(),
      step,
      data,
      success,
      error
    };
    setLogs(prev => [...prev, log]);
    console.log(`🔧 [DEBUG MOBILE] ${step}:`, { data, success, error });
  };

  useEffect(() => {
    addLog('Page loaded', { sessionId });
    checkSessionValidity();
  }, [sessionId]);

  const checkSessionValidity = async () => {
    addLog('Checking session validity', { sessionId });

    try {
      const response = await fetch(`/api/debug/session/${sessionId}/photos`);
      const data = await response.json();

      addLog('Session validity check response', {
        status: response.status,
        ok: response.ok,
        hasDebugLogs: !!data.debug?.logs
      });

      if (data.debug?.logs) {
        data.debug.logs.forEach((log: DebugLog) => {
          setLogs(prev => [...prev, log]);
        });
      }

      if (response.ok) {
        setSessionValid(true);
        addLog('Session is valid', {
          status: data.status,
          photoCount: data.photoCount
        });
      } else {
        setSessionValid(false);
        addLog('Session is invalid', { error: data.error }, false, data.error);
      }
    } catch (error: any) {
      setSessionValid(false);
      addLog('Session validity check failed', { error: error.message }, false, error.message);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    addLog('Files selected', { fileCount: files.length });

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const photoId = `photo_${Date.now()}_${Math.random()}`;
        const preview = URL.createObjectURL(file);

        addLog('Photo added to queue', {
          photoId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        });

        setPhotos(prev => [...prev, {
          id: photoId,
          file,
          preview,
          uploaded: false,
          uploading: false,
        }]);
      }
    });
  };

  const uploadPhoto = async (photo: UploadedPhoto) => {
    if (!photo.file) return false;

    addLog('Starting photo upload', {
      photoId: photo.id,
      fileName: photo.file.name,
      fileSize: photo.file.size
    });

    try {
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, uploading: true } : p
      ));

      addLog('Converting file to base64', { photoId: photo.id });
      const base64 = await fileToBase64(photo.file);

      addLog('Base64 conversion complete', {
        photoId: photo.id,
        base64Length: base64.length,
        base64Prefix: base64.substring(0, 50) + '...'
      });

      addLog('Sending upload request', { sessionId, photoId: photo.id });

      const response = await fetch(`/api/debug/session/${sessionId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: base64 }),
      });

      const data = await response.json();

      addLog('Upload response received', {
        photoId: photo.id,
        status: response.status,
        ok: response.ok,
        hasDebugLogs: !!data.debug?.logs
      });

      if (data.debug?.logs) {
        data.debug.logs.forEach((log: DebugLog) => {
          setLogs(prev => [...prev, log]);
        });
      }

      if (response.ok) {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploaded: true, uploading: false } : p
        ));
        addLog('Photo upload successful', { photoId: photo.id });
        return true;
      } else {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploading: false } : p
        ));
        addLog('Photo upload failed', {
          photoId: photo.id,
          error: data.error
        }, false, data.error);
        return false;
      }
    } catch (error: any) {
      addLog('Upload error', {
        photoId: photo.id,
        error: error.message
      }, false, error.message);

      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, uploading: false } : p
      ));
      return false;
    }
  };

  const uploadAllPhotos = async () => {
    const unuploadedPhotos = photos.filter(p => !p.uploaded);
    addLog('Starting batch upload', {
      totalPhotos: photos.length,
      unuploadedCount: unuploadedPhotos.length
    });

    for (const photo of unuploadedPhotos) {
      await uploadPhoto(photo);
    }

    addLog('Batch upload completed', {
      totalPhotos: photos.length,
      uploadedCount: photos.filter(p => p.uploaded).length
    });
  };

  const formatLogData = (data: any) => {
    return JSON.stringify(data, null, 2);
  };

  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking session...</p>
        </div>
      </div>
    );
  }

  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Session Expired</h1>
          <p className="text-gray-600">This session is no longer valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm p-4">
        <h1 className="text-lg font-semibold text-center">
          🔧 Debug Mobile Upload
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Session: {sessionId.substring(0, 8)}...
        </p>
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="mt-2 w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2"
        >
          <DocumentTextIcon className="h-4 w-4" />
          {showLogs ? 'Hide' : 'Show'} Debug Logs ({logs.length})
        </button>
      </div>

      {/* Debug Logs */}
      {showLogs && (
        <div className="bg-white mx-4 mt-4 rounded-lg shadow-sm p-4 max-h-64 overflow-y-auto">
          <h3 className="font-medium mb-2">Debug Logs</h3>
          {logs.map((log, index) => (
            <div
              key={index}
              className={`p-2 mb-2 rounded text-xs ${
                log.success ? 'bg-green-50' : 'bg-red-50'
              }`}
            >
              <div className="flex items-center gap-1 mb-1">
                {log.success ? (
                  <CheckCircleIcon className="h-3 w-3 text-green-600" />
                ) : (
                  <ExclamationTriangleIcon className="h-3 w-3 text-red-600" />
                )}
                <span className="font-medium">{log.step}</span>
                <span className="text-gray-500">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              {log.error && (
                <div className="text-red-600 mb-1">Error: {log.error}</div>
              )}
              <details>
                <summary className="cursor-pointer">Data</summary>
                <pre className="mt-1 text-xs bg-gray-100 p-1 rounded overflow-x-auto">
                  {formatLogData(log.data)}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )}

      {/* Photo Upload */}
      <div className="p-4">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Upload Photos</h2>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 mb-4"
          >
            <PhotoIcon className="h-5 w-5" />
            Select Photos
          </button>

          {photos.length > 0 && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                {photos.map((photo) => (
                  <div key={photo.id} className="relative">
                    <img
                      src={photo.preview}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <div className="absolute top-2 right-2">
                      {photo.uploading ? (
                        <div className="w-6 h-6 bg-blue-500 rounded-full animate-pulse"></div>
                      ) : photo.uploaded ? (
                        <CheckCircleIcon className="w-6 h-6 text-green-500" />
                      ) : (
                        <div className="w-6 h-6 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={uploadAllPhotos}
                disabled={photos.every(p => p.uploaded || p.uploading)}
                className="w-full bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Upload All Photos
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}