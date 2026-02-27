import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db';
import { rainfallConagua } from '@/lib/db/schema';
import { and, desc, eq, gte, lte } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { rainfallRecordSchema } from '@/lib/schemas/rainfall';

function getDatabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/db').db;
}

export async function GET(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { detail: 'Database not configured' },
      { status: 503 },
    );
  }

  const db = getDatabase();
  const { searchParams } = new URL(request.url);
  const rawLimit = Number(searchParams.get('limit') || 500);
  const limit = Math.min(Math.max(rawLimit, 1), 5000);
  const station = searchParams.get('station');
  const dateFrom = searchParams.get('dateFrom');
  const dateTo = searchParams.get('dateTo');

  const conditions: SQL[] = [];
  if (station) conditions.push(eq(rainfallConagua.conaguaStationId, station));
  if (dateFrom) conditions.push(gte(rainfallConagua.fechaEvento, dateFrom));
  if (dateTo) conditions.push(lte(rainfallConagua.fechaEvento, dateTo));

  try {
    const rows =
      conditions.length > 0
        ? await db
            .select()
            .from(rainfallConagua)
            .where(and(...conditions))
            .orderBy(desc(rainfallConagua.fechaEvento))
            .limit(limit)
        : await db
            .select()
            .from(rainfallConagua)
            .orderBy(desc(rainfallConagua.fechaEvento))
            .limit(limit);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching rainfall data:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch rainfall data' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { detail: 'Database not configured' },
      { status: 503 },
    );
  }

  const db = getDatabase();
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const parsed = rainfallRecordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Validation error', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;

  try {
    const [row] = await db
      .insert(rainfallConagua)
      .values({
        conaguaStationId: data.conaguaStationId,
        fechaEvento: data.fechaEvento,
        estacionNombre: data.estacionNombre,
        precipitacionMm: data.precipitacionMm,
        evaporacionMm: data.evaporacionMm,
        tempMaxC: data.tempMaxC,
        tempMinC: data.tempMinC,
        lat: data.lat,
        lon: data.lon,
        fuenteUrl: data.fuenteUrl || undefined,
      })
      .onConflictDoUpdate({
        target: [
          rainfallConagua.conaguaStationId,
          rainfallConagua.fechaEvento,
        ],
        set: {
          estacionNombre: data.estacionNombre,
          precipitacionMm: data.precipitacionMm,
          evaporacionMm: data.evaporacionMm,
          tempMaxC: data.tempMaxC,
          tempMinC: data.tempMinC,
          lat: data.lat,
          lon: data.lon,
          fuenteUrl: data.fuenteUrl || undefined,
          ingestedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Error upserting rainfall record:', error);
    return NextResponse.json(
      { detail: 'Failed to upsert rainfall record' },
      { status: 500 },
    );
  }
}
