import { useState } from "react";
import { Library, Bookmark } from "lucide-react";
import { LibraryPage } from "./library";
import { WatchlistPage } from "./watchlist";
import { useLang } from "../lib/lang-context";

export function MyCollectionPage() {
  const { t } = useLang();
  const [tab, setTab] = useState<"library" | "watchlist">("library");

  return (
    <div>
      {/* Tabs header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 pt-6 pb-3">
            <button
              onClick={() => setTab("library")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                tab === "library"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Library className="w-4 h-4" />
              {t("tabLibrary")}
            </button>
            <button
              onClick={() => setTab("watchlist")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${
                tab === "watchlist"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Bookmark className="w-4 h-4" />
              {t("tabWatchlist")}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div>
        {tab === "library" ? <LibraryPage /> : <WatchlistPage />}
      </div>
    </div>
  );
}
