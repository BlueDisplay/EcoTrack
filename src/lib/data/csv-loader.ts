// ─── CSV data loading & processing (server-side) ───────────────────────────
// Executes in Node.js at build/request time, never bundled to the client

import Papa from 'papaparse';
import { readFileSync } from 'fs';
import path from 'path';
import { asc, desc, eq, sql } from 'drizzle-orm';
import { db, isDbConfigured } from '@/lib/db';
import { rainfallConagua } from '@/lib/db/schema';

const MONTH_NAMES_ES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
] as const;

const MONTH_INDEX_BY_NAME = new Map<string, number>(
  MONTH_NAMES_ES.flatMap((name, index) => [
    [name.toLowerCase(), index],
    [name.slice(0, 3).toLowerCase(), index],
  ]),
);

const HERMOSILLO_COORDS = {
  latitude: 29.072967,
  longitude: -110.955919,
};

const HERMOSILLO_CONAGUA_STATION_ID = '26139';
const HERMOSILLO_STATION_NAME = 'HERMOSILLO II (DGE)';
const CONAGUA_FUENTE_URL = 'https://www.gob.mx/conagua';
const OPEN_METEO_FUENTE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const RAINFALL_UPSERT_BATCH_SIZE = 250;

export interface HistoricalRainRecord {
  año: number;
  mes: string;
  precipitacion: number;
  [key: string]: unknown;
}

export interface HydroEvent {
  id_evento?: string;
  id?: string;
  fecha_evento?: string;
  fecha?: string;
  titulo: string;
  medio?: string;
  url_noticia?: string;
  direccion_detectada?: string;
  direccion?: string;
  colonia?: string;
  lat: number;
  lon: number;
  mm_lluvia_reportados?: number;
  mm_lluvia?: number;
  afectaciones_reportadas?: string;
  descripcion?: string;
  gravedad: string;
  tipo_evento?: string;
  [key: string]: unknown;
}

export type RainfallDataSource = 'neon_db' | 'conagua_csv' | 'open_meteo';

type RawHistoricalRainRecord = Record<string, unknown> & {
  año?: number | string;
  anio?: number | string;
  mes?: number | string;
  precipitacion?: number | string;
  precipitacion_mm?: number | string;
  evaporacion_mm?: number | string;
  temp_max_c?: number | string;
  temp_min_c?: number | string;
  fecha?: string;
  estacion?: string;
  estacion_id?: number | string;
  latitud?: number | string;
  longitud?: number | string;
};

interface OpenMeteoArchiveResponse {
  daily?: {
    time?: string[];
    precipitation_sum?: Array<number | null>;
  };
}

interface RainfallDbRow {
  conaguaStationId: string;
  fechaEvento: string;
  estacionNombre: string;
  precipitacionMm: number;
  evaporacionMm: number | null;
  tempMaxC: number | null;
  tempMinC: number | null;
  lat: number | null;
  lon: number | null;
  fuenteUrl: string;
}

function toNumber(value: unknown): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function monthNameFromIndex(index: number): string | null {
  return index >= 0 && index < MONTH_NAMES_ES.length ? MONTH_NAMES_ES[index] : null;
}

function normalizeMonth(rawMonth: unknown): string | null {
  if (typeof rawMonth === 'number' && Number.isInteger(rawMonth)) {
    return monthNameFromIndex(rawMonth - 1);
  }

  if (typeof rawMonth !== 'string') return null;

  const normalized = rawMonth.trim().toLowerCase();
  if (!normalized) return null;

  if (/^\d{1,2}$/.test(normalized)) {
    const monthNumeric = Number.parseInt(normalized, 10);
    return monthNameFromIndex(monthNumeric - 1);
  }

  return monthNameFromIndex(MONTH_INDEX_BY_NAME.get(normalized) ?? -1);
}

function parseDateToYearMonth(rawDate: unknown): { year: number; month: string } | null {
  if (typeof rawDate !== 'string') return null;

  const match = rawDate.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number.parseInt(match[1], 10);
  const month = monthNameFromIndex(Number.parseInt(match[2], 10) - 1);
  if (!month || !Number.isFinite(year)) return null;

  return { year, month };
}

