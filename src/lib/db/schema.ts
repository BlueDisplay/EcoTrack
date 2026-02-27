import {
  pgTable,
  text,
  doublePrecision,
  boolean,
  date,
  timestamp,
  index,
  jsonb,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  passwordHash: text('password_hash'),
  role: text('role').default('citizen'), // 'citizen' | 'admin' | 'authority'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// ─── Incidents (news-derived records) ───────────────────────────────────────

export const incidents = pgTable(
  'incidents',
  {
    id: text('id').primaryKey(),
    fechaEvento: date('fecha_evento').notNull(),
    fechaPublicacion: date('fecha_publicacion'),
    titulo: text('titulo').notNull(),
    medio: text('medio'),
    autora: text('autora'),
    urlNoticia: text('url_noticia').notNull().unique(),
    direccionDetectada: text('direccion_detectada'),
    colonia: text('colonia'),
    urlMaps: text('url_maps'),
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    mmLluviaReportados: doublePrecision('mm_lluvia_reportados'),
    afectacionesReportadas: text('afectaciones_reportadas'),
    gravedad: text('gravedad'), // 'bajo' | 'medio' | 'alto' | 'critico'
    notas: text('notas'),
    conaguaStationId: text('conagua_station_id'),
    status: text('status').default('atendido'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_incidents_fecha_evento').on(table.fechaEvento),
    index('idx_incidents_colonia').on(table.colonia),
    index('idx_incidents_station').on(table.conaguaStationId),
    index('idx_incidents_created').on(table.createdAt),
  ],
);

// ─── Reports (citizen submissions + mandatory photo + AI metadata) ─────────

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').references(() => users.id, { onDelete: 'set null' }),
    fechaEvento: date('fecha_evento'),
    titulo: text('titulo').notNull(),
    direccion: text('direccion'),
    colonia: text('colonia'),
    gravedad: text('gravedad'), // 'bajo' | 'medio' | 'alto' | 'critico'
    descripcion: text('descripcion'),
    mmLluvia: doublePrecision('mm_lluvia'),
    tipoEvento: text('tipo_evento').default('contaminacion'),
    medio: text('medio').default('ciudadano'),
    imagen: text('imagen').notNull(), // single required photo URL
    fotoBlobKey: text('foto_blob_key'),
    fotoMime: text('foto_mime'),
    fotoSizeBytes: doublePrecision('foto_size_bytes'),
    urlNoticia: text('url_noticia'),
    tipoReporte: text('tipo_reporte').default('ciudadano'),
    detectadoAi: boolean('detectado_ai').default(false),
    aiConfidence: doublePrecision('ai_confidence'),
    aiModel: text('ai_model'),
    aiResultJson: jsonb('ai_result_json'),
    status: text('status').default('enviado'), // 'enviado' | 'revision' | 'atendido'
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    conaguaStationId: text('conagua_station_id'),
    // geom column is managed via raw SQL migration (PostGIS)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_reports_colonia').on(table.colonia),
    index('idx_reports_status').on(table.status),
    index('idx_reports_user').on(table.userId),
    index('idx_reports_station').on(table.conaguaStationId),
    index('idx_reports_created').on(table.createdAt),
  ],
);

// ─── Rainfall (CONAGUA daily observations) ──────────────────────────────────

export const rainfallConagua = pgTable(
  'rainfall_conagua',
  {
    conaguaStationId: text('conagua_station_id').notNull(),
    fechaEvento: date('fecha_evento').notNull(),
    estacionNombre: text('estacion_nombre').notNull(),
    precipitacionMm: doublePrecision('precipitacion_mm').notNull(),
    evaporacionMm: doublePrecision('evaporacion_mm'),
    tempMaxC: doublePrecision('temp_max_c'),
    tempMinC: doublePrecision('temp_min_c'),
    lat: doublePrecision('lat'),
    lon: doublePrecision('lon'),
    fuenteUrl: text('fuente_url'),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    primaryKey({
      name: 'rainfall_conagua_pk',
      columns: [table.conaguaStationId, table.fechaEvento],
    }),
    index('idx_rainfall_fecha').on(table.fechaEvento),
    index('idx_rainfall_station').on(table.conaguaStationId),
  ],
);

// ─── Inferred types ─────────────────────────────────────────────────────────

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type Incident = typeof incidents.$inferSelect;
export type NewIncident = typeof incidents.$inferInsert;
export type RainfallConagua = typeof rainfallConagua.$inferSelect;
export type NewRainfallConagua = typeof rainfallConagua.$inferInsert;
export type User = typeof users.$inferSelect;

// ─── Constants ──────────────────────────────────────────────────────────────

export const REPORT_STATUS = ['enviado', 'revision', 'atendido'] as const;
export type ReportStatus = (typeof REPORT_STATUS)[number];

export const GRAVEDAD = ['bajo', 'medio', 'alto', 'critico'] as const;
export type Gravedad = (typeof GRAVEDAD)[number];

export const USER_ROLES = ['citizen', 'admin', 'authority'] as const;
export type UserRole = (typeof USER_ROLES)[number];
