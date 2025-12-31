import { useState, useCallback, useEffect } from "react";
import { Copy, Check, Upload, Loader2, AlertCircle, CheckCircle, Clock, ExternalLink, Smartphone, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";

interface PaymentSectionProps {
  onVerified: (photoCount: number, amount: number) => void;
  expectedAmount: number;
  expectedPhotos: number;
  onTimeout?: () => void;
  isIndia?: boolean;
}

const UPI_ID = "ikvivsp6@ybl";
const RECIPIENT = "Vicky Patekar";
const TIMEOUT_SECONDS = 150; // 2.5 minutes

export const PaymentSection = ({ onVerified, expectedAmount, expectedPhotos, onTimeout, isIndia = true }: PaymentSectionProps) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<"idle" | "verifying" | "success" | "failed" | "timeout">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(TIMEOUT_SECONDS);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "gpay" | "paypal">(isIndia ? "upi" : "gpay");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Update payment method when isIndia changes
  useEffect(() => {
    setPaymentMethod(isIndia ? "upi" : "gpay");
  }, [isIndia]);

  // Countdown timer
  useEffect(() => {
    if (verificationStatus === "success" || verificationStatus === "timeout") return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setVerificationStatus("timeout");
          toast.error("Time expired! Please try again.");
          onTimeout?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [verificationStatus, onTimeout]);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const copyToClipboard = useCallback((text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const sendConfirmationEmail = async (amount: number, currency: string, photoCount: number, paymentMethod: string) => {
    if (!email || !validateEmail(email)) return;
    
    try {
      const { error } = await supabase.functions.invoke("send-payment-confirmation", {
        body: {
          email,
          amount,
          currency,
          photoCount,
          paymentMethod,
        },
      });
      
      if (error) {
        console.error("Failed to send confirmation email:", error);
      } else {
        console.log("Confirmation email sent to:", email);
      }
    } catch (err) {
      console.error("Error sending confirmation email:", err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate email for international payments
    if (!isIndia && email && !validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setIsVerifying(true);
    setVerificationStatus("verifying");
    setErrorMessage("");
    setEmailError("");

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

        // Keep all keys in sync so photo tools (apply-clothes/enhance) can see the verified payment.
        localStorage.setItem("photo_session_id", sessionId);
        localStorage.setItem("payment_session_id", sessionId);
        localStorage.setItem("premium_session_id", sessionId);
        
        const { data, error } = await supabase.functions.invoke("verify-payment", {
          body: { 
            imageBase64: base64, 
            sessionId, 
            paymentMethod,
            isInternational: !isIndia,
            expectedAmount: isIndia ? expectedAmount : 5 // $5 for international
          },
        });

        if (error) {
          console.error("Verification error:", error);
          setVerificationStatus("failed");
          setErrorMessage("Payment verification failed. Please try again.");
          toast.error("Verification failed");
          return;
        }

        if (data.verified) {
          setVerificationStatus("success");
          toast.success(`Payment verified! You get ${data.photoCount} photos.`);
          
          // Send confirmation email for international users
          if (!isIndia && email) {
            sendConfirmationEmail(
              data.amount,
              data.currency || "USD",
              data.photoCount,
              data.paymentMethod || paymentMethod
            );
          }
          
          onVerified(data.photoCount, data.amount);
        } else {
          setVerificationStatus("failed");
          setErrorMessage(data.reason || "Payment verification failed. Please check the payment details.");
          toast.error("Payment not verified");
        }
      };

      reader.onerror = () => {
        setVerificationStatus("failed");
        setErrorMessage("Failed to read the image file");
        toast.error("Failed to read image");
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Upload error:", err);
      setVerificationStatus("failed");
      setErrorMessage("An error occurred during verification");
      toast.error("Verification error");
    } finally {
      setIsVerifying(false);
    }
  };

  const openPayPal = () => {
    const paypalUrl = `https://www.paypal.com/paypalme/VickyPatekar/5USD`;
    window.open(paypalUrl, "_blank");
  };

  const openGPay = () => {
    // GPay deep link with UPI ID for international payments
    const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECIPIENT)}&am=5&cu=USD&tn=${encodeURIComponent(`Payment for ${expectedPhotos} photos`)}`;
    window.open(upiLink, "_blank");
  };

  return (
    <div className="w-full animate-fade-in">
      <div className="rounded-2xl border-2 border-border/50 bg-card/30 p-6 md:p-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="font-display text-2xl font-bold text-foreground">
            {t("payment.title") || "Complete Payment"}
          </h3>
          {/* Timer Display */}
          {verificationStatus !== "success" && verificationStatus !== "timeout" && (
            <div className={`flex items-center gap-2 rounded-full px-4 py-2 ${
              timeRemaining <= 30 
                ? "bg-destructive/20 text-destructive" 
                : timeRemaining <= 60 
                  ? "bg-amber-500/20 text-amber-500" 
                  : "bg-primary/20 text-primary"
            }`}>
              <Clock className="h-4 w-4" />
              <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Timeout State */}
        {verificationStatus === "timeout" ? (
          <div className="flex flex-col items-center gap-4 rounded-xl border-2 border-destructive/50 bg-destructive/10 p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <p className="text-xl font-bold text-foreground">Time Expired!</p>
              <p className="mt-2 text-muted-foreground">
                The 2.5 minute window has passed. Please go back and try again.
              </p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="mt-2"
            >
              Start Over
            </Button>
          </div>
        ) : (
          <>
            {/* Email Input for International Users */}
            {!isIndia && (
              <div className="mb-6">
                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
                  <Mail className="h-4 w-4" />
                  Email for confirmation (optional)
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  className={emailError ? "border-destructive" : ""}
                />
                {emailError && (
                  <p className="mt-1 text-sm text-destructive">{emailError}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  We'll send you a confirmation email after successful payment
                </p>
              </div>
            )}

            {/* Payment Method Selector - Only show for non-India */}
            {!isIndia && (
              <div className="mb-6">
                <p className="mb-3 text-sm font-medium text-foreground">Payment Method</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setPaymentMethod("gpay")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      paymentMethod === "gpay"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <Smartphone className="h-5 w-5" />
                    <span className="font-semibold">GPay</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("paypal")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      paymentMethod === "paypal"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-primary/50"
                    }`}
                  >
                    <span className="font-semibold">PayPal</span>
                  </button>
                  <button
                    onClick={() => setPaymentMethod("upi")}
                    className={`flex items-center justify-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      paymentMethod === "upi"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/50 hover:border-primary/50"
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
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
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
                    <p className="text-2xl font-bold text-primary">$5 USD</p>
                    <p className="text-sm text-muted-foreground">for {expectedPhotos} photos</p>
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
                      <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 font-mono text-sm text-primary">
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
                    <p className="text-2xl font-bold text-primary">$5 USD</p>
                    <p className="text-sm text-muted-foreground">for {expectedPhotos} photos</p>
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
                      <code className="flex-1 truncate rounded-lg bg-card px-3 py-2 font-mono text-sm text-primary">
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

                  {/* UPI deep link button */}
                  <Button
                    onClick={() => {
                      const note = `Payment for ${expectedPhotos} photos`;
                      const upiLink = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(RECIPIENT)}&am=${expectedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;
                      window.location.href = upiLink;
                    }}
                    className="w-full gap-2 mb-4"
                    size="lg"
                  >
                    <Smartphone className="h-4 w-4" />
                    Pay ₹{expectedAmount} via UPI App
                  </Button>

                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg bg-background/50 px-4 py-2 font-mono text-primary">
                      {UPI_ID}
                    </code>
                    <Button variant="outline" size="icon" onClick={() => copyToClipboard(UPI_ID, "UPI ID")}>
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground">
                    Amount: <span className="font-semibold text-primary">₹{expectedAmount}</span> for{" "}
                    <span className="font-semibold text-foreground">{expectedPhotos} photos</span>
                  </p>
                </div>
              )}
            </div>

            {/* Step 2: Upload Screenshot */}
            <div>
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                <span className="font-semibold text-foreground">Upload Payment Screenshot</span>
                {timeRemaining <= 60 && verificationStatus !== "success" && (
                  <span className="text-sm text-destructive">Hurry!</span>
                )}
              </div>

          {verificationStatus === "success" ? (
            <div className="flex items-center gap-3 rounded-xl border-2 border-green-500 bg-green-500/10 p-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-lg font-bold text-green-600">✓ Payment Successful!</p>
                <p className="text-sm text-muted-foreground">You can now download your {expectedPhotos} photos.</p>
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
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-muted-foreground/30 p-6 transition-all hover:border-primary/50 hover:bg-card/30">
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
                ? "border-primary bg-primary/5" 
                : "border-muted-foreground/30 hover:border-primary/50 hover:bg-card/30"
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
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <div className="text-center">
                    <p className="font-semibold text-foreground">Verifying Payment...</p>
                    <p className="text-sm text-muted-foreground">AI is analyzing your screenshot</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="rounded-full bg-primary/10 p-4">
                    <Upload className="h-8 w-8 text-primary" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-foreground">
                      Upload {paymentMethod === "paypal" ? "PayPal" : paymentMethod === "gpay" ? "GPay" : "UPI"} payment screenshot
                    </p>
                    <p className="text-sm text-muted-foreground">
                      We'll verify your payment automatically
                    </p>
                  </div>
                </>
              )}
            </label>
          )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};