import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { getWatchlist, removeFromWatchlist, TMDB_IMG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
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
      .catch(() => toast.error("Не удалось загрузить список"))
      .finally(() => setLoading(false));
  }, [session]);

  const handleRemove = async (movieId: number, title: string) => {
    setRemoving(movieId);
    try {
      await removeFromWatchlist(movieId);
      setItems((prev) => prev.filter((m) => m.movieId !== movieId));
      toast.success(`«${title}» удалён из списка`);
    } catch {
      toast.error("Не удалось удалить");
    } finally {
      setRemoving(null);
    }
  };

  const filtered = items
    .filter((m) => m.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      let cmp = 0;
      if (sortKey === "addedAt") cmp = new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime();
      else if (sortKey === "title") cmp = a.title.localeCompare(b.title, "ru");
      else if (sortKey === "vote_average") cmp = (a.vote_average || 0) - (b.vote_average || 0);
      else if (sortKey === "release_date") cmp = (a.release_date || "").localeCompare(b.release_date || "");
      return sortAsc ? cmp : -cmp;
    });

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(false); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загружаем список…</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Bookmark className="w-4.5 h-4.5 text-primary" />
          </div>
          <h1 className="text-2xl font-black text-foreground">Хочу посмотреть</h1>
          {items.length > 0 && (
            <span className="text-xs font-bold text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-full">
              {items.length}
            </span>
          )}
        </div>
        <p className="text-muted-foreground text-sm ml-12">
          Фильмы, которые вы планируете посмотреть
        </p>
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-12 flex flex-col items-center text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-4">
            <Bookmark className="w-8 h-8 text-primary/30" />
          </div>
          <h2 className="text-foreground font-bold text-lg mb-2">Список пуст</h2>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed mb-6">
            Находите фильмы и нажимайте «Хочу посмотреть» — они появятся здесь
          </p>
          <button
            onClick={() => navigate("/search")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
          >
            <Search className="w-4 h-4" />
            Найти фильмы
          </button>
        </div>
      )}

      {/* Controls */}
      {items.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию…"
              className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
            />
          </div>
          {/* Sort buttons */}
          <div className="flex items-center gap-1.5 bg-card border border-border rounded-xl p-1">
            {(
              [
                { key: "addedAt", label: "Дата" },
                { key: "title", label: "Название" },
                { key: "vote_average", label: "Рейтинг" },
              ] as { key: SortKey; label: string }[]
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => toggleSort(key)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  sortKey === key
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {label}
                {sortKey === key && (sortAsc ? <SortAsc className="w-3 h-3" /> : <SortDesc className="w-3 h-3" />)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No results after search */}
      {items.length > 0 && filtered.length === 0 && (
        <div className="text-center py-12">
          <Film className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Ничего не найдено</p>
        </div>
      )}

      {/* Grid */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filtered.map((movie) => (
            <div
              key={movie.movieId}
              className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer relative"
              onClick={() => navigate(`/movie/${movie.movieId}`)}
            >
              {/* Poster */}
              <div className="relative aspect-[2/3] bg-muted overflow-hidden">
                {movie.poster_path ? (
                  <img
                    src={`${TMDB_IMG}/w342${movie.poster_path}`}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Film className="w-10 h-10 text-muted-foreground/20" />
                  </div>
                )}

                {/* Rating badge */}
                {movie.vote_average > 0 && (
                  <div className="absolute top-2 left-2 bg-black/70 backdrop-blur rounded-lg px-1.5 py-0.5 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                    <span className="text-white text-[10px] font-bold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}

                {/* Remove button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemove(movie.movieId, movie.title); }}
                  disabled={removing === movie.movieId}
                  className="absolute top-2 right-2 w-7 h-7 bg-black/60 backdrop-blur rounded-lg flex items-center justify-center text-white hover:bg-destructive/80 transition-all opacity-0 group-hover:opacity-100"
                  title="Удалить из списка"
                >
                  {removing === movie.movieId
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />
                  }
                </button>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end p-3">
                  <p className="text-white text-xs font-semibold leading-tight line-clamp-2">{movie.title}</p>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <h3 className="text-foreground text-xs font-bold leading-tight line-clamp-2 mb-1.5">
                  {movie.title}
                </h3>
                <div className="flex items-center justify-between">
                  {movie.release_date && (
                    <span className="text-muted-foreground text-[10px] flex items-center gap-0.5">
                      <Calendar className="w-2.5 h-2.5" />
                      {movie.release_date.slice(0, 4)}
                    </span>
                  )}
                  <span className="text-muted-foreground/50 text-[9px]">
                    {new Date(movie.addedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
