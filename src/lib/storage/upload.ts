// ─── Vercel Blob storage for report images ──────────────────────────────────
// Client-side: uploads to our API, which forwards to Vercel Blob

export async function uploadReportImage(file: File): Promise<string> {
  // For now, we use a simple upload endpoint
  // Later this can be upgraded to use Vercel Blob's client upload
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Failed to upload image');
  }

  const data = await res.json();
  return data.url;
}
