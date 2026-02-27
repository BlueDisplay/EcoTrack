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

  const res = await fetch('/api/analyze', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Analysis failed: ${res.status}`);
  }

  return res.json();
}
