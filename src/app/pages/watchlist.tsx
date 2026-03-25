import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getWatchlist, removeFromWatchlist, TMDB_IMG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useLang } from "../lib/lang-context";
import {
  Bookmark, Trash2, Loader2, Film, Search,
  Star, Calendar, SortAsc, SortDesc, Filter,
} from "lucide-react";
import { toast } from "sonner";

interface WatchlistEntry {
  movieId: number;
  title: string;
  poster_path: string | null;
  release_date: string;
  vote_average: number;
  addedAt: string;
}

type SortKey = "addedAt" | "title" | "vote_average" | "release_date";

export function WatchlistPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [items, setItems] = useState<WatchlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("addedAt");
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }
    getWatchlist()
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => toast.error(t("failedToLoad")))
      .finally(() => setLoading(false));
  }, [session]);

  const handleRemove = async (movieId: number, title: string) => {
    setRemoving(movieId);
    try {
      await removeFromWatchlist(movieId);
      setItems((prev) => prev.filter((m) => m.movieId !== movieId));
      toast.success(`«${title}» ${t("removedFromList")}`);
    } catch {
      toast.error(t("failedToRemove"));
    } finally {
      setRemoving(null);
    }
  };

  const sorted = [...items]
    .filter((m) => !search || m.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const mul = sortAsc ? 1 : -1;
      if (sortKey === "addedAt") return mul * (new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
      if (sortKey === "title") return mul * a.title.localeCompare(b.title);
      if (sortKey === "vote_average") return mul * ((a.vote_average || 0) - (b.vote_average || 0));
      if (sortKey === "release_date") return mul * (a.release_date || "").localeCompare(b.release_date || "");
      return 0;
    });

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Bookmark className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("watchlistTitle")}</h1>
          <p className="text-muted-foreground text-sm">{items.length} {t("moviesCount")}</p>
        </div>
      </div>

      {/* Empty */}
      {items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Bookmark className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">{t("emptyWatchlist")}</h2>
            <p className="text-muted-foreground text-sm">{t("emptyWatchlistDesc")}</p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            {t("browseMovies")}
          </button>
        </div>
      )}

      {/* Toolbar */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2.5 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchWatchlist")}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary transition"
            />
          </div>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition cursor-pointer"
          >
            <option value="addedAt">{t("sortByAddedDate")}</option>
            <option value="title">{t("sortByTitle")}</option>
            <option value="vote_average">{t("sortByVote")}</option>
            <option value="release_date">{t("sortByRelease")}</option>
          </select>
          <button
            onClick={() => setSortAsc(!sortAsc)}
            className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-muted-foreground hover:text-foreground hover:border-primary/30 transition text-sm"
          >
            {sortAsc ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
          </button>
        </div>
      )}

      {/* List */}
      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((item) => (
            <div
              key={item.movieId}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-3.5 hover:border-primary/30 transition-all group shadow-sm"
            >
              {/* Poster */}
              <div
                onClick={() => navigate(`/movie/${item.movieId}`)}
                className="shrink-0 cursor-pointer"
              >
                {item.poster_path ? (
                  <img
                    src={`${TMDB_IMG}/w92${item.poster_path}`}
                    alt={item.title}
                    className="w-12 h-[72px] rounded-lg object-cover shadow-sm group-hover:shadow-md transition-shadow"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-12 h-[72px] rounded-lg bg-muted flex items-center justify-center">
                    <Film className="w-5 h-5 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => navigate(`/movie/${item.movieId}`)}
              >
                <p className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">
                  {item.title}
                </p>
                <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                  {item.release_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {item.release_date.slice(0, 4)}
                    </span>
                  )}
                  {item.vote_average > 0 && (
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" />
                      {item.vote_average.toFixed(1)}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground/50 mt-1">
                  {t("addedAt")} {new Date(item.addedAt).toLocaleDateString()}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => handleRemove(item.movieId, item.title)}
                disabled={removing === item.movieId}
                className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/20 transition-all opacity-0 group-hover:opacity-100"
              >
                {removing === item.movieId
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* No search results */}
      {sorted.length === 0 && items.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>{t("noResults")}</p>
        </div>
      )}
    </div>
  );
}