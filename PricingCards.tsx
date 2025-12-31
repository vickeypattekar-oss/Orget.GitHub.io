import { Check, Sparkles, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { isIndianLanguage } from "./PlanSelector";

interface PricingCardsProps {
  onGetStarted: () => void;
  onPremiumSelect: (plan: PremiumPlan) => void;
}

export interface PremiumPlan {
  name: string;
  planType: string;
  amountINR: number;
  amountUSD: number;
  baseAmountINR: number;
  baseAmountUSD: number;
  uses: number;
  usesUSD?: number;
  months: number;
  monthsUSD?: number;
}

const PRICING = [
  { amountINR: 37, amountUSD: 5, photos: 21, popular: false },
  { amountINR: 47, amountUSD: 10, photos: 30, popular: true },
  { amountINR: 49, amountUSD: 15, photos: 37, popular: false },
];

export const PREMIUM_PLANS: PremiumPlan[] = [
  { name: "Premium 1+", planType: "premium_1", amountINR: 340, amountUSD: 40, baseAmountINR: 37, baseAmountUSD: 5, uses: 10, months: 2 },
  { name: "Premium 2+", planType: "premium_2", amountINR: 430, amountUSD: 80, baseAmountINR: 47, baseAmountUSD: 10, uses: 10, months: 2 },
  { name: "Premium 3+", planType: "premium_3", amountINR: 410, amountUSD: 120, baseAmountINR: 49, baseAmountUSD: 15, uses: 10, months: 2 },
  { name: "Gold Premium", planType: "gold_premium", amountINR: 1000, amountUSD: 250, baseAmountINR: 37, baseAmountUSD: 5, uses: 30, usesUSD: 32, months: 12, monthsUSD: 17 },
];

export const PricingCards = ({ onGetStarted, onPremiumSelect }: PricingCardsProps) => {
  const { t, language } = useLanguage();
  const isIndia = isIndianLanguage(language);

  const getDisplayAmount = (amountINR: number, amountUSD: number) => {
    return isIndia ? `₹${amountINR}` : `$${amountUSD}`;
  };

  return (
    <div className="w-full">
      <div className="mb-8 text-center">
        <h2 className="font-display text-3xl font-bold text-foreground md:text-4xl">
          {t("pricing.title")}
        </h2>
        <p className="mt-2 text-muted-foreground">
          {t("pricing.subtitle")}
        </p>
      </div>
      
      {/* Regular Pricing */}
      <div className="grid gap-6 md:grid-cols-3 mb-16">
        {PRICING.map((plan, index) => (
          <div
            key={index}
            className={`relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 ${
              plan.popular
                ? "border-primary bg-primary/5 shadow-lg glow"
                : "border-border/50 bg-card/30 hover:border-primary/30"
            }`}
          >
            {plan.popular && (
              <div className="absolute -right-8 top-4 rotate-45 gradient-primary px-10 py-1 text-xs font-bold text-primary-foreground">
                {t("plan.popular")}
              </div>
            )}
            
            <div className="mb-4">
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">{getDisplayAmount(plan.amountINR, plan.amountUSD)}</span>
              </div>
              <p className="text-sm text-muted-foreground">{t("pricing.perUse")}</p>
            </div>
            
            <div className="mb-6 flex items-center gap-2 rounded-lg bg-secondary/50 px-4 py-3">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">{plan.photos} {t("plan.photos")}</span>
            </div>
            
            <ul className="mb-6 space-y-3">
              {[
                "High-quality output",
                "PNG & PDF formats",
                "All photo sizes",
                "All paper layouts",
                "Instant download",
              ].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {feature}
                </li>
              ))}
            </ul>
            
            <button
              onClick={onGetStarted}
              className={`w-full rounded-xl py-3 font-semibold transition-all duration-300 ${
                plan.popular
                  ? "gradient-primary text-primary-foreground hover:shadow-lg"
                  : "bg-secondary text-foreground hover:bg-secondary/80"
              }`}
            >
              {t("pricing.getStarted")}
            </button>
          </div>
        ))}
      </div>

      {/* Premium Plans Section */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-medium text-amber-400">
          <Crown className="h-4 w-4" />
          {t("pricing.premium")}
        </div>
        <h3 className="font-display text-2xl font-bold text-foreground md:text-3xl">
          {t("pricing.bestValue")}
        </h3>
        <p className="mt-2 text-muted-foreground">
          Pre-pay for multiple uses with great savings
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {PREMIUM_PLANS.map((plan) => {
          const displayAmount = getDisplayAmount(plan.amountINR, plan.amountUSD);
          const displayBaseAmount = getDisplayAmount(plan.baseAmountINR, plan.baseAmountUSD);
          const displayUses = isIndia ? plan.uses : (plan.usesUSD ?? plan.uses);
          const displayMonths = isIndia ? plan.months : (plan.monthsUSD ?? plan.months);
          const savings = isIndia 
            ? `₹${plan.baseAmountINR * plan.uses - plan.amountINR}`
            : `$${plan.baseAmountUSD * displayUses - plan.amountUSD}`;
          
          const getMonthsLabel = (months: number) => {
            if (months === 12) return "12 months (1 year)";
            if (months === 17) return "17 months (1 year 5 months)";
            return `${months} months`;
          };
          
          return (
            <div
              key={plan.name}
              className={`relative overflow-hidden rounded-2xl border-2 p-6 transition-all duration-300 hover:-translate-y-1 ${
                plan.planType === "gold_premium" 
                  ? "border-yellow-500/50 bg-gradient-to-b from-yellow-500/20 to-amber-500/10 hover:border-yellow-500/70 shadow-lg shadow-yellow-500/10"
                  : "border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent hover:border-amber-500/50"
              }`}
            >
              {/* Best Value Badge for Gold Premium */}
              {plan.planType === "gold_premium" && (
                <div className="absolute -left-8 top-6 rotate-[-45deg] bg-gradient-to-r from-yellow-500 to-amber-500 px-10 py-1 text-xs font-bold text-white shadow-md">
                  Best Value
                </div>
              )}
              
              <div className={`absolute top-0 right-0 rounded-bl-xl px-3 py-1 ${
                plan.planType === "gold_premium" ? "bg-gradient-to-r from-yellow-500 to-amber-500" : "gradient-primary"
              }`}>
                <Crown className="h-4 w-4 text-primary-foreground" />
              </div>
              
              <div className="mb-4">
                <h4 className={`text-lg font-bold mb-1 ${plan.planType === "gold_premium" ? "text-yellow-400" : "text-amber-400"}`}>{plan.name}</h4>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-foreground">{displayAmount}</span>
                </div>
                <p className="text-sm text-muted-foreground">{t("pricing.perUse")}</p>
              </div>
              
              <div className="mb-6 space-y-2">
                <div className={`flex items-center gap-2 rounded-lg px-4 py-3 ${
                  plan.planType === "gold_premium" ? "bg-yellow-500/15" : "bg-amber-500/10"
                }`}>
                  <Sparkles className={`h-5 w-5 ${plan.planType === "gold_premium" ? "text-yellow-400" : "text-amber-400"}`} />
                  <span className="font-semibold text-foreground">{displayBaseAmount} plan × {displayUses} {t("pricing.uses")}</span>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Valid for {getMonthsLabel(displayMonths)}
                </p>
              </div>
              
              <ul className="mb-6 space-y-3">
                {[
                  "All regular features included",
                  `Save ${savings} total`,
                  `Use anytime in ${displayMonths} months`,
                  "Manual approval (24h)",
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className={`h-4 w-4 ${plan.planType === "gold_premium" ? "text-yellow-400" : "text-amber-400"}`} />
                    {feature}
                  </li>
                ))}
              </ul>
              
              <button
                onClick={() => onPremiumSelect(plan)}
                className="w-full rounded-xl py-3 font-semibold transition-all duration-300 bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:shadow-lg hover:shadow-amber-500/25"
              >
                {t("pricing.subscribe")}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
