import { useState } from "react";
import { Shirt, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface ClothesSelectorProps {
  onApplyClothes: (clothingType: string, clothingStyle: string) => void;
  disabled?: boolean;
  isApplying?: boolean;
}

const BLAZER_STYLES = [
  { id: "navy-blazer", name: "Navy Blue Blazer", color: "#1e3a5f", description: "Classic navy formal blazer" },
  { id: "black-blazer", name: "Black Blazer", color: "#1a1a1a", description: "Professional black blazer" },
  { id: "charcoal-blazer", name: "Charcoal Blazer", color: "#36454f", description: "Elegant charcoal gray blazer" },
  { id: "burgundy-blazer", name: "Burgundy Blazer", color: "#722f37", description: "Rich burgundy blazer" },
  { id: "gray-blazer", name: "Light Gray Blazer", color: "#808080", description: "Modern light gray blazer" },
  { id: "brown-blazer", name: "Brown Blazer", color: "#654321", description: "Classic brown tweed blazer" },
];

const SHIRT_STYLES = [
  { id: "white-formal", name: "White Formal Shirt", color: "#ffffff", description: "Crisp white dress shirt" },
  { id: "light-blue", name: "Light Blue Shirt", color: "#add8e6", description: "Professional light blue shirt" },
  { id: "pink-shirt", name: "Pink Shirt", color: "#ffb6c1", description: "Elegant pale pink shirt" },
  { id: "striped-white", name: "Striped White", color: "#f5f5f5", description: "White shirt with subtle stripes" },
  { id: "cream-shirt", name: "Cream Shirt", color: "#fffdd0", description: "Warm cream colored shirt" },
  { id: "lavender-shirt", name: "Lavender Shirt", color: "#e6e6fa", description: "Soft lavender dress shirt" },
];

const SUIT_STYLES = [
  { id: "navy-suit", name: "Navy Blue Suit", color: "#1e3a5f", description: "Professional navy suit with white shirt" },
  { id: "black-suit", name: "Black Suit", color: "#1a1a1a", description: "Classic black suit with white shirt" },
  { id: "charcoal-suit", name: "Charcoal Suit", color: "#36454f", description: "Modern charcoal suit" },
  { id: "gray-suit", name: "Light Gray Suit", color: "#708090", description: "Light gray professional suit" },
  { id: "dark-gray-suit", name: "Dark Gray Suit", color: "#4a4a4a", description: "Sophisticated dark gray suit" },
  { id: "burgundy-suit", name: "Burgundy Suit", color: "#722f37", description: "Bold burgundy formal suit" },
  { id: "brown-suit", name: "Brown Suit", color: "#5c4033", description: "Classic brown business suit" },
  { id: "tan-suit", name: "Tan Suit", color: "#d2b48c", description: "Light tan summer suit" },
  { id: "blue-suit", name: "Royal Blue Suit", color: "#4169e1", description: "Vibrant royal blue suit" },
  { id: "teal-suit", name: "Teal Suit", color: "#008080", description: "Modern teal business suit" },
  { id: "wine-suit", name: "Wine Red Suit", color: "#722f37", description: "Deep wine colored suit" },
  { id: "olive-suit", name: "Olive Suit", color: "#556b2f", description: "Stylish olive green suit" },
  { id: "cream-suit", name: "Cream Suit", color: "#fffdd0", description: "Elegant cream white suit" },
  { id: "pinstripe-suit", name: "Navy Pinstripe", color: "#1e3a5f", description: "Navy suit with white pinstripes" },
];

const TIE_STYLES = [
  { id: "navy-tie", name: "Navy Blue Tie", color: "#1e3a5f", description: "Classic navy blue silk tie" },
  { id: "black-tie", name: "Black Tie", color: "#1a1a1a", description: "Elegant black tie" },
  { id: "burgundy-tie", name: "Burgundy Tie", color: "#722f37", description: "Rich burgundy silk tie" },
  { id: "red-tie", name: "Red Tie", color: "#b22222", description: "Bold power red tie" },
  { id: "gray-tie", name: "Silver Gray Tie", color: "#708090", description: "Modern silver gray tie" },
  { id: "gold-tie", name: "Gold Tie", color: "#daa520", description: "Elegant gold silk tie" },
  { id: "green-tie", name: "Forest Green Tie", color: "#228b22", description: "Classic forest green tie" },
  { id: "purple-tie", name: "Purple Tie", color: "#663399", description: "Royal purple silk tie" },
  { id: "teal-tie", name: "Teal Tie", color: "#008080", description: "Sophisticated teal tie" },
  { id: "orange-tie", name: "Orange Tie", color: "#ff8c00", description: "Vibrant orange tie" },
];

const BOWTIE_STYLES = [
  { id: "black-bowtie", name: "Black Bow Tie", color: "#1a1a1a", description: "Classic black bow tie" },
  { id: "navy-bowtie", name: "Navy Bow Tie", color: "#1e3a5f", description: "Elegant navy bow tie" },
  { id: "burgundy-bowtie", name: "Burgundy Bow Tie", color: "#722f37", description: "Rich burgundy bow tie" },
  { id: "red-bowtie", name: "Red Bow Tie", color: "#b22222", description: "Bold red bow tie" },
  { id: "silver-bowtie", name: "Silver Bow Tie", color: "#c0c0c0", description: "Elegant silver bow tie" },
  { id: "gold-bowtie", name: "Gold Bow Tie", color: "#daa520", description: "Luxurious gold bow tie" },
  { id: "purple-bowtie", name: "Purple Bow Tie", color: "#663399", description: "Royal purple bow tie" },
  { id: "green-bowtie", name: "Green Bow Tie", color: "#228b22", description: "Forest green bow tie" },
  { id: "pink-bowtie", name: "Pink Bow Tie", color: "#ff69b4", description: "Stylish pink bow tie" },
  { id: "white-bowtie", name: "White Bow Tie", color: "#ffffff", description: "Classic white formal bow tie" },
];

export const ClothesSelector = ({ onApplyClothes, disabled, isApplying }: ClothesSelectorProps) => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  const handleSelect = (type: string, style: { id: string; name: string; description: string }) => {
    onApplyClothes(type, `${style.name}: ${style.description}`);
    setOpen(false);
  };

  const renderClothingGrid = (items: typeof BLAZER_STYLES, type: string) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleSelect(type, item)}
          disabled={isApplying}
          className="group flex flex-col items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-primary hover:bg-primary/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <div
            className="w-12 h-12 rounded-lg shadow-md group-hover:scale-105 transition-transform border border-border/30"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs font-medium text-center text-foreground">{item.name}</span>
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="secondary"
          size="sm"
          disabled={disabled || isApplying}
          className={`bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 disabled:opacity-50 transition-all ${
            isApplying ? "ring-2 ring-amber-400 ring-offset-2 ring-offset-background animate-pulse" : ""
          }`}
        >
          {isApplying ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : (
            <Shirt className="h-4 w-4 mr-1" />
          )}
          {isApplying ? t("clothes.applying") : t("upload.clothes")}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shirt className="h-5 w-5" />
            {t("clothes.title")}
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Select a clothing style to professionally dress your photo for ID/passport use.
        </p>
        <Tabs defaultValue="suits" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="suits" className="text-xs px-2">Suits</TabsTrigger>
            <TabsTrigger value="blazers" className="text-xs px-2">Blazers</TabsTrigger>
            <TabsTrigger value="shirts" className="text-xs px-2">Shirts</TabsTrigger>
            <TabsTrigger value="ties" className="text-xs px-2">Ties</TabsTrigger>
            <TabsTrigger value="bowties" className="text-xs px-2">Bow Ties</TabsTrigger>
          </TabsList>
          <TabsContent value="suits" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">Complete suit with shirt - ideal for formal ID photos</p>
            {renderClothingGrid(SUIT_STYLES, "suit")}
          </TabsContent>
          <TabsContent value="blazers" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">Professional blazers for a polished look</p>
            {renderClothingGrid(BLAZER_STYLES, "blazer")}
          </TabsContent>
          <TabsContent value="shirts" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">Formal shirts for a clean appearance</p>
            {renderClothingGrid(SHIRT_STYLES, "shirt")}
          </TabsContent>
          <TabsContent value="ties" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">Add a professional tie to your outfit</p>
            {renderClothingGrid(TIE_STYLES, "tie")}
          </TabsContent>
          <TabsContent value="bowties" className="mt-4">
            <p className="text-xs text-muted-foreground mb-3">Elegant bow ties for a distinguished look</p>
            {renderClothingGrid(BOWTIE_STYLES, "bowtie")}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
