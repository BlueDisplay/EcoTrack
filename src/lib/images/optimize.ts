// ─── Client-side image optimization for API uploads ────────────────────────
// Shrinks large photos to avoid 413 (Payload Too Large) on serverless edges.

const QUALITY_STEPS = [0.9, 0.82, 0.74, 0.66, 0.58, 0.5];
const SCALE_STEP = 0.85;
const MIN_DIMENSION = 640;

export interface OptimizeImageOptions {
  maxBytes?: number;
  maxEdge?: number;
}

function inferOutputType(inputType: string): 'image/jpeg' | 'image/webp' {
  return inputType === 'image/webp' ? 'image/webp' : 'image/jpeg';
}

function withOutputExtension(name: string, type: string): string {
  const base = name.replace(/\.[^.]+$/, '');
  const ext = type === 'image/webp' ? 'webp' : 'jpg';
  return `${base}.${ext}`;
}

function clampDimensions(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }

  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No se pudo decodificar la imagen'));
    };

    img.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('No se pudo convertir la imagen'));
          return;
        }
        resolve(blob);
      },
      type,
      quality,
    );
  });
}

function blobToFile(blob: Blob, originalName: string, type: string): File {
  return new File([blob], withOutputExtension(originalName, type), {
    type,
    lastModified: Date.now(),
  });
}

/**
 * Reduce image size for API requests while preserving enough quality for IA.
 * Returns the smallest valid file found; may return original when already small.
 */
export async function optimizeImageForApi(
  file: File,
  options: OptimizeImageOptions = {},
): Promise<File> {
  const maxBytes = options.maxBytes ?? 3_500_000;
  const maxEdge = options.maxEdge ?? 2048;

  if (!file.type.startsWith('image/')) return file;
  if (file.size <= maxBytes) return file;

  const image = await loadImage(file);
  const baseDims = clampDimensions(image.naturalWidth, image.naturalHeight, maxEdge);
  const outputType = inferOutputType(file.type);

  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return file;

  let width = baseDims.width;
  let height = baseDims.height;
  let smallestBlob: Blob | null = null;

  for (let scalePass = 0; scalePass < 6; scalePass += 1) {
    canvas.width = width;
    canvas.height = height;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of QUALITY_STEPS) {
      const blob = await canvasToBlob(canvas, outputType, quality);
      if (!smallestBlob || blob.size < smallestBlob.size) {
        smallestBlob = blob;
      }
      if (blob.size <= maxBytes) {
        return blobToFile(blob, file.name, outputType);
      }
    }

    width = Math.max(MIN_DIMENSION, Math.round(width * SCALE_STEP));
    height = Math.max(MIN_DIMENSION, Math.round(height * SCALE_STEP));
  }

  if (!smallestBlob) return file;
  if (smallestBlob.size >= file.size) return file;

  return blobToFile(smallestBlob, file.name, outputType);
}

