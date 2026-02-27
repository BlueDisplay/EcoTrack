'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { Detection } from '@/lib/api/analyze';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ManualAnnotation extends Detection {
  /** Marks this detection as manually drawn by the user */
  _manual: true;
}

interface DrawingBox {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface AnnotationCanvasProps {
  imageSrc: string;
  /** AI detections (read-only display) */
  aiDetections: Detection[];
  /** Manual annotations (editable) */
  manualAnnotations: ManualAnnotation[];
  imageSize: { width: number; height: number };
  /** Whether manual draw mode is active */
  drawMode: boolean;
  /** Callback when user finishes drawing a box */
  onBoxDrawn: (annotation: Omit<ManualAnnotation, 'class' | 'confidence' | '_manual'>) => void;
  /** Callback to remove a manual annotation by index */
  onRemoveAnnotation: (index: number) => void;
}

// ─── Color palette ──────────────────────────────────────────────────────────

const CLASS_COLORS: Record<string, string> = {
  plastic: '#ef4444',
  tire: '#f59e0b',
  debris: '#8b5cf6',
  basura: '#ef4444',
  escombro: '#8b5cf6',
  'agua estancada': '#3b82f6',
  contaminacion: '#f97316',
  otro: '#6b7280',
  manual: '#10b981',
  default: '#06b6d4',
};

// ─── Component ──────────────────────────────────────────────────────────────

export function AnnotationCanvas({
  imageSrc,
  aiDetections,
  manualAnnotations,
  imageSize,
  drawMode,
  onBoxDrawn,
  onRemoveAnnotation,
}: AnnotationCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [drawing, setDrawing] = useState<DrawingBox | null>(null);
  const [hoveredManual, setHoveredManual] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [canvasDims, setCanvasDims] = useState({ width: 640, height: 480 });

  const allDetections: (Detection & { _isManual?: boolean; _manualIdx?: number })[] = [
    ...aiDetections.map((d) => ({ ...d, _isManual: false as const })),
    ...manualAnnotations.map((d, i) => ({ ...d, _isManual: true as const, _manualIdx: i })),
  ];

  // ─── Draw everything ───────────────────────────────────────────────────

  const paint = useCallback(
    (currentDrawing?: DrawingBox | null) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx || !imgRef.current) return;

      const img = imgRef.current;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const scaleX = canvas.width / imageSize.width;
      const scaleY = canvas.height / imageSize.height;

      // Draw all boxes
      allDetections.forEach((det, _idx) => {
        const isManual = det._isManual;
        const color = isManual
          ? CLASS_COLORS[det.class] || CLASS_COLORS.manual
          : CLASS_COLORS[det.class] || CLASS_COLORS.default;

        const x = (det.x - det.width / 2) * scaleX;
        const y = (det.y - det.height / 2) * scaleY;
        const w = det.width * scaleX;
        const h = det.height * scaleY;

        // Dashed border for manual, solid for AI
        ctx.setLineDash(isManual ? [6, 3] : []);
        ctx.strokeStyle = color;
        ctx.lineWidth = isManual ? 2.5 : 2;
        ctx.strokeRect(x, y, w, h);

        // Fill
        ctx.fillStyle = `${color}${isManual ? '18' : '20'}`;
        ctx.fillRect(x, y, w, h);

        // Label
        const sourceTag = isManual ? '✏️ ' : '🤖 ';
        const confText = det.confidence >= 1 ? '' : ` ${(det.confidence * 100).toFixed(0)}%`;
        const label = `${sourceTag}${det.class}${confText}`;
        ctx.font = 'bold 12px system-ui, sans-serif';
        const textWidth = ctx.measureText(label).width;
        const labelH = 22;

        ctx.setLineDash([]);
        ctx.fillStyle = color;
        const radius = 4;
        const lx = x;
        const ly = y - labelH;
        ctx.beginPath();
        ctx.roundRect(lx, ly, textWidth + 12, labelH, radius);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.fillText(label, lx + 6, ly + 15);

        // Delete button for manual annotations on hover
        if (isManual && det._manualIdx === hoveredManual) {
          const btnSize = 20;
          const btnX = x + w - btnSize - 4;
          const btnY = y + 4;
          ctx.fillStyle = 'rgba(239,68,68,0.9)';
          ctx.beginPath();
          ctx.roundRect(btnX, btnY, btnSize, btnSize, 3);
          ctx.fill();
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px system-ui';
          ctx.fillText('×', btnX + 5, btnY + 15);
        }
      });

      // Draw current drawing box
      const db = currentDrawing ?? drawing;
      if (db) {
        const x = Math.min(db.startX, db.endX);
        const y = Math.min(db.startY, db.endY);
        const w = Math.abs(db.endX - db.startX);
        const h = Math.abs(db.endY - db.startY);

        ctx.setLineDash([8, 4]);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(16, 185, 129, 0.12)';
        ctx.fillRect(x, y, w, h);
        ctx.setLineDash([]);

        // Size indicator
        if (w > 30 && h > 20) {
          ctx.font = '11px system-ui';
          ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
          ctx.fillText(`${Math.round(w)}×${Math.round(h)}`, x + 4, y + h - 6);
        }
      }

      // Draw mode crosshair indicator
      if (drawMode && !db) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    },
    [allDetections, imageSize, drawing, drawMode, hoveredManual],
  );

  // ─── Load image ────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 640;
      const scale = containerWidth / img.width;
      const displayWidth = containerWidth;
      const displayHeight = img.height * scale;

      canvas.width = displayWidth;
      canvas.height = displayHeight;
      setCanvasDims({ width: displayWidth, height: displayHeight });
      imgRef.current = img;
      paint();
    };
    img.src = imageSrc;
  }, [imageSrc]);

  // Repaint when detections/annotations/state change
  useEffect(() => {
    paint();
  }, [paint]);

  // ─── Mouse handlers ────────────────────────────────────────────────────

  const getCanvasCoords = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawMode) return;
      const { x, y } = getCanvasCoords(e);
      setDrawing({ startX: x, startY: y, endX: x, endY: y });
    },
    [drawMode, getCanvasCoords],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const { x, y } = getCanvasCoords(e);

      if (drawing) {
        const newDrawing = { ...drawing, endX: x, endY: y };
        setDrawing(newDrawing);
        paint(newDrawing);
        return;
      }

      // Check hover over manual annotation delete zones
      if (!drawMode) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const scaleX = canvas.width / imageSize.width;
        const scaleY = canvas.height / imageSize.height;

        let found = -1;
        for (let i = manualAnnotations.length - 1; i >= 0; i--) {
          const det = manualAnnotations[i];
          const bx = (det.x - det.width / 2) * scaleX;
          const by = (det.y - det.height / 2) * scaleY;
          const bw = det.width * scaleX;
          const bh = det.height * scaleY;

          if (x >= bx && x <= bx + bw && y >= by && y <= by + bh) {
            found = i;
            break;
          }
        }
        if (found !== hoveredManual) {
          setHoveredManual(found >= 0 ? found : null);
        }
      }
    },
    [drawing, drawMode, getCanvasCoords, imageSize, manualAnnotations, hoveredManual, paint],
  );

  const handleMouseUp = useCallback(
    (_e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!drawing) return;

      const minSize = 10;
      const w = Math.abs(drawing.endX - drawing.startX);
      const h = Math.abs(drawing.endY - drawing.startY);

      if (w >= minSize && h >= minSize) {
        const canvas = canvasRef.current;
        if (canvas) {
          const scaleX = canvas.width / imageSize.width;
          const scaleY = canvas.height / imageSize.height;

          const boxX = Math.min(drawing.startX, drawing.endX);
          const boxY = Math.min(drawing.startY, drawing.endY);

          // Convert to Roboflow center-format (in original image coords)
          const centerX = (boxX + w / 2) / scaleX;
          const centerY = (boxY + h / 2) / scaleY;
          const origW = w / scaleX;
          const origH = h / scaleY;

          onBoxDrawn({ x: centerX, y: centerY, width: origW, height: origH });
        }
      }

      setDrawing(null);
    },
    [drawing, imageSize, onBoxDrawn],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (drawMode) return;

      // Check click on delete button of hovered manual annotation
      if (hoveredManual !== null) {
        const { x, y } = getCanvasCoords(e);
        const canvas = canvasRef.current;
        if (!canvas) return;
        const scaleX = canvas.width / imageSize.width;
        const scaleY = canvas.height / imageSize.height;

        const det = manualAnnotations[hoveredManual];
        const bx = (det.x - det.width / 2) * scaleX;
        const bw = det.width * scaleX;
        const by = (det.y - det.height / 2) * scaleY;

        const btnSize = 20;
        const btnX = bx + bw - btnSize - 4;
        const btnY = by + 4;

        if (x >= btnX && x <= btnX + btnSize && y >= btnY && y <= btnY + btnSize) {
          onRemoveAnnotation(hoveredManual);
          setHoveredManual(null);
        }
      }
    },
    [drawMode, hoveredManual, getCanvasCoords, imageSize, manualAnnotations, onRemoveAnnotation],
  );

  // Badge counts
  const aiCount = aiDetections.length;
  const manualCount = manualAnnotations.length;

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className={`w-full rounded-lg transition-all ${
          drawMode ? 'cursor-crosshair ring-2 ring-emerald-400 ring-offset-2' : 'cursor-default'
        }`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={handleClick}
        onMouseLeave={() => {
          if (drawing) {
            setDrawing(null);
          }
        }}
      />

      {/* Badges */}
      <div className="absolute top-2 left-2 flex gap-2">
        {aiCount > 0 && (
          <span className="bg-cyan-600/80 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
            🤖 {aiCount} IA
          </span>
        )}
        {manualCount > 0 && (
          <span className="bg-emerald-600/80 text-white text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-sm">
            ✏️ {manualCount} manual{manualCount !== 1 ? 'es' : ''}
          </span>
        )}
      </div>

      {/* Draw mode indicator */}
      {drawMode && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-emerald-600/90 text-white text-xs px-4 py-2 rounded-full font-medium backdrop-blur-sm animate-pulse">
          Haz clic y arrastra para dibujar un recuadro
        </div>
      )}
    </div>
  );
}
