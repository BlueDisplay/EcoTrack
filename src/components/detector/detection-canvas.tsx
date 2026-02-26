'use client';

import { useEffect, useRef } from 'react';
import type { Detection } from '@/lib/api/analyze';

interface DetectionCanvasProps {
  imageSrc: string;
  detections: Detection[];
  imageSize: { width: number; height: number };
}

const CLASS_COLORS: Record<string, string> = {
  plastic: '#ef4444',
  tire: '#f59e0b',
  debris: '#8b5cf6',
  default: '#06b6d4',
};

export function DetectionCanvas({
  imageSrc,
  detections,
  imageSize,
}: DetectionCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Scale canvas to fit container while maintaining aspect ratio
      const containerWidth = canvas.parentElement?.clientWidth || 640;
      const scale = containerWidth / img.width;
      const displayWidth = containerWidth;
      const displayHeight = img.height * scale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;

      // Draw image
      ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

      // Draw detection bounding boxes
      const scaleX = displayWidth / imageSize.width;
      const scaleY = displayHeight / imageSize.height;

      detections.forEach((det) => {
        const color = CLASS_COLORS[det.class] || CLASS_COLORS.default;
        const x = (det.x - det.width / 2) * scaleX;
        const y = (det.y - det.height / 2) * scaleY;
        const w = det.width * scaleX;
        const h = det.height * scaleY;

        // Box
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        // Semi-transparent fill
        ctx.fillStyle = `${color}20`;
        ctx.fillRect(x, y, w, h);

        // Label background
        const label = `${det.class} ${(det.confidence * 100).toFixed(0)}%`;
        ctx.font = 'bold 12px sans-serif';
        const textWidth = ctx.measureText(label).width;
        ctx.fillStyle = color;
        ctx.fillRect(x, y - 20, textWidth + 10, 20);

        // Label text
        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, x + 5, y - 6);
      });
    };
    img.src = imageSrc;
  }, [imageSrc, detections, imageSize]);

  return (
    <div className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full rounded-lg"
      />
      {detections.length > 0 && (
        <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">
          {detections.length} objeto{detections.length !== 1 ? 's' : ''} detectado{detections.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
