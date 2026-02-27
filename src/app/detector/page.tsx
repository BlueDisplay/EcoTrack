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

  // Computed stats
  const totalObjects = detections.length;
  const avgConfidence = totalObjects > 0
    ? Math.round(detections.reduce((s, d) => s + d.confidence, 0) / totalObjects * 100)
    : 0;
  const contaminationIndex = Math.min(100, totalObjects * 15);

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="container mx-auto px-6">

        {/* Hero Header */}
        <div className="text-center mb-12 slide-up">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-green-100 mb-6">
            <span className="text-2xl">🤖</span>
            <span className="font-bold text-xl text-gray-800">Detector IA de Contaminación</span>
          </div>
          <h1 className="font-black text-4xl md:text-6xl mb-4 leading-tight">
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Detección Inteligente
            </span>
            <br />
            <span className="text-2xl md:text-4xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              de Contaminación Visual
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
            Utiliza <strong className="text-green-600">inteligencia artificial</strong> avanzada para detectar automáticamente
            basura y contaminación en fotografías, y mapeamos su ubicación usando datos EXIF.
          </p>

          {/* Demo Notice */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="text-blue-400 mr-3">ℹ️</span>
                <div className="text-left">
                  <p className="text-sm font-medium text-blue-800">
                    <strong>Modo Demostración Activo</strong>
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    El detector está funcionando con IA simulada para fines de demostración.
                    Las detecciones son generadas algorítmicamente para mostrar el funcionamiento del sistema.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

          {/* Left Column: Upload & Controls */}
          <div className="space-y-6">

            {/* Upload Zone Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-green-600 text-xl">☁️</span>
                </div>
                Subir Fotografía
              </h3>
              <ImageUpload onFileSelect={handleFileSelect} preview={null} />
              {currentFile && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <span className="text-green-600">🖼️</span>
                    <div>
                      <p className="font-medium text-green-800">Archivo seleccionado:</p>
                      <p className="text-sm text-green-600">{currentFile.name}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Control Panel Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <span className="text-blue-600 text-xl">⚙️</span>
                </div>
                Control de Análisis
              </h3>

              <div className="space-y-4">
                <button
                  onClick={handleDetect}
                  disabled={!currentFile || isAnalyzing}
                  className="w-full hero-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAnalyzing ? '⏳ Analizando...' : '🔍 Analizar con IA'}
                </button>

                {/* Status Badge */}
                <div className={`status-badge ${isAnalyzing ? 'loading' : analysisError ? 'error' : detections.length > 0 ? 'success' : 'info'}`}>
                  <span>
                    {isAnalyzing ? 'ℹ️' : analysisError ? '❌' : detections.length > 0 ? '✅' : 'ℹ️'}
                  </span>
                  {isAnalyzing
                    ? 'Analizando imagen...'
                    : analysisError
                      ? `Error: ${analysisError}`
                      : detections.length > 0
                        ? `${detections.length} objetos detectados`
                        : 'Sistema listo — Selecciona una imagen'}
                </div>

                {/* Demo mode toggle */}
                <label className="flex items-center gap-2 text-sm text-gray-500 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={demoMode}
                    onChange={(e) => setDemoMode(e.target.checked)}
                    className="rounded border-gray-300 text-emerald-500 focus:ring-emerald-500"
                  />
                  Modo Demo (detecciones simuladas)
                </label>
              </div>
            </div>

            {/* Results Stats Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <span className="text-purple-600 text-xl">📊</span>
                </div>
                Resultados del Análisis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-600">{totalObjects}</div>
                  <div className="text-sm text-gray-600 font-medium">Objetos Detectados</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-blue-600">{avgConfidence}%</div>
                  <div className="text-sm text-gray-600 font-medium">Confianza Promedio</div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100">
                  <div className="text-2xl font-bold text-red-600">{contaminationIndex}%</div>
                  <div className="text-sm text-gray-600 font-medium">Índice Contaminación</div>
                </div>
              </div>

              {detections.length > 0 && (
                <button
                  onClick={handleGeneratePDF}
                  className="w-full mt-6 hero-cta-secondary"
                >
                  📄 Generar Reporte PDF
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Image Display & Map */}
          <div className="space-y-6">

            {/* Image Display Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <span className="text-orange-600 text-xl">👁️</span>
                </div>
                Imagen con Detecciones
              </h3>

              <div className="bg-gray-100 rounded-xl min-h-96 flex items-center justify-center overflow-hidden relative">
                {preview && detections.length > 0 ? (
                  <DetectionCanvas
                    imageSrc={preview}
                    detections={detections}
                    imageSize={imageSize}
                  />
                ) : preview ? (
                  <img
                    src={preview}
                    alt="Imagen cargada"
                    className="max-w-full max-h-96 object-contain rounded-lg shadow-lg"
                  />
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <span className="text-6xl mb-4 block">🖼️</span>
                    <p className="text-lg">La imagen aparecerá aquí</p>
                    <p className="text-sm">Las detecciones se mostrarán como cajas de colores</p>
                  </div>
                )}
              </div>
            </div>

            {/* Map Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <span className="text-teal-600 text-xl">📍</span>
                </div>
                Ubicación GPS
              </h3>
              <DetectionMap location={location} />
            </div>

            {/* Results Detail Panel */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <span className="text-gray-600 text-xl">🔬</span>
                </div>
                Detalle de Detecciones
              </h3>
              <ResultsPanel
                detections={detections}
                isLoading={isAnalyzing}
                error={analysisError}
                demoMode={demoMode}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
