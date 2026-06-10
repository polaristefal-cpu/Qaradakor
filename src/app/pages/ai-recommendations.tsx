import { useState } from "react";
import { Bot, Sparkles } from "lucide-react";
import { AiChatPage } from "./ai-chat";
import { RecommendationsPage } from "./recommendations";
import { useLang } from "../lib/lang-context";

export function AiRecommendationsPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<"ai" | "recommendations">("recommendations");

  return (
    <div>
      {/* Tabs header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 pt-6 pb-3">
            <button
              onClick={() => setTab("recommendations")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                tab === "recommendations"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {t("tabRecommendations")}
            </button>
            <button
              onClick={() => setTab("ai")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                tab === "ai"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Bot className="w-4 h-4" />
              {t("tabAiChat")}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === "recommendations" ? <RecommendationsPage /> : <AiChatPage />}
      </div>
    </div>
  );
}
