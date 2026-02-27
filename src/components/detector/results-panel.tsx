'use client';

import type { Detection } from '@/lib/api/analyze';
import { StockIcon } from '@/components/ui/stock-icon';

interface ResultsPanelProps {
  detections: Detection[];
  isLoading: boolean;
  error: string | null;
  /** Optional: indices of detections that are manual (user-drawn) */
  manualStartIndex?: number;
}

const CLASS_LABELS: Record<string, string> = {
  plastic: 'Plástico',
  tire: 'Neumático',
  debris: 'Escombro',
  basura: 'Basura / Plástico',
  escombro: 'Escombro',
  'agua estancada': 'Agua Estancada',
  contaminacion: 'Contaminación',
  otro: 'Otro',
  default: 'Objeto',
};

const CLASS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  plastic: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  tire: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  debris: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  basura: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  escombro: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'agua estancada': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  contaminacion: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  otro: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
  default: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
};

export function ResultsPanel({
  detections,
  isLoading,
  error,
  manualStartIndex,
}: ResultsPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mb-4">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-gray-700 font-medium">Analizando imagen con IA...</p>
        <p className="text-gray-400 text-sm mt-1">Esto puede tomar unos segundos</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-5 border border-red-200">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-red-100 rounded-lg flex-shrink-0 mt-0.5">
            <StockIcon name="shield" className="w-4 h-4 text-red-600" />
          </div>
          <div>
            <p className="text-red-700 font-medium">Error en detección</p>
            <p className="text-red-500 text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (detections.length === 0) {
    return (
      <div className="rounded-xl p-8 text-center text-gray-400">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gray-100 mb-4">
          <StockIcon name="eye" className="w-7 h-7 opacity-40" />
        </div>
        <p className="font-medium">Sin detecciones aún</p>
        <p className="text-sm mt-1">Sube una imagen y analízala con IA</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Detection List */}
      <div className="space-y-2">
        {detections.map((det, i) => {
          const classColors = CLASS_COLORS[det.class] || CLASS_COLORS.default;
          const isManual = manualStartIndex !== undefined && i >= manualStartIndex;
          return (
            <div
              key={i}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all hover:shadow-sm hover:-translate-y-px ${classColors.bg} ${classColors.border}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${classColors.text} bg-white/80`}>
                  #{i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${classColors.text}`}>
                      {CLASS_LABELS[det.class] || det.class}
                    </p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isManual
                        ? 'bg-emerald-200 text-emerald-800'
                        : 'bg-cyan-200 text-cyan-800'
                    }`}>
                      {isManual ? '✏️ MANUAL' : '🤖 IA'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400">
                    {Math.round(det.width)}x{Math.round(det.height)}px
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2 h-2 rounded-full ${
                    det.confidence > 0.8 ? 'bg-emerald-500' : det.confidence > 0.5 ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <p className={`text-sm font-bold ${
                    det.confidence > 0.8
                      ? 'text-emerald-600'
                      : det.confidence > 0.5
                        ? 'text-amber-600'
                        : 'text-red-500'
                  }`}>
                    {(det.confidence * 100).toFixed(1)}%
                  </p>
                </div>
                <p className="text-xs text-gray-400">confianza</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-sm">
        <span className="text-gray-500 font-medium">
          {detections.length} objeto{detections.length !== 1 ? 's' : ''} detectado{detections.length !== 1 ? 's' : ''}
        </span>
        <span className="text-gray-500">
          Promedio:{' '}
          <span className="font-semibold text-gray-700">
            {(
              (detections.reduce((sum, d) => sum + d.confidence, 0) /
                detections.length) *
              100
            ).toFixed(1)}%
          </span>
        </span>
      </div>
    </div>
  );
}
