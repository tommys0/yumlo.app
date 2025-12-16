"use client";

import { useState, useRef, useEffect } from "react";
import QRCode from 'qrcode';
import {
  CameraIcon,
  PhotoIcon,
  PlusIcon,
  XMarkIcon,
  SparklesIcon,
  CheckBadgeIcon,
  QrCodeIcon,
  DevicePhoneMobileIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface DetectedIngredient {
  name: string;
  confidence: number;
  quantity?: string;
}

export default function AiScannerPage() {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [detectedIngredients, setDetectedIngredients] = useState<DetectedIngredient[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [manualIngredients, setManualIngredients] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [sessionId, setSessionId] = useState<string>("");
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrStatus, setQrStatus] = useState<'generating' | 'waiting' | 'active' | 'completed'>('generating');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // QR Code functionality
  const generateQRSession = async () => {
    try {
      setQrStatus('generating');
      setShowQRModal(true);

      const response = await fetch('/api/session/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to create session');

      const { sessionId: newSessionId, qrUrl } = await response.json();

      // Generate QR code
      const qrCodeData = await QRCode.toDataURL(qrUrl, {
        width: 256,
        margin: 2,
        color: {
          dark: '#1f2937',
          light: '#ffffff'
        }
      });

      setSessionId(newSessionId);
      setQrCode(qrCodeData);
      setQrStatus('waiting');

      // Start polling for photos
      pollForPhotos(newSessionId);

    } catch (error) {
      console.error('Error generating QR:', error);
      setShowQRModal(false);
    }
  };

  const pollForPhotos = async (sessionId: string) => {
    const poll = async () => {
      try {
        const response = await fetch(`/api/session/${sessionId}/photos`);
        let data: any = null;

        if (response.ok) {
          data = await response.json();

          if (data.photos.length > 0) {
            setQrStatus('active');
            setUploadedImages(data.photos);

            // Analyze all photos
            data.photos.forEach((photo: string) => analyzeImage(photo));

            if (data.status === 'completed') {
              setQrStatus('completed');
              setTimeout(() => setShowQRModal(false), 2000);
              return;
            }
          }
        }

        // Continue polling if session is still active
        if (data?.status !== 'completed') {
          setTimeout(poll, 2000);
        }
      } catch (error) {
        console.error('Polling error:', error);
        setTimeout(poll, 5000); // Retry after error
      }
    };

    poll();
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setUploadedImages(prev => [...prev, imageUrl]);
        analyzeImage(imageUrl);
      };
      reader.readAsDataURL(file);
    });
  };

  const analyzeImage = async (imageUrl: string) => {
    setIsAnalyzing(true);

    // Simulace AI analýzy - v reálné implementaci by se volalo API
    setTimeout(() => {
      const mockIngredients: DetectedIngredient[] = [
        { name: "Rajčata", confidence: 0.95, quantity: "3 ks" },
        { name: "Cibule", confidence: 0.88, quantity: "1 ks" },
        { name: "Mrkev", confidence: 0.82, quantity: "2 ks" },
        { name: "Brambory", confidence: 0.91, quantity: "500g" },
        { name: "Česnek", confidence: 0.76, quantity: "1 stroužek" },
      ];

      setDetectedIngredients(prev => {
        const existing = prev.map(ing => ing.name);
        const newIngredients = mockIngredients.filter(ing => !existing.includes(ing.name));
        return [...prev, ...newIngredients];
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeDetectedIngredient = (index: number) => {
    setDetectedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const addManualIngredient = () => {
    if (newIngredient.trim() && !manualIngredients.includes(newIngredient.trim())) {
      setManualIngredients([...manualIngredients, newIngredient.trim()]);
      setNewIngredient("");
    }
  };

  const removeManualIngredient = (ingredient: string) => {
    setManualIngredients(prev => prev.filter(item => item !== ingredient));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addManualIngredient();
    }
  };

  const getAllIngredients = () => {
    return [
      ...detectedIngredients.map(ing => ing.name),
      ...manualIngredients
    ];
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AI Scanner</h1>
        <p className="text-gray-600">
          Nahrujte fotky z vaší ledničky nebo kuchyně a AI automaticky rozpozná ingredience
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Nahrát fotky</h2>

        {/* Upload Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Direct Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Přímé nahrání
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Nahrajte fotky přímo z vašeho zařízení
            </p>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center px-4 py-2 bg-gray-600 text-white font-medium rounded-lg hover:bg-gray-700 transition-colors"
            >
              <PhotoIcon className="w-4 h-4 mr-2" />
              Vybrat fotky
            </button>
          </div>

          {/* QR Code Upload */}
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gradient-to-br from-blue-50 to-indigo-50">
            <DevicePhoneMobileIcon className="w-10 h-10 text-blue-500 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Mobilní nahrání
            </h3>
            <p className="text-gray-500 text-sm mb-4">
              Vygenerujte QR kód pro nahrání z mobilu
            </p>

            <button
              onClick={generateQRSession}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
            >
              <QrCodeIcon className="w-4 h-4 mr-2" />
              Vygenerovat QR
            </button>
          </div>
        </div>
      </div>

      {/* Uploaded Images */}
      {uploadedImages.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Nahrané fotky ({uploadedImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative group">
                <img
                  src={image}
                  alt={`Uploaded ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg border border-gray-200"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis Status */}
      {isAnalyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-700 font-medium">
              AI analyzuje fotky a rozpoznává ingredience...
            </span>
          </div>
        </div>
      )}

      {/* Detected Ingredients */}
      {detectedIngredients.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <CheckBadgeIcon className="w-6 h-6 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Rozpoznané ingredience ({detectedIngredients.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {detectedIngredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <span className="font-medium text-gray-900">{ingredient.name}</span>
                    {ingredient.quantity && (
                      <span className="text-gray-500 text-sm ml-2">({ingredient.quantity})</span>
                    )}
                    <div className="text-xs text-gray-500">
                      Jistota: {Math.round(ingredient.confidence * 100)}%
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeDetectedIngredient(index)}
                  className="text-red-500 hover:text-red-700 p-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Manual Input */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Přidat ručně
        </h3>
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newIngredient}
            onChange={(e) => setNewIngredient(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Např. olivový olej, sůl..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <button
            onClick={addManualIngredient}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5" />
          </button>
        </div>

        {manualIngredients.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {manualIngredients.map((ingredient, index) => (
              <div
                key={index}
                className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-full"
              >
                <span className="text-sm">{ingredient}</span>
                <button
                  onClick={() => removeManualIngredient(ingredient)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Generate Recipes */}
      {getAllIngredients().length > 0 && (
        <div className="text-center">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Připraveno k generování!
            </h3>
            <p className="text-gray-600 mb-4">
              Máte {getAllIngredients().length} ingrediencí připravených pro AI generování receptů
            </p>
            <button className="inline-flex items-center px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors shadow-lg">
              <SparklesIcon className="w-5 h-5 mr-2" />
              Vygenerovat recepty
            </button>
          </div>

          {/* Summary */}
          <div className="text-left bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Vaše ingredience:</h4>
            <div className="flex flex-wrap gap-2">
              {getAllIngredients().map((ingredient, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-white text-gray-700 rounded text-sm border"
                >
                  {ingredient}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 relative">
            <div className="text-center">
              {/* Close button */}
              <button
                onClick={() => setShowQRModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>

              {/* Header */}
              <div className="mb-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DevicePhoneMobileIcon className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {qrStatus === 'generating' && 'Generuje se QR kód...'}
                  {qrStatus === 'waiting' && 'Naskenujte QR kód'}
                  {qrStatus === 'active' && 'Fotky se nahrávají...'}
                  {qrStatus === 'completed' && 'Hotovo!'}
                </h3>
                <p className="text-gray-600">
                  {qrStatus === 'generating' && 'Připravuje se session pro váš telefon'}
                  {qrStatus === 'waiting' && 'Použijte telefon k naskenování a nahrání fotek'}
                  {qrStatus === 'active' && 'Fotky byly přijaty z vašeho telefonu'}
                  {qrStatus === 'completed' && 'Všechny fotky byly úspěšně nahrány'}
                </p>
              </div>

              {/* QR Code */}
              {qrCode && qrStatus !== 'completed' && (
                <div className="bg-white p-6 rounded-xl border-2 border-gray-200 mb-6">
                  <img
                    src={qrCode}
                    alt="QR Code"
                    className="mx-auto"
                    style={{ width: '256px', height: '256px' }}
                  />
                </div>
              )}

              {/* Status Indicator */}
              <div className="mb-6">
                {qrStatus === 'generating' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-blue-600">Generuje se...</span>
                  </div>
                )}

                {qrStatus === 'waiting' && (
                  <div className="flex items-center justify-center space-x-2">
                    <ClockIcon className="w-5 h-5 text-yellow-500" />
                    <span className="text-yellow-600">Čeká se na telefon...</span>
                  </div>
                )}

                {qrStatus === 'active' && (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="animate-pulse rounded-full h-5 w-5 bg-green-500"></div>
                    <span className="text-green-600">Nahrává se z telefonu...</span>
                  </div>
                )}

                {qrStatus === 'completed' && (
                  <div className="flex items-center justify-center space-x-2">
                    <CheckBadgeIcon className="w-5 h-5 text-green-500" />
                    <span className="text-green-600">Úspěšně dokončeno!</span>
                  </div>
                )}
              </div>

              {/* Instructions */}
              {qrStatus === 'waiting' && (
                <div className="text-left space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">1</span>
                    </div>
                    <p>Naskenujte QR kód fotoaparátem telefonu</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">2</span>
                    </div>
                    <p>Otevře se stránka pro nahrání fotek</p>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-blue-600">3</span>
                    </div>
                    <p>Vyfotografujte nebo vyberte fotky ingrediencí</p>
                  </div>
                </div>
              )}

              {/* Upload Status */}
              {qrStatus === 'active' && uploadedImages.length > 0 && (
                <div className="bg-green-50 rounded-lg p-4">
                  <p className="text-green-700 font-medium">
                    Nahrané fotky: {uploadedImages.length}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}