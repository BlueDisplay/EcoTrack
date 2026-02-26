import {
  pgTable,
  text,
  doublePrecision,
  boolean,
  date,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';

// ─── Reports ────────────────────────────────────────────────────────────────

export const reports = pgTable(
  'reports',
  {
    id: text('id').primaryKey(), // 'rep-<uuid>'
    fechaEvento: date('fecha_evento'),
    titulo: text('titulo').notNull(),
    direccion: text('direccion'),
    colonia: text('colonia'),
    gravedad: text('gravedad'), // 'bajo' | 'medio' | 'alto' | 'critico'
    descripcion: text('descripcion'),
    mmLluvia: doublePrecision('mm_lluvia'),
    tipoEvento: text('tipo_evento'),
    medio: text('medio'),
    imagen: text('imagen'),
    urlNoticia: text('url_noticia'),
    tipoReporte: text('tipo_reporte').default('ciudadano'),
    detectadoAi: boolean('detectado_ai').default(false),
    aiConfidence: doublePrecision('ai_confidence'),
    status: text('status').default('enviado'), // 'enviado' | 'revision' | 'atendido'
    lat: doublePrecision('lat').notNull(),
    lon: doublePrecision('lon').notNull(),
    // geom column is managed via raw SQL migration (PostGIS)
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
  },
  (table) => [
    index('idx_reports_colonia').on(table.colonia),
    index('idx_reports_status').on(table.status),
    index('idx_reports_created').on(table.createdAt),
  ],
);

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

// ─── Inferred types ─────────────────────────────────────────────────────────

export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type User = typeof users.$inferSelect;

// ─── Constants ──────────────────────────────────────────────────────────────

export const REPORT_STATUS = ['enviado', 'revision', 'atendido'] as const;
export type ReportStatus = (typeof REPORT_STATUS)[number];

export const GRAVEDAD = ['bajo', 'medio', 'alto', 'critico'] as const;
export type Gravedad = (typeof GRAVEDAD)[number];

export const USER_ROLES = ['citizen', 'admin', 'authority'] as const;
export type UserRole = (typeof USER_ROLES)[number];
