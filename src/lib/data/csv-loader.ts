// ─── CSV data loading & processing (server-side) ───────────────────────────
// Executes in Node.js at build/request time, never bundled to the client

import Papa from 'papaparse';
import { readFileSync } from 'fs';
import path from 'path';

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

export type RainfallDataSource = 'conagua_csv' | 'open_meteo';

type RawHistoricalRainRecord = Record<string, unknown> & {
  año?: number | string;
  anio?: number | string;
  mes?: number | string;
  precipitacion?: number | string;
  precipitacion_mm?: number | string;
  fecha?: string;
};

interface OpenMeteoArchiveResponse {
  daily?: {
    time?: string[];
    precipitation_sum?: Array<number | null>;
  };
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
export function loadHistoricalRainData(): HistoricalRainRecord[] {
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

  return data
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
 * Priority:
 * 1) RAINFALL_SOURCE=open-meteo -> Open-Meteo only
 * 2) RAINFALL_SOURCE=conagua -> CSV only
 * 3) auto (default) -> CSV first, then Open-Meteo fallback
 */
export async function loadBestAvailableRainData(): Promise<{
  records: HistoricalRainRecord[];
  source: RainfallDataSource | null;
}> {
  const sourcePref = (process.env.RAINFALL_SOURCE ?? 'auto').toLowerCase();
  const forceOpenMeteo = sourcePref === 'open-meteo' || sourcePref === 'open_meteo';
  const forceConagua = sourcePref === 'conagua' || sourcePref === 'conagua_csv';
  let csvRecords: HistoricalRainRecord[] = [];
  let csvSourceShouldBeUsed = false;

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
