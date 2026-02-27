// ─── Vercel Blob storage for report images ──────────────────────────────────
// Client-side: uploads to our API, which forwards to Vercel Blob

export interface UploadedReportImage {
  url: string;
  blobKey: string | null;
  mime: string;
  size: number;
}

export async function uploadReportImage(file: File): Promise<UploadedReportImage> {
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
  return {
    url: data.url as string,
    blobKey: (data.blobKey as string | null) ?? null,
    mime: (data.mime as string) || file.type,
    size: Number(data.size ?? file.size),
  };
}
