'use client';

import { useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { ImageUpload } from '@/components/detector/image-upload';
import { DetectionCanvas } from '@/components/detector/detection-canvas';
import { ResultsPanel } from '@/components/detector/results-panel';
import { analyzeImage, type Detection, type AnalysisResult } from '@/lib/api/analyze';
import { extractExifData, type ExifLocation } from '@/lib/exif/extract';
import { generateDetectionPDF } from '@/lib/pdf/generate';
import { toast } from 'sonner';

// Dynamic import for the mini-map (Leaflet = client only)
const DetectionMap = dynamic(
  () => import('@/components/detector/detection-map').then((m) => m.DetectionMap),
  {
    ssr: false,
    loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />,
  },
);

export default function DetectorPage() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 640, height: 480 });
  const [location, setLocation] = useState<ExifLocation | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState(false);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    setCurrentFile(file);
    setDetections([]);
    setAnalysisError(null);
    setDemoMode(false);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Extract EXIF
    try {
      const exifData = await extractExifData(file);
      setLocation(exifData);
      if (exifData) {
        toast.info(`📍 Ubicación GPS encontrada: ${exifData.lat.toFixed(4)}, ${exifData.lon.toFixed(4)}`);
      }
    } catch {
      setLocation(null);
    }
  }, []);

  // Run detection
  const handleDetect = useCallback(async () => {
    if (!currentFile) return;

    setIsAnalyzing(true);
    setAnalysisError(null);
    setDetections([]);

    try {
      const result: AnalysisResult = await analyzeImage(currentFile, { demoMode });

      setDetections(result.predictions);
      setImageSize(result.image);

      if (result.predictions.length === 0) {
        toast.info('No se detectaron objetos en la imagen');
      } else {
        toast.success(`${result.predictions.length} objetos detectados`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setAnalysisError(message);
      toast.error(`Error en detección: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentFile, demoMode]);

  // Generate PDF
  const handleGeneratePDF = useCallback(() => {
    if (!preview || detections.length === 0) return;

    generateDetectionPDF({
      imageSrc: preview,
      detections,
      location: location ? { lat: location.lat, lon: location.lon } : null,
      dateTime: location?.dateTime,
      fileName: currentFile?.name,
    });

    toast.success('Reporte PDF generado');
  }, [preview, detections, location, currentFile]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          🤖 EcoScan — Detector IA
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Sube una imagen para detectar contaminación automáticamente
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column: Upload + controls */}
        <div className="space-y-4">
          <ImageUpload onFileSelect={handleFileSelect} preview={null} />

          {/* Controls */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleDetect}
              disabled={!currentFile || isAnalyzing}
              className="flex-1 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isAnalyzing ? '⏳ Analizando...' : '🔍 Detectar Contaminación'}
            </button>

            {detections.length > 0 && (
              <button
                onClick={handleGeneratePDF}
                className="px-4 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                📄 Generar PDF
              </button>
            )}
          </div>

          {/* Demo mode toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input
              type="checkbox"
              checked={demoMode}
              onChange={(e) => setDemoMode(e.target.checked)}
              className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
            />
            Modo Demo (detecciones simuladas)
          </label>

          {/* Mini-map */}
          <DetectionMap location={location} />
        </div>

        {/* Right column: Results */}
        <div className="space-y-4">
          {/* Canvas with detections */}
          {preview && detections.length > 0 && (
            <DetectionCanvas
              imageSrc={preview}
              detections={detections}
              imageSize={imageSize}
            />
          )}

          {/* Preview without detections */}
          {preview && detections.length === 0 && !isAnalyzing && (
            <div className="bg-white rounded-xl p-2 shadow-sm border border-gray-100">
              <img
                src={preview}
                alt="Imagen cargada"
                className="w-full rounded-lg object-contain max-h-96"
              />
            </div>
          )}

          {/* Results panel */}
          <ResultsPanel
            detections={detections}
            isLoading={isAnalyzing}
            error={analysisError}
            demoMode={demoMode}
          />
        </div>
      </div>
    </div>
  );
}