function normalizeHistoricalRow(raw: RawHistoricalRainRecord): HistoricalRainRecord | null {
  const precip = toNumber(raw.precipitacion ?? raw.precipitacion_mm);
  if (precip == null || precip < 0) return null;

  let year = toNumber(raw.año ?? raw.anio);
  let month = normalizeMonth(raw.mes);

  if ((!year || !month) && raw.fecha) {
    const parsed = parseDateToYearMonth(raw.fecha);
    if (parsed) {
      if (!year) year = parsed.year;
      if (!month) month = parsed.month;
    }
  }

  if (!year || !month) return null;

  return {
    ...raw,
    año: Math.trunc(year),
    mes: month,
    precipitacion: Math.round(precip * 10) / 10,
  };
}

/**
 * Load and parse the historical rainfall CSV from CONAGUA.
 * Runs server-side only.
 */
function loadHistoricalRainCsvRows(): RawHistoricalRainRecord[] {
  const csvPath = path.join(
    process.cwd(),
    'public',
    'data',
    'hermosillo_lluvias_historicas.csv',
  );
  const csvText = readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse<RawHistoricalRainRecord>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  return data;
}

export function loadHistoricalRainData(): HistoricalRainRecord[] {
  return loadHistoricalRainCsvRows()
    .map((row) => normalizeHistoricalRow(row))
    .filter((row): row is HistoricalRainRecord => row !== null);
}

/**
 * Load hydrometeorological events CSV.
 * Runs server-side only.
 */
export function loadHydroEvents(): HydroEvent[] {
  const csvPath = path.join(
    process.cwd(),
    'public',
    'data',
    'eventos_hidro.csv',
  );
  const csvText = readFileSync(csvPath, 'utf-8');
  const { data } = Papa.parse<HydroEvent>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return data;
}

/**
 * Fallback climate source: Open-Meteo archive daily precipitation.
 * Useful when CSV headers/schema drift or CONAGUA export fails.
 */
