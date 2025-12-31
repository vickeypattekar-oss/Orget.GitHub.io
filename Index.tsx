import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, ArrowRight, Shield, Zap, Download, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PhotoUploader } from "@/components/PhotoUploader";
import { PhotoSizeSelector, PHOTO_SIZES, type PhotoSize } from "@/components/PhotoSizeSelector";
import { PaperLayoutSelector, PAPER_LAYOUTS, type PaperLayout } from "@/components/PaperLayoutSelector";
import { PricingCards, type PremiumPlan } from "@/components/PricingCards";
import { PaymentSection } from "@/components/PaymentSection";
import { PremiumPaymentSection } from "@/components/PremiumPaymentSection";
import { PhotoPreview } from "@/components/PhotoPreview";
import { DownloadSection } from "@/components/DownloadSection";
import { PlanSelector, PRICING_PLANS, type PricingPlan, isIndianLanguage } from "@/components/PlanSelector";
import { SettingsDialog } from "@/components/SettingsDialog";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Step = "landing" | "upload" | "customize" | "payment" | "premium-payment" | "download";

const Index = () => {
  const { t, language } = useLanguage();
  const { user, isGuest, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const isIndia = isIndianLanguage(language);
  const [step, setStep] = useState<Step>("landing");
  const [photo, setPhoto] = useState<string>("");
  const [photoSize, setPhotoSize] = useState<PhotoSize>(PHOTO_SIZES[0]);
  const [paperLayout, setPaperLayout] = useState<PaperLayout>(PAPER_LAYOUTS[4]); // A4 default
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(PRICING_PLANS[1]); // Default to popular plan
  const [verifiedPhotoCount, setVerifiedPhotoCount] = useState<number>(0);
  const [verifiedAmount, setVerifiedAmount] = useState<number>(0);
  const [selectedPremiumPlan, setSelectedPremiumPlan] = useState<PremiumPlan | null>(null);

  useEffect(() => {
    if (!isLoading && !user && !isGuest) {
      navigate("/auth");
    }
  }, [user, isGuest, isLoading, navigate]);

  const handleGetStarted = () => {
    setStep("upload");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePhotoSelect = (selectedPhoto: string) => {
    setPhoto(selectedPhoto);
  };

  const handleProceedToCustomize = () => {
    if (photo) {
      setStep("customize");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleProceedToPayment = () => {
    setStep("payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePaymentVerified = (photoCount: number, amount: number) => {
    setVerifiedPhotoCount(photoCount);
    setVerifiedAmount(amount);
    setStep("download");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handlePremiumSelect = (plan: PremiumPlan) => {
    setSelectedPremiumPlan(plan);
    setStep("premium-payment");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4">
          {/* Left - Language Selector */}
          <LanguageSelector />

          {/* Center - Orgeta Brand */}
          <button 
            onClick={() => setStep("landing")}
            className="font-display text-2xl font-bold text-primary"
          >
            Orgeta
          </button>

          {/* Right - User Menu / Settings */}
          <div className="flex items-center gap-2">
            {step !== "landing" && (
              <Button variant="ghost" size="sm" onClick={() => setStep("landing")}>
                {t("nav.backToHome")}
              </Button>
            )}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {user.email?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                  <DropdownMenuItem className="text-muted-foreground text-sm">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    {t("profile.title")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t("auth.logout")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isGuest ? (
              <Button variant="outline" size="sm" onClick={() => navigate("/auth")}>
                {t("auth.login")}
              </Button>
            ) : null}
            
            <SettingsDialog />
          </div>
        </div>
      </header>

      <main className="pt-16">
        {/* Landing Page */}
        {step === "landing" && (
          <div className="animate-fade-in">
            {/* Hero Section */}
            <section className="relative overflow-hidden py-20 md:py-32">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.1),transparent_50%)]" />
              <div className="container relative px-4">
                <div className="mx-auto max-w-3xl text-center">
                  <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    <Zap className="h-4 w-4" />
                    {t("hero.badge")}
                  </div>
                  <h1 className="mb-6 font-display text-4xl font-bold leading-tight text-foreground md:text-6xl">
                    {t("hero.title.part1")}{" "}
                    <span className="text-gradient">{t("hero.title.part2")}</span>{" "}
                    {t("hero.title.part3")}
                  </h1>
                  <p className="mb-10 text-lg text-muted-foreground md:text-xl">
                    {t("hero.description")}
                  </p>
                  <Button variant="hero" size="xl" onClick={handleGetStarted}>
                    {t("hero.cta")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </section>

            {/* Features */}
            <section className="border-y border-border/50 bg-card/20 py-16">
              <div className="container px-4">
                <div className="grid gap-8 md:grid-cols-3">
                  {[
                    {
                      icon: Camera,
                      titleKey: "features.multipleSizes.title",
                      descKey: "features.multipleSizes.desc",
                    },
                    {
                      icon: Download,
                      titleKey: "features.printReady.title",
                      descKey: "features.printReady.desc",
                    },
                    {
                      icon: Shield,
                      titleKey: "features.securePayment.title",
                      descKey: "features.securePayment.desc",
                    },
                  ].map((feature) => (
                    <div
                      key={feature.titleKey}
                      className="flex flex-col items-center rounded-2xl border border-border/50 bg-card/30 p-8 text-center transition-all hover:-translate-y-1 hover:border-primary/30"
                    >
                      <div className="mb-4 rounded-full bg-primary/10 p-4">
                        <feature.icon className="h-8 w-8 text-primary" />
                      </div>
                      <h3 className="mb-2 font-display text-xl font-semibold text-foreground">
                        {t(feature.titleKey)}
                      </h3>
                      <p className="text-muted-foreground">{t(feature.descKey)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Pricing */}
            <section className="py-20">
              <div className="container px-4">
                <PricingCards onGetStarted={handleGetStarted} onPremiumSelect={handlePremiumSelect} />
              </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-border/50 py-8">
              <div className="container px-4 text-center text-sm text-muted-foreground">
                <p>{t("footer.copyright")}</p>
              </div>
            </footer>
          </div>
        )}

        {/* Upload Step */}
        {step === "upload" && (
          <div className="container animate-fade-in px-4 py-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {t("upload.title")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("upload.description")}
                </p>
              </div>
              <PhotoUploader onPhotoSelect={handlePhotoSelect} currentPhoto={photo} />
              
              {photo && (
                <div className="mt-6">
                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={handleProceedToCustomize}
                  >
                    {t("upload.continue")}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Customize Step */}
        {step === "customize" && (
          <div className="container animate-fade-in px-4 py-12">
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {t("customize.title")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("customize.description")}
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <div className="space-y-8">
                  <PlanSelector
                    selectedPlan={selectedPlan}
                    onPlanChange={setSelectedPlan}
                  />
                  <PhotoSizeSelector
                    selectedSize={photoSize}
                    onSizeChange={setPhotoSize}
                  />
                  <PaperLayoutSelector
                    selectedLayout={paperLayout}
                    onLayoutChange={setPaperLayout}
                  />
                  <Button
                    variant="hero"
                    size="xl"
                    className="w-full"
                    onClick={handleProceedToPayment}
                  >
                    {t("customize.continue")} ({isIndia ? `₹${selectedPlan.amountINR}` : `$${selectedPlan.amountUSD}`})
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
                <div>
                  <PhotoPreview
                    photo={photo}
                    photoSize={photoSize}
                    paperLayout={paperLayout}
                    photoCount={selectedPlan.photos}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Step */}
        {step === "payment" && (
          <div className="container animate-fade-in px-4 py-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {t("payment.title")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("payment.description", { 
                    amount: isIndia ? selectedPlan.amountINR : selectedPlan.amountUSD, 
                    count: selectedPlan.photos 
                  })}
                </p>
              </div>
              <PaymentSection 
                onVerified={handlePaymentVerified} 
                expectedAmount={isIndia ? selectedPlan.amountINR : selectedPlan.amountUSD}
                expectedPhotos={selectedPlan.photos}
                isIndia={isIndia}
              />
            </div>
          </div>
        )}

        {/* Premium Payment Step */}
        {step === "premium-payment" && selectedPremiumPlan && (
          <div className="container animate-fade-in px-4 py-12">
            <div className="mx-auto max-w-2xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {t("premium.title")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("premium.description")}
                </p>
              </div>
              <PremiumPaymentSection 
                plan={{
                  ...selectedPremiumPlan,
                  amount: isIndia ? selectedPremiumPlan.amountINR : selectedPremiumPlan.amountUSD,
                  baseAmount: isIndia ? selectedPremiumPlan.baseAmountINR : selectedPremiumPlan.baseAmountUSD,
                }}
                onBack={() => setStep("landing")}
                isIndia={isIndia}
              />
            </div>
          </div>
        )}


        {step === "download" && (
          <div className="container animate-fade-in px-4 py-12">
            <div className="mx-auto max-w-5xl">
              <div className="mb-8 text-center">
                <h2 className="font-display text-3xl font-bold text-foreground">
                  {t("download.title")}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {t("download.description", { amount: verifiedAmount, count: verifiedPhotoCount })}
                </p>
              </div>

              <div className="grid gap-8 lg:grid-cols-2">
                <PhotoPreview
                  photo={photo}
                  photoSize={photoSize}
                  paperLayout={paperLayout}
                  photoCount={verifiedPhotoCount}
                />
                <DownloadSection
                  photo={photo}
                  photoSize={photoSize}
                  paperLayout={paperLayout}
                  photoCount={verifiedPhotoCount}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;