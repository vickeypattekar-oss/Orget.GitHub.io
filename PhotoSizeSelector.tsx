import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type PhotoSize = {
  id: string;
  name: string;
  country: string;
  flag: string;
  width: number;
  height: number;
  unit: string;
};

export const PHOTO_SIZES: PhotoSize[] = [
  { id: "india-passport", name: "India Passport", country: "India", flag: "🇮🇳", width: 3.5, height: 4.5, unit: "cm" },
  { id: "uk-passport", name: "UK Passport", country: "UK", flag: "🇬🇧", width: 3.5, height: 4.5, unit: "cm" },
  { id: "us-passport", name: "US Passport", country: "USA", flag: "🇺🇸", width: 2, height: 2, unit: "inch" },
  { id: "visa-photo", name: "Visa Photo", country: "Standard", flag: "📋", width: 2, height: 2, unit: "inch" },
  { id: "pan-card", name: "PAN Card", country: "India", flag: "💳", width: 2.5, height: 2.5, unit: "cm" },
];

interface PhotoSizeSelectorProps {
  selectedSize: PhotoSize;
  onSizeChange: (size: PhotoSize) => void;
}

export const PhotoSizeSelector = ({ selectedSize, onSizeChange }: PhotoSizeSelectorProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        {t("photoSize.title")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PHOTO_SIZES.map((size) => (
          <button
            key={size.id}
            onClick={() => onSizeChange(size)}
            className={`group relative flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all duration-300 ${
              selectedSize.id === size.id
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
            }`}
          >
            <span className="text-2xl">{size.flag}</span>
            <div className="flex-1">
              <p className="font-semibold text-foreground">{size.name}</p>
              <p className="text-sm text-muted-foreground">
                {size.width} × {size.height} {size.unit}
              </p>
            </div>
            {selectedSize.id === size.id && (
              <div className="absolute right-3 top-3 rounded-full bg-primary p-1">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};