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
    let detail = `Error del servidor (${res.status})`;
    try {
      const body = (await res.json()) as { detail?: string; message?: string };
      detail = body.detail || body.message || detail;
    } catch {
      if (res.status === 413) {
        detail = 'Imagen demasiado grande para subir. Usa una menor a 4 MB.';
      }
    }
    throw new Error(detail);
  }

  const data = await res.json();
  return {
    url: data.url as string,
    blobKey: (data.blobKey as string | null) ?? null,
    mime: (data.mime as string) || file.type,
    size: Number(data.size ?? file.size),
  };
}
