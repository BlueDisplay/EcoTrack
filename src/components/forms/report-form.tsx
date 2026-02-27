'use client';

import { useState } from 'react';
import type { ReportFormData } from '@/lib/schemas/report';
import { createReport } from '@/lib/api/reports';
import { uploadReportImage } from '@/lib/storage/upload';

interface ReportFormProps {
  lat: number;
  lon: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ReportForm({ lat, lon, onSuccess, onCancel }: ReportFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const photo = formData.get('foto') as File | null;

    if (!photo || photo.size === 0) {
      setError('La foto del incidente es obligatoria');
      setIsSubmitting(false);
      return;
    }

    try {
      const uploaded = await uploadReportImage(photo);

      const data: ReportFormData = {
        titulo: formData.get('titulo') as string,
        lat,
        lon,
        colonia: (formData.get('colonia') as string) || undefined,
        direccion: (formData.get('direccion') as string) || undefined,
        gravedad: (formData.get('gravedad') as ReportFormData['gravedad']) || undefined,
        descripcion: (formData.get('descripcion') as string) || undefined,
        tipoEvento: (formData.get('tipoEvento') as string) || undefined,
        medio: 'ciudadano',
        imagen: uploaded.url,
        fotoBlobKey: uploaded.blobKey || undefined,
        fotoMime: uploaded.mime,
        fotoSizeBytes: uploaded.size,
        tipoReporte: 'ciudadano',
        detectadoAi: false,
        status: 'enviado',
      };

      await createReport(data as Record<string, unknown>);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear reporte');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-bold text-gray-800">Nuevo Reporte</h3>
        <button
          type="button"
          onClick={onCancel}
          className="p-1 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Cancelar"
        >
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Location preview */}
      <div className="bg-gray-50 rounded-lg p-3">
        <p className="text-xs text-gray-500 font-medium">Ubicación seleccionada</p>
        <p className="text-xs text-gray-600 font-mono">
          {lat.toFixed(6)}, {lon.toFixed(6)}
        </p>
      </div>

      {/* Title */}
      <div>
        <label htmlFor="titulo" className="block text-sm font-medium text-gray-700 mb-1">
          Título *
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          minLength={3}
          placeholder="Ej: Acumulación de basura en canal"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Colonia */}
      <div>
        <label htmlFor="colonia" className="block text-sm font-medium text-gray-700 mb-1">
          Colonia
        </label>
        <input
          id="colonia"
          name="colonia"
          placeholder="Ej: Centro, Villa de Seris"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Dirección */}
      <div>
        <label htmlFor="direccion" className="block text-sm font-medium text-gray-700 mb-1">
          Dirección
        </label>
        <input
          id="direccion"
          name="direccion"
          placeholder="Ej: Blvd. Rosales y Calle Yáñez"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        />
      </div>

      {/* Severity */}
      <div>
        <label htmlFor="gravedad" className="block text-sm font-medium text-gray-700 mb-1">
          Gravedad
        </label>
        <select
          id="gravedad"
          name="gravedad"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        >
          <option value="">Seleccionar...</option>
          <option value="bajo">🟢 Bajo</option>
          <option value="medio">🟡 Medio</option>
          <option value="alto">🟠 Alto</option>
          <option value="critico">🔴 Crítico</option>
        </select>
      </div>

      {/* Event type */}
      <div>
        <label htmlFor="tipoEvento" className="block text-sm font-medium text-gray-700 mb-1">
          Tipo de Evento
        </label>
        <select
          id="tipoEvento"
          name="tipoEvento"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
        >
          <option value="">Seleccionar...</option>
          <option value="contaminacion">Contaminación / Basura</option>
          <option value="inundacion">Inundación</option>
          <option value="deslizamiento">Deslizamiento</option>
          <option value="sequia">Sequía</option>
          <option value="otro">Otro</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium text-gray-700 mb-1">
          Descripción
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          placeholder="Describe la situación con detalle..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none resize-none"
        />
      </div>

      {/* Mandatory photo */}
      <div>
        <label htmlFor="foto" className="block text-sm font-medium text-gray-700 mb-1">
          Foto del incidente *
        </label>
        <input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required
          className="w-full text-sm text-gray-700 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:text-emerald-700 hover:file:bg-emerald-100"
        />
        <p className="text-xs text-gray-500 mt-1">
          Obligatorio para validar el reporte. Formatos: JPG, PNG, WebP (max 10 MB).
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Enviando...' : 'Enviar Reporte'}
        </button>
      </div>
    </form>
  );
}
