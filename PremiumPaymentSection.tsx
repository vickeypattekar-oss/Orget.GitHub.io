import { useState, useCallback, useEffect } from "react";
import { Copy, Check, Upload, Loader2, AlertCircle, CheckCircle, Crown, Clock, ExternalLink, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface PremiumPaymentSectionProps {
  plan: {
    name: string;
    planType: string;
    amount: number;
    baseAmount: number;
    uses: number;
    months: number;
  };
  onBack: () => void;
  isIndia?: boolean;
}

const UPI_ID = "ikvivsp6@ybl";
const RECIPIENT = "Vicky Patekar";

export const PremiumPaymentSection = ({ plan, onBack, isIndia = true }: PremiumPaymentSectionProps) => {
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "failed">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "gpay" | "paypal">(isIndia ? "upi" : "gpay");

  // Update payment method when isIndia changes
  useEffect(() => {
    setPaymentMethod(isIndia ? "upi" : "gpay");
  }, [isIndia]);

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    setIsVerifying(true);
    setVerificationStatus("verifying");
    setErrorMessage("");

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target?.result as string;
        
        // Use a single shared session id across the app
        let sessionId =
          localStorage.getItem("premium_session_id") ||
          localStorage.getItem("payment_session_id") ||
          localStorage.getItem("photo_session_id");

        if (!sessionId) {
          sessionId = crypto.randomUUID();
        }

        // Keep all keys in sync so photo tools can validate premium subscriptions.
        localStorage.setItem("photo_session_id", sessionId);
        localStorage.setItem("payment_session_id", sessionId);
        localStorage.setItem("premium_session_id", sessionId);
        
        const { data, error } = await supabase.functions.invoke("verify-premium-payment", {
          body: { 
            imageBase64: base64, 
            sessionId, 
            planType: plan.planType, 
            paymentMethod,
            isInternational: !isIndia,
            expectedAmount: plan.amount
          },
        });

        setIsVerifying(false);

        if (error) {
          console.error("Verification error:", error);
          setVerificationStatus("failed");
          setErrorMessage("Payment verification failed. Please try again.");
          toast.error("Verification failed");
          return;
        }

        if (data.verified) {
          setVerificationStatus("success");
          toast.success("Payment verified! Awaiting manual approval.");
        } else {
          setVerificationStatus("failed");
          setErrorMessage(data.reason || "Payment verification failed. Please check the payment details.");
          toast.error("Payment not verified");
        }
      };

      reader.onerror = () => {
        setIsVerifying(false);
        setVerificationStatus("failed");
        setErrorMessage("Failed to read the image file");
        toast.error("Failed to read image");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setIsVerifying(false);
      setVerificationStatus("failed");
      setErrorMessage("An error occurred during verification");
      toast.error("Verification error");
    }
  };

  // Get the USD amount for international payments
  const usdAmount = plan.amount;

  const openPayPal = () => {
    const paypalUrl = `https://www.paypal.com/paypalme/VickyPatekar/${usdAmount}USD`;
    window.open(paypalUrl, "_blank");
  };

  const openGPay = () => {
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECIPIENT)}&am=${usdAmount}&cu=USD&tn=${encodeURIComponent(`Premium ${plan.name} subscription`)}`;
    window.open(upiLink, "_blank");
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-amber-500/20 p-2">
              <Crown className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-display text-2xl font-bold text-foreground">
                {plan.name}
              </h3>
              <p className="text-sm text-muted-foreground">
                {isIndia ? "₹" : "$"}{isIndia ? plan.baseAmount : plan.amount} for {plan.uses} uses ({plan.months} months)
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        </div>

        {/* Payment Method Selector - Only show for non-India */}
        {!isIndia && (
          <div className="mb-6">
            <p className="mb-3 text-sm font-medium text-foreground">Payment Method</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setPaymentMethod("gpay")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  paymentMethod === "gpay"
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-border/50 hover:border-amber-500/50"
                }`}
              >
                <Smartphone className="h-5 w-5" />
                <span className="font-semibold">GPay</span>
              </button>
              <button
                onClick={() => setPaymentMethod("paypal")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  paymentMethod === "paypal"
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-border/50 hover:border-amber-500/50"
                }`}
              >
                <span className="font-semibold">PayPal</span>
              </button>
              <button
                onClick={() => setPaymentMethod("upi")}
                className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  paymentMethod === "upi"
                    ? "border-amber-500 bg-amber-500/10 text-amber-400"
                    : "border-border/50 hover:border-amber-500/50"
                }`}
              >
                <span className="font-semibold">UPI</span>
              </button>
            </div>
          </div>
        )}

        {/* Step 1: Pay */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              1
            </span>
            <span className="font-semibold text-foreground">
              {paymentMethod === "paypal" ? "Pay via PayPal" : paymentMethod === "gpay" ? "Pay via GPay" : "Pay via UPI"}
            </span>
          </div>
          
          {paymentMethod === "paypal" ? (
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Amount to pay:</p>
                <p className="text-2xl font-bold text-amber-400">${usdAmount} USD</p>
              </div>
              
              <Button 
                onClick={openPayPal}
                className="w-full gap-2 bg-[#0070ba] hover:bg-[#005ea6]"
                size="lg"
              >
                <ExternalLink className="h-4 w-4" />
                Pay with PayPal
              </Button>
              
              <div className="mt-4 rounded-lg bg-background/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">Or send payment to UPI:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 font-mono text-sm text-amber-400">
                    {UPI_ID}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(UPI_ID, "UPI ID")}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
          ) : paymentMethod === "gpay" ? (
            <div className="rounded-xl bg-secondary/50 p-4">
              <div className="mb-4">
                <p className="mb-2 text-sm text-muted-foreground">Amount to pay:</p>
                <p className="text-2xl font-bold text-amber-400">${usdAmount} USD</p>
              </div>
              
              <Button 
                onClick={openGPay}
                className="w-full gap-2 bg-[#4285f4] hover:bg-[#3367d6]"
                size="lg"
              >
                <Smartphone className="h-4 w-4" />
                Pay with GPay
              </Button>
              
              <div className="mt-4 rounded-lg bg-background/50 p-3">
                <p className="mb-1 text-xs text-muted-foreground">Pay to UPI ID:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 font-mono text-sm text-amber-400">
                    {UPI_ID}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => copyToClipboard(UPI_ID, "UPI ID")}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Recipient: {RECIPIENT}</p>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-secondary/50 p-4">
              <p className="mb-2 text-sm text-muted-foreground">Pay to:</p>
              <p className="mb-1 text-lg font-semibold text-foreground">{RECIPIENT}</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-background/50 px-4 py-2 font-mono text-amber-400">
                  {UPI_ID}
                </code>
                <Button variant="outline" size="icon" onClick={() => copyToClipboard(UPI_ID, "UPI ID")}>
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                Amount: <span className="font-semibold text-amber-400">{isIndia ? "₹" : "$"}{plan.amount}</span>
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Upload Screenshot */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
              2
            </span>
            <span className="font-semibold text-foreground">Upload Payment Screenshot</span>
          </div>

          {verificationStatus === "success" ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl border-2 border-green-500 bg-green-500/10 p-4">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-lg font-bold text-green-600">✓ Payment Successful!</p>
                  <p className="text-sm text-muted-foreground">Your subscription is pending approval.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-muted-foreground/30 bg-card/30 p-4">
                <Clock className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-foreground">Manual Approval Required</p>
                  <p className="text-sm text-muted-foreground">
                    Your premium subscription will be activated within 24 hours after manual verification.
                  </p>
                </div>
              </div>
            </div>
          ) : verificationStatus === "failed" ? (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-xl border-2 border-destructive/50 bg-destructive/10 p-4">
                <AlertCircle className="h-8 w-8 shrink-0 text-destructive" />
                <div>
                  <p className="text-lg font-bold text-destructive">✗ Payment Failed</p>
                  <p className="text-sm text-muted-foreground">{errorMessage}</p>
                </div>
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 transition-all hover:border-amber-500/50 hover:bg-card/30">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={isVerifying}
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">Try uploading again</span>
              </label>
            </div>
          ) : (
            <label className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-8 transition-all ${
              isVerifying 
                ? "border-amber-500 bg-amber-500/5" 
                : "border-muted-foreground/30 hover:border-amber-500/50 hover:bg-card/30"
            }`}>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
                disabled={isVerifying}
              />
              {isVerifying ? (
                <>
                  <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Verifying Payment...</p>
                    <p className="text-sm text-muted-foreground">AI is analyzing your screenshot</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-amber-500/10 p-4">
                    <Upload className="h-8 w-8 text-amber-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      Upload {paymentMethod === "paypal" ? "PayPal" : paymentMethod === "gpay" ? "GPay" : "UPI"} payment screenshot
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'll verify your {isIndia ? "₹" : "$"}{plan.amount} payment automatically
                    </p>
                  </div>
                </>
              )}
            </label>
          )}
        </div>
      </div>
    </div>
  );
};
