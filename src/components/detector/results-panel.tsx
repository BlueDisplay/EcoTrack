'use client';

import type { Detection } from '@/lib/api/analyze';
import { StockIcon } from '@/components/ui/stock-icon';

interface ResultsPanelProps {
  detections: Detection[];
  isLoading: boolean;
  error: string | null;
}

const CLASS_LABELS: Record<string, string> = {
  plastic: 'Plástico',
  tire: 'Neumático',
  debris: 'Escombro',
  default: 'Objeto',
};

export function ResultsPanel({
  detections,
  isLoading,
  error,
}: ResultsPanelProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
        <p className="text-gray-600 text-sm">Analizando imagen con IA...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 rounded-xl p-4 border border-red-200">
        <p className="text-red-700 text-sm font-medium">Error en detección</p>
        <p className="text-red-500 text-xs mt-1">{error}</p>
      </div>
    );
  }

  if (detections.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700">
          Resultados de Detección
        </h3>
      </div>

      <div className="space-y-2">
        {detections.map((det, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3">
              <span className="inline-flex">
                {det.class === 'tire' ? (
                  <StockIcon name="target" className="w-5 h-5" />
                ) : det.class === 'plastic' ? (
                  <StockIcon name="document" className="w-5 h-5" />
                ) : (
                  <StockIcon name="lab" className="w-5 h-5" />
                )}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {CLASS_LABELS[det.class] || det.class}
                </p>
                <p className="text-xs text-gray-400">
                  Pos: ({Math.round(det.x)}, {Math.round(det.y)}) — {Math.round(det.width)}×
                  {Math.round(det.height)}px
                </p>
              </div>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-bold ${
                  det.confidence > 0.8
                    ? 'text-emerald-600'
                    : det.confidence > 0.5
                      ? 'text-amber-600'
                      : 'text-red-500'
                }`}
              >
                {(det.confidence * 100).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-400">confianza</p>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-between text-xs text-gray-500">
        <span>Total: {detections.length} objetos</span>
        <span>
          Promedio:{' '}
          {(
            (detections.reduce((sum, d) => sum + d.confidence, 0) /
              detections.length) *
            100
          ).toFixed(1)}
          % confianza
        </span>
      </div>
    </div>
  );
}
