import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Loading() {
  return (
    <div className="h-[calc(100dvh-3.5rem)] flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Cargando EcoTrack...</p>
      </div>
    </div>
  );
}
