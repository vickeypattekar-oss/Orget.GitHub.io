import { AlertTriangle, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface AIUsageBannerProps {
  type: "credits" | "ratelimit" | null;
  onDismiss: () => void;
}

export const AIUsageBanner = ({ type, onDismiss }: AIUsageBannerProps) => {
  const { t } = useLanguage();
  
  if (!type) return null;

  const isCredits = type === "credits";

  return (
    <div
      className={`relative flex items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
        isCredits
          ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
          : "border-blue-500/30 bg-blue-500/10 text-blue-200"
      }`}
    >
      {isCredits ? (
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
      ) : (
        <Clock className="h-5 w-5 shrink-0 text-blue-400" />
      )}

      <div className="flex-1">
        {isCredits ? (
          <>
            <span className="font-medium">{t("ai.creditsExhausted")}</span>{" "}
            <span className="text-amber-300/80">
              {t("ai.addCredits")}
            </span>
          </>
        ) : (
          <>
            <span className="font-medium">{t("ai.rateLimit")}</span>{" "}
            <span className="text-blue-300/80">
              {t("ai.waitMinute")}
            </span>
          </>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        onClick={onDismiss}
        className="h-6 w-6 shrink-0 text-current hover:bg-white/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};
