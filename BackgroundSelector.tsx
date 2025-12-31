import { Check, Pipette, Search, X } from "lucide-react";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";

interface BackgroundSelectorProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
}

const COLOR_CATEGORIES = {
  whites: {
    label: "Whites",
    colors: [
      { name: "White", value: "#FFFFFF", textColor: "text-gray-800" },
      { name: "Snow", value: "#FFFAFA", textColor: "text-gray-800" },
      { name: "HoneyDew", value: "#F0FFF0", textColor: "text-gray-800" },
      { name: "MintCream", value: "#F5FFFA", textColor: "text-gray-800" },
      { name: "Azure", value: "#F0FFFF", textColor: "text-gray-800" },
      { name: "AliceBlue", value: "#F0F8FF", textColor: "text-gray-800" },
      { name: "GhostWhite", value: "#F8F8FF", textColor: "text-gray-800" },
      { name: "WhiteSmoke", value: "#F5F5F5", textColor: "text-gray-800" },
      { name: "SeaShell", value: "#FFF5EE", textColor: "text-gray-800" },
      { name: "Beige", value: "#F5F5DC", textColor: "text-gray-800" },
      { name: "OldLace", value: "#FDF5E6", textColor: "text-gray-800" },
      { name: "FloralWhite", value: "#FFFAF0", textColor: "text-gray-800" },
      { name: "Ivory", value: "#FFFFF0", textColor: "text-gray-800" },
      { name: "AntiqueWhite", value: "#FAEBD7", textColor: "text-gray-800" },
      { name: "Linen", value: "#FAF0E6", textColor: "text-gray-800" },
      { name: "LavenderBlush", value: "#FFF0F5", textColor: "text-gray-800" },
      { name: "MistyRose", value: "#FFE4E1", textColor: "text-gray-800" },
      { name: "Cornsilk", value: "#FFF8DC", textColor: "text-gray-800" },
    ],
  },
  grays: {
    label: "Grays",
    colors: [
      { name: "Gainsboro", value: "#DCDCDC", textColor: "text-gray-800" },
      { name: "LightGray", value: "#D3D3D3", textColor: "text-gray-800" },
      { name: "Silver", value: "#C0C0C0", textColor: "text-gray-800" },
      { name: "DarkGray", value: "#A9A9A9", textColor: "text-gray-800" },
      { name: "Gray", value: "#808080", textColor: "text-white" },
      { name: "DimGray", value: "#696969", textColor: "text-white" },
      { name: "LightSlateGray", value: "#778899", textColor: "text-white" },
      { name: "SlateGray", value: "#708090", textColor: "text-white" },
      { name: "DarkSlateGray", value: "#2F4F4F", textColor: "text-white" },
      { name: "Black", value: "#000000", textColor: "text-white" },
    ],
  },
  blues: {
    label: "Blues",
    colors: [
      { name: "LightCyan", value: "#E0FFFF", textColor: "text-gray-800" },
      { name: "PaleTurquoise", value: "#AFEEEE", textColor: "text-gray-800" },
      { name: "Aquamarine", value: "#7FFFD4", textColor: "text-gray-800" },
      { name: "Turquoise", value: "#40E0D0", textColor: "text-gray-800" },
      { name: "MediumTurquoise", value: "#48D1CC", textColor: "text-gray-800" },
      { name: "DarkTurquoise", value: "#00CED1", textColor: "text-gray-800" },
      { name: "LightBlue", value: "#ADD8E6", textColor: "text-gray-800" },
      { name: "PowderBlue", value: "#B0E0E6", textColor: "text-gray-800" },
      { name: "SkyBlue", value: "#87CEEB", textColor: "text-gray-800" },
      { name: "LightSkyBlue", value: "#87CEFA", textColor: "text-gray-800" },
      { name: "DeepSkyBlue", value: "#00BFFF", textColor: "text-gray-800" },
      { name: "DodgerBlue", value: "#1E90FF", textColor: "text-white" },
      { name: "CornflowerBlue", value: "#6495ED", textColor: "text-white" },
      { name: "LightSteelBlue", value: "#B0C4DE", textColor: "text-gray-800" },
      { name: "SteelBlue", value: "#4682B4", textColor: "text-white" },
      { name: "RoyalBlue", value: "#4169E1", textColor: "text-white" },
      { name: "Blue", value: "#0000FF", textColor: "text-white" },
      { name: "MediumBlue", value: "#0000CD", textColor: "text-white" },
      { name: "DarkBlue", value: "#00008B", textColor: "text-white" },
      { name: "Navy", value: "#000080", textColor: "text-white" },
      { name: "MidnightBlue", value: "#191970", textColor: "text-white" },
      { name: "Cyan", value: "#00FFFF", textColor: "text-gray-800" },
      { name: "Aqua", value: "#00FFFF", textColor: "text-gray-800" },
      { name: "DarkCyan", value: "#008B8B", textColor: "text-white" },
      { name: "Teal", value: "#008080", textColor: "text-white" },
      { name: "CadetBlue", value: "#5F9EA0", textColor: "text-white" },
      { name: "LightSeaGreen", value: "#20B2AA", textColor: "text-white" },
    ],
  },
  greens: {
    label: "Greens",
    colors: [
      { name: "PaleGreen", value: "#98FB98", textColor: "text-gray-800" },
      { name: "LightGreen", value: "#90EE90", textColor: "text-gray-800" },
      { name: "MediumSpringGreen", value: "#00FA9A", textColor: "text-gray-800" },
      { name: "SpringGreen", value: "#00FF7F", textColor: "text-gray-800" },
      { name: "MediumAquaMarine", value: "#66CDAA", textColor: "text-gray-800" },
      { name: "MediumSeaGreen", value: "#3CB371", textColor: "text-white" },
      { name: "SeaGreen", value: "#2E8B57", textColor: "text-white" },
      { name: "ForestGreen", value: "#228B22", textColor: "text-white" },
      { name: "Green", value: "#008000", textColor: "text-white" },
      { name: "DarkGreen", value: "#006400", textColor: "text-white" },
      { name: "YellowGreen", value: "#9ACD32", textColor: "text-gray-800" },
      { name: "OliveDrab", value: "#6B8E23", textColor: "text-white" },
      { name: "Olive", value: "#808000", textColor: "text-white" },
      { name: "DarkOliveGreen", value: "#556B2F", textColor: "text-white" },
      { name: "LawnGreen", value: "#7CFC00", textColor: "text-gray-800" },
      { name: "Chartreuse", value: "#7FFF00", textColor: "text-gray-800" },
      { name: "GreenYellow", value: "#ADFF2F", textColor: "text-gray-800" },
      { name: "Lime", value: "#00FF00", textColor: "text-gray-800" },
      { name: "LimeGreen", value: "#32CD32", textColor: "text-gray-800" },
      { name: "DarkSeaGreen", value: "#8FBC8F", textColor: "text-gray-800" },
    ],
  },
  yellows: {
    label: "Yellows",
    colors: [
      { name: "LightYellow", value: "#FFFFE0", textColor: "text-gray-800" },
      { name: "LemonChiffon", value: "#FFFACD", textColor: "text-gray-800" },
      { name: "LightGoldenRodYellow", value: "#FAFAD2", textColor: "text-gray-800" },
      { name: "PapayaWhip", value: "#FFEFD5", textColor: "text-gray-800" },
      { name: "Moccasin", value: "#FFE4B5", textColor: "text-gray-800" },
      { name: "PeachPuff", value: "#FFDAB9", textColor: "text-gray-800" },
      { name: "PaleGoldenRod", value: "#EEE8AA", textColor: "text-gray-800" },
      { name: "Khaki", value: "#F0E68C", textColor: "text-gray-800" },
      { name: "DarkKhaki", value: "#BDB76B", textColor: "text-gray-800" },
      { name: "Yellow", value: "#FFFF00", textColor: "text-gray-800" },
      { name: "Gold", value: "#FFD700", textColor: "text-gray-800" },
      { name: "GoldenRod", value: "#DAA520", textColor: "text-gray-800" },
      { name: "DarkGoldenRod", value: "#B8860B", textColor: "text-white" },
    ],
  },
  oranges: {
    label: "Oranges",
    colors: [
      { name: "NavajoWhite", value: "#FFDEAD", textColor: "text-gray-800" },
      { name: "Wheat", value: "#F5DEB3", textColor: "text-gray-800" },
      { name: "BurlyWood", value: "#DEB887", textColor: "text-gray-800" },
      { name: "Tan", value: "#D2B48C", textColor: "text-gray-800" },
      { name: "SandyBrown", value: "#F4A460", textColor: "text-gray-800" },
      { name: "Orange", value: "#FFA500", textColor: "text-gray-800" },
      { name: "DarkOrange", value: "#FF8C00", textColor: "text-white" },
      { name: "Coral", value: "#FF7F50", textColor: "text-white" },
      { name: "Tomato", value: "#FF6347", textColor: "text-white" },
      { name: "OrangeRed", value: "#FF4500", textColor: "text-white" },
      { name: "Peru", value: "#CD853F", textColor: "text-white" },
      { name: "Chocolate", value: "#D2691E", textColor: "text-white" },
      { name: "SaddleBrown", value: "#8B4513", textColor: "text-white" },
      { name: "Sienna", value: "#A0522D", textColor: "text-white" },
    ],
  },
  reds: {
    label: "Reds",
    colors: [
      { name: "LightSalmon", value: "#FFA07A", textColor: "text-gray-800" },
      { name: "Salmon", value: "#FA8072", textColor: "text-gray-800" },
      { name: "DarkSalmon", value: "#E9967A", textColor: "text-gray-800" },
      { name: "LightCoral", value: "#F08080", textColor: "text-gray-800" },
      { name: "RosyBrown", value: "#BC8F8F", textColor: "text-white" },
      { name: "IndianRed", value: "#CD5C5C", textColor: "text-white" },
      { name: "Red", value: "#FF0000", textColor: "text-white" },
      { name: "FireBrick", value: "#B22222", textColor: "text-white" },
      { name: "Crimson", value: "#DC143C", textColor: "text-white" },
      { name: "DarkRed", value: "#8B0000", textColor: "text-white" },
      { name: "Maroon", value: "#800000", textColor: "text-white" },
      { name: "Brown", value: "#A52A2A", textColor: "text-white" },
    ],
  },
  pinks: {
    label: "Pinks",
    colors: [
      { name: "Pink", value: "#FFC0CB", textColor: "text-gray-800" },
      { name: "LightPink", value: "#FFB6C1", textColor: "text-gray-800" },
      { name: "HotPink", value: "#FF69B4", textColor: "text-white" },
      { name: "DeepPink", value: "#FF1493", textColor: "text-white" },
      { name: "MediumVioletRed", value: "#C71585", textColor: "text-white" },
      { name: "PaleVioletRed", value: "#DB7093", textColor: "text-white" },
    ],
  },
  purples: {
    label: "Purples",
    colors: [
      { name: "Lavender", value: "#E6E6FA", textColor: "text-gray-800" },
      { name: "Thistle", value: "#D8BFD8", textColor: "text-gray-800" },
      { name: "Plum", value: "#DDA0DD", textColor: "text-gray-800" },
      { name: "Violet", value: "#EE82EE", textColor: "text-gray-800" },
      { name: "Orchid", value: "#DA70D6", textColor: "text-white" },
      { name: "Fuchsia", value: "#FF00FF", textColor: "text-white" },
      { name: "Magenta", value: "#FF00FF", textColor: "text-white" },
      { name: "MediumOrchid", value: "#BA55D3", textColor: "text-white" },
      { name: "MediumPurple", value: "#9370DB", textColor: "text-white" },
      { name: "BlueViolet", value: "#8A2BE2", textColor: "text-white" },
      { name: "DarkViolet", value: "#9400D3", textColor: "text-white" },
      { name: "DarkOrchid", value: "#9932CC", textColor: "text-white" },
      { name: "DarkMagenta", value: "#8B008B", textColor: "text-white" },
      { name: "Purple", value: "#800080", textColor: "text-white" },
      { name: "RebeccaPurple", value: "#663399", textColor: "text-white" },
      { name: "Indigo", value: "#4B0082", textColor: "text-white" },
      { name: "SlateBlue", value: "#6A5ACD", textColor: "text-white" },
      { name: "DarkSlateBlue", value: "#483D8B", textColor: "text-white" },
      { name: "MediumSlateBlue", value: "#7B68EE", textColor: "text-white" },
    ],
  },
  browns: {
    label: "Browns",
    colors: [
      { name: "BlanchedAlmond", value: "#FFEBCD", textColor: "text-gray-800" },
      { name: "Bisque", value: "#FFE4C4", textColor: "text-gray-800" },
    ],
  },
};

