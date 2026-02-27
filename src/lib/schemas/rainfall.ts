import { z } from 'zod';

export const rainfallRecordSchema = z.object({
  conaguaStationId: z.string().min(1, 'conaguaStationId es requerido'),
  fechaEvento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  estacionNombre: z.string().min(1, 'estacionNombre es requerido'),
  precipitacionMm: z.number().min(0),
  evaporacionMm: z.number().optional(),
  tempMaxC: z.number().optional(),
  tempMinC: z.number().optional(),
  lat: z.number().min(-90).max(90).optional(),
  lon: z.number().min(-180).max(180).optional(),
  fuenteUrl: z.string().url().optional().or(z.literal('')),
});

export type RainfallRecordFormData = z.infer<typeof rainfallRecordSchema>;
