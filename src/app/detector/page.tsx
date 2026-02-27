'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { ImageUpload } from '@/components/detector/image-upload';
import { DetectionCanvas } from '@/components/detector/detection-canvas';
import { ResultsPanel } from '@/components/detector/results-panel';
import { analyzeImage, type Detection, type AnalysisResult } from '@/lib/api/analyze';
import { createReport } from '@/lib/api/reports';
import { extractExifData, type ExifLocation } from '@/lib/exif/extract';
import { generateDetectionPDF } from '@/lib/pdf/generate';
import { uploadReportImage } from '@/lib/storage/upload';
import { optimizeImageForApi } from '@/lib/images/optimize';
import { StockIcon } from '@/components/ui/stock-icon';
import { toast } from 'sonner';

// Dynamic import for the mini-map (Leaflet = client only)
const DetectionMap = dynamic(
  () => import('@/components/detector/detection-map').then((m) => m.DetectionMap),
  {
    ssr: false,
    loading: () => <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />,
  },
);

const MAX_API_IMAGE_BYTES = 3_500_000;

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function DetectorPage() {
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [apiReadyFile, setApiReadyFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [imageSize, setImageSize] = useState({ width: 640, height: 480 });
  const [location, setLocation] = useState<ExifLocation | null>(null);
  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const selectionRef = useRef(0);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const selectionId = ++selectionRef.current;
    setCurrentFile(file);
    setApiReadyFile(file);
    setDetections([]);
    setAnalysisError(null);
    setIsPreparingFile(true);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Extract EXIF
    try {
      const exifData = await extractExifData(file);
      setLocation(exifData);
      if (exifData) {
        toast.info(`Ubicación GPS encontrada: ${exifData.lat.toFixed(4)}, ${exifData.lon.toFixed(4)}`);
      }
    } catch {
      setLocation(null);
    }

    try {
      const optimized = await optimizeImageForApi(file, {
        maxBytes: MAX_API_IMAGE_BYTES,
        maxEdge: 2048,
      });

      if (selectionId !== selectionRef.current) return;
      setApiReadyFile(optimized);

      if (optimized.size < file.size) {
        toast.info(
          `Imagen optimizada: ${formatMb(file.size)} -> ${formatMb(optimized.size)}`,
        );
      }
    } catch {
      if (selectionId !== selectionRef.current) return;
      setApiReadyFile(file);
    } finally {
      if (selectionId === selectionRef.current) {
        setIsPreparingFile(false);
      }
    }
  }, []);

  // Run detection
  const handleDetect = useCallback(async () => {
    const fileForAnalysis = apiReadyFile ?? currentFile;
    if (!fileForAnalysis) return;
    if (isPreparingFile) {
      toast.info('Preparando imagen, intenta de nuevo en un momento');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setDetections([]);

    try {
      const result: AnalysisResult = await analyzeImage(fileForAnalysis);

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
  }, [apiReadyFile, currentFile, isPreparingFile]);

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

  const handleSaveReport = useCallback(async () => {
    const fileForUpload = apiReadyFile ?? currentFile;
    if (!fileForUpload || detections.length === 0) return;

    setIsSavingReport(true);
    try {
      const uploaded = await uploadReportImage(fileForUpload);
      const topDetection = detections.reduce(
        (best, curr) => (curr.confidence > best.confidence ? curr : best),
        detections[0],
      );
      const maxConfidence = topDetection?.confidence ?? 0;

      await createReport({
        titulo: `Detección IA: ${topDetection?.class || 'contaminacion'}`,
        lat: location?.lat ?? 29.072967,
        lon: location?.lon ?? -110.955919,
        gravedad: maxConfidence >= 0.85 ? 'alto' : maxConfidence >= 0.6 ? 'medio' : 'bajo',
        descripcion: `Reporte generado desde EcoScan con ${detections.length} detecciones.`,
        tipoEvento: 'contaminacion',
        medio: 'ciudadano',
        imagen: uploaded.url,
        fotoBlobKey: uploaded.blobKey || undefined,
        fotoMime: uploaded.mime,
        fotoSizeBytes: uploaded.size,
        tipoReporte: 'ciudadano',
        detectadoAi: true,
        aiConfidence: maxConfidence,
        aiModel: 'visual-pollution-detection-04jk5/3',
        aiResultJson: { detections },
        status: 'enviado',
      });

      toast.success('Reporte guardado en la base de datos');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar reporte';
      toast.error(message);
    } finally {
      setIsSavingReport(false);
    }
  }, [apiReadyFile, currentFile, detections, location]);

  // Computed stats
  const totalObjects = detections.length;
  const avgConfidence = totalObjects > 0
    ? Math.round(detections.reduce((s, d) => s + d.confidence, 0) / totalObjects * 100)
    : 0;
  const contaminationIndex = totalObjects > 0
    ? Math.min(100, Math.round(avgConfidence * (Math.log2(totalObjects + 1) / Math.log2(10)) * 100))
    : 0;

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="container mx-auto px-6">

        {/* Hero Header */}
        <div className="text-center mb-12 slide-up">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-green-100 mb-6">
            <StockIcon name="camera" className="w-6 h-6" />
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

          {/* AI Detection Info */}
          <div className="max-w-2xl mx-auto">
            <div className="bg-emerald-50 border-l-4 border-emerald-400 p-4 rounded-lg">
              <div className="flex items-center">
                <span className="mr-3">
                  <StockIcon name="lab" className="w-5 h-5" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-emerald-800">
                    <strong>Detección con IA Activa</strong>
                  </p>
                  <p className="text-sm text-emerald-700 mt-1">
                    El detector utiliza el modelo de Roboflow para identificar contaminación visual
                    en fotografías. Sube una imagen para analizarla.
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
                  <StockIcon name="upload" className="w-5 h-5" />
                </div>
                Subir Fotografía
              </h3>
              <ImageUpload onFileSelect={handleFileSelect} preview={null} />
              {currentFile && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <StockIcon name="document" className="w-5 h-5" />
                    <div>
                      <p className="font-medium text-green-800">Archivo seleccionado:</p>
                      <p className="text-sm text-green-600">
                        {currentFile.name} ({formatMb(currentFile.size)})
                      </p>
                      {apiReadyFile && apiReadyFile.size < currentFile.size && (
                        <p className="text-xs text-emerald-700 mt-1">
                          Archivo optimizado para API: {formatMb(apiReadyFile.size)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Control Panel Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <StockIcon name="target" className="w-5 h-5" />
                </div>
                Control de Análisis
              </h3>

              <div className="space-y-4">
                <button
                  onClick={handleDetect}
                  disabled={!currentFile || isAnalyzing || isPreparingFile}
                  className="w-full hero-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPreparingFile ? 'Preparando imagen...' : isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                </button>

                {/* Status Badge */}
                <div className={`status-badge ${isAnalyzing ? 'loading' : analysisError ? 'error' : detections.length > 0 ? 'success' : 'info'}`}>
                  {isPreparingFile
                    ? 'Optimizando imagen para evitar errores de tamaño...'
                    : isAnalyzing
                    ? 'Analizando imagen...'
                    : analysisError
                      ? `Error: ${analysisError}`
                      : detections.length > 0
                        ? `${detections.length} objetos detectados`
                        : 'Sistema listo — Selecciona una imagen'}
                </div>
              </div>
            </div>

            {/* Results Stats Card */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <StockIcon name="chart" className="w-5 h-5" />
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
                  Generar Reporte PDF
                </button>
              )}

              {detections.length > 0 && (
                <button
                  onClick={handleSaveReport}
                  disabled={isSavingReport || isAnalyzing || isPreparingFile}
                  className="w-full mt-3 hero-cta-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingReport ? 'Guardando...' : 'Guardar Reporte Ciudadano'}
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
                  <StockIcon name="eye" className="w-5 h-5" />
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
                    <span className="inline-flex justify-center mb-4">
                      <StockIcon name="camera" className="w-14 h-14 opacity-50" />
                    </span>
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
                  <StockIcon name="pin" className="w-5 h-5" />
                </div>
                Ubicación GPS
              </h3>
              <DetectionMap location={location} />
            </div>

            {/* Results Detail Panel */}
            <div className="card p-8 slide-up">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2 bg-gray-100 rounded-lg">
                  <StockIcon name="lab" className="w-5 h-5" />
                </div>
                Detalle de Detecciones
              </h3>
              <ResultsPanel
                detections={detections}
                isLoading={isAnalyzing}
                error={analysisError}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
