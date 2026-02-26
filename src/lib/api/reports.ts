import type { Report } from '@/lib/db/schema';

const API_BASE = '';

// ─── Reports ────────────────────────────────────────────────────────────────

export async function fetchReports(limit = 500): Promise<Report[]> {
  const res = await fetch(`${API_BASE}/api/reports?limit=${limit}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch reports: ${res.status}`);
  }
  return res.json();
}

export async function createReport(
  data: Record<string, unknown>,
): Promise<Report> {
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Failed to create report: ${res.status}`);
  }
  return res.json();
}

export async function updateReportStatus(
  id: string,
  status: string,
): Promise<Report> {
  const res = await fetch(`${API_BASE}/api/reports`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, status }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail || `Failed to update report: ${res.status}`);
  }
  return res.json();
}
