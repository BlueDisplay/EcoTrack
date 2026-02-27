import { z } from 'zod';

// ─── Report creation schema ────────────────────────────────────────────────
// Used both server-side (API validation) and client-side (form validation)

export const reportSchema = z.object({
  userId: z.string().min(1).optional(),
  titulo: z.string().min(1, 'El título es requerido'),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  fechaEvento: z.string().optional(),
  direccion: z.string().optional(),
  colonia: z.string().optional(),
  gravedad: z.enum(['bajo', 'medio', 'alto', 'critico']).optional(),
  descripcion: z.string().optional(),
  mmLluvia: z.number().min(0).optional(),
  tipoEvento: z.string().optional(),
  medio: z.string().optional(),
  imagen: z.string().url('La foto debe ser una URL válida'),
  fotoBlobKey: z.string().optional(),
  fotoMime: z.string().optional(),
  fotoSizeBytes: z.number().min(0).optional(),
  urlNoticia: z.string().url().optional().or(z.literal('')),
  tipoReporte: z.string().default('ciudadano'),
  detectadoAi: z.boolean().default(false),
  aiConfidence: z.number().min(0).max(1).optional(),
  aiModel: z.string().optional(),
  aiResultJson: z.unknown().optional(),
  conaguaStationId: z.string().optional(),
  status: z.enum(['enviado', 'revision', 'atendido']).default('enviado'),
});

export type ReportFormData = z.infer<typeof reportSchema>;
