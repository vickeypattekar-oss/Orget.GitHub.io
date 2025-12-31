import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { ScrollArea } from "@/components/ui/scroll-area";

// Country flag emoji mapping based on language code
const getCountryFlag = (code: string): string => {
  const flagMap: Record<string, string> = {
    "en-US": "🇺🇸",
    "en-GB": "🇬🇧",
    "af": "🇿🇦",
    "sq": "🇦🇱",
    "am": "🇪🇹",
    "ar": "🇸🇦",
    "hy": "🇦🇲",
    "az": "🇦🇿",
    "bn": "🇧🇩",
    "bg": "🇧🇬",
    "my": "🇲🇲",
    "zh-CN": "🇨🇳",
    "zh-TW": "🇹🇼",
    "hr": "🇭🇷",
    "cs": "🇨🇿",
    "da": "🇩🇰",
    "nl": "🇳🇱",
    "fi": "🇫🇮",
    "fr-FR": "🇫🇷",
    "de": "🇩🇪",
    "el": "🇬🇷",
    "gu": "🇮🇳",
    "he": "🇮🇱",
    "hi": "🇮🇳",
    "hu": "🇭🇺",
    "id": "🇮🇩",
    "it": "🇮🇹",
    "ja": "🇯🇵",
    "kn": "🇮🇳",
    "ko": "🇰🇷",
    "ms": "🇲🇾",
    "ml": "🇮🇳",
    "mr": "🇮🇳",
    "ne": "🇳🇵",
    "nb": "🇳🇴",
    "fa": "🇮🇷",
    "pl": "🇵🇱",
    "pt-BR": "🇧🇷",
    "pt-PT": "🇵🇹",
    "pa": "🇮🇳",
    "ro": "🇷🇴",
    "ru": "🇷🇺",
    "sr": "🇷🇸",
    "sk": "🇸🇰",
    "sl": "🇸🇮",
    "es": "🇪🇸",
    "sw": "🇰🇪",
    "sv": "🇸🇪",
    "ta": "🇮🇳",
    "te": "🇮🇳",
    "th": "🇹🇭",
    "tr": "🇹🇷",
    "uk": "🇺🇦",
    "ur": "🇵🇰",
    "vi": "🇻🇳",
    "cy": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  };
  return flagMap[code] || "🌐";
};

export const LanguageSelector = () => {
  const { language, setLanguage, languageName } = useLanguage();
  const currentFlag = getCountryFlag(language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-10 gap-2 bg-secondary/50 border-border/50 hover:bg-secondary px-3"
        >
          <span className="text-lg">{currentFlag}</span>
          <span className="hidden sm:inline text-sm">{language.split("-")[0].toUpperCase()}</span>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56 bg-popover border-border z-50">
        <ScrollArea className="h-80">
          {LANGUAGES.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`flex items-center gap-3 cursor-pointer ${
                language === lang.code ? "bg-primary/10 text-primary" : ""
              }`}
            >
              <span className="text-lg">{getCountryFlag(lang.code)}</span>
              <span className="flex-1">{lang.name}</span>
              {language === lang.code && (
                <span className="text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};