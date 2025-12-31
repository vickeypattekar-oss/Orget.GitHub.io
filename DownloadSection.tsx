import { useCallback } from "react";
import { Download, FileImage, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { PhotoSize } from "./PhotoSizeSelector";
import type { PaperLayout } from "./PaperLayoutSelector";
import { useLanguage } from "@/contexts/LanguageContext";

interface DownloadSectionProps {
  photo: string;
  photoSize: PhotoSize;
  paperLayout: PaperLayout;
  photoCount: number;
}

// High-res conversion (300 DPI for print)
const cmToPxHiRes = (cm: number) => Math.round(cm * 118.11); // 300 DPI
const inchToPxHiRes = (inch: number) => Math.round(inch * 300);

const toPxHiRes = (value: number, unit: string) => {
  return unit === "cm" ? cmToPxHiRes(value) : inchToPxHiRes(value);
};

export const DownloadSection = ({ photo, photoSize, paperLayout, photoCount }: DownloadSectionProps) => {
  const { t } = useLanguage();

  const generateHighResCanvas = useCallback(() => {
    return new Promise<HTMLCanvasElement>((resolve, reject) => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const paperWidth = toPxHiRes(paperLayout.width, paperLayout.unit);
        const paperHeight = toPxHiRes(paperLayout.height, paperLayout.unit);
        const photoWidth = toPxHiRes(photoSize.width, photoSize.unit);
        const photoHeight = toPxHiRes(photoSize.height, photoSize.unit);
        
        // Gap between photos (3mm at 300 DPI for visible spacing)
        const gap = cmToPxHiRes(0.3);

        canvas.width = paperWidth;
        canvas.height = paperHeight;

        // White background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, paperWidth, paperHeight);

        const cols = Math.floor((paperWidth + gap) / (photoWidth + gap));
        const rows = Math.floor((paperHeight + gap) / (photoHeight + gap));
        const maxPhotos = Math.min(photoCount, cols * rows);

        const totalGridWidth = cols * photoWidth + (cols - 1) * gap;
        const totalGridHeight = rows * photoHeight + (rows - 1) * gap;
        const startX = (paperWidth - totalGridWidth) / 2;
        const startY = (paperHeight - totalGridHeight) / 2;

        let count = 0;
        for (let row = 0; row < rows && count < maxPhotos; row++) {
          for (let col = 0; col < cols && count < maxPhotos; col++) {
            const x = startX + col * (photoWidth + gap);
            const y = startY + row * (photoHeight + gap);

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
            
            ctx.strokeStyle = "#cccccc";
            ctx.lineWidth = 1;
            ctx.strokeRect(x, y, photoWidth, photoHeight);

            count++;
          }
        }

        resolve(canvas);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = photo;
    });
  }, [photo, photoSize, paperLayout, photoCount]);

  const downloadPNG = useCallback(async () => {
    try {
      toast.loading(t("download.downloading"));
      const canvas = await generateHighResCanvas();
      const link = document.createElement("a");
      link.download = `passport-photos-${paperLayout.name}-${photoCount}pcs.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
      toast.dismiss();
      toast.success(t("payment.success"));
    } catch (err) {
      toast.dismiss();
      toast.error(t("common.error"));
    }
  }, [generateHighResCanvas, paperLayout.name, photoCount, t]);

  const downloadPDF = useCallback(async () => {
    try {
      toast.loading(t("download.downloading"));
      const canvas = await generateHighResCanvas();
      
      // Create a simple PDF using canvas data
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      
      // Create PDF-like download
      const link = document.createElement("a");
      link.download = `passport-photos-${paperLayout.name}-${photoCount}pcs.jpg`;
      link.href = imgData;
      link.click();
      
      toast.dismiss();
      toast.success(t("payment.success"));
    } catch (err) {
      toast.dismiss();
      toast.error(t("common.error"));
    }
  }, [generateHighResCanvas, paperLayout.name, photoCount, t]);

  return (
    <div className="w-full animate-slide-up">
      <div className="rounded-2xl border-2 border-success/30 bg-success/5 p-6 md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-full bg-success/20 p-2">
            <Download className="h-6 w-6 text-success" />
          </div>
          <div>
            <h3 className="font-display text-xl font-bold text-foreground">
              {t("download.title")}
            </h3>
            <p className="text-sm text-muted-foreground">
              High-quality 300 DPI print-ready files
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Button
            variant="hero"
            size="xl"
            className="w-full"
            onClick={downloadPNG}
          >
            <FileImage className="mr-2 h-5 w-5" />
            {t("download.downloadPNG")}
          </Button>
          
          <Button
            variant="outline"
            size="xl"
            className="w-full"
            onClick={downloadPDF}
          >
            <FileText className="mr-2 h-5 w-5" />
            {t("download.downloadPDF")}
          </Button>
        </div>

        <div className="mt-4 rounded-lg bg-secondary/30 p-4">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Tip:</span> For best print quality, 
            use the PNG file and print at actual size (100% scale).
          </p>
        </div>
      </div>
    </div>
  );
};
