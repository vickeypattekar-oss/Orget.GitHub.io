import { useRef, useEffect, useState } from "react";
import type { PhotoSize } from "./PhotoSizeSelector";
import type { PaperLayout } from "./PaperLayoutSelector";

interface PhotoPreviewProps {
  photo: string;
  photoSize: PhotoSize;
  paperLayout: PaperLayout;
  photoCount: number;
}

// Convert cm to pixels (96 DPI for screen preview)
const cmToPx = (cm: number) => Math.round(cm * 37.8);
// Convert inch to pixels
const inchToPx = (inch: number) => Math.round(inch * 96);

const toPx = (value: number, unit: string) => {
  return unit === "cm" ? cmToPx(value) : inchToPx(value);
};

export const PhotoPreview = ({ photo, photoSize, paperLayout, photoCount }: PhotoPreviewProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    if (!photo || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Paper dimensions in pixels (scaled down for preview)
      const scaleFactor = 0.3;
      const paperWidth = toPx(paperLayout.width, paperLayout.unit) * scaleFactor;
      const paperHeight = toPx(paperLayout.height, paperLayout.unit) * scaleFactor;

      // Photo dimensions in pixels (scaled)
      const photoWidth = toPx(photoSize.width, photoSize.unit) * scaleFactor;
      const photoHeight = toPx(photoSize.height, photoSize.unit) * scaleFactor;
      
      // Gap between photos (3mm scaled for visible spacing)
      const gap = cmToPx(0.3) * scaleFactor;

      canvas.width = paperWidth;
      canvas.height = paperHeight;

      // White background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, paperWidth, paperHeight);

      // Calculate grid with gaps
      const cols = Math.floor((paperWidth + gap) / (photoWidth + gap));
      const rows = Math.floor((paperHeight + gap) / (photoHeight + gap));
      const maxPhotos = Math.min(photoCount, cols * rows);

      // Calculate starting position to center the grid
      const totalGridWidth = cols * photoWidth + (cols - 1) * gap;
      const totalGridHeight = rows * photoHeight + (rows - 1) * gap;
      const startX = (paperWidth - totalGridWidth) / 2;
      const startY = (paperHeight - totalGridHeight) / 2;

      // Draw photos
      let count = 0;
      for (let row = 0; row < rows && count < maxPhotos; row++) {
        for (let col = 0; col < cols && count < maxPhotos; col++) {
          const x = startX + col * (photoWidth + gap);
          const y = startY + row * (photoHeight + gap);

          // Draw photo maintaining aspect ratio
          const imgAspect = img.width / img.height;
          const cellAspect = photoWidth / photoHeight;

          let srcX = 0, srcY = 0, srcWidth = img.width, srcHeight = img.height;

          if (imgAspect > cellAspect) {
            srcWidth = img.height * cellAspect;
            srcX = (img.width - srcWidth) / 2;
          } else {
            srcHeight = img.width / cellAspect;
            srcY = (img.height - srcHeight) / 2;
          }

          ctx.drawImage(img, srcX, srcY, srcWidth, srcHeight, x, y, photoWidth, photoHeight);
          
          // Draw border
          ctx.strokeStyle = "#e5e5e5";
          ctx.lineWidth = 0.5;
          ctx.strokeRect(x, y, photoWidth, photoHeight);

          count++;
        }
      }

      setPreviewUrl(canvas.toDataURL("image/png"));
    };
    img.src = photo;
  }, [photo, photoSize, paperLayout, photoCount]);

  return (
    <div className="w-full">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        Preview ({photoCount} photos on {paperLayout.name})
      </h3>
      <div className="overflow-hidden rounded-xl border-2 border-border/50 bg-secondary/20 p-4">
        <div className="flex items-center justify-center">
          <canvas
            ref={canvasRef}
            className="max-h-[400px] max-w-full rounded-lg shadow-lg"
          />
        </div>
      </div>
      {previewUrl && (
        <p className="mt-2 text-center text-sm text-muted-foreground">
          This is a preview. Full resolution available after payment verification.
        </p>
      )}
    </div>
  );
};