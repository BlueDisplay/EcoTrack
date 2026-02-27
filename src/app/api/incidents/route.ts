import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db';
import { incidents } from '@/lib/db/schema';
import { desc } from 'drizzle-orm';
import { incidentSchema } from '@/lib/schemas/incident';
import { randomUUID } from 'crypto';

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
  const limit = Math.min(Math.max(rawLimit, 1), 2000);

  try {
    const rows = await db
      .select()
      .from(incidents)
      .orderBy(desc(incidents.fechaEvento), desc(incidents.createdAt))
      .limit(limit);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching incidents:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch incidents' },
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

  const parsed = incidentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Validation error', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const id = data.id || `inc-${randomUUID().replace(/-/g, '')}`;

  try {
    const [row] = await db
      .insert(incidents)
      .values({
        id,
        fechaEvento: data.fechaEvento,
        fechaPublicacion: data.fechaPublicacion,
        titulo: data.titulo,
        medio: data.medio,
        autora: data.autora,
        urlNoticia: data.urlNoticia,
        direccionDetectada: data.direccionDetectada,
        colonia: data.colonia,
        urlMaps: data.urlMaps || undefined,
        lat: data.lat,
        lon: data.lon,
        mmLluviaReportados: data.mmLluviaReportados,
        afectacionesReportadas: data.afectacionesReportadas,
        gravedad: data.gravedad,
        notas: data.notas,
        conaguaStationId: data.conaguaStationId,
        status: data.status,
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Error creating incident:', error);
    return NextResponse.json(
      { detail: 'Failed to create incident' },
      { status: 500 },
    );
  }
}
