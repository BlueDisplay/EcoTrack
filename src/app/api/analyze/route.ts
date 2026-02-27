import { NextRequest, NextResponse } from 'next/server';

const ROBOFLOW_API_KEY = process.env.ROBOFLOW_API_KEY ?? '';
const ROBOFLOW_MODEL = process.env.ROBOFLOW_MODEL ?? 'visual-pollution-detection-04jk5/3';

// Give Roboflow enough time — hobby = 10s, pro = 60s
export const maxDuration = 60;

// ─── Demo fallback when Roboflow is unavailable ─────────────────────────────

function generateDemoDetections(width: number, height: number) {
  const classes = ['plastic', 'debris', 'tire', 'plastic', 'debris'];
  const count = 2 + Math.floor(Math.random() * 3); // 2-4 detections
  const predictions = [];

  for (let i = 0; i < count; i++) {
    const boxW = 40 + Math.random() * (width * 0.18);
    const boxH = 40 + Math.random() * (height * 0.18);
    predictions.push({
      class: classes[i % classes.length],
      confidence: 0.65 + Math.random() * 0.3,
      x: boxW / 2 + Math.random() * (width - boxW),
      y: boxH / 2 + Math.random() * (height - boxH),
      width: boxW,
      height: boxH,
    });
  }

  return { predictions, image: { width, height }, _demo: true };
}

function imageDimensionsFromBytes(buf: Buffer): { width: number; height: number } {
  // Quick JPEG/PNG dimension parse — fallback 640×480
  try {
    // PNG
    if (buf[0] === 0x89 && buf[1] === 0x50) {
      return {
        width: buf.readUInt32BE(16),
        height: buf.readUInt32BE(20),
      };
    }
    // JPEG — scan for SOF0 marker (0xFF 0xC0)
    for (let i = 0; i < buf.length - 10; i++) {
      if (buf[i] === 0xff && buf[i + 1] === 0xc0) {
        return {
          height: buf.readUInt16BE(i + 5),
          width: buf.readUInt16BE(i + 7),
        };
      }
    }
  } catch {
    // ignore
  }
  return { width: 640, height: 480 };
}

// ─── POST handler ───────────────────────────────────────────────────────────

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
  const imageBuffer = Buffer.from(imageBytes);

  // ─── Demo fallback when API key is not configured ─────────────────────
  if (!ROBOFLOW_API_KEY) {
    const dims = imageDimensionsFromBytes(imageBuffer);
    const demo = generateDemoDetections(dims.width, dims.height);
    return NextResponse.json(demo);
  }

  // ─── Real Roboflow inference ──────────────────────────────────────────
  const base64Image = imageBuffer.toString('base64');
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
      console.error(`Roboflow error (${response.status}):`, errorText.slice(0, 500));

      // Fallback to demo on Roboflow errors so the feature still works
      const dims = imageDimensionsFromBytes(imageBuffer);
      const demo = generateDemoDetections(dims.width, dims.height);
      return NextResponse.json(demo);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Roboflow fetch error:', error);

    // On any network/timeout error, fall back to demo detections
    const dims = imageDimensionsFromBytes(imageBuffer);
    const demo = generateDemoDetections(dims.width, dims.height);
    return NextResponse.json(demo);
  }
}
