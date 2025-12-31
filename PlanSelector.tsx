import { Check, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export interface PricingPlan {
  id: string;
  amountINR: number;
  amountUSD: number;
  photos: number;
  popular: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  { id: "plan_21", amountINR: 37, amountUSD: 5, photos: 21, popular: false },
  { id: "plan_30", amountINR: 47, amountUSD: 10, photos: 30, popular: true },
  { id: "plan_37", amountINR: 49, amountUSD: 15, photos: 37, popular: false },
];

export const isIndianLanguage = (langCode: string): boolean => {
  const indianLanguages = ["hi", "bn", "te", "mr", "ta", "gu", "kn", "ml", "pa", "or", "as"];
  return langCode === "en-IN" || indianLanguages.includes(langCode);
};

interface PlanSelectorProps {
  selectedPlan: PricingPlan;
  onPlanChange: (plan: PricingPlan) => void;
}

export const PlanSelector = ({ selectedPlan, onPlanChange }: PlanSelectorProps) => {
  const { t, language } = useLanguage();
  const isIndia = isIndianLanguage(language);

  const getDisplayAmount = (plan: PricingPlan) => {
    if (isIndia) {
      return `₹${plan.amountINR}`;
    }
    return `$${plan.amountUSD}`;
  };

  return (
    <div className="w-full">
      <h3 className="mb-4 font-display text-lg font-semibold text-foreground">
        {t("plan.title")}
      </h3>
      <div className="grid gap-3 sm:grid-cols-3">
        {PRICING_PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onPlanChange(plan)}
            className={`group relative flex flex-col items-center rounded-xl border-2 p-4 text-center transition-all duration-300 ${
              selectedPlan.id === plan.id
                ? "border-primary bg-primary/10"
                : "border-border/50 bg-card/30 hover:border-primary/50 hover:bg-card/50"
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                {t("plan.popular")}
              </div>
            )}
            
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-foreground">{getDisplayAmount(plan)}</span>
            </div>
            
            <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="font-semibold text-foreground">{plan.photos} {t("plan.photos")}</span>
            </div>
            
            {selectedPlan.id === plan.id && (
              <div className="absolute right-2 top-2 rounded-full bg-primary p-1">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </button>
        ))}
      </div>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        {t("paperLayout.photosPerSheet")}
      </p>
    </div>
  );
};
