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

// Demo detections for fallback when the backend/API is unavailable
const DEMO_DETECTIONS: Detection[] = [
  { class: 'plastic', confidence: 0.92, x: 200, y: 150, width: 120, height: 80 },
  { class: 'tire', confidence: 0.87, x: 450, y: 300, width: 100, height: 100 },
  { class: 'debris', confidence: 0.78, x: 120, y: 400, width: 150, height: 60 },
];

export async function analyzeImage(
  file: File,
  options: { demoMode?: boolean } = {},
): Promise<AnalysisResult> {
  // Demo mode: return simulated detections
  if (options.demoMode) {
    await new Promise((r) => setTimeout(r, 1500)); // simulate latency
    return {
      predictions: DEMO_DETECTIONS,
      image: { width: 640, height: 480 },
    };
  }

  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  // If the server doesn't have the API key configured, fall back to demo mode
  if (res.status === 501) {
    console.warn('Backend ROBOFLOW_API_KEY not configured — falling back to demo mode');
    return analyzeImage(file, { demoMode: true });
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Analysis failed: ${res.status}`);
  }

  return res.json();
}
