import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { neon } from '@neondatabase/serverless';

const ROOT_DIR = process.cwd();
const ENV_FILES = ['.env.local', '.env'];
const CSV_PATH = path.join(ROOT_DIR, 'public', 'data', 'hermosillo_lluvias_historicas.csv');
const SOURCE_LABEL = 'csv_conagua';
const BATCH_SIZE = 200;

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
      };
    })
    .filter((row) => row !== null);
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
  const batches = chunk(rows, BATCH_SIZE);

  const beforeCountResult = await sql('SELECT COUNT(*)::int AS count FROM rainfall_conagua');
  const beforeCount = beforeCountResult[0]?.count ?? 0;

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
          ${SOURCE_LABEL}
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

  const afterCountResult = await sql(`
    SELECT
      COUNT(*)::int AS count,
      MIN(fecha_evento)::text AS min_fecha,
      MAX(fecha_evento)::text AS max_fecha
    FROM rainfall_conagua
    WHERE conagua_station_id = '26139'
  `);

  const summary = afterCountResult[0] ?? {};
  console.log(
    JSON.stringify(
      {
        importedRows: rows.length,
        tableCountBefore: beforeCount,
        stationCountAfter: summary.count ?? 0,
        minFecha: summary.min_fecha ?? null,
        maxFecha: summary.max_fecha ?? null,
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
