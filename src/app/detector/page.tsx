'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ImageUpload } from '@/components/detector/image-upload';
import { AnnotationCanvas, type ManualAnnotation, type AnnotationCanvasHandle } from '@/components/detector/annotation-canvas';
import { ResultsPanel } from '@/components/detector/results-panel';
import { LabelPicker } from '@/components/detector/label-picker';
import { analyzeImage, type Detection, type AnalysisResult } from '@/lib/api/analyze';
import { createReport } from '@/lib/api/reports';
import { extractExifData, type ExifLocation } from '@/lib/exif/extract';
import { generateDetectionPDF } from '@/lib/pdf/generate';
import { uploadReportImage } from '@/lib/storage/upload';
import { optimizeImageForApi } from '@/lib/images/optimize';
import { StockIcon } from '@/components/ui/stock-icon';
import { useScrollReveal } from '@/lib/hooks/use-scroll-reveal';
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
  const [aiDetections, setAiDetections] = useState<Detection[]>([]);
  const [manualAnnotations, setManualAnnotations] = useState<ManualAnnotation[]>([]);
  const [imageSize, setImageSize] = useState({ width: 640, height: 480 });
  const [location, setLocation] = useState<ExifLocation | null>(null);
  const [hasExif, setHasExif] = useState(false);
  const [isPreparingFile, setIsPreparingFile] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSavingReport, setIsSavingReport] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const selectionRef = useRef(0);
  const canvasRef = useRef<AnnotationCanvasHandle>(null);

  // Manual annotation mode
  const [drawMode, setDrawMode] = useState(false);
  const [pendingBox, setPendingBox] = useState<Omit<ManualAnnotation, 'class' | 'confidence' | '_manual'> | null>(null);

  // User comment for reports
  const [userComment, setUserComment] = useState('');

  useScrollReveal();

  // Merged detections for stats & saving
  const allDetections: Detection[] = [...aiDetections, ...manualAnnotations];
  const totalObjects = allDetections.length;

  // Fake progress bar for analysis
  useEffect(() => {
    if (!isAnalyzing) { setAnalyzeProgress(0); return; }
    setAnalyzeProgress(10);
    const t1 = setTimeout(() => setAnalyzeProgress(35), 500);
    const t2 = setTimeout(() => setAnalyzeProgress(60), 1500);
    const t3 = setTimeout(() => setAnalyzeProgress(80), 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [isAnalyzing]);

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    const selectionId = ++selectionRef.current;
    setCurrentFile(file);
    setApiReadyFile(file);
    setAiDetections([]);
    setManualAnnotations([]);
    setAnalysisError(null);
    setIsPreparingFile(true);
    setDrawMode(false);
    setPendingBox(null);

    // Create preview
    const url = URL.createObjectURL(file);
    setPreview(url);

    // Read natural image dimensions for coordinate mapping
    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.src = url;

    // Extract EXIF
    try {
      const exifData = await extractExifData(file);
      setLocation(exifData);
      setHasExif(!!exifData);
      if (exifData) {
        toast.info(`Ubicación GPS encontrada: ${exifData.lat.toFixed(4)}, ${exifData.lon.toFixed(4)}`);
      } else {
        toast.warning('Datos EXIF de ubicación no encontrados — localiza en el mapa dónde tomaste la foto para completar el reporte');
      }
    } catch {
      setLocation(null);
      setHasExif(false);
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

  // Run AI detection
  const handleDetect = useCallback(async () => {
    const fileForAnalysis = apiReadyFile ?? currentFile;
    if (!fileForAnalysis) return;
    if (isPreparingFile) {
      toast.info('Preparando imagen, intenta de nuevo en un momento');
      return;
    }
    if (fileForAnalysis.size > MAX_API_IMAGE_BYTES) {
      const msg = `La imagen sigue muy pesada (${formatMb(fileForAnalysis.size)}). Prueba con otra foto.`;
      setAnalysisError(msg);
      toast.error(msg);
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAiDetections([]);

    try {
      const result: AnalysisResult = await analyzeImage(fileForAnalysis);

      setAiDetections(result.predictions);
      setImageSize(result.image);
      setAnalyzeProgress(100);

      if (result.predictions.length === 0) {
        toast.info('No se detectaron objetos en la imagen');
      } else {
        toast.success(`${result.predictions.length} objetos detectados por IA`);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setAnalysisError(message);
      toast.error(`Error en detección: ${message}`);
    } finally {
      setIsAnalyzing(false);
    }
  }, [apiReadyFile, currentFile, isPreparingFile]);

  // Manual annotation handlers
  const handleBoxDrawn = useCallback(
    (box: Omit<ManualAnnotation, 'class' | 'confidence' | '_manual'>) => {
      setPendingBox(box);
      setDrawMode(false);
    },
    [],
  );

  const handleLabelSelect = useCallback(
    (label: string) => {
      if (!pendingBox) return;
      const annotation: ManualAnnotation = {
        ...pendingBox,
        class: label,
        confidence: 1.0,
        _manual: true,
      };
      setManualAnnotations((prev) => [...prev, annotation]);
      setPendingBox(null);
      toast.success(`Anotación "${label}" agregada`);
    },
    [pendingBox],
  );

  const handleLabelCancel = useCallback(() => {
    setPendingBox(null);
  }, []);

  const handleRemoveAnnotation = useCallback((index: number) => {
    setManualAnnotations((prev) => prev.filter((_, i) => i !== index));
    toast.info('Anotación eliminada');
  }, []);

  // Manual location from map (when image has no EXIF GPS)
  const handleManualLocation = useCallback((coords: { lat: number; lon: number }) => {
    setLocation({ lat: coords.lat, lon: coords.lon });
  }, []);

  // Generate PDF (includes both AI + manual — uses annotated canvas image)
  const handleGeneratePDF = useCallback(() => {
    if (!preview || allDetections.length === 0) return;

    // Grab the canvas with all detections/annotations drawn
    const annotatedSrc = canvasRef.current?.toAnnotatedDataURL() ?? preview;

    generateDetectionPDF({
      imageSrc: annotatedSrc,
      detections: allDetections,
      location: location ? { lat: location.lat, lon: location.lon } : null,
      dateTime: location?.dateTime,
      fileName: currentFile?.name,
    });

    toast.success('Reporte PDF generado');
  }, [preview, allDetections, location, currentFile]);

  // Save report (AI + manual combined — uploads annotated image with bounding boxes)
  const handleSaveReport = useCallback(async () => {
    if (!currentFile || allDetections.length === 0) return;

    setIsSavingReport(true);
    try {
      // 1. Get annotated canvas image as JPEG (compressed to stay under Vercel 4.5MB body limit)
      let fileForUpload: File | Blob | null = null;
      const annotatedBlob = await canvasRef.current?.toAnnotatedBlob();
      if (annotatedBlob && annotatedBlob.size <= 4_000_000) {
        fileForUpload = new File(
          [annotatedBlob],
          currentFile.name.replace(/\.\w+$/, '-annotated.jpg'),
          { type: 'image/jpeg' },
        );
      }
      // Fallback to original optimized image if canvas JPEG is still too large
      if (!fileForUpload) {
        fileForUpload = apiReadyFile ?? currentFile;
      }

      const uploaded = await uploadReportImage(fileForUpload as File);
      const topDetection = allDetections.reduce(
        (best, curr) => (curr.confidence > best.confidence ? curr : best),
        allDetections[0],
      );
      const maxConfidence = topDetection?.confidence ?? 0;

      const hasAi = aiDetections.length > 0;
      const hasManual = manualAnnotations.length > 0;
      const sourceLabel = hasAi && hasManual ? 'IA + Manual' : hasAi ? 'IA' : 'Manual';

      // Build description: user comment + auto-generated summary
      const autoDesc = `Reporte EcoScan (${sourceLabel}): ${allDetections.length} detecciones (${aiDetections.length} IA, ${manualAnnotations.length} manuales).`;
      const fullDesc = userComment.trim()
        ? `${userComment.trim()}\n\n${autoDesc}`
        : autoDesc;

      await createReport({
        titulo: `Detección ${sourceLabel}: ${topDetection?.class || 'contaminacion'}`,
        lat: location?.lat ?? 29.072967,
        lon: location?.lon ?? -110.955919,
        gravedad: maxConfidence >= 0.85 ? 'alto' : maxConfidence >= 0.6 ? 'medio' : 'bajo',
        descripcion: fullDesc,
        tipoEvento: 'contaminacion',
        medio: 'ciudadano',
        imagen: uploaded.url,
        fotoBlobKey: uploaded.blobKey || undefined,
        fotoMime: uploaded.mime,
        fotoSizeBytes: uploaded.size,
        tipoReporte: 'ciudadano',
        detectadoAi: hasAi,
        aiConfidence: hasAi ? maxConfidence : undefined,
        aiModel: hasAi ? 'visual-pollution-detection-04jk5/3' : undefined,
        aiResultJson: { detections: allDetections },
        status: 'enviado',
      });

      toast.success('Reporte guardado en la base de datos');
      setUserComment('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error al guardar reporte';
      toast.error(message);
    } finally {
      setIsSavingReport(false);
    }
  }, [apiReadyFile, currentFile, allDetections, aiDetections, manualAnnotations, location, userComment]);

  // Computed stats
  const avgConfidence = totalObjects > 0
    ? Math.round(allDetections.reduce((s, d) => s + d.confidence, 0) / totalObjects * 100)
    : 0;
  const contaminationIndex = totalObjects > 0
    ? Math.min(100, Math.round(avgConfidence * (Math.log2(totalObjects + 1) / Math.log2(10)) * 100))
    : 0;

  // Severity
  const severity = contaminationIndex >= 70 ? 'alto' : contaminationIndex >= 40 ? 'medio' : 'bajo';
  const severityConfig = {
    alto: { label: 'Alto', color: 'text-red-600', bg: 'bg-red-100', ring: 'ring-red-200' },
    medio: { label: 'Medio', color: 'text-amber-600', bg: 'bg-amber-100', ring: 'ring-amber-200' },
    bajo: { label: 'Bajo', color: 'text-emerald-600', bg: 'bg-emerald-100', ring: 'ring-emerald-200' },
  }[severity];

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12">
      <div className="container mx-auto px-6">

        {/* Hero Header */}
        <div className="text-center mb-12 reveal">
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-6 py-3 shadow-xl border border-green-100 gradient-border mb-6">
            <StockIcon name="camera" className="w-6 h-6" />
            <span className="font-bold text-xl text-gray-800">EcoScan</span>
            <div className="h-5 w-px bg-gray-300" />
            <span className="text-sm font-medium text-emerald-600">Detector IA + Manual</span>
          </div>
          <h1 className="font-black text-4xl md:text-6xl mb-4 leading-tight">
            <span className="bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent text-shimmer">
              Detección Inteligente
            </span>
            <br />
            <span className="text-2xl md:text-4xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              de Contaminación Visual
            </span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-6">
            Usa <strong className="text-green-600">inteligencia artificial</strong> para detectar contaminación automáticamente,
            o <strong className="text-emerald-600">dibuja tus propias anotaciones</strong> directamente sobre la imagen.
          </p>

          {/* How it works steps */}
          <div className="max-w-4xl mx-auto grid grid-cols-4 gap-3 reveal">
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-sm">1</div>
              <span className="text-sm text-gray-600 font-medium text-center">Sube una foto</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-sm">2</div>
              <span className="text-sm text-gray-600 font-medium text-center">IA detecta objetos</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-sm">3</div>
              <span className="text-sm text-gray-600 font-medium text-center">Dibuja lo que veas</span>
            </div>
            <div className="flex flex-col items-center gap-2 p-3">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-sm">4</div>
              <span className="text-sm text-gray-600 font-medium text-center">Genera un reporte</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-7xl mx-auto">

          {/* Left Column: Upload & Controls */}
          <div className="space-y-6">

            {/* Upload Zone Card */}
            <div className="card p-8 reveal">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm">
                  <StockIcon name="upload" className="w-5 h-5" />
                </div>
                Subir Fotografía
              </h3>
              <ImageUpload onFileSelect={handleFileSelect} preview={null} />
              {currentFile && (
                <div className="mt-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <StockIcon name="document" className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-green-800 truncate">{currentFile.name}</p>
                      <p className="text-sm text-green-600">
                        {formatMb(currentFile.size)}
                        {apiReadyFile && apiReadyFile.size < currentFile.size && (
                          <span className="text-emerald-700 ml-2">
                            (optimizado: {formatMb(apiReadyFile.size)})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Control Panel Card */}
            <div className="card p-8 reveal">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-xl shadow-sm">
                  <StockIcon name="target" className="w-5 h-5" />
                </div>
                Control de Análisis
              </h3>

              <div className="space-y-4">
                {/* Dual action buttons: AI + Manual */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleDetect}
                    disabled={!currentFile || isAnalyzing || isPreparingFile}
                    className="hero-cta-primary disabled:opacity-50 disabled:cursor-not-allowed group text-sm py-3"
                  >
                    <span className="relative z-10 inline-flex items-center gap-2">
                      {isPreparingFile ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Preparando...
                        </>
                      ) : isAnalyzing ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <StockIcon name="lab" className="w-4 h-4" />
                          Detector IA
                        </>
                      )}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      if (!preview) {
                        toast.info('Primero sube una imagen');
                        return;
                      }
                      setDrawMode(!drawMode);
                      if (pendingBox) setPendingBox(null);
                    }}
                    disabled={!currentFile}
                    className={`text-sm py-3 rounded-xl font-semibold transition-all border-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      drawMode
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-lg shadow-emerald-500/25'
                        : 'bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50 hover:border-emerald-400'
                    }`}
                  >
                    {drawMode ? (
                      <span className="inline-flex items-center gap-2">
                        <StockIcon name="target" className="w-4 h-4 animate-pulse" /> Dibujando...
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2">
                        <StockIcon name="target" className="w-4 h-4" /> Anotar Manual
                      </span>
                    )}
                  </button>
                </div>

                {/* Draw mode instructions */}
                {drawMode && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800 animate-in fade-in slide-in-from-top-1">
                    <p className="font-semibold mb-1">Modo Anotación Manual activo</p>
                    <p className="text-emerald-600">
                      Haz <strong>clic y arrastra</strong> sobre la imagen para dibujar un recuadro alrededor de lo que detectaste.
                      Luego selecciona la categoría.
                    </p>
                  </div>
                )}

                {/* Progress Bar */}
                {(isAnalyzing || analyzeProgress === 100) && (
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${analyzeProgress}%` }}
                    />
                  </div>
                )}

                {/* Status Badge */}
                <div className={`status-badge ${isAnalyzing ? 'loading' : analysisError ? 'error' : totalObjects > 0 ? 'success' : 'info'}`}>
                  {isPreparingFile
                    ? 'Optimizando imagen para evitar errores de tamaño...'
                    : isAnalyzing
                    ? 'Procesando con modelo de IA...'
                    : analysisError
                      ? `Error: ${analysisError}`
                      : totalObjects > 0
                        ? `${aiDetections.length} IA + ${manualAnnotations.length} manuales = ${totalObjects} detecciones`
                        : drawMode
                          ? 'Dibuja un recuadro sobre la imagen →'
                          : 'Listo — Analiza con IA o anota manualmente'}
                </div>
              </div>
            </div>

            {/* Results Stats Card */}
            <div className="card p-8 reveal">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-purple-100 to-violet-100 rounded-xl shadow-sm">
                  <StockIcon name="chart" className="w-5 h-5" />
                </div>
                Resultados del Análisis
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="text-3xl font-bold text-green-600 mb-1">{totalObjects}</div>
                  <div className="text-sm text-gray-600 font-medium">Total Detectados</div>
                  {totalObjects > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      IA {aiDetections.length} · Manual {manualAnnotations.length}
                    </div>
                  )}
                </div>
                <div className="text-center p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-100 transition-all hover:shadow-md hover:-translate-y-0.5">
                  <div className="text-3xl font-bold text-blue-600 mb-1">{avgConfidence}%</div>
                  <div className="text-sm text-gray-600 font-medium">Confianza Promedio</div>
                </div>
                <div className={`text-center p-5 rounded-xl border transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  totalObjects > 0 ? `${severityConfig.bg} ${severityConfig.ring} ring-1` : 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-100'
                }`}>
                  <div className={`text-3xl font-bold mb-1 ${totalObjects > 0 ? severityConfig.color : 'text-gray-400'}`}>
                    {totalObjects > 0 ? severityConfig.label : '—'}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">Nivel de Riesgo</div>
                </div>
              </div>

              {/* Contamination Index Bar */}
              {totalObjects > 0 && (
                <div className="mt-5 p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">Índice de Contaminación</span>
                    <span className={`font-bold ${severityConfig.color}`}>{contaminationIndex}%</span>
                  </div>
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${
                        contaminationIndex >= 70 ? 'bg-gradient-to-r from-red-400 to-red-600' :
                        contaminationIndex >= 40 ? 'bg-gradient-to-r from-amber-400 to-amber-600' :
                        'bg-gradient-to-r from-emerald-400 to-emerald-600'
                      }`}
                      style={{ width: `${contaminationIndex}%` }}
                    />
                  </div>
                </div>
              )}

              {totalObjects > 0 && (
                <div className="mt-6 space-y-4">
                  {/* User comments */}
                  <div>
                    <label htmlFor="userComment" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Comentarios del reporte
                    </label>
                    <textarea
                      id="userComment"
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      rows={3}
                      placeholder="Describe lo que observas: tipo de contaminación, nivel de riesgo, contexto del lugar, etc."
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none bg-gray-50 placeholder:text-gray-400"
                    />
                    <p className="text-xs text-gray-400 mt-1">Opcional — se incluirá en la descripción del reporte y en el PDF.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={handleGeneratePDF}
                      className="hero-cta-secondary text-sm py-3"
                    >
                      <StockIcon name="document" className="w-4 h-4 mr-2 inline" />
                      Generar PDF
                    </button>
                    <button
                      onClick={handleSaveReport}
                      disabled={isSavingReport || isAnalyzing || isPreparingFile}
                      className="hero-cta-primary text-sm py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="relative z-10 inline-flex items-center gap-2">
                        {isSavingReport ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Guardando...
                          </>
                        ) : (
                          <>
                            <StockIcon name="upload" className="w-4 h-4" />
                            Guardar Reporte
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual annotations list card */}
            {manualAnnotations.length > 0 && (
              <div className="card p-8 reveal">
                <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                  <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-green-100 rounded-xl shadow-sm">
                    <StockIcon name="target" className="w-5 h-5" />
                  </div>
                  Mis Anotaciones
                  <span className="ml-auto text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {manualAnnotations.length}
                  </span>
                </h3>
                <div className="space-y-2">
                  {manualAnnotations.map((ann, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 transition-all hover:shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-emerald-200 flex items-center justify-center text-xs font-bold text-emerald-800">
                          #{i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-emerald-800 capitalize">{ann.class}</p>
                          <p className="text-xs text-emerald-500">
                            {Math.round(ann.width)}×{Math.round(ann.height)}px
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveAnnotation(i)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar anotación"
                      >
                        <StockIcon name="close" className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => setManualAnnotations([])}
                    className="w-full mt-2 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl py-2 transition-colors"
                  >
                    Borrar todas las anotaciones
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Image Display & Map */}
          <div className="space-y-6">

            {/* Image Display Card with Interactive Canvas */}
            <div className="card p-8 reveal">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl shadow-sm">
                  <StockIcon name="eye" className="w-5 h-5" />
                </div>
                Imagen con Detecciones
                {totalObjects > 0 && (
                  <span className="ml-auto text-sm font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                    {totalObjects} detectado{totalObjects !== 1 ? 's' : ''}
                  </span>
                )}
              </h3>

              <div className="bg-gray-100 rounded-xl min-h-96 flex items-center justify-center overflow-hidden relative">
                {preview ? (
                  <AnnotationCanvas
                    ref={canvasRef}
                    imageSrc={preview}
                    aiDetections={aiDetections}
                    manualAnnotations={manualAnnotations}
                    imageSize={imageSize}
                    drawMode={drawMode}
                    onBoxDrawn={handleBoxDrawn}
                    onRemoveAnnotation={handleRemoveAnnotation}
                  />
                ) : (
                  <div className="text-center text-gray-400 py-12">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gray-200/80 mb-4">
                      <StockIcon name="camera" className="w-10 h-10 opacity-40" />
                    </div>
                    <p className="text-lg font-medium">La imagen aparecerá aquí</p>
                    <p className="text-sm mt-1">Las detecciones se mostrarán como cajas de colores</p>
                  </div>
                )}
              </div>

              {/* Label Picker — appears after drawing a box */}
              {pendingBox && (
                <div className="mt-4">
                  <LabelPicker
                    onSelect={handleLabelSelect}
                    onCancel={handleLabelCancel}
                  />
                </div>
              )}
            </div>

            {/* Map Card */}
            <div className="card p-8 reveal">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl shadow-sm">
                  <StockIcon name="pin" className="w-5 h-5" />
                </div>
                Ubicación
                {location && hasExif && (
                  <span className="ml-auto text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                    {location.lat.toFixed(4)}, {location.lon.toFixed(4)} (EXIF)
                  </span>
                )}
                {location && !hasExif && (
                  <span className="ml-auto text-xs font-mono text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    {location.lat.toFixed(4)}, {location.lon.toFixed(4)} (manual)
                  </span>
                )}
              </h3>
              <DetectionMap
                location={location}
                hasImage={!!preview}
                hasExif={hasExif}
                onLocationChange={handleManualLocation}
              />
            </div>

            {/* Results Detail Panel */}
            <div className="card p-8 reveal">
              <h3 className="font-bold text-2xl mb-6 flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-gray-100 to-slate-100 rounded-xl shadow-sm">
                  <StockIcon name="lab" className="w-5 h-5" />
                </div>
                Detalle de Detecciones
              </h3>
              <ResultsPanel
                detections={allDetections}
                isLoading={isAnalyzing}
                error={analysisError}
                manualStartIndex={aiDetections.length}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
