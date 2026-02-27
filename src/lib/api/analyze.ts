// ─── Roboflow analysis API client ───────────────────────────────────────────
// Communicates with our own /api/analyze proxy, never directly with Roboflow

export interface Detection {
  class: string;
  confidence: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnalysisResult {
  predictions: Detection[];
  image: { width: number; height: number };
}

export async function analyzeImage(file: File): Promise<AnalysisResult> {
  const formData = new FormData();
  formData.append('file', file);

  let res: Response;
  try {
    res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData,
    });
  } catch (networkErr) {
    // Network / CORS / connection error — fetch itself threw
    const detail =
      networkErr instanceof Error ? networkErr.message : 'Error de red';
    throw new Error(`No se pudo conectar al servidor: ${detail}`);
  }

  // Try to parse body regardless of status
  let body: Record<string, unknown> | null = null;
  try {
    const text = await res.text();
    body = JSON.parse(text);
  } catch {
    // body is not JSON (e.g. Vercel HTML error page)
  }

  if (!res.ok) {
    const msg =
      (body?.detail as string) ||
      (body?.message as string) ||
      `Error del servidor (${res.status})`;
    throw new Error(msg);
  }

  // Validate that the body has the expected shape
  if (!body || !('predictions' in body) || !('image' in body)) {
    throw new Error(
      'Respuesta inesperada del servidor — intenta de nuevo',
    );
  }

  return body as unknown as AnalysisResult;
}
