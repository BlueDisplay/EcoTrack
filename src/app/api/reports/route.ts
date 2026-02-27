import { NextRequest, NextResponse } from 'next/server';
import { isDbConfigured } from '@/lib/db';
import { reports } from '@/lib/db/schema';
import { desc, eq } from 'drizzle-orm';
import { reportSchema } from '@/lib/schemas/report';
import { randomUUID } from 'crypto';

function getDatabase() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/db').db;
}

// ─── GET /api/reports ───────────────────────────────────────────────────────

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
      .from(reports)
      .orderBy(desc(reports.createdAt))
      .limit(limit);

    return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching reports:', error);
    return NextResponse.json(
      { detail: 'Failed to fetch reports' },
      { status: 500 },
    );
  }
}

// ─── POST /api/reports ──────────────────────────────────────────────────────

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

  const parsed = reportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { detail: 'Validation error', errors: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const id = `rep-${randomUUID().replace(/-/g, '')}`;

  try {
    const [row] = await db
      .insert(reports)
      .values({
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
      })
      .returning();

    return NextResponse.json(row, { status: 201 });
  } catch (error) {
    console.error('Error creating report:', error);
    return NextResponse.json(
      { detail: 'Failed to create report' },
      { status: 500 },
    );
  }
}

// ─── PATCH /api/reports (update status) ─────────────────────────────────────

export async function PATCH(request: NextRequest) {
  if (!isDbConfigured()) {
    return NextResponse.json(
      { detail: 'Database not configured' },
      { status: 503 },
    );
  }

  const db = getDatabase();
  let body: { id: string; status: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { detail: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  if (!body.id || !body.status) {
    return NextResponse.json(
      { detail: 'Missing required fields: id, status' },
      { status: 400 },
    );
  }

  const validStatuses = ['enviado', 'revision', 'atendido'];
  if (!validStatuses.includes(body.status)) {
    return NextResponse.json(
      { detail: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const [updated] = await db
      .update(reports)
      .set({ status: body.status })
      .where(eq(reports.id, body.id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { detail: 'Report not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating report:', error);
    return NextResponse.json(
      { detail: 'Failed to update report' },
      { status: 500 },
    );
  }
}
