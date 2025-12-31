import { useState, useCallback, useRef } from "react";
import { Upload, X, Sparkles, Loader2, Eraser, Crop, Undo2, Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { removeBackground, applyBackgroundColor, loadImageFromDataUrl } from "@/lib/backgroundRemoval";
import { cropToPassport, loadImageElement } from "@/lib/faceDetection";
import { BackgroundSelector } from "./BackgroundSelector";
import { ClothesSelector } from "./ClothesSelector";
import { AIUsageBanner } from "./AIUsageBanner";

interface PhotoUploaderProps {
  onPhotoSelect: (photo: string) => void;
  currentPhoto: string | null;
}

const MAX_HISTORY = 20;

type FunctionErrorInfo = { status?: number; message: string; code?: string };

const parseFunctionsInvokeError = async (error: any, response?: Response): Promise<FunctionErrorInfo> => {
  const status = response?.status ?? error?.context?.status;

  if (response) {
    try {
      const contentType = response.headers.get("Content-Type")?.split(";")[0].trim();

      if (contentType === "application/json") {
        const body = await response.clone().json();
        return {
          status,
          message: body?.error ?? body?.message ?? error?.message ?? "Request failed",
          code: body?.code,
        };
      }

      const text = await response.clone().text();
      try {
        const body = JSON.parse(text);
        return {
          status,
          message: body?.error ?? body?.message ?? error?.message ?? "Request failed",
          code: body?.code,
        };
      } catch {
        return { status, message: text || error?.message || "Request failed" };
      }
    } catch {
      // fall through
    }
  }

  return { status, message: error?.message || "Request failed" };
};

export const PhotoUploader = ({ onPhotoSelect, currentPhoto }: PhotoUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [isApplyingClothes, setIsApplyingClothes] = useState(false);
  const [transparentBlob, setTransparentBlob] = useState<Blob | null>(null);
  const [selectedBgColor, setSelectedBgColor] = useState("#FFFFFF");
  const [showBgSelector, setShowBgSelector] = useState(false);
  const [aiBannerType, setAiBannerType] = useState<"credits" | "ratelimit" | null>(null);
  
  // History management for undo/redo
  const historyRef = useRef<string[]>([]);
  const historyIndexRef = useRef<number>(-1);
  const [, forceUpdate] = useState({});

  const addToHistory = useCallback((photo: string) => {
    // Remove any future states if we're not at the end
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, historyIndexRef.current + 1);
    }
    
    // Add new state
    historyRef.current.push(photo);
    
    // Limit history size
    if (historyRef.current.length > MAX_HISTORY) {
      historyRef.current.shift();
    } else {
      historyIndexRef.current++;
    }
    
    forceUpdate({});
  }, []);

  const handlePhotoChange = useCallback((photo: string) => {
    if (photo && photo !== historyRef.current[historyIndexRef.current]) {
      addToHistory(photo);
    }
    onPhotoSelect(photo);
  }, [onPhotoSelect, addToHistory]);

  const canUndo = historyIndexRef.current > 0;
  const canRedo = historyIndexRef.current < historyRef.current.length - 1;

  const handleUndo = useCallback(() => {
    if (canUndo) {
      historyIndexRef.current--;
      const previousPhoto = historyRef.current[historyIndexRef.current];
      onPhotoSelect(previousPhoto);
      forceUpdate({});
      toast.success("Undo successful");
    }
  }, [canUndo, onPhotoSelect]);

  const handleRedo = useCallback(() => {
    if (canRedo) {
      historyIndexRef.current++;
      const nextPhoto = historyRef.current[historyIndexRef.current];
      onPhotoSelect(nextPhoto);
      forceUpdate({});
      toast.success("Redo successful");
    }
  }, [canRedo, onPhotoSelect]);
  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const photo = e.target?.result as string;
      handlePhotoChange(photo);
      setTransparentBlob(null);
      setShowBgSelector(false);
    };
    reader.readAsDataURL(file);
  }, [handlePhotoChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearPhoto = () => {
    onPhotoSelect("");
    setTransparentBlob(null);
    setShowBgSelector(false);
    historyRef.current = [];
    historyIndexRef.current = -1;
    forceUpdate({});
  };

  // Get session ID from localStorage for payment/subscription validation
  const getSessionId = (): string => {
    // Use a single shared session id across photo edits, one-off payments, and premium subscriptions.
    // Priority: premium -> payment -> photo (fallback)
    let sessionId =
      localStorage.getItem("premium_session_id") ||
      localStorage.getItem("payment_session_id") ||
      localStorage.getItem("photo_session_id");

    if (!sessionId) {
      sessionId = crypto.randomUUID();
    }

    // Keep all keys in sync so backend checks work no matter which flow the user used.
    localStorage.setItem("photo_session_id", sessionId);
    localStorage.setItem("payment_session_id", sessionId);
    localStorage.setItem("premium_session_id", sessionId);

    return sessionId;
  };

  const enhancePhoto = async () => {
    if (!currentPhoto) return;

    setIsEnhancing(true);
    toast.loading("Enhancing your photo with AI...", { id: "enhance" });

    try {
      const { data, error, response } = await supabase.functions.invoke("enhance-photo", {
        body: { image: currentPhoto },
      });

      if (error) {
        const info = await parseFunctionsInvokeError(error, response);

        if (info.status === 402 || info.code === "CREDITS_EXHAUSTED") {
          setAiBannerType("credits");
          toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage", {
            id: "enhance",
            duration: 6000,
          });
          return;
        }

        if (info.status === 429) {
          setAiBannerType("ratelimit");
          toast.error("Rate limit reached. Please try again in a minute.", { id: "enhance" });
          return;
        }

        toast.error(info.message || "Failed to enhance photo", { id: "enhance" });
        return;
      }

      if (data?.error) {
        if (data.code === "CREDITS_EXHAUSTED") {
          setAiBannerType("credits");
          toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage", {
            id: "enhance",
            duration: 6000,
          });
          return;
        }

        throw new Error(data.error);
      }

      if (data?.enhancedImage) {
        handlePhotoChange(data.enhancedImage);
        toast.success("Photo enhanced successfully!", { id: "enhance" });
      } else {
        throw new Error("No enhanced image received");
      }
    } catch (error: any) {
      console.error("Enhancement error:", error);
      toast.error(error.message || "Failed to enhance photo", { id: "enhance" });
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleRemoveBackground = async () => {
    if (!currentPhoto) return;

    setIsRemovingBg(true);
    toast.loading("Removing background... This may take a moment.", { id: "removebg" });

    try {
      const img = await loadImageFromDataUrl(currentPhoto);
      const blob = await removeBackground(img);
      setTransparentBlob(blob);
      
      // Apply default white background
      const newPhoto = await applyBackgroundColor(blob, selectedBgColor);
      handlePhotoChange(newPhoto);
      setShowBgSelector(true);
      
      toast.success("Background removed! Choose a background color.", { id: "removebg" });
    } catch (error: any) {
      console.error("Background removal error:", error);
      toast.error("Failed to remove background. Try a clearer photo.", { id: "removebg" });
    } finally {
      setIsRemovingBg(false);
    }
  };

  const handleColorSelect = async (color: string) => {
    if (!currentPhoto) return;
    
    setSelectedBgColor(color);
    
    // If background already removed, apply instantly without toast
    if (transparentBlob) {
      try {
        const newPhoto = await applyBackgroundColor(transparentBlob, color);
        handlePhotoChange(newPhoto);
      } catch (error) {
        console.error("Error applying background:", error);
        toast.error("Failed to apply background");
      }
    } else {
      // Auto-remove background first, then apply the selected color
      setIsRemovingBg(true);
      
      try {
        const img = await loadImageFromDataUrl(currentPhoto);
        const blob = await removeBackground(img);
        setTransparentBlob(blob);
        
        const newPhoto = await applyBackgroundColor(blob, color);
        handlePhotoChange(newPhoto);
        setShowBgSelector(true);
      } catch (error: any) {
        console.error("Background processing error:", error);
        toast.error("Failed to process background. Try a clearer photo.");
      } finally {
        setIsRemovingBg(false);
      }
    }
  };

  const handleAutoCrop = async () => {
    if (!currentPhoto) return;

    setIsCropping(true);
    toast.loading("Detecting face and cropping...", { id: "autocrop" });

    try {
      const img = await loadImageElement(currentPhoto);
      const croppedPhoto = await cropToPassport(img, 3.5 / 4.5); // Passport aspect ratio
      handlePhotoChange(croppedPhoto);
      toast.success("Photo cropped to passport dimensions!", { id: "autocrop" });
    } catch (error: any) {
      console.error("Auto-crop error:", error);
      toast.error(error.message || "Failed to auto-crop. Try a clearer photo.", { id: "autocrop" });
    } finally {
      setIsCropping(false);
    }
  };

  const handleApplyClothes = async (clothingType: string, clothingStyle: string) => {
    if (!currentPhoto) return;

    setIsApplyingClothes(true);
    toast.loading("Applying clothing to your photo...", { id: "clothes" });

    try {
      const { data, error, response } = await supabase.functions.invoke("apply-clothes", {
        body: {
          image: currentPhoto,
          clothingType,
          clothingStyle,
        },
      });

      if (error) {
        const info = await parseFunctionsInvokeError(error, response);

        if (info.status === 402 || info.code === "CREDITS_EXHAUSTED") {
          setAiBannerType("credits");
          toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage", {
            id: "clothes",
            duration: 6000,
          });
          return;
        }

        if (info.status === 429) {
          setAiBannerType("ratelimit");
          toast.error("Rate limit reached. Please try again in a minute.", { id: "clothes" });
          return;
        }

        toast.error(info.message || "Failed to apply clothing", { id: "clothes" });
        return;
      }

      if (data?.error) {
        if (data.code === "CREDITS_EXHAUSTED") {
          setAiBannerType("credits");
          toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage", {
            id: "clothes",
            duration: 6000,
          });
          return;
        }
        throw new Error(data.error);
      }

      if (data?.editedImage) {
        handlePhotoChange(data.editedImage);
        toast.success("Clothing applied successfully!", { id: "clothes" });
      } else {
        throw new Error("No edited image received");
      }
    } catch (error: any) {
      console.error("Clothing application error:", error);
      toast.error(error.message || "Failed to apply clothing", { id: "clothes" });
    } finally {
      setIsApplyingClothes(false);
    }
  };

  const isProcessing = isEnhancing || isRemovingBg || isCropping || isApplyingClothes;

  // Get processing message based on current action
  const getProcessingMessage = () => {
    if (isEnhancing) return "Enhancing with AI...";
    if (isApplyingClothes) return "Applying clothes...";
    if (isRemovingBg) return "Removing background...";
    if (isCropping) return "Auto cropping...";
    return "Processing...";
  };

  return (
    <div className="w-full space-y-4">
      {/* AI Usage Banner */}
      <AIUsageBanner type={aiBannerType} onDismiss={() => setAiBannerType(null)} />

      {/* Photo Preview or Upload Area */}
      {currentPhoto ? (
        <div className="animate-fade-in">
          <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-card/50 p-4">
            <img
              src={currentPhoto}
              alt="Uploaded photo"
              className={`mx-auto max-h-64 rounded-lg object-contain transition-all duration-300 ${
                isProcessing ? "opacity-50 blur-sm" : ""
              }`}
            />
            
            {/* Processing Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[2px] rounded-xl">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            )}
            
            <Button
              variant="destructive"
              size="icon"
              onClick={clearPhoto}
              disabled={isProcessing}
              className="absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <label
          className={`flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-300 ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-muted-foreground/30 hover:border-primary/50 hover:bg-card/30"
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleInputChange}
          />
          <div className="flex flex-col items-center gap-4 p-8 text-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Upload className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                Drop your photo here
              </p>
              <p className="text-sm text-muted-foreground">
                or click to browse
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              Supports JPG, PNG, WEBP
            </p>
          </div>
        </label>
      )}

      {/* Editing Buttons - Always Visible */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-foreground">Photo Editing Tools</p>
          {/* Undo/Redo Buttons */}
          <div className="flex gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUndo}
              disabled={!canUndo || isProcessing}
              className="h-8 px-2"
              title="Undo"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRedo}
              disabled={!canRedo || isProcessing}
              className="h-8 px-2"
              title="Redo"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            {historyRef.current.length > 0 && (
              <span className="text-xs text-muted-foreground ml-2 self-center">
                {historyIndexRef.current + 1}/{historyRef.current.length}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAutoCrop}
            disabled={!currentPhoto || isProcessing}
            className={`bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-0 disabled:opacity-50 transition-all ${
              isCropping ? "ring-2 ring-green-400 ring-offset-2 ring-offset-background" : ""
            }`}
          >
            {isCropping ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Crop className="h-4 w-4 mr-1" />
            )}
            {isCropping ? "Cropping..." : "Auto Crop"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={enhancePhoto}
            disabled={!currentPhoto || isProcessing}
            className={`bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-0 disabled:opacity-50 transition-all ${
              isEnhancing ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-background animate-pulse" : ""
            }`}
          >
            {isEnhancing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1" />
            )}
            {isEnhancing ? "Enhancing..." : "Enhance"}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRemoveBackground}
            disabled={!currentPhoto || isProcessing}
            className={`bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-0 disabled:opacity-50 transition-all ${
              isRemovingBg ? "ring-2 ring-blue-400 ring-offset-2 ring-offset-background" : ""
            }`}
          >
            {isRemovingBg ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Eraser className="h-4 w-4 mr-1" />
            )}
            {isRemovingBg ? "Removing..." : "Remove BG"}
          </Button>
          <ClothesSelector
            onApplyClothes={handleApplyClothes}
            disabled={!currentPhoto || isProcessing}
            isApplying={isApplyingClothes}
          />
        </div>

        {/* Background Color Selector - Always Visible & Enabled */}
        <div className={!currentPhoto || isProcessing ? "opacity-50 pointer-events-none" : ""}>
          <BackgroundSelector 
            selectedColor={selectedBgColor} 
            onColorSelect={handleColorSelect} 
          />
          <p className="text-xs text-muted-foreground mt-2">
            {transparentBlob ? "Click a color to change background" : "Select a color to auto-remove background & apply"}
          </p>
        </div>
      </div>
    </div>
  );
};