import { Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export type PaperLayout = {
  id: string;
  name: string;
  width: number;
  height: number;
  unit: string;
  displayName: string;
};

export const PAPER_LAYOUTS: PaperLayout[] = [
  { id: "3r", name: "3R (L)", displayName: "3.5 x 5 inch", width: 3.5, height: 5, unit: "inch" },
  { id: "4r", name: "4R", displayName: "6 x 4 inch", width: 6, height: 4, unit: "inch" },
  { id: "5r", name: "5R (2L)", displayName: "7 x 5 inch", width: 7, height: 5, unit: "inch" },
  { id: "a5", name: "A5", displayName: "21 x 14.85 cm", width: 21, height: 14.85, unit: "cm" },
  { id: "a4", name: "A4", displayName: "29.7 x 21 cm", width: 29.7, height: 21, unit: "cm" },
  { id: "letter", name: "Letter", displayName: "8.5 x 11 inch", width: 8.5, height: 11, unit: "inch" },
];

interface PaperLayoutSelectorProps {
  selectedLayout: PaperLayout;
  onLayoutChange: (layout: PaperLayout) => void;
}

export const PaperLayoutSelector = ({ selectedLayout, onLayoutChange }: PaperLayoutSelectorProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        {t("paperLayout.title")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {PAPER_LAYOUTS.map((layout) => (
          <button
            key={layout.id}
            onClick={() => onLayoutChange(layout)}
            className={`group relative flex flex-col items-start rounded-xl border-2 p-4 text-left transition-all duration-300 ${
              selectedLayout.id === layout.id
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
            }`}
          >
            <p className="font-semibold text-foreground">{layout.name}</p>
            <p className="text-sm text-muted-foreground">{layout.displayName}</p>
            {selectedLayout.id === layout.id && (
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