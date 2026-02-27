import { z } from 'zod';

export const incidentSchema = z.object({
  id: z.string().min(1).optional(),
  fechaEvento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaPublicacion: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  titulo: z.string().min(1, 'El título es requerido'),
  medio: z.string().optional(),
  autora: z.string().optional(),
  urlNoticia: z.string().url('url_noticia debe ser una URL válida'),
  direccionDetectada: z.string().optional(),
  colonia: z.string().optional(),
  urlMaps: z.string().url().optional().or(z.literal('')),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  mmLluviaReportados: z.number().min(0).optional(),
  afectacionesReportadas: z.string().optional(),
  gravedad: z.enum(['bajo', 'medio', 'alto', 'critico']).optional(),
  notas: z.string().optional(),
  conaguaStationId: z.string().optional(),
  status: z.enum(['enviado', 'revision', 'atendido']).default('atendido'),
});

export type IncidentFormData = z.infer<typeof incidentSchema>;
