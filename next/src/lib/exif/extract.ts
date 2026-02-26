// ─── EXIF extraction from images ────────────────────────────────────────────
// Uses the exif-js library to extract GPS coordinates from JPEG metadata.
// This is client-only (needs FileReader/DOM).

import EXIF from 'exif-js';

export interface ExifLocation {
  lat: number;
  lon: number;
  altitude?: number;
  dateTime?: string;
}

/**
 * Convert EXIF GPS coordinates (degrees, minutes, seconds) to decimal degrees.
 */
function dmsToDecimal(dms: number[], ref: string): number {
  if (!dms || dms.length < 3) return 0;
  let decimal = dms[0] + dms[1] / 60 + dms[2] / 3600;
  if (ref === 'S' || ref === 'W') {
    decimal = -decimal;
  }
  return decimal;
}

/**
 * Extract GPS location and metadata from an image file.
 * Returns null if no GPS data is found.
 */
export function extractExifData(file: File): Promise<ExifLocation | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = function () {
      const img = document.createElement('img');
      img.src = reader.result as string;

      img.onload = function () {
        try {
          EXIF.getData(img as unknown as string, function (this: unknown) {
            const exifData = this as Record<string, unknown>;

            const gpsLat = EXIF.getTag(exifData, 'GPSLatitude') as number[] | undefined;
            const gpsLatRef = EXIF.getTag(exifData, 'GPSLatitudeRef') as string | undefined;
            const gpsLon = EXIF.getTag(exifData, 'GPSLongitude') as number[] | undefined;
            const gpsLonRef = EXIF.getTag(exifData, 'GPSLongitudeRef') as string | undefined;
            const gpsAlt = EXIF.getTag(exifData, 'GPSAltitude') as number | undefined;
            const dateTime = EXIF.getTag(exifData, 'DateTimeOriginal') as string | undefined;

            if (!gpsLat || !gpsLon || !gpsLatRef || !gpsLonRef) {
              resolve(null);
              return;
            }

            const lat = dmsToDecimal(gpsLat, gpsLatRef);
            const lon = dmsToDecimal(gpsLon, gpsLonRef);

            if (lat === 0 && lon === 0) {
              resolve(null);
              return;
            }

            resolve({
              lat,
              lon,
              altitude: gpsAlt ? Number(gpsAlt) : undefined,
              dateTime: dateTime || undefined,
            });
          });
        } catch {
          resolve(null);
        }
      };

      img.onerror = () => resolve(null);
    };

    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}
