import { NextRequest, NextResponse } from 'next/server';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY ?? '';
const ROBOFLOW_MODEL = process.env.ROBOFLOW_MODEL ?? 'visual-pollution-detection-04jk5/3';

// Extend timeout for Roboflow (Vercel Pro only — Hobby caps at 10s)
export const maxDuration = 30;

export async function POST(request: NextRequest) {
  if (!ROBOFLOW_API_KEY) {
    return NextResponse.json(
      { detail: 'Server not configured: missing ROBOFLOW_API_KEY' },
      { status: 501 },
    );
  }

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

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { detail: `Unsupported file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}` },
      { status: 400 },
    );
  }

  // Validate file size (max 10 MB)
  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { detail: 'File too large. Maximum size is 10 MB.' },
      { status: 400 },
    );
  }

  const imageBytes = await file.arrayBuffer();
  const base64Image = Buffer.from(imageBytes).toString('base64');
  const url = `https://detect.roboflow.com/${ROBOFLOW_MODEL}?api_key=${ROBOFLOW_API_KEY}`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);

    const response = await fetch(url, {
      method: 'POST',
      body: base64Image,
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      return NextResponse.json(
        {
          detail: `Roboflow error (${response.status}): ${errorText.slice(0, 200)}`,
          message: 'Roboflow returned an error',
          status_code: response.status,
          body: errorText,
        },
        { status: 502 },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json(
        { detail: 'Roboflow request timed out' },
        { status: 504 },
      );
    }
    return NextResponse.json(
      { detail: 'Roboflow request failed' },
      { status: 502 },
    );
  }
}
