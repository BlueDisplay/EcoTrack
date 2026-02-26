// ─── PDF report generation ──────────────────────────────────────────────────
// Uses jsPDF to create a technical report of AI detections

import { jsPDF } from 'jspdf';
import type { Detection } from '@/lib/api/analyze';

interface PdfReportData {
  imageSrc: string; // base64 or data URL of the analyzed image
  detections: Detection[];
  location?: { lat: number; lon: number } | null;
  dateTime?: string;
  fileName?: string;
}

export function generateDetectionPDF(data: PdfReportData): void {
  const doc = new jsPDF();
  const { imageSrc, detections, location, dateTime, fileName } = data;

  // ── Header ──
  doc.setFontSize(20);
  doc.setTextColor(16, 185, 129); // emerald
  doc.text('EcoTrack - Reporte de Detección IA', 14, 22);

  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text(`Generado: ${new Date().toLocaleString('es-MX')}`, 14, 30);
  if (fileName) {
    doc.text(`Archivo: ${fileName}`, 14, 36);
  }

  // ── Image preview ──
  try {
    doc.addImage(imageSrc, 'JPEG', 14, 44, 80, 60);
  } catch {
    doc.setTextColor(200, 0, 0);
    doc.text('[No se pudo incluir la imagen]', 14, 70);
  }

  // ── Location info ──
  let yPos = 112;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text('Ubicación', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setTextColor(60);
  if (location) {
    doc.text(`Latitud: ${location.lat.toFixed(6)}`, 14, yPos);
    yPos += 6;
    doc.text(`Longitud: ${location.lon.toFixed(6)}`, 14, yPos);
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
  yPos += 8;
  doc.setFontSize(12);
  doc.setTextColor(0);
  doc.text(`Detecciones (${detections.length})`, 14, yPos);
  yPos += 10;

  // Table header
  doc.setFontSize(9);
  doc.setTextColor(255);
  doc.setFillColor(31, 41, 55); // gray-800
  doc.rect(14, yPos - 5, 182, 8, 'F');
  doc.text('#', 18, yPos);
  doc.text('Clase', 30, yPos);
  doc.text('Confianza', 90, yPos);
  doc.text('X', 120, yPos);
  doc.text('Y', 140, yPos);
  doc.text('Ancho', 155, yPos);
  doc.text('Alto', 175, yPos);
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

    doc.text(`${i + 1}`, 18, yPos);
    doc.text(det.class, 30, yPos);
    doc.text(`${(det.confidence * 100).toFixed(1)}%`, 90, yPos);
    doc.text(`${Math.round(det.x)}`, 120, yPos);
    doc.text(`${Math.round(det.y)}`, 140, yPos);
    doc.text(`${Math.round(det.width)}`, 155, yPos);
    doc.text(`${Math.round(det.height)}`, 175, yPos);
    yPos += 7;
  });

  // ── Footer ──
  yPos += 10;
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Este reporte fue generado automáticamente por EcoTrack. Los datos de detección provienen del modelo de IA y deben ser verificados.',
    14,
    yPos,
    { maxWidth: 180 },
  );

  // Save
  const timestamp = new Date().toISOString().slice(0, 10);
  doc.save(`ecotrack-reporte-${timestamp}.pdf`);
}
