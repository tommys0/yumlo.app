"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import {
  CameraIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowUpIcon,
} from "@heroicons/react/24/outline";

interface UploadedPhoto {
  id: string;
  file: File | null;
  preview: string;
  uploaded: boolean;
  uploading: boolean;
}

export default function MobileUploadPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;

  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const [uploadComplete, setUploadComplete] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Check session validity on mount
  useEffect(() => {
    checkSessionValidity();
  }, [sessionId]);

  const checkSessionValidity = async () => {
    try {
      const response = await fetch(`/api/session/${sessionId}/photos`);
      if (response.ok) {
        setSessionValid(true);
      } else {
        setSessionValid(false);
      }
    } catch (error) {
      setSessionValid(false);
    }
  };

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  // Handle file selection from gallery
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const photoId = `photo_${Date.now()}_${Math.random()}`;
        const preview = URL.createObjectURL(file);

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

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }, // Back camera
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setShowCamera(true);
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Nelze přistupovat k fotoaparátu. Použijte nahrání z galerie.');
    }
  };

  // Take photo with camera
  const takePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas dimensions to video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to blob
    canvas.toBlob((blob) => {
      if (!blob) return;

      const photoId = `photo_${Date.now()}_${Math.random()}`;
      const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
      const preview = URL.createObjectURL(blob);

      setPhotos(prev => [...prev, {
        id: photoId,
        file,
        preview,
        uploaded: false,
        uploading: false,
      }]);

      // Stop camera after taking photo
      stopCamera();
    }, 'image/jpeg', 0.8);
  };

  // Stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Remove photo
  const removePhoto = (photoId: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== photoId));
  };

  // Upload single photo
  const uploadPhoto = async (photo: UploadedPhoto) => {
    if (!photo.file) return false;

    try {
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, uploading: true } : p
      ));

      const base64 = await fileToBase64(photo.file);

      const response = await fetch(`/api/session/${sessionId}/photos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ photo: base64 }),
      });

      if (response.ok) {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploaded: true, uploading: false } : p
        ));
        return true;
      } else {
        setPhotos(prev => prev.map(p =>
          p.id === photo.id ? { ...p, uploading: false } : p
        ));
        return false;
      }
    } catch (error) {
      console.error('Upload error:', error);
      setPhotos(prev => prev.map(p =>
        p.id === photo.id ? { ...p, uploading: false } : p
      ));
      return false;
    }
  };

  // Upload all photos
  const uploadAllPhotos = async () => {
    setIsUploading(true);

    const unuploadedPhotos = photos.filter(p => !p.uploaded);
    const uploadPromises = unuploadedPhotos.map(photo => uploadPhoto(photo));

    await Promise.all(uploadPromises);

    setIsUploading(false);
    setUploadComplete(true);

    // Mark session as completed
    try {
      await fetch(`/api/session/${sessionId}/complete`, { method: 'POST' });
    } catch (error) {
      console.error('Error completing session:', error);
    }
  };

  // Loading state
  if (sessionValid === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Načítá se...</p>
        </div>
      </div>
    );
  }

  // Invalid session
  if (sessionValid === false) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Session vypršela</h1>
          <p className="text-gray-600">
            QR kód již není platný. Vygenerujte nový QR kód na vašem počítači.
          </p>
        </div>
      </div>
    );
  }

  // Upload complete
  if (uploadComplete) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Úspěšně odesláno!</h1>
          <p className="text-gray-600 mb-4">
            Všechny fotky byly úspěšně nahrány na váš počítač.
          </p>
          <div className="text-sm text-gray-500">
            Můžete tuto stránku zavřít.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-6">
        <div className="text-center">
          <img
            src="/Yumlo-Icon.png"
            alt="Y"
            className="h-8 w-auto mx-auto mb-2"
          />
          <h1 className="text-xl font-bold text-gray-900">Nahrát fotky ingrediencí</h1>
          <p className="text-sm text-gray-600">Vyfotografujte nebo vyberte fotky z galerie</p>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Camera View */}
        {showCamera && (
          <div className="fixed inset-0 bg-black z-50">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Camera Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-6">
              <button
                onClick={stopCamera}
                className="bg-gray-600 text-white p-4 rounded-full"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              <button
                onClick={takePhoto}
                className="bg-white text-gray-900 p-6 rounded-full shadow-lg"
              >
                <CameraIcon className="w-8 h-8" />
              </button>
            </div>
          </div>
        )}

        {/* Upload Methods */}
        <div className="grid grid-cols-1 gap-4">
          {/* Camera Button */}
          <button
            onClick={startCamera}
            className="flex items-center justify-center space-x-3 p-6 bg-blue-600 text-white rounded-lg"
          >
            <CameraIcon className="w-6 h-6" />
            <span className="font-medium">Vyfotit fotoaparátem</span>
          </button>

          {/* Gallery Button */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center space-x-3 p-6 bg-green-600 text-white rounded-lg w-full"
            >
              <PhotoIcon className="w-6 h-6" />
              <span className="font-medium">Vybrat z galerie</span>
            </button>
          </div>
        </div>

        {/* Selected Photos */}
        {photos.length > 0 && (
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium text-gray-900 mb-4">
              Vybrané fotky ({photos.length})
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              {photos.map((photo) => (
                <div key={photo.id} className="relative">
                  <img
                    src={photo.preview}
                    alt={`Photo ${photo.id}`}
                    className="w-full h-32 object-cover rounded-lg"
                  />

                  {/* Status indicators */}
                  {photo.uploading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}

                  {photo.uploaded && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                      <CheckCircleIcon className="w-4 h-4" />
                    </div>
                  )}

                  {!photo.uploaded && !photo.uploading && (
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Upload Button */}
            <button
              onClick={uploadAllPhotos}
              disabled={isUploading || photos.length === 0 || photos.every(p => p.uploaded)}
              className="w-full flex items-center justify-center space-x-2 p-4 bg-blue-600 text-white font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Nahrává se...</span>
                </>
              ) : (
                <>
                  <ArrowUpIcon className="w-5 h-5" />
                  <span>Odeslat fotky</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Instructions */}
        {photos.length === 0 && (
          <div className="bg-white rounded-lg p-6 text-center">
            <CameraIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Začněte fotografováním
            </h3>
            <p className="text-gray-600 text-sm">
              Vyfotografujte ingredience v ledničce nebo je vyberte z galerie telefonu.
              Fotky se automaticky pošlou na váš počítač.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}