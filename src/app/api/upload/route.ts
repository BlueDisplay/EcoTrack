import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { put } from '@vercel/blob';

// Max file size: 10 MB
const MAX_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const maxDuration = 30;

function sanitizeFilename(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export async function POST(request: NextRequest) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json(
      { detail: 'Invalid multipart/form-data request' },
      { status: 400 },
    );
  }

  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return NextResponse.json(
      { detail: 'No file provided or file is empty' },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { detail: `Unsupported file type: ${file.type}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
      { status: 400 },
    );
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { detail: 'File too large. Maximum size is 10 MB.' },
      { status: 400 },
    );
  }

  try {
    const safeName = sanitizeFilename(file.name || 'report.jpg');
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;

    // Production path (persistent storage via Vercel Blob)
    if (blobToken) {
      const blob = await put(`reports/${randomUUID()}-${safeName}`, file, {
        access: 'public',
        token: blobToken,
      });

      return NextResponse.json({
        url: blob.url,
        filename: safeName,
        blobKey: blob.pathname,
        mime: file.type,
        size: file.size,
        storage: 'vercel_blob',
      });
    }

    // Check if we're on Vercel (read-only filesystem) — can't use local fallback
    if (process.env.VERCEL) {
      return NextResponse.json(
        { detail: 'Almacenamiento de imágenes no configurado. El administrador debe agregar BLOB_READ_WRITE_TOKEN en las variables de entorno de Vercel.' },
        { status: 503 },
      );
    }

    // Development fallback (local filesystem — non-persistent on serverless)
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext = safeName.split('.').pop() || 'jpg';
    const filename = `${randomUUID()}.${ext}`;
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(path.join(uploadsDir, filename), buffer);

    const origin = new URL(request.url).origin;
    return NextResponse.json({
      url: `${origin}/uploads/${filename}`,
      filename,
      blobKey: null,
      mime: file.type,
      size: file.size,
      storage: 'local_public',
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { detail: 'Failed to save uploaded file' },
      { status: 500 },
    );
  }
}
