// ─── CSV data loading & processing (server-side) ───────────────────────────
// Executes in Node.js at build/request time, never bundled to the client

import Papa from 'papaparse';
import { readFileSync } from 'fs';
import path from 'path';

export interface HistoricalRainRecord {
  año: number;
  mes: string;
  precipitacion: number;
  [key: string]: unknown;
}

export interface HydroEvent {
  id: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  lat: number;
  lon: number;
  gravedad: string;
  mm_lluvia: number;
  tipo_evento: string;
  medio: string;
  url_noticia: string;
  [key: string]: unknown;
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
  const { data } = Papa.parse<HistoricalRainRecord>(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return data;
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
