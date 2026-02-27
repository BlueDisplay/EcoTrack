import { Suspense } from 'react';
import { loadBestAvailableRainData } from '@/lib/data/csv-loader';
import { computeHistoricalStats } from '@/lib/data/historical-stats';
import { HistoricalClient } from './historical-client';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export const revalidate = 3600; // ISR: revalidate every hour

export const metadata = {
  title: 'Historial Meteorológico — EcoTrack',
  description: 'Datos históricos de precipitación pluvial en Hermosillo, Sonora.',
};

async function HistoricalData() {
  const { records: rawData, source } = await loadBestAvailableRainData();
  if (rawData.length === 0) {
    const message = source === 'neon_db'
      ? 'La tabla `rainfall_conagua` en Neon no tiene registros. Las gráficas históricas no se muestran hasta cargar datos.'
      : 'No se pudieron cargar datos de lluvia desde las fuentes configuradas.';

    return (
      <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 text-sm">
        {message}
      </div>
    );
  }

  const stats = computeHistoricalStats(rawData);

  return <HistoricalClient data={rawData} stats={stats} source={source} />;
}

export default function HistoricoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Historial Meteorológico
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Datos históricos de precipitación pluvial — Hermosillo, Sonora
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <HistoricalData />
      </Suspense>
    </div>
  );
}
