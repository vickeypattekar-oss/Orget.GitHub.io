import { useState } from "react";
import { Settings, Globe, Check, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const SettingsDialog = () => {
  const { language, setLanguage, languageName, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);

  const filteredLanguages = LANGUAGES.filter((lang) =>
    lang.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleFeedbackSubmit = async () => {
    if (!feedback.trim()) {
      toast.error(t("settings.feedbackEmpty"));
      return;
    }
    
    setFeedbackSubmitting(true);
    
    try {
      const sessionId = localStorage.getItem("session_id") || "";
      
      const { data, error } = await supabase.functions.invoke("submit-feedback", {
        body: { message: feedback.trim(), language },
        headers: { "x-session-id": sessionId },
      });

      if (error) throw error;
      
      setFeedback("");
      toast.success(t("settings.feedbackSent"));
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      toast.error(t("settings.feedbackError"));
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-foreground/80 hover:text-foreground hover:bg-foreground/10"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Settings className="h-5 w-5" />
            {t("settings.title")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Language Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Globe className="h-4 w-4" />
              {t("settings.language")}
            </div>

            <div className="text-xs text-muted-foreground mb-2">
              {t("settings.current")}: <span className="text-foreground font-medium">{languageName}</span>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("settings.search")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-secondary border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Language List */}
            <ScrollArea className="h-48 rounded-md border border-border bg-secondary/50">
              <div className="p-2 space-y-1">
                {filteredLanguages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                      language === lang.code
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{lang.name}</span>
                    {language === lang.code && <Check className="h-4 w-4" />}
                  </button>
                ))}
                {filteredLanguages.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    {t("settings.noLanguages")}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Feedback Section */}
          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <MessageSquare className="h-4 w-4" />
              {t("settings.feedback")}
            </div>
            
            <Textarea
              placeholder={t("settings.feedbackPlaceholder")}
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="min-h-[80px] bg-secondary border-border text-foreground placeholder:text-muted-foreground resize-none"
            />
            
            <Button
              onClick={handleFeedbackSubmit}
              disabled={feedbackSubmitting || !feedback.trim()}
              className="w-full"
            >
              {feedbackSubmitting ? t("settings.feedbackSending") : t("settings.feedbackSubmit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