export async function loadOpenMeteoRainData(options: {
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
} = {}): Promise<HistoricalRainRecord[]> {
  const endDate = options.endDate ?? new Date().toISOString().slice(0, 10);
  const startDate = options.startDate ?? '1961-01-01';

  const url = new URL('https://archive-api.open-meteo.com/v1/archive');
  url.searchParams.set('latitude', `${options.latitude ?? HERMOSILLO_COORDS.latitude}`);
  url.searchParams.set('longitude', `${options.longitude ?? HERMOSILLO_COORDS.longitude}`);
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('daily', 'precipitation_sum');
  url.searchParams.set('timezone', 'America/Hermosillo');

  const res = await fetch(url.toString(), {
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (${res.status})`);
  }

  const payload = (await res.json()) as OpenMeteoArchiveResponse;
  const dates = payload.daily?.time ?? [];
  const mmSeries = payload.daily?.precipitation_sum ?? [];

  if (dates.length === 0 || mmSeries.length === 0 || dates.length !== mmSeries.length) {
    return [];
  }

  const normalized: HistoricalRainRecord[] = [];

  for (let i = 0; i < dates.length; i += 1) {
    const parsed = parseDateToYearMonth(dates[i]);
    const mm = toNumber(mmSeries[i]);
    if (!parsed || mm == null || mm < 0) continue;

    normalized.push({
      fecha: dates[i],
      fuente: 'open-meteo',
      año: parsed.year,
      mes: parsed.month,
      precipitacion: Math.round(mm * 10) / 10,
    });
  }

  return normalized;
}

/**
 * Convert the local CONAGUA CSV into rows that match the Neon rainfall table.
 */
function loadHistoricalRainSeedRows(): RainfallDbRow[] {
  return loadHistoricalRainCsvRows()
    .map((row) => {
      const fechaEvento = typeof row.fecha === 'string' ? row.fecha.trim() : '';
      const conaguaStationId = row.estacion_id != null
        ? String(row.estacion_id).trim()
        : HERMOSILLO_CONAGUA_STATION_ID;
      const estacionNombre = typeof row.estacion === 'string' && row.estacion.trim()
        ? row.estacion.trim()
        : HERMOSILLO_STATION_NAME;
      const precipitacionMm = toNumber(row.precipitacion_mm ?? row.precipitacion);

      if (!fechaEvento || !conaguaStationId || !estacionNombre || precipitacionMm == null || precipitacionMm < 0) {
        return null;
      }

      return {
        conaguaStationId,
        fechaEvento,
        estacionNombre,
        precipitacionMm: Math.round(precipitacionMm * 10) / 10,
        evaporacionMm: toNumber(row.evaporacion_mm),
        tempMaxC: toNumber(row.temp_max_c),
        tempMinC: toNumber(row.temp_min_c),
        lat: toNumber(row.latitud),
        lon: toNumber(row.longitud),
        fuenteUrl: CONAGUA_FUENTE_URL,
      };
    })
    .filter((row): row is RainfallDbRow => row !== null);
}

function mapOpenMeteoRowsToDbRows(rows: HistoricalRainRecord[]): RainfallDbRow[] {
  return rows
    .map((row): RainfallDbRow | null => {
      const fechaEvento = typeof row.fecha === 'string' ? row.fecha.trim() : '';
      const precipitacionMm = toNumber(row.precipitacion);

      if (!fechaEvento || precipitacionMm == null || precipitacionMm < 0) {
        return null;
      }

      return {
        conaguaStationId: HERMOSILLO_CONAGUA_STATION_ID,
        fechaEvento,
        estacionNombre: HERMOSILLO_STATION_NAME,
        precipitacionMm: Math.round(precipitacionMm * 10) / 10,
        evaporacionMm: null,
        tempMaxC: null,
        tempMinC: null,
        lat: HERMOSILLO_COORDS.latitude,
        lon: HERMOSILLO_COORDS.longitude,
        fuenteUrl: OPEN_METEO_FUENTE_URL,
      };
    })
    .filter((row): row is RainfallDbRow => row !== null);
}

function chunkRows(rows: RainfallDbRow[], size: number): RainfallDbRow[][] {
  const chunks: RainfallDbRow[][] = [];
  for (let i = 0; i < rows.length; i += size) {
    chunks.push(rows.slice(i, i + size));
  }
  return chunks;
}

function addDays(date: string, days: number): string {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function getYesterdayIsoDate(): string {
  const today = new Date();
  today.setUTCDate(today.getUTCDate() - 1);
  return today.toISOString().slice(0, 10);
}

async function upsertRainfallRows(rows: RainfallDbRow[]): Promise<void> {
  if (rows.length === 0) return;

  const batches = chunkRows(rows, RAINFALL_UPSERT_BATCH_SIZE);

  for (const batch of batches) {
    await db
      .insert(rainfallConagua)
      .values(
        batch.map((row) => ({
          conaguaStationId: row.conaguaStationId,
          fechaEvento: row.fechaEvento,
          estacionNombre: row.estacionNombre,
          precipitacionMm: row.precipitacionMm,
          evaporacionMm: row.evaporacionMm,
          tempMaxC: row.tempMaxC,
          tempMinC: row.tempMinC,
          lat: row.lat,
          lon: row.lon,
          fuenteUrl: row.fuenteUrl,
        })),
      )
      .onConflictDoUpdate({
        target: [
          rainfallConagua.conaguaStationId,
          rainfallConagua.fechaEvento,
        ],
        set: {
          estacionNombre: sql`excluded.estacion_nombre`,
          precipitacionMm: sql`excluded.precipitacion_mm`,
          evaporacionMm: sql`excluded.evaporacion_mm`,
          tempMaxC: sql`excluded.temp_max_c`,
          tempMinC: sql`excluded.temp_min_c`,
          lat: sql`excluded.lat`,
          lon: sql`excluded.lon`,
          fuenteUrl: sql`excluded.fuente_url`,
          ingestedAt: new Date(),
        },
      });
  }
}

/**
 * Load historical rainfall data from the application's primary Neon table.
 * When DATABASE_URL is configured, this becomes the source of truth.
 */
async function loadDatabaseRainData(): Promise<HistoricalRainRecord[]> {
  if (!isDbConfigured()) {
    return [];
  }

  const rows = await db
    .select({
      fecha: rainfallConagua.fechaEvento,
      precipitacionMm: rainfallConagua.precipitacionMm,
    })
    .from(rainfallConagua)
    .where(eq(rainfallConagua.conaguaStationId, HERMOSILLO_CONAGUA_STATION_ID))
    .orderBy(asc(rainfallConagua.fechaEvento));

  return rows
    .map((row) =>
      normalizeHistoricalRow({
        fecha: row.fecha,
        precipitacion_mm: row.precipitacionMm,
      }),
    )
    .filter((row): row is HistoricalRainRecord => row !== null);
}

async function getLatestDatabaseRainDate(): Promise<string | null> {
  if (!isDbConfigured()) {
    return null;
  }

  const [latestRow] = await db
    .select({
      fecha: rainfallConagua.fechaEvento,
    })
    .from(rainfallConagua)
    .where(eq(rainfallConagua.conaguaStationId, HERMOSILLO_CONAGUA_STATION_ID))
    .orderBy(desc(rainfallConagua.fechaEvento))
    .limit(1);

  return latestRow?.fecha ?? null;
}

/**
 * Smart sync strategy:
 * 1) Seed the DB from the canonical CONAGUA CSV if the table is empty
 * 2) Extend beyond the CSV with Open-Meteo up to yesterday
 * 3) If CSV is unavailable, Open-Meteo can populate the whole history as fallback
 */
async function syncRainfallDatabase(): Promise<void> {
  if (!isDbConfigured()) {
    return;
  }

  let latestDate = await getLatestDatabaseRainDate();

  if (!latestDate) {
    try {
      const seedRows = loadHistoricalRainSeedRows();
      await upsertRainfallRows(seedRows);
      latestDate = await getLatestDatabaseRainDate();
    } catch {
      // fallback handled below
    }
  }

  const endDate = getYesterdayIsoDate();

  if (!latestDate) {
    try {
      const openMeteoRows = await loadOpenMeteoRainData({
        startDate: '1961-01-01',
        endDate,
      });
      await upsertRainfallRows(mapOpenMeteoRowsToDbRows(openMeteoRows));
      return;
    } catch {
      return;
    }
  }

  if (latestDate >= endDate) {
    return;
  }

  try {
    const startDate = addDays(latestDate, 1);
    if (startDate > endDate) {
      return;
    }

    const openMeteoRows = await loadOpenMeteoRainData({
      startDate,
      endDate,
    });
    await upsertRainfallRows(mapOpenMeteoRowsToDbRows(openMeteoRows));
  } catch {
    // If refresh fails, keep existing DB data and continue.
  }
}

/**
 * Priority:
 * 1) In auto mode, if DATABASE_URL is configured, Neon DB is the primary source
 * 2) RAINFALL_SOURCE=db|neon -> Neon DB only
 * 3) RAINFALL_SOURCE=open-meteo -> Open-Meteo only
 * 4) RAINFALL_SOURCE=conagua -> CSV only
 * 5) auto (default) without DB -> CSV first, then Open-Meteo fallback
 */
export async function loadBestAvailableRainData(): Promise<{
  records: HistoricalRainRecord[];
  source: RainfallDataSource | null;
}> {
  const sourcePref = (process.env.RAINFALL_SOURCE ?? 'auto').toLowerCase();
  const forceDatabase = ['db', 'database', 'neon', 'neon_db'].includes(sourcePref);
  const forceOpenMeteo = sourcePref === 'open-meteo' || sourcePref === 'open_meteo';
  const forceConagua = sourcePref === 'conagua' || sourcePref === 'conagua_csv';
  let csvRecords: HistoricalRainRecord[] = [];
  let csvSourceShouldBeUsed = false;

  if (forceDatabase || (!forceOpenMeteo && !forceConagua && isDbConfigured())) {
    try {
      await syncRainfallDatabase();
      const dbRecords = await loadDatabaseRainData();
      if (dbRecords.length > 0) {
        return { records: dbRecords, source: 'neon_db' };
      }

      if (forceDatabase) {
        return { records: [], source: 'neon_db' };
      }
    } catch {
      if (forceDatabase) {
        return { records: [], source: 'neon_db' };
      }
    }
  }

  if (!forceOpenMeteo) {
    try {
      csvRecords = loadHistoricalRainData();
      if (csvRecords.length > 0) {
        const newestCsvYear = Math.max(...csvRecords.map((r) => r.año));
        const currentYear = new Date().getFullYear();
        const csvLooksStale = newestCsvYear < currentYear - 1;

        if (forceConagua || !csvLooksStale) {
          return { records: csvRecords, source: 'conagua_csv' };
        }

        csvSourceShouldBeUsed = true;
      }
    } catch {
      // fallback handled below
    }
  }

  if (!forceConagua) {
    try {
      const apiRecords = await loadOpenMeteoRainData();
      if (apiRecords.length > 0) {
        return { records: apiRecords, source: 'open_meteo' };
      }
    } catch {
      // handled by empty return below
    }
  }

  if (csvSourceShouldBeUsed && csvRecords.length > 0) {
    return { records: csvRecords, source: 'conagua_csv' };
  }

  return { records: [], source: null };
}
