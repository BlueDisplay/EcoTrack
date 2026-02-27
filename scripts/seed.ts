/**
 * Seed script - populates the Neon database with an admin user.
 * Incidents are seeded via scripts/seed-incidents.sql.
 * Reports are created by citizens via the detector form (requires photo).
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Requires DATABASE_URL in .env.local or environment.
 */

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { users } from '../src/lib/db/schema';
import { randomUUID } from 'crypto';

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
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql);

const ADMIN_USER = {
  id: `usr-${randomUUID()}`,
  email: 'admin@ecotrack.mx',
  name: 'Admin EcoTrack',
  role: 'admin',
};

async function seed() {
  console.log('Seeding database...');
  await db.insert(users).values(ADMIN_USER).onConflictDoNothing();
  console.log('Admin user inserted');
  console.log('Note: Incidents are seeded via scripts/seed-incidents.sql');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
