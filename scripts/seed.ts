/**
 * Seed script — populates the Neon database with sample reports and an admin user.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires DATABASE_URL in .env.local or environment.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { reports, users } from '../src/lib/db/schema';
import { randomUUID } from 'crypto';

// ─── Load .env.local ────────────────────────────────────────────────────────
import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env.local may not exist */ }

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

// ─── Hermosillo sample reports ──────────────────────────────────────────────

const SAMPLE_REPORTS = [
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-09-15',
    titulo: 'Inundación Vado del Río',
    direccion: 'Blvd. Vado del Río y Colosio',
    colonia: 'Villa de Seris',
    gravedad: 'alto' as const,
    descripcion: 'Inundación severa por lluvias torrenciales, vehículos varados y tránsito cerrado.',
    mmLluvia: 85,
    tipoEvento: 'inundacion',
    medio: 'reporte_ciudadano',
    tipoReporte: 'ciudadano',
    detectadoAi: false,
    status: 'revision',
    lat: 29.0688,
    lon: -110.9613,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-08-22',
    titulo: 'Basura acumulada en arroyo',
    direccion: 'Col. Pimentel entre Yáñez y Garmendia',
    colonia: 'Pimentel',
    gravedad: 'medio' as const,
    descripcion: 'Gran cantidad de residuos sólidos acumulados en el cauce del arroyo, obstruyendo el flujo.',
    mmLluvia: 0,
    tipoEvento: 'contaminacion',
    medio: 'detector_ia',
    tipoReporte: 'ciudadano',
    detectadoAi: true,
    aiConfidence: 0.87,
    status: 'enviado',
    lat: 29.0892,
    lon: -110.9551,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-07-30',
    titulo: 'Socavón en calle tras lluvia',
    direccion: 'Blvd. Morelos y Reforma',
    colonia: 'Centro',
    gravedad: 'critico' as const,
    descripcion: 'Socavón de 2 metros de profundidad tras tormenta. Peligro para peatones y vehículos.',
    mmLluvia: 65,
    tipoEvento: 'infraestructura',
    medio: 'proteccion_civil',
    tipoReporte: 'autoridad',
    detectadoAi: false,
    status: 'atendido',
    lat: 29.0729,
    lon: -110.9559,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-10-03',
    titulo: 'Desbordamiento canal pluvial',
    direccion: 'Canal pluvial Norte, altura de Solidaridad',
    colonia: 'Solidaridad',
    gravedad: 'alto' as const,
    descripcion: 'El canal pluvial norte se desbordó afectando a 15 viviendas de la colonia.',
    mmLluvia: 72,
    tipoEvento: 'inundacion',
    medio: 'reporte_ciudadano',
    tipoReporte: 'ciudadano',
    detectadoAi: false,
    status: 'revision',
    lat: 29.1105,
    lon: -110.9483,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-06-18',
    titulo: 'Contaminación visual zona comercial',
    direccion: 'Av. Serna y Periférico Norte',
    colonia: 'Las Quintas',
    gravedad: 'bajo' as const,
    descripcion: 'Acumulación de basura en terreno baldío junto a zona comercial.',
    mmLluvia: 0,
    tipoEvento: 'contaminacion',
    medio: 'detector_ia',
    tipoReporte: 'ciudadano',
    detectadoAi: true,
    aiConfidence: 0.92,
    status: 'enviado',
    lat: 29.1023,
    lon: -110.9781,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-09-01',
    titulo: 'Anegación blvd. Luis Encinas',
    direccion: 'Blvd. Luis Encinas y Rosales',
    colonia: 'Country Club',
    gravedad: 'medio' as const,
    descripcion: 'Nivel de agua de 40cm en la vialidad por falta de drenaje pluvial.',
    mmLluvia: 45,
    tipoEvento: 'inundacion',
    medio: 'redes_sociales',
    tipoReporte: 'ciudadano',
    detectadoAi: false,
    status: 'atendido',
    lat: 29.0856,
    lon: -110.9714,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-08-10',
    titulo: 'Llantas y escombros en lecho de río',
    direccion: 'Puente peatonal Río Sonora, Col. Olivares',
    colonia: 'Olivares',
    gravedad: 'medio' as const,
    descripcion: 'Más de 50 llantas y materiales de construcción tirados en el lecho seco del río.',
    mmLluvia: 0,
    tipoEvento: 'contaminacion',
    medio: 'detector_ia',
    tipoReporte: 'ciudadano',
    detectadoAi: true,
    aiConfidence: 0.78,
    status: 'enviado',
    lat: 29.0704,
    lon: -110.9472,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-10-12',
    titulo: 'Alcantarilla colapsada tras lluvia',
    direccion: 'Blvd. Hidalgo y Nayarit',
    colonia: 'Modelo',
    gravedad: 'alto' as const,
    descripcion: 'La alcantarilla pluvial colapsó creando un hundimiento de 1.5m. Protección Civil acordonó la zona.',
    mmLluvia: 58,
    tipoEvento: 'infraestructura',
    medio: 'proteccion_civil',
    tipoReporte: 'autoridad',
    detectadoAi: false,
    status: 'revision',
    lat: 29.0775,
    lon: -110.9398,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-07-05',
    titulo: 'Tiradero clandestino detectado',
    direccion: 'Cerro de la Campana, ladera sur',
    colonia: 'Cerro de la Campana',
    gravedad: 'alto' as const,
    descripcion: 'Tiradero clandestino de aproximadamente 200m² con residuos domésticos y de construcción.',
    mmLluvia: 0,
    tipoEvento: 'contaminacion',
    medio: 'detector_ia',
    tipoReporte: 'ciudadano',
    detectadoAi: true,
    aiConfidence: 0.95,
    status: 'enviado',
    lat: 29.0813,
    lon: -110.9637,
  },
  {
    id: `rep-${randomUUID()}`,
    fechaEvento: '2025-09-28',
    titulo: 'Inundación paso a desnivel Quiroga',
    direccion: 'Paso a desnivel Quiroga y Periférico',
    colonia: 'San Benito',
    gravedad: 'critico' as const,
    descripcion: 'Paso inferior completamente inundado con 1.8m de agua. Se rescataron 3 personas.',
    mmLluvia: 95,
    tipoEvento: 'inundacion',
    medio: 'proteccion_civil',
    tipoReporte: 'autoridad',
    detectadoAi: false,
    status: 'atendido',
    lat: 29.0643,
    lon: -110.9826,
  },
];

// ─── Admin user ─────────────────────────────────────────────────────────────

const ADMIN_USER = {
  id: `usr-${randomUUID()}`,
  email: 'admin@ecotrack.mx',
  name: 'Admin EcoTrack',
  role: 'admin',
};

// ─── Run seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Insert reports
  console.log(`📝 Inserting ${SAMPLE_REPORTS.length} sample reports...`);
  for (const report of SAMPLE_REPORTS) {
    await db.insert(reports).values(report).onConflictDoNothing();
  }
  console.log('   ✅ Reports inserted');

  // Insert admin user
  console.log('👤 Inserting admin user...');
  await db.insert(users).values(ADMIN_USER).onConflictDoNothing();
  console.log('   ✅ Admin user inserted');

  console.log('\n🎉 Seed complete!');
  console.log(`   Reports: ${SAMPLE_REPORTS.length}`);
  console.log(`   Users: 1 (admin@ecotrack.mx)`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
