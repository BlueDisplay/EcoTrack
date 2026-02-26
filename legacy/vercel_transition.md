# EcoTrack: Plan de Migración a Next.js + Vercel

**Versión:** 1.0
**Fecha:** Febrero 2026
**Estado:** Planificación
**Autor:** Equipo EcoTrack

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Inventario del Sistema Actual](#2-inventario-del-sistema-actual)
3. [Stack Objetivo](#3-stack-objetivo)
4. [Arquitectura Objetivo](#4-arquitectura-objetivo)
5. [Mapeo Archivo por Archivo](#5-mapeo-archivo-por-archivo)
6. [Schema de Base de Datos (Drizzle)](#6-schema-de-base-de-datos-drizzle)
7. [API Routes (Next.js)](#7-api-routes-nextjs)
8. [Componentes React](#8-componentes-react)
9. [Manejo de Datos Estáticos](#9-manejo-de-datos-estáticos)
10. [Autenticación](#10-autenticación)
11. [Infraestructura Vercel](#11-infraestructura-vercel)
12. [Plan de Ejecución por Fases](#12-plan-de-ejecución-por-fases)
13. [Comandos Paso a Paso](#13-comandos-paso-a-paso)
14. [Riesgos y Mitigación](#14-riesgos-y-mitigación)
15. [Checklist de Validación](#15-checklist-de-validación)

---

## 1. Resumen Ejecutivo

### Qué tenemos hoy

- Frontend: HTML + CSS + JS vanilla (8,562 líneas en 6 archivos JS + 2,729 líneas CSS)
- Backend: Python FastAPI (383 líneas) sirviendo estáticos + API REST
- Base de datos: PostgreSQL + PostGIS en Railway
- IA: Roboflow API vía proxy server-side
- Deploy: Railway (Nixpacks, monorepo)

### Qué queremos

- Framework: Next.js 15 (App Router, React Server Components)
- Base de datos: Neon PostgreSQL (serverless, PostGIS compatible)
- ORM: Drizzle ORM (type-safe, migraciones SQL)
- Deploy: Vercel (zero-config, preview deploys, edge functions)
- Auth: NextAuth.js v5 (Auth.js)
- Storage: Vercel Blob (imágenes de reportes)

### Por qué migrar

| Problema actual | Solución con Next.js + Vercel |
|---|---|
| `app.js` monolítico de 116KB / 3,270 líneas | Componentes React modulares con code-splitting automático |
| Sin bundler ni minificación | Next.js con Turbopack: tree-shaking, minificación, lazy loading |
| Sin type safety | TypeScript end-to-end (DB → API → UI) |
| Railway: cold starts de contenedor completo | Vercel: serverless functions con ~50ms cold start |
| Sin preview deployments | Cada PR genera un deploy de preview automático |
| CSS monolítico de 2,729 líneas | Tailwind CSS v4 con purge automático |
| Sin tests | Vitest + Testing Library integrados |
| FastAPI sirve estáticos manualmente | Next.js: SSR/SSG/ISR nativos |

---

## 2. Inventario del Sistema Actual

### Archivos JavaScript

| Archivo | Líneas | Responsabilidad | Objetos globales |
|---|---|---|---|
| `app.js` | 3,270 | Mapa, datos CSV, marcadores, gráficas, estado global | `AppState`, `Utils`, `DataManager`, `MapManager`, `ChartManager`, `MobileManager` |
| `detector.js` | 796 | Detector IA (EcoScan), EXIF, bounding boxes, PDF | `CONFIG`, `currentFile`, `detections`, `detectionMap` |
| `ui.js` | 533 | Templates HTML, paneles, popups, detalles de incidente | `UITemplates`, `UIManager` |
| `main.js` | 481 | Coordinador: inicializa módulos en orden, chart controls | Funciones sueltas: `setupChartControls`, `setupPeriodicUpdates` |
| `historical.js` | 382 | Datos históricos CONAGUA, parseo CSV, gráficas | `HistoricalDataManager` |
| `forms.js` | 371 | Formulario de nuevo reporte, click en mapa, submit | `FormManager` |

### Archivos HTML

| Archivo | Líneas | Descripción |
|---|---|---|
| `index.html` | 1,059 | Página principal: mapa + sidebar + paneles de stats |
| `detector.html` | 528 | EcoScan: upload de imagen + canvas + mapa de detección |

### CSS

| Archivo | Líneas | Descripción |
|---|---|---|
| `styles.css` | 2,729 | Todo el CSS: layout, componentes, animaciones, responsive, glassmorphism |

### Datos estáticos

| Archivo | Tamaño | Descripción |
|---|---|---|
| `eventos_hidro.csv` | 7.5 KB | 12 eventos hidrometeorológicos 2025 con coordenadas |
| `hermosillo_lluvias_historicas.csv` | 182 KB | Precipitaciones CONAGUA 1966-2024 |
| `hermosillo_historico_completo.csv` | 1.8 MB | Dataset completo CONAGUA |
| `incidents.json` | 864 B | Reportes ciudadanos legacy |
| `IMG_6701.JPG` | 7.5 MB | Imagen ejemplo |
| `AGEB-Municipio.geojson` | 787 KB | Límites municipales |
| `AGEB-Rurales.geojson` | 1.5 MB | AGEB rurales |
| `AGEB-Urbanas.geojson` | 1.5 MB | AGEB urbanas |

### Backend (FastAPI)

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/health` | GET | Status del sistema |
| `/api/analyze` | POST | Proxy a Roboflow (multipart/form-data) |
| `/api/reports` | GET | Listar reportes (PostGIS → JSON) |
| `/api/reports` | POST | Crear reporte (JSON → PostGIS) |
| `/` | GET | Sirve `index.html` |
| `/detector.html` | GET | Sirve detector |
| `/sw.js` | GET | Service Worker |
| `/assets/*` | GET | Archivos estáticos |
| `/GeoJSON/*` | GET | Archivos GeoJSON |

### Service Worker

- Cache-first strategy para assets estáticos
- 75 líneas, versión `ecotrack-v1`

---

## 3. Stack Objetivo

### Dependencias de producción

```json
{
  "dependencies": {
    "next": "^15.1",
    "react": "^19.0",
    "react-dom": "^19.0",
    "typescript": "^5.7",

    "drizzle-orm": "^0.38",
    "@neondatabase/serverless": "^0.10",

    "next-auth": "^5.0.0-beta",

    "@vercel/blob": "^0.27",

    "react-leaflet": "^5.0",
    "leaflet": "^1.9",

    "recharts": "^2.15",

    "zod": "^3.24",

    "tailwindcss": "^4.0",

    "exif-js": "^2.3",
    "jspdf": "^2.5",
    "papaparse": "^5.4"
  }
}
```

### Dependencias de desarrollo

```json
{
  "devDependencies": {
    "drizzle-kit": "^0.30",
    "@types/leaflet": "^1.9",
    "@types/react": "^19.0",
    "@types/node": "^22",
    "vitest": "^3.0",
    "@testing-library/react": "^16",
    "eslint": "^9",
    "eslint-config-next": "^15.1"
  }
}
```

---

## 4. Arquitectura Objetivo

### Diagrama de alto nivel

```
┌────────────────────────────────────────────────────────────┐
│                        VERCEL                               │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │              Next.js 15 (App Router)                   │ │
│  │                                                        │ │
│  │  app/                                                  │ │
│  │  ├── page.tsx .............. Mapa principal (SSR)      │ │
│  │  ├── detector/page.tsx .... EcoScan (Client)          │ │
│  │  ├── historico/page.tsx ... Datos CONAGUA (SSG/ISR)   │ │
│  │  ├── admin/page.tsx ....... Dashboard (Protected)     │ │
│  │  │                                                     │ │
│  │  └── api/                                              │ │
│  │      ├── analyze/route.ts . Proxy Roboflow            │ │
│  │      ├── reports/route.ts . CRUD reportes             │ │
│  │      └── health/route.ts .. Health check              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Vercel Blob  │  │ Vercel KV    │  │ Edge Middleware  │  │
│  │ (imágenes)   │  │ (rate limit) │  │ (auth guard)    │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└──────────────┬──────────────────┬──────────────────────────┘
               │                  │
        ┌──────┴──────┐    ┌──────┴──────┐
        │   Neon DB   │    │  Roboflow   │
        │  PostgreSQL │    │  API (IA)   │
        │  + PostGIS  │    └─────────────┘
        │ (serverless)│
        └─────────────┘
```

### Flujo de renderizado por página

| Página | Estrategia | Justificación |
|---|---|---|
| `/` (mapa) | SSR + Client Components | El mapa (Leaflet) es 100% client-side. Los datos iniciales se cargan en el server. |
| `/detector` | Client Component | Upload de archivos, canvas, EXIF — todo requiere DOM |
| `/historico` | ISR (revalidate: 86400) | Datos CONAGUA son estáticos — se regeneran cada 24h |
| `/admin` | SSR + Protected | Requiere auth, datos en tiempo real |
| `/api/*` | Serverless Functions | Lógica de backend pura |

---

## 5. Mapeo Archivo por Archivo

### `app.js` (3,270 líneas) → Se descompone en ~15 archivos

| Objeto global actual | Archivo Next.js destino | Tipo |
|---|---|---|
| `AppState` | `lib/store.ts` (Zustand o Context) | Estado global React |
| `Utils.showNotification` | `components/ui/toast.tsx` | Client Component (o usar `sonner`) |
| `Utils.formatDate` / helpers | `lib/utils.ts` | Funciones puras |
| `Utils.animateCounter` | `components/ui/animated-counter.tsx` | Client Component |
| `Utils.setCache` / `getCache` | Eliminar — Next.js maneja cache con ISR/SWR | N/A |
| `DataManager.loadCSVData` | `lib/data/csv-loader.ts` | Server action o utility |
| `DataManager.parseCSV` | Reemplazar con `papaparse` | Librería |
| `DataManager.convertCSVToIncidents` | `lib/data/transforms.ts` | Función pura |
| `DataManager.loadCitizenReports` | `lib/api/reports.ts` → `fetch('/api/reports')` | API client |
| `MapManager.initialize` | `components/map/map-container.tsx` | Client Component (react-leaflet) |
| `MapManager.addIncidentToMap` | `components/map/incident-marker.tsx` | Client Component |
| `MapManager.addCitizenReportToMap` | `components/map/report-marker.tsx` | Client Component |
| `MapManager.getIconBySeverity` | `lib/map/icons.ts` | Utility |
| `MapManager.loadAGEBLayer` | `components/map/ageb-layer.tsx` | Client Component |
| `MapManager.setupSearchControls` | `components/map/search-control.tsx` | Client Component |
| `ChartManager.updateCharts` | `components/charts/severity-chart.tsx` | Client Component (Recharts) |
| `ChartManager.updateTemporalChart` | `components/charts/temporal-chart.tsx` | Client Component |
| `MobileManager` | Responsive design nativo + `components/layout/mobile-nav.tsx` | Client Component |

### `detector.js` (796 líneas) → 5 archivos

| Función actual | Archivo Next.js destino | Notas |
|---|---|---|
| `init()` + event listeners | `app/detector/page.tsx` | Página del detector |
| `handleImageSelect` | `components/detector/image-upload.tsx` | Drag & drop + file input |
| `runDetection` + `CONFIG.API_URL` | `components/detector/detection-engine.tsx` + `lib/api/analyze.ts` | Client component + API client |
| `drawDetections` (canvas) | `components/detector/detection-canvas.tsx` | Client Component con `useRef` |
| `extractEXIFData` | `lib/exif/extract.ts` | Utility (usa `exif-js`) |
| `generateReport` (PDF) | `components/detector/pdf-report.tsx` + `lib/pdf/generate.ts` | Client Component (usa `jspdf`) |
| `initializeMap` (mini-mapa) | `components/detector/detection-map.tsx` | Client Component (react-leaflet) |
| Demo mode (simulación) | `lib/api/analyze.ts` con flag `DEMO_MODE` | Misma lógica, API client |

### `ui.js` (533 líneas) → 4 archivos

| Objeto actual | Archivo Next.js destino | Notas |
|---|---|---|
| `UITemplates.welcomePanel` | `components/sidebar/welcome-panel.tsx` | Server Component (estático) |
| `UITemplates.incidentDetails` | `components/sidebar/incident-details.tsx` | Client Component |
| `UIManager.showReportForm` | `components/sidebar/report-form-panel.tsx` | Client Component |
| `UIManager.displayIncidentDetails` | Estado React: `selectedIncident` → renderiza `<IncidentDetails>` | Hook + state |

### `forms.js` (371 líneas) → 3 archivos

| Función actual | Archivo Next.js destino | Notas |
|---|---|---|
| `FormManager.onMapClick` | `components/map/map-click-handler.tsx` | Client Component con `useMapEvents` |
| `FormManager.handleFormSubmit` | `components/forms/report-form.tsx` + Server Action | React Hook Form + Zod + Server Action |
| `FormManager.setupFormValidation` | Schema Zod en `lib/schemas/report.ts` | Validación compartida client/server |
| `FormManager.setupAutoSave` | `hooks/use-autosave.ts` | Custom hook con `localStorage` |

### `historical.js` (382 líneas) → 3 archivos

| Función actual | Archivo Next.js destino | Notas |
|---|---|---|
| `HistoricalDataManager.loadHistoricalData` | `lib/data/historical.ts` | Server-side: leer CSV en build time |
| `HistoricalDataManager.parseCSV` | Reemplazar con `papaparse` | Librería |
| `HistoricalDataManager.processStatistics` | `lib/data/historical-stats.ts` | Función pura, ejecuta en server |
| `HistoricalDataManager.initializeCharts` | `components/charts/historical-charts.tsx` | Client Component (Recharts) |
| UI updates (DOM) | Props de React | Reactivo automáticamente |

### `main.js` (481 líneas) → Desaparece

La coordinación de inicialización la maneja Next.js automáticamente vía el App Router:
- `layout.tsx` carga providers globales
- Cada `page.tsx` carga sus datos
- Los `useEffect` de Client Components reemplazan los `DOMContentLoaded`

### `styles.css` (2,729 líneas) → Se reduce ~80%

| Sección actual | Destino | Notas |
|---|---|---|
| Utility classes (margin, padding, flex) | Eliminar — Tailwind las provee | ~40% del CSS actual |
| Componentes custom (`.toast`, `.sidebar`, etc.) | `globals.css` (solo lo que Tailwind no cubre) | ~200 líneas estimadas |
| Animaciones (floating, glassmorphism) | `globals.css` con `@keyframes` | Se mantienen |
| Media queries responsive | `tailwind.config.ts` breakpoints | Tailwind responsive nativo |
| Variables CSS (colores, tipografía) | `tailwind.config.ts` + CSS variables | Centralizadas |

### `sw.js` (75 líneas) → `next-pwa` o eliminarlo

Next.js tiene soporte PWA vía el paquete `next-pwa`. Alternativamente, Vercel cachea assets automáticamente en su CDN global, haciendo el SW menos necesario. **Recomendación:** No migrar el SW por ahora. Agregar `next-pwa` solo si se necesita funcionalidad offline.

### `index.html` (1,059 líneas) → `app/page.tsx` + `app/layout.tsx`

| Sección del HTML | Archivo Next.js | Notas |
|---|---|---|
| `<head>` (meta, fonts, CDN scripts) | `app/layout.tsx` + `next/font` + `next/script` | Fonts optimizadas por Next.js |
| Loading screen | `app/loading.tsx` | Suspense boundary nativo |
| Sidebar panel | `components/sidebar/sidebar.tsx` | Client Component |
| Mapa `<div id="map">` | `components/map/map-container.tsx` | Client Component |
| Stats cards | `components/stats/stats-grid.tsx` | Server Component con datos |
| Charts section | `components/charts/charts-section.tsx` | Client Component |
| Footer | `components/layout/footer.tsx` | Server Component |
| Mobile nav | `components/layout/mobile-nav.tsx` | Client Component |

### `detector.html` (528 líneas) → `app/detector/page.tsx`

| Sección del HTML | Archivo Next.js | Notas |
|---|---|---|
| Header/nav | Compartido con `layout.tsx` | Mismo layout global |
| Upload zone | `components/detector/image-upload.tsx` | Client Component |
| Canvas overlay | `components/detector/detection-canvas.tsx` | Client Component |
| Results panel | `components/detector/results-panel.tsx` | Client Component |
| Mini mapa | `components/detector/detection-map.tsx` | Client Component |
| Stats cards | `components/detector/detection-stats.tsx` | Client Component |

---

## 6. Schema de Base de Datos (Drizzle)

### `lib/db/schema.ts`

```typescript
import { pgTable, text, doublePrecision, boolean, date, timestamp, index } from 'drizzle-orm/pg-core';
// PostGIS support via raw SQL for geometry column

export const reports = pgTable('reports', {
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
  lat: doublePrecision('lat').notNull(), // Extraído de geom para queries simples
  lon: doublePrecision('lon').notNull(), // Extraído de geom para queries simples
  // geom se maneja con raw SQL: ST_SetSRID(ST_MakePoint(lon, lat), 4326)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => [
  index('idx_reports_colonia').on(table.colonia),
  index('idx_reports_status').on(table.status),
  index('idx_reports_created').on(table.createdAt),
]);

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  role: text('role').default('citizen'), // 'citizen' | 'admin' | 'authority'
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

// Tipos inferidos automáticamente
export type Report = typeof reports.$inferSelect;
export type NewReport = typeof reports.$inferInsert;
export type User = typeof users.$inferSelect;
```

### `lib/db/index.ts`

```typescript
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql, { schema });
```

### Migración PostGIS

Drizzle no soporta PostGIS nativamente. La columna `geom` y el índice GIST se manejan con una migración SQL custom:

```sql
-- drizzle/migrations/0001_add_postgis.sql
CREATE EXTENSION IF NOT EXISTS postgis;

-- Si quieres mantener la columna geom además de lat/lon:
ALTER TABLE reports ADD COLUMN IF NOT EXISTS geom GEOMETRY(Point, 4326);

-- Trigger para auto-calcular geom desde lat/lon
CREATE OR REPLACE FUNCTION update_report_geom()
RETURNS TRIGGER AS $$
BEGIN
  NEW.geom := ST_SetSRID(ST_MakePoint(NEW.lon, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_geom
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION update_report_geom();

CREATE INDEX IF NOT EXISTS idx_reports_geom ON reports USING GIST (geom);
```

> **Nota sobre Neon y PostGIS:** Neon soporta PostGIS de forma nativa. Solo necesitas habilitarlo con `CREATE EXTENSION IF NOT EXISTS postgis;` en tu migración.

---

## 7. API Routes (Next.js)

### `app/api/health/route.ts`

```typescript
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'online',
    roboflow_configured: !!process.env.ROBOFLOW_API_KEY,
    roboflow_model: process.env.ROBOFLOW_MODEL || 'visual-pollution-detection-04jk5/3',
    db_configured: !!process.env.DATABASE_URL,
  });
}
```

### `app/api/analyze/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY;
const ROBOFLOW_MODEL = process.env.ROBOFLOW_MODEL || 'visual-pollution-detection-04jk5/3';

export async function POST(request: NextRequest) {
  if (!ROBOFLOW_API_KEY) {
    return NextResponse.json(
      { detail: 'Server not configured: missing ROBOFLOW_API_KEY' },
      { status: 501 }
    );
  }

  const formData = await request.formData();
  const file = formData.get('file') as File | null;

  if (!file) {
    return NextResponse.json({ detail: 'No file provided' }, { status: 400 });
  }

  const imageBytes = await file.arrayBuffer();
  const url = `https://detect.roboflow.com/${ROBOFLOW_MODEL}?api_key=${ROBOFLOW_API_KEY}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: imageBytes,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      return NextResponse.json(
        { message: 'Roboflow returned an error', status_code: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return NextResponse.json({ detail: 'Roboflow request timed out' }, { status: 504 });
    }
    return NextResponse.json({ detail: 'Roboflow request failed' }, { status: 502 });
  }
}
```

### `app/api/reports/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { reports, type NewReport } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { z } from 'zod';
import { randomUUID } from 'crypto';

// GET /api/reports?limit=500
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Math.max(Number(searchParams.get('limit') || 500), 1), 2000);

  const rows = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.createdAt))
    .limit(limit);

  return NextResponse.json(rows);
}

// POST /api/reports
const reportSchema = z.object({
  titulo: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  fechaEvento: z.string().optional(),
  direccion: z.string().optional(),
  colonia: z.string().optional(),
  gravedad: z.string().optional(),
  descripcion: z.string().optional(),
  mmLluvia: z.number().optional(),
  tipoEvento: z.string().optional(),
  medio: z.string().optional(),
  imagen: z.string().optional(),
  urlNoticia: z.string().optional(),
  tipoReporte: z.string().default('ciudadano'),
  detectadoAi: z.boolean().default(false),
  aiConfidence: z.number().optional(),
  status: z.string().default('enviado'),
});

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = reportSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Validation error', errors: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const data = parsed.data;
  const id = `rep-${randomUUID().replace(/-/g, '')}`;

  const [row] = await db.insert(reports).values({
    id,
    titulo: data.titulo,
    lat: data.lat,
    lon: data.lon,
    fechaEvento: data.fechaEvento,
    direccion: data.direccion,
    colonia: data.colonia,
    gravedad: data.gravedad,
    descripcion: data.descripcion,
    mmLluvia: data.mmLluvia,
    tipoEvento: data.tipoEvento,
    medio: data.medio,
    imagen: data.imagen,
    urlNoticia: data.urlNoticia,
    tipoReporte: data.tipoReporte,
    detectadoAi: data.detectadoAi,
    aiConfidence: data.aiConfidence,
    status: data.status,
  }).returning();

  return NextResponse.json(row, { status: 201 });
}
```

---

## 8. Componentes React

### Mapa Principal (`components/map/map-container.tsx`)

```typescript
'use client';

import { MapContainer, TileLayer, useMapEvents } from 'react-leaflet';
import { IncidentMarker } from './incident-marker';
import { ReportMarker } from './report-marker';
import { AGEBLayer } from './ageb-layer';
import type { Report } from '@/lib/db/schema';

interface MapProps {
  incidents: Report[];
  onMapClick?: (lat: number, lng: number) => void;
  onMarkerClick?: (report: Report) => void;
}

export function EcoTrackMap({ incidents, onMapClick, onMarkerClick }: MapProps) {
  return (
    <MapContainer
      center={[29.072967, -110.955919]}
      zoom={13}
      className="h-full w-full rounded-xl"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution="&copy; OpenStreetMap contributors"
      />
      <AGEBLayer />
      {incidents.map((incident) => (
        <IncidentMarker
          key={incident.id}
          incident={incident}
          onClick={() => onMarkerClick?.(incident)}
        />
      ))}
      {onMapClick && <MapClickHandler onClick={onMapClick} />}
    </MapContainer>
  );
}

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
```

> **Nota importante:** `react-leaflet` y `leaflet` dependen del DOM. Deben importarse con `dynamic` de Next.js:

```typescript
// app/page.tsx (o donde se use el mapa)
import dynamic from 'next/dynamic';

const EcoTrackMap = dynamic(() => import('@/components/map/map-container').then(m => m.EcoTrackMap), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-slate-200 rounded-xl" />,
});
```

### Chart con Recharts (`components/charts/severity-chart.tsx`)

```typescript
'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import type { Report } from '@/lib/db/schema';

const COLORS = {
  alto: '#ef4444',
  medio: '#f59e0b',
  bajo: '#22c55e',
};

export function SeverityChart({ reports }: { reports: Report[] }) {
  const data = Object.entries(
    reports.reduce((acc, r) => {
      const key = r.gravedad || 'bajo';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS] || '#94a3b8'} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
```

---

## 9. Manejo de Datos Estáticos

### CSVs de CONAGUA

Los datos históricos de CONAGUA no cambian frecuentemente. La estrategia:

1. **Mover CSVs a `public/data/`** — Next.js los sirve automáticamente
2. **Pre-procesar en build time** vía `generateStaticParams` o un script de build
3. **ISR en `/historico`** con `revalidate: 86400` (cada 24h)

```typescript
// lib/data/historical.ts
import Papa from 'papaparse';
import { readFileSync } from 'fs';
import path from 'path';

export function loadHistoricalData() {
  const csvPath = path.join(process.cwd(), 'public', 'data', 'hermosillo_lluvias_historicas.csv');
  const csvText = readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse(csvText, { header: true, dynamicTyping: true });
  return data;
}

// Esto se ejecuta en el SERVER, nunca llega al bundle del cliente
```

### GeoJSON de AGEB

Los archivos GeoJSON son grandes (hasta 1.5 MB). Estrategia:

1. Mover a `public/geojson/`
2. Cargar bajo demanda en el cliente con `fetch` (lazy load al activar la capa)
3. Considerar simplificar geometrías con `mapshaper` para reducir tamaño

```typescript
// components/map/ageb-layer.tsx
'use client';

import { GeoJSON, useMap } from 'react-leaflet';
import { useState, useEffect } from 'react';

export function AGEBLayer({ visible = false }: { visible: boolean }) {
  const [data, setData] = useState(null);
  const map = useMap();

  useEffect(() => {
    if (visible && !data) {
      fetch('/geojson/AGEB-Urbanas.geojson')
        .then(r => r.json())
        .then(setData);
    }
  }, [visible, data]);

  if (!visible || !data) return null;
  return <GeoJSON data={data} style={{ color: '#06b6d4', weight: 1, fillOpacity: 0.1 }} />;
}
```

### Imágenes de reportes

Las imágenes que suben los usuarios se guardan en **Vercel Blob**:

```typescript
// lib/storage/upload.ts
import { put } from '@vercel/blob';

export async function uploadReportImage(file: File): Promise<string> {
  const blob = await put(`reports/${Date.now()}-${file.name}`, file, {
    access: 'public',
  });
  return blob.url; // URL pública del CDN de Vercel
}
```

---

## 10. Autenticación

### Setup NextAuth.js v5

```typescript
// lib/auth.ts
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db } from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Opcional: credenciales para admin
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        // Lógica de verificación aquí
        return null;
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // Agregar rol al session
      session.user.role = user.role;
      return session;
    },
  },
});
```

### Middleware de protección

```typescript
// middleware.ts
import { auth } from '@/lib/auth';

export default auth((req) => {
  const isAdmin = req.nextUrl.pathname.startsWith('/admin');
  if (isAdmin && !req.auth) {
    return Response.redirect(new URL('/api/auth/signin', req.url));
  }
});

export const config = {
  matcher: ['/admin/:path*'],
};
```

### Roles

| Rol | Permisos |
|---|---|
| `citizen` | Crear reportes, ver mapa, ver detector |
| `admin` | Todo de citizen + cambiar estado de reportes + dashboard |
| `authority` | Todo de admin + eliminar reportes + exportar datos |

---

## 11. Infraestructura Vercel

### Variables de entorno

```env
# Neon PostgreSQL (se configura automáticamente con la integración de Vercel)
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/ecotrack?sslmode=require

# Roboflow (migrar el valor actual de Railway)
ROBOFLOW_API_KEY=tu_key_actual
ROBOFLOW_MODEL=visual-pollution-detection-04jk5/3

# Vercel Blob (se genera automáticamente al habilitar Blob)
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx

# NextAuth
AUTH_SECRET=openssl_rand_base64_32
AUTH_URL=https://ecotrack.vercel.app

# Google OAuth (opcional, para auth social)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
```

### Configuración de proyecto

```typescript
// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: '*.public.blob.vercel-storage.com' }, // Vercel Blob
      { hostname: 'tile.openstreetmap.org' },
    ],
  },
  // Los GeoJSON grandes se excluyen del bundle de webpack
  webpack: (config) => {
    config.module.rules.push({
      test: /\.geojson$/,
      type: 'json',
    });
    return config;
  },
};

export default nextConfig;
```

### Integraciones de Vercel a activar

1. **Neon** — Marketplace de Vercel → conectar proyecto Neon → inyecta `DATABASE_URL` automáticamente
2. **Vercel Blob** — Dashboard → Storage → Create Blob Store → inyecta `BLOB_READ_WRITE_TOKEN`
3. **Vercel Analytics** — Dashboard → Analytics → Enable → métricas de rendimiento gratis
4. **Vercel Speed Insights** — Web Vitals automatizados

---

## 12. Plan de Ejecución por Fases

### Fase 0: Preparación (1 día)

- [ ] Crear cuenta/proyecto en Neon (free tier: 0.5 GB storage, 190 horas compute)
- [ ] Crear proyecto en Vercel y conectar repo de GitHub
- [ ] Configurar integración Neon ↔ Vercel
- [ ] Exportar datos actuales de Railway PostgreSQL → importar en Neon
- [ ] Crear rama `feat/nextjs-migration` en el repo

### Fase 1: Scaffolding Next.js (1 día)

- [ ] Crear proyecto Next.js dentro del repo (o en repo nuevo)
- [ ] Instalar todas las dependencias (ver Sección 3)
- [ ] Configurar Tailwind CSS v4
- [ ] Configurar Drizzle ORM + schema + migraciones
- [ ] Verificar conexión a Neon desde local: `npx drizzle-kit push`
- [ ] Crear `app/layout.tsx` con fonts, metadata y providers
- [ ] Crear `app/loading.tsx` con skeleton del mapa
- [ ] Copiar archivos estáticos a `public/` (CSVs, GeoJSON, Logo)

### Fase 2: API Routes (1 día)

- [ ] Implementar `app/api/health/route.ts`
- [ ] Implementar `app/api/analyze/route.ts` (proxy Roboflow)
- [ ] Implementar `app/api/reports/route.ts` (GET + POST)
- [ ] Validar con Postman/curl que los 3 endpoints funcionan
- [ ] Verificar paridad con la API actual de FastAPI

### Fase 3: Mapa Principal (2-3 días)

- [ ] Instalar `leaflet` + `react-leaflet` + `@types/leaflet`
- [ ] Crear `components/map/map-container.tsx` con dynamic import (ssr: false)
- [ ] Portar marcadores de incidentes (`MapManager.addIncidentToMap`)
- [ ] Portar marcadores de reportes ciudadanos
- [ ] Portar iconos por severidad (`MapManager.getIconBySeverity`)
- [ ] Portar popups de incidente (HTML → JSX)
- [ ] Crear `components/map/ageb-layer.tsx` con lazy loading
- [ ] Portar controles de búsqueda en el mapa
- [ ] Crear sidebar (`components/sidebar/`) con paneles: welcome, detalles, formulario
- [ ] Portar stats cards y legend
- [ ] Verificar mobile responsiveness

### Fase 4: Gráficas (1 día)

- [ ] Instalar Recharts
- [ ] Crear `components/charts/severity-chart.tsx` (PieChart)
- [ ] Crear `components/charts/temporal-chart.tsx` (BarChart)
- [ ] Crear `components/charts/colonia-chart.tsx` (BarChart horizontal)
- [ ] Crear stats animadas (`components/ui/animated-counter.tsx`)

### Fase 5: Detector IA — EcoScan (2 días)

- [ ] Crear `app/detector/page.tsx`
- [ ] Portar `components/detector/image-upload.tsx` (drag & drop + file input)
- [ ] Portar `components/detector/detection-canvas.tsx` (canvas con bounding boxes)
- [ ] Crear `lib/api/analyze.ts` (API client con modo demo)
- [ ] Portar extracción EXIF (`lib/exif/extract.ts`)
- [ ] Portar mini-mapa de detección (`components/detector/detection-map.tsx`)
- [ ] Portar generación de PDF (`lib/pdf/generate.ts` con `jspdf`)
- [ ] Verificar flujo completo: upload → detectar → ver resultados → generar PDF

### Fase 6: Datos Históricos (1 día)

- [ ] Crear `app/historico/page.tsx` con ISR
- [ ] Cargar y procesar CSV de CONAGUA en server (`lib/data/historical.ts`)
- [ ] Crear charts históricos con Recharts
- [ ] Portar estadísticas (promedios, extremos, tendencias)

### Fase 7: Formulario de Reportes (1 día)

- [ ] Crear schema Zod (`lib/schemas/report.ts`)
- [ ] Crear `components/forms/report-form.tsx` con React Hook Form
- [ ] Implementar click-en-mapa para seleccionar ubicación
- [ ] Conectar submit con `POST /api/reports`
- [ ] Implementar upload de imagen a Vercel Blob
- [ ] Auto-save en localStorage via custom hook

### Fase 8: Auth y Admin (2 días)

- [ ] Configurar NextAuth.js v5
- [ ] Crear páginas de login/registro
- [ ] Crear `app/admin/page.tsx` — dashboard de gestión de reportes
- [ ] Implementar cambio de estado de reportes (semáforo)
- [ ] Proteger rutas admin con middleware

### Fase 9: QA y Migración (1-2 días)

- [ ] Test visual: comparar cada vista con la versión actual
- [ ] Test funcional: crear reporte, detectar basura, ver histórico
- [ ] Test mobile: verificar en iOS Safari y Android Chrome
- [ ] Lighthouse audit: objetivo score > 90 en todas las categorías
- [ ] Migrar dominio DNS de Railway a Vercel
- [ ] Desactivar servicio de Railway (mantener BD como backup temporalmente)

**Tiempo total estimado: 10-14 días**

---

## 13. Comandos Paso a Paso

### Crear proyecto

```bash
# Desde la raíz del repo existente, o en un nuevo repo
npx create-next-app@latest ecotrack-next \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --turbopack

cd ecotrack-next
```

### Instalar dependencias

```bash
# Base de datos
npm install drizzle-orm @neondatabase/serverless
npm install -D drizzle-kit

# Auth
npm install next-auth@beta @auth/drizzle-adapter

# Mapas
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Gráficas
npm install recharts

# Validación
npm install zod

# Storage
npm install @vercel/blob

# Utilidades
npm install papaparse exif-js jspdf
npm install -D @types/papaparse

# Testing
npm install -D vitest @testing-library/react @vitejs/plugin-react jsdom
```

### Configurar Drizzle

```bash
# Crear archivo de configuración
cat > drizzle.config.ts << 'EOF'
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
EOF

# Generar migración inicial
npx drizzle-kit generate

# Aplicar migración a Neon
npx drizzle-kit push
```

### Migrar datos de Railway a Neon

```bash
# 1. Exportar de Railway
pg_dump "$RAILWAY_DATABASE_URL" \
  --no-owner \
  --no-privileges \
  --data-only \
  --table=reports \
  > railway_export.sql

# 2. Importar a Neon
psql "$NEON_DATABASE_URL" < railway_export.sql
```

### Copiar archivos estáticos

```bash
# Desde el repo actual
cp -r assets/data/ ecotrack-next/public/data/
cp -r GeoJSON/ ecotrack-next/public/geojson/
cp -r Logo/ ecotrack-next/public/logo/
```

### Deploy a Vercel

```bash
# Instalar Vercel CLI
npm install -g vercel

# Conectar proyecto
vercel link

# Deploy de preview
vercel

# Deploy a producción
vercel --prod
```

---

## 14. Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|---|---|---|---|
| **Leaflet SSR crash** | Alta | Bloqueante | Usar `dynamic()` con `ssr: false` para todo componente que use `L` |
| **PostGIS no disponible en Neon** | Baja | Alto | Neon soporta PostGIS; verificar en el free tier antes de empezar |
| **Tamaño de GeoJSON (3.7MB total)** | Media | Medio | Lazy-load por capa, simplificar geometrías, considerar vector tiles |
| **Roboflow timeout en serverless** | Media | Medio | Serverless functions de Vercel tienen timeout de 60s (Pro) o 10s (Hobby). Para Hobby, considerar maxDuration en route config |
| **EXIF en mobile no funciona** | Baja | Bajo | `exif-js` funciona en mobile; testear en iOS Safari |
| **Cold start de Neon** | Media | Bajo | Neon serverless tiene ~200ms cold start; tolerable para esta app |
| **CSS roto en migración** | Alta | Medio | Migrar estilos incrementalmente; mantener `globals.css` con los custom styles |
| **Pérdida de datos en migración DB** | Baja | Crítico | Hacer backup completo de Railway antes de migrar; mantener Railway activo 2 semanas |

### Vercel Hobby vs Pro

| Feature | Hobby (gratis) | Pro ($20/mes) |
|---|---|---|
| Serverless timeout | 10s | 60s |
| Bandwidth | 100 GB/mes | 1 TB/mes |
| Blob storage | 500 MB | 5 GB |
| Analytics | Básico | Completo |
| Preview deploys | Sí | Sí |

> **Recomendación:** Empezar con Hobby. El timeout de 10s puede ser problema para `/api/analyze` (Roboflow tarda ~5-15s). Si se pasa, upgradear a Pro o mover el analyze a un Edge Function con streaming.

Para extender el timeout en una route específica:

```typescript
// app/api/analyze/route.ts
export const maxDuration = 30; // Solo funciona en plan Pro
```

---

## 15. Checklist de Validación

### Paridad funcional (debe pasar TODO antes de switchear DNS)

- [ ] Mapa carga con todos los marcadores de `eventos_hidro.csv`
- [ ] Click en marcador abre popup con detalles correctos
- [ ] Capas AGEB se activan/desactivan correctamente
- [ ] Sidebar muestra detalles del incidente seleccionado
- [ ] Formulario de nuevo reporte funciona (click en mapa → llenar → submit)
- [ ] Reporte creado aparece en el mapa sin recargar
- [ ] Detector IA: upload de imagen → detección → bounding boxes visibles
- [ ] Detector IA: extracción EXIF → pin en mini-mapa
- [ ] Detector IA: generar PDF con resultados
- [ ] Detector IA: modo demo funciona sin API key
- [ ] Datos históricos: gráficas de precipitación cargan correctamente
- [ ] Datos históricos: estadísticas (promedios, extremos) son correctas
- [ ] Stats cards se actualizan con datos reales
- [ ] Mobile: navegación inferior funciona
- [ ] Mobile: mapa responde a gestos táctiles
- [ ] `GET /api/health` retorna status correcto
- [ ] `GET /api/reports` retorna reportes desde Neon
- [ ] `POST /api/reports` crea reporte en Neon
- [ ] `POST /api/analyze` proxea correctamente a Roboflow

### Mejoras post-migración (ya no son bugs del sistema actual)

- [ ] Lighthouse Performance > 90
- [ ] Lighthouse Accessibility > 90
- [ ] Sin `console.log` en producción (ESLint rule: `no-console`)
- [ ] Bundle size < 200KB (first load JS)
- [ ] Time to Interactive < 3s
- [ ] WCAG 2.1 AA compliance

---

## Estructura final del proyecto

```
ecotrack-next/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Layout global (fonts, providers, nav)
│   │   ├── page.tsx                      # Mapa principal (SSR + Client)
│   │   ├── loading.tsx                   # Skeleton del mapa
│   │   ├── globals.css                   # Animaciones custom + variables
│   │   ├── detector/
│   │   │   └── page.tsx                  # EcoScan
│   │   ├── historico/
│   │   │   └── page.tsx                  # Datos CONAGUA (ISR)
│   │   ├── admin/
│   │   │   └── page.tsx                  # Dashboard (protected)
│   │   └── api/
│   │       ├── analyze/route.ts          # Proxy Roboflow
│   │       ├── reports/route.ts          # CRUD reportes
│   │       ├── health/route.ts           # Health check
│   │       └── auth/[...nextauth]/route.ts # NextAuth
│   ├── components/
│   │   ├── map/
│   │   │   ├── map-container.tsx         # Mapa principal (dynamic, ssr:false)
│   │   │   ├── incident-marker.tsx       # Marcador de incidente
│   │   │   ├── report-marker.tsx         # Marcador de reporte ciudadano
│   │   │   ├── ageb-layer.tsx            # Capa GeoJSON AGEB
│   │   │   ├── search-control.tsx        # Búsqueda en mapa
│   │   │   └── map-click-handler.tsx     # Handler de click para nuevos reportes
│   │   ├── sidebar/
│   │   │   ├── sidebar.tsx               # Container del sidebar
│   │   │   ├── welcome-panel.tsx         # Panel de bienvenida
│   │   │   ├── incident-details.tsx      # Detalles del incidente
│   │   │   └── report-form-panel.tsx     # Panel con formulario
│   │   ├── detector/
│   │   │   ├── image-upload.tsx          # Drag & drop
│   │   │   ├── detection-canvas.tsx      # Canvas con bounding boxes
│   │   │   ├── detection-map.tsx         # Mini-mapa
│   │   │   ├── results-panel.tsx         # Resultados de detección
│   │   │   └── detection-stats.tsx       # Stats del detector
│   │   ├── charts/
│   │   │   ├── severity-chart.tsx        # PieChart por gravedad
│   │   │   ├── temporal-chart.tsx        # BarChart temporal
│   │   │   ├── colonia-chart.tsx         # BarChart por colonia
│   │   │   └── historical-charts.tsx     # Gráficas CONAGUA
│   │   ├── forms/
│   │   │   └── report-form.tsx           # Formulario de reporte (React Hook Form + Zod)
│   │   ├── layout/
│   │   │   ├── navbar.tsx                # Navegación principal
│   │   │   ├── mobile-nav.tsx            # Navegación móvil inferior
│   │   │   └── footer.tsx                # Footer
│   │   └── ui/
│   │       ├── toast.tsx                 # Notificaciones (o usar sonner)
│   │       ├── animated-counter.tsx      # Contadores animados
│   │       └── loading-spinner.tsx       # Spinner reutilizable
│   ├── lib/
│   │   ├── db/
│   │   │   ├── index.ts                  # Cliente Drizzle + Neon
│   │   │   └── schema.ts                 # Schema de tablas
│   │   ├── api/
│   │   │   ├── reports.ts                # Client-side: fetch /api/reports
│   │   │   └── analyze.ts               # Client-side: fetch /api/analyze (+ demo mode)
│   │   ├── data/
│   │   │   ├── csv-loader.ts             # Parsear CSVs con PapaParse
│   │   │   ├── historical.ts             # Cargar datos CONAGUA (server-side)
│   │   │   ├── historical-stats.ts       # Calcular estadísticas
│   │   │   └── transforms.ts             # CSV → Report objects
│   │   ├── map/
│   │   │   └── icons.ts                  # Iconos Leaflet por severidad
│   │   ├── exif/
│   │   │   └── extract.ts               # Extracción EXIF de imágenes
│   │   ├── pdf/
│   │   │   └── generate.ts              # Generación de reportes PDF
│   │   ├── schemas/
│   │   │   └── report.ts                # Zod schemas (compartidos client/server)
│   │   ├── storage/
│   │   │   └── upload.ts                # Upload a Vercel Blob
│   │   ├── auth.ts                       # Configuración NextAuth
│   │   └── utils.ts                      # Helpers (formatDate, etc.)
│   ├── hooks/
│   │   ├── use-reports.ts                # SWR/React Query para reportes
│   │   ├── use-autosave.ts              # Auto-save de formulario
│   │   └── use-media-query.ts           # Responsive hooks
│   └── middleware.ts                     # Auth guard para /admin
├── public/
│   ├── data/
│   │   ├── eventos_hidro.csv
│   │   ├── hermosillo_lluvias_historicas.csv
│   │   └── hermosillo_historico_completo.csv
│   ├── geojson/
│   │   ├── AGEB-Municipio.geojson
│   │   ├── AGEB-Rurales.geojson
│   │   └── AGEB-Urbanas.geojson
│   └── logo/
│       └── ecotrack.png
├── drizzle/
│   └── migrations/                       # Migraciones SQL generadas
├── scripts/
│   └── process_conagua_data.py          # Mantener script de procesamiento
├── drizzle.config.ts
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── .env.local                            # Variables de entorno locales
└── package.json
```

---

## Notas Finales

### Qué NO migrar

- `incidents.json` — legacy, los reportes viven en PostgreSQL
- `eventos_hidro1.csv` — duplicado, solo migrar `eventos_hidro.csv`
- `IMG_6701.JPG` (7.5 MB) — no incluir en el repo; subir a Vercel Blob si se necesita
- `demo3d/aquapulse.html` — demo experimental, migrar aparte si se necesita

### Convivencia temporal

Durante la migración, Railway y Vercel pueden coexistir:
- Railway sigue sirviendo la versión actual
- Vercel sirve la versión nueva en un subdominio de preview
- Cuando la versión de Vercel pase todos los checks de la Sección 15, se hace el switch de DNS

### Decisión pendiente: repo nuevo vs mismo repo

| Opción | Pro | Contra |
|---|---|---|
| **Mismo repo** (carpeta `next/`) | Historial de git unificado, fácil comparar | Puede complicar el deploy de Railway mientras conviven |
| **Repo nuevo** | Limpio, sin conflictos de deploy | Pierdes historial, hay que mover issues |

> **Recomendación:** Crear en el **mismo repo** en una rama `feat/nextjs-migration`, con el proyecto Next.js en la raíz (reemplazando la estructura actual). Una vez mergeado, Railway deja de funcionar y Vercel toma el control.
