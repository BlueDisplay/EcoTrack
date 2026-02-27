// ─── PDF report generation ──────────────────────────────────────────────────
// Uses jsPDF to create a technical report of AI / manual detections.
// The imageSrc is expected to be the ANNOTATED canvas (with bounding boxes
// and labels already drawn on the image).

import { jsPDF } from 'jspdf';
import type { Detection } from '@/lib/api/analyze';

interface PdfReportData {
  /** data-URL (PNG) of the annotated canvas — includes bounding boxes + labels */
  imageSrc: string;
  detections: Detection[];
  location?: { lat: number; lon: number } | null;
  dateTime?: string;
  fileName?: string;
}

export function generateDetectionPDF(data: PdfReportData): void {
  const doc = new jsPDF();
  const { imageSrc, detections, location, dateTime, fileName } = data;
  const pageW = doc.internal.pageSize.getWidth();

  // ── Header ──
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('EcoTrack - Reporte de Detección', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 30);
  if (fileName) {
    doc.text(`Archivo: ${fileName}`, 14, 36);
  }

  const aiCount = detections.filter((d) => !(d as unknown as Record<string, unknown>)._manual).length;
  const manualCount = detections.length - aiCount;
  const sourceLabel = aiCount > 0 && manualCount > 0
    ? `IA (${aiCount}) + Manual (${manualCount})`
    : aiCount > 0
      ? `IA (${aiCount})`
      : `Manual (${manualCount})`;
  doc.text(`Fuente: ${sourceLabel}`, 14, 42);

  // ── Annotated image (full page width, with bounding boxes visible) ──
  let yPos = 50;
  try {
    // Determine aspect ratio from the data URL to maintain proportions
    const imgW = pageW - 28; // 14mm margin each side
    // Use a 4:3 default ratio; jsPDF stretches to fit — height proportional
    const imgH = imgW * 0.6;
    doc.addImage(imageSrc, 'PNG', 14, yPos, imgW, imgH);
    yPos += imgH + 6;
  } catch {
    doc.setTextColor(200, 0, 0);
    doc.text('[No se pudo incluir la imagen anotada]', 14, yPos + 20);
    yPos += 30;
  }

  // ── Location info ──
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Ubicación', 14, yPos);
  yPos += 7;

  doc.setFontSize(10);
  doc.setTextColor(60);
  if (location) {
    doc.text(`Latitud: ${location.lat.toFixed(6)}   Longitud: ${location.lon.toFixed(6)}`, 14, yPos);
    yPos += 6;
  } else {
    doc.text('Sin datos de ubicación GPS', 14, yPos);
    yPos += 6;
  }

  if (dateTime) {
    doc.text(`Fecha de captura: ${dateTime}`, 14, yPos);
    yPos += 6;
  }

  // ── Detections table ──
  yPos += 6;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Detecciones (${detections.length})`, 14, yPos);
  yPos += 8;

  // Table header
  doc.setFontSize(9);
  doc.setTextColor(255);
  doc.setFillColor(31, 41, 55); // gray-800
  doc.rect(14, yPos - 5, 182, 8, 'F');
  doc.text('#', 18, yPos);
  doc.text('Clase', 30, yPos);
  doc.text('Fuente', 80, yPos);
  doc.text('Confianza', 105, yPos);
  doc.text('X', 135, yPos);
  doc.text('Y', 150, yPos);
  doc.text('Ancho', 165, yPos);
  doc.text('Alto', 180, yPos);
  yPos += 8;

  // Table rows
  doc.setTextColor(60);
  detections.forEach((det, i) => {
    // New page if needed
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }

    // Alternating row background
    if (i % 2 === 0) {
      doc.setFillColor(243, 244, 246); // gray-100
      doc.rect(14, yPos - 5, 182, 7, 'F');
    }

    const isManual = !!(det as unknown as Record<string, unknown>)._manual;

    doc.text(`${i + 1}`, 18, yPos);
    doc.text(det.class, 30, yPos);
    doc.text(isManual ? 'Manual' : 'IA', 80, yPos);
    doc.text(`${(det.confidence * 100).toFixed(1)}%`, 105, yPos);
    doc.text(`${Math.round(det.x)}`, 135, yPos);
    doc.text(`${Math.round(det.y)}`, 150, yPos);
    doc.text(`${Math.round(det.width)}`, 165, yPos);
    doc.text(`${Math.round(det.height)}`, 180, yPos);
    yPos += 7;
  });

  // ── Footer ──
  yPos += 10;
  if (yPos > 270) {
    doc.addPage();
    yPos = 20;
  }
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Este reporte fue generado por EcoTrack. La imagen incluye las detecciones visuales (cajas de color). Los datos deben ser verificados en campo.',
    14,
    yPos,
    { maxWidth: 180 },
  );

  // Save
  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`ecotrack-reporte-${timestamp}.pdf`);
}
