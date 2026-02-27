import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { neon } from '@neondatabase/serverless';

const ROOT_DIR = process.cwd();
const ENV_FILES = ['.env.local', '.env'];
const CSV_PATH = path.join(ROOT_DIR, 'public', 'data', 'hermosillo_lluvias_historicas.csv');
const CONAGUA_SOURCE_URL = 'https://www.gob.mx/conagua';
const OPEN_METEO_SOURCE_URL = 'https://archive-api.open-meteo.com/v1/archive';
const BATCH_SIZE = 200;
const HERMOSILLO_STATION_ID = '26139';
const HERMOSILLO_STATION_NAME = 'HERMOSILLO II (DGE)';
const HERMOSILLO_COORDS = {
  latitude: 29.072967,
  longitude: -110.955919,
};

function loadEnvFiles() {
  for (const fileName of ENV_FILES) {
    const filePath = path.join(ROOT_DIR, fileName);
    if (!fs.existsSync(filePath)) continue;

    const content = fs.readFileSync(filePath, 'utf8');
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;

      const separatorIndex = line.indexOf('=');
      if (separatorIndex <= 0) continue;

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  }
}

function toNullableNumber(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string') return null;

  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function chunk(items, size) {
  const chunks = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function addDays(date, days) {
  const base = new Date(`${date}T12:00:00Z`);
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

function getYesterdayIsoDate() {
  const today = new Date();
  today.setUTCDate(today.getUTCDate() - 1);
  return today.toISOString().slice(0, 10);
}

function normalizeRows(rows) {
  return rows
    .map((row) => {
      const fechaEvento = typeof row.fecha === 'string' ? row.fecha.trim() : '';
      const conaguaStationId = row.estacion_id != null ? String(row.estacion_id).trim() : '';
      const estacionNombre = typeof row.estacion === 'string' ? row.estacion.trim() : '';
      const precipitacionMm = toNullableNumber(row.precipitacion_mm);

      if (!fechaEvento || !conaguaStationId || !estacionNombre || precipitacionMm == null) {
        return null;
      }

      return {
        conaguaStationId,
        fechaEvento,
        estacionNombre,
        precipitacionMm,
        evaporacionMm: toNullableNumber(row.evaporacion_mm),
        tempMaxC: toNullableNumber(row.temp_max_c),
        tempMinC: toNullableNumber(row.temp_min_c),
        lat: toNullableNumber(row.latitud),
        lon: toNullableNumber(row.longitud),
        fuenteUrl: CONAGUA_SOURCE_URL,
      };
    })
    .filter((row) => row !== null);
}

async function fetchOpenMeteoRows(startDate, endDate) {
  if (startDate > endDate) return [];

  const url = new URL(OPEN_METEO_SOURCE_URL);
  url.searchParams.set('latitude', String(HERMOSILLO_COORDS.latitude));
  url.searchParams.set('longitude', String(HERMOSILLO_COORDS.longitude));
  url.searchParams.set('start_date', startDate);
  url.searchParams.set('end_date', endDate);
  url.searchParams.set('daily', 'precipitation_sum');
  url.searchParams.set('timezone', 'America/Hermosillo');

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo respondió ${response.status}`);
  }

  const payload = await response.json();
  const dates = payload?.daily?.time ?? [];
  const mmSeries = payload?.daily?.precipitation_sum ?? [];

  if (!Array.isArray(dates) || !Array.isArray(mmSeries) || dates.length !== mmSeries.length) {
    return [];
  }

  return dates
    .map((fechaEvento, index) => {
      const precipitacionMm = toNullableNumber(mmSeries[index]);
      if (typeof fechaEvento !== 'string' || !fechaEvento || precipitacionMm == null || precipitacionMm < 0) {
        return null;
      }

      return {
        conaguaStationId: HERMOSILLO_STATION_ID,
        fechaEvento,
        estacionNombre: HERMOSILLO_STATION_NAME,
        precipitacionMm,
        evaporacionMm: null,
        tempMaxC: null,
        tempMinC: null,
        lat: HERMOSILLO_COORDS.latitude,
        lon: HERMOSILLO_COORDS.longitude,
        fuenteUrl: OPEN_METEO_SOURCE_URL,
      };
    })
    .filter((row) => row !== null);
}

async function upsertRows(sql, rows) {
  const batches = chunk(rows, BATCH_SIZE);

  for (const batch of batches) {
    await sql.transaction(
      batch.map((row) => sql`
        INSERT INTO rainfall_conagua (
          conagua_station_id,
          fecha_evento,
          estacion_nombre,
          precipitacion_mm,
          evaporacion_mm,
          temp_max_c,
          temp_min_c,
          lat,
          lon,
          fuente_url
        ) VALUES (
          ${row.conaguaStationId},
          ${row.fechaEvento},
          ${row.estacionNombre},
          ${row.precipitacionMm},
          ${row.evaporacionMm},
          ${row.tempMaxC},
          ${row.tempMinC},
          ${row.lat},
          ${row.lon},
          ${row.fuenteUrl}
        )
        ON CONFLICT (conagua_station_id, fecha_evento)
        DO UPDATE SET
          estacion_nombre = EXCLUDED.estacion_nombre,
          precipitacion_mm = EXCLUDED.precipitacion_mm,
          evaporacion_mm = EXCLUDED.evaporacion_mm,
          temp_max_c = EXCLUDED.temp_max_c,
          temp_min_c = EXCLUDED.temp_min_c,
          lat = EXCLUDED.lat,
          lon = EXCLUDED.lon,
          fuente_url = EXCLUDED.fuente_url,
          ingested_at = NOW()
      `),
    );
  }
}

async function main() {
  loadEnvFiles();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL no está configurado en el entorno ni en .env.local');
  }

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`No se encontró el CSV en ${CSV_PATH}`);
  }

  const csvText = fs.readFileSync(CSV_PATH, 'utf8');
  const { data, errors } = Papa.parse(csvText, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    throw new Error(`Error al parsear CSV: ${errors[0].message}`);
  }

  const rows = normalizeRows(data);
  if (rows.length === 0) {
    throw new Error('El CSV no produjo registros válidos');
  }

  const sql = neon(databaseUrl);

  const beforeCountResult = await sql('SELECT COUNT(*)::int AS count FROM rainfall_conagua');
  const beforeCount = beforeCountResult[0]?.count ?? 0;
  await upsertRows(sql, rows);

  const latestRow = await sql(`
    SELECT MAX(fecha_evento)::text AS max_fecha
    FROM rainfall_conagua
    WHERE conagua_station_id = '26139'
  `);
  const latestDate = latestRow[0]?.max_fecha ?? null;
  const endDate = getYesterdayIsoDate();

  let openMeteoRows = [];
  if (latestDate && latestDate < endDate) {
    openMeteoRows = await fetchOpenMeteoRows(addDays(latestDate, 1), endDate);
    await upsertRows(sql, openMeteoRows);
  }

  const afterCountResult = await sql(`
    SELECT
      COUNT(*)::int AS count,
      MIN(fecha_evento)::text AS min_fecha,
      MAX(fecha_evento)::text AS max_fecha,
      COUNT(*) FILTER (WHERE fuente_url = '${OPEN_METEO_SOURCE_URL}')::int AS open_meteo_count
    FROM rainfall_conagua
    WHERE conagua_station_id = '26139'
  `);

  const summary = afterCountResult[0] ?? {};
  console.log(
    JSON.stringify(
      {
        importedCsvRows: rows.length,
        importedOpenMeteoRows: openMeteoRows.length,
        tableCountBefore: beforeCount,
        stationCountAfter: summary.count ?? 0,
        minFecha: summary.min_fecha ?? null,
        maxFecha: summary.max_fecha ?? null,
        openMeteoRowsInDb: summary.open_meteo_count ?? 0,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