const ALL_COLORS = Object.values(COLOR_CATEGORIES).flatMap(cat => cat.colors);

export const BackgroundSelector = ({ selectedColor, onColorSelect }: BackgroundSelectorProps) => {
  const { t } = useLanguage();
  const [customColor, setCustomColor] = useState(selectedColor || "#FFFFFF");
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isCustomColor = !ALL_COLORS.some(c => c.value === selectedColor);

  const filteredColors = searchQuery.trim()
    ? ALL_COLORS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : null;

  const handleCustomColorApply = () => {
    onColorSelect(customColor);
    setIsOpen(false);
  };

  const renderColorGrid = (colors: typeof ALL_COLORS) => (
    <div className="grid grid-cols-6 gap-2 max-h-48 overflow-y-auto">
      {colors.map((color) => (
        <button
          key={color.value + color.name}
          onClick={() => onColorSelect(color.value)}
          className={`relative w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
            selectedColor === color.value 
              ? "border-primary ring-2 ring-primary/50" 
              : "border-border/50 hover:border-primary/50"
          }`}
          style={{ backgroundColor: color.value }}
          title={color.name}
        >
          {selectedColor === color.value && (
            <Check 
              className={`absolute inset-0 m-auto h-5 w-5 ${color.textColor}`} 
            />
          )}
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      <h4 className="text-sm font-medium text-foreground mb-3">{t("background.title")}</h4>

      {/* Search Box */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search colors..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Custom Color Picker */}
      <div className="mb-4 flex items-center gap-3 p-3 rounded-lg border border-border/50 bg-muted/30">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <button
              className={`relative w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 flex-shrink-0 ${
                isCustomColor 
                  ? "border-primary ring-2 ring-primary/50" 
                  : "border-border/50 hover:border-primary/50"
              }`}
              style={{ 
                background: isCustomColor 
                  ? selectedColor 
                  : "conic-gradient(from 0deg, red, yellow, lime, aqua, blue, magenta, red)" 
              }}
              title="Custom Color"
            >
              {isCustomColor ? (
                <Check className="absolute inset-0 m-auto h-5 w-5 text-white drop-shadow-md" />
              ) : (
                <Pipette className="absolute inset-0 m-auto h-4 w-4 text-white drop-shadow-md" />
              )}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-3" align="start">
            <div className="space-y-3">
              <p className="text-sm font-medium">Pick a custom color</p>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={customColor}
                  onChange={(e) => {
                    setCustomColor(e.target.value);
                    onColorSelect(e.target.value);
                  }}
                  className="w-10 h-10 rounded cursor-pointer border-0 p-0"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCustomColor(value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                      onColorSelect(value);
                    }
                  }}
                  placeholder="#FFFFFF"
                  className="flex-1 font-mono text-sm"
                />
              </div>
              <div 
                className="h-8 rounded-md border"
                style={{ backgroundColor: customColor }}
              />
            </div>
          </PopoverContent>
        </Popover>
        <div className="text-sm">
          <span className="text-muted-foreground">Custom: </span>
          <span className="font-mono">{isCustomColor ? selectedColor : "Click to pick"}</span>
        </div>
      </div>

      {/* Show search results or category tabs */}
      {filteredColors ? (
        <div>
          <p className="text-xs text-muted-foreground mb-2">
            {filteredColors.length} color{filteredColors.length !== 1 ? 's' : ''} found
          </p>
          {filteredColors.length > 0 ? (
            renderColorGrid(filteredColors)
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No colors match your search</p>
          )}
        </div>
      ) : (
        <Tabs defaultValue="whites" className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 mb-3 bg-transparent p-0">
            {Object.entries(COLOR_CATEGORIES).map(([key, category]) => (
              <TabsTrigger 
                key={key} 
                value={key} 
                className="text-xs px-2 py-1 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category.label}
              </TabsTrigger>
            ))}
          </TabsList>
          {Object.entries(COLOR_CATEGORIES).map(([key, category]) => (
            <TabsContent key={key} value={key}>
              {renderColorGrid(category.colors)}
            </TabsContent>
          ))}
        </Tabs>
      )}
    </div>
  );
};