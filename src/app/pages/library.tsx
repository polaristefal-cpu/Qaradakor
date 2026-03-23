import { useEffect, useState } from "react";
import { getWatched, getMovie, TMDB_IMG } from "../lib/api";
import { useNavigate, Link } from "react-router";
import {
  Library as LibIcon, Loader2, Star, Clock, Search, Film,
  Grid3X3, List, SortAsc,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";

interface WatchedMovie {
  id: number; title: string; original_title: string;
  poster_path: string | null; release_date: string;
  vote_average: number; runtime: number;
  genres: { id: number; name: string }[];
  overview: string; _rating: number; _addedAt: string; _review: string;
}

export function LibraryPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [movies, setMovies] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"date" | "rating" | "title" | "year">("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);

  useEffect(() => {
    if (!session) { setMovies([]); setLoading(false); return; }
    (async () => {
      try {
        const watched = await getWatched();
        if (!watched || !Array.isArray(watched) || watched.length === 0) { setMovies([]); setLoading(false); return; }
        const details = await Promise.all(
          watched.map(async (w: any) => {
            try {
              const m = await getMovie(w.movieId);
              if (!m || m.success === false) return null;
              return { ...m, _rating: w.rating, _addedAt: w.addedAt, _review: w.review };
            } catch { return null; }
          })
        );
        setMovies(details.filter(Boolean) as WatchedMovie[]);
      } catch { setMovies([]); }
      finally { setLoading(false); }
    })();
  }, [session]);

  const filtered = movies
    .filter((m) => {
      if (filter && !m.title.toLowerCase().includes(filter.toLowerCase()) && !m.original_title?.toLowerCase().includes(filter.toLowerCase())) return false;
      if (ratingFilter !== null && m._rating !== ratingFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sort === "rating") return (b._rating || 0) - (a._rating || 0);
      if (sort === "title") return a.title.localeCompare(b.title);
      if (sort === "year") return (b.release_date || "").localeCompare(a.release_date || "");
      return new Date(b._addedAt || 0).getTime() - new Date(a._addedAt || 0).getTime();
    });

  const totalRuntime = movies.reduce((s, m) => s + (m.runtime || 0), 0);
  const avgRating = movies.length > 0 ? (movies.reduce((s, m) => s + (m._rating || 0), 0) / movies.length).toFixed(1) : "—";

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загрузка библиотеки...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <LibIcon className="w-5.5 h-5.5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Моя библиотека</h1>
            <p className="text-muted-foreground text-sm">
              {movies.length} {movies.length === 1 ? "фильм" : movies.length < 5 ? "фильма" : "фильмов"}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Фильмов", value: movies.length, icon: Film, color: "text-foreground" },
            { label: "Средняя оценка", value: avgRating, icon: Star, color: "text-primary" },
            { label: "Время просмотра", value: `${Math.floor(totalRuntime / 60)}ч`, icon: Clock, color: "text-secondary" },
            { label: "С отзывами", value: movies.filter(m => m._review).length, icon: SortAsc, color: "text-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
              <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-widest mb-1">{label}</p>
              <p className={`text-xl font-black ${color} flex items-center gap-1.5`}>
                <Icon className="w-4 h-4 opacity-70" />
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      {movies.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Поиск в библиотеке..."
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={ratingFilter ?? ""}
              onChange={(e) => setRatingFilter(e.target.value ? Number(e.target.value) : null)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition"
            >
              <option value="">Все оценки</option>
              {[10,9,8,7,6,5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as any)}
              className="bg-card border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary transition"
            >
              <option value="date">По дате</option>
              <option value="rating">По оценке</option>
              <option value="title">По названию</option>
              <option value="year">По году</option>
            </select>
            <div className="flex bg-card border border-border rounded-xl overflow-hidden">
              <button onClick={() => setView("grid")} className={`p-2 transition ${view === "grid" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")} className={`p-2 transition border-l border-border ${view === "list" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      {movies.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-muted border border-border inline-flex items-center justify-center mb-5">
            <Film className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-foreground font-bold text-lg">Библиотека пуста</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            Начните добавлять фильмы — найдите их через поиск и отметьте как просмотренные.
          </p>
          <Link to="/search" className="inline-flex items-center gap-2 mt-5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm">
            <Search className="w-4 h-4" /> Найти фильмы
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground">Ничего не найдено</p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/movie/${m.id}`)}
              className="group cursor-pointer relative rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:border-primary/40 hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
            >
              {m.poster_path ? (
                <img src={`${TMDB_IMG}/w342${m.poster_path}`} alt={m.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
              ) : (
                <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                  <Film className="w-8 h-8 text-muted-foreground/20" />
                </div>
              )}
              {m._rating > 0 && (
                <div className="absolute top-2 right-2 bg-primary/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                  <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                  <span className="text-primary-foreground text-[10px] font-black">{m._rating}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <p className="text-white text-xs font-semibold line-clamp-2">{m.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {m.release_date && <span className="text-white/50 text-[10px]">{m.release_date.slice(0, 4)}</span>}
                    {m.genres?.length > 0 && <span className="text-white/50 text-[10px]">{m.genres[0].name}</span>}
                  </div>
                  {m._review && <p className="text-white/50 text-[10px] mt-1 line-clamp-1 italic">«{m._review}»</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-1.5">
          {filtered.map((m) => (
            <div
              key={m.id}
              onClick={() => navigate(`/movie/${m.id}`)}
              className="flex items-center gap-4 bg-card border border-border rounded-xl p-3 hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all group"
            >
              {m.poster_path ? (
                <img src={`${TMDB_IMG}/w92${m.poster_path}`} alt={m.title} className="w-10 h-15 rounded-lg object-cover shrink-0" loading="lazy" />
              ) : (
                <div className="w-10 h-15 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <Film className="w-5 h-5 text-muted-foreground/30" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">{m.title}</p>
                <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground">
                  {m.release_date && <span>{m.release_date.slice(0, 4)}</span>}
                  {m.genres?.length > 0 && <span>{m.genres.slice(0, 2).map(g => g.name).join(", ")}</span>}
                  {m.runtime > 0 && <span>{m.runtime} мин</span>}
                </div>
                {m._review && <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1 italic">«{m._review}»</p>}
              </div>
              {m._rating > 0 && (
                <div className="flex items-center gap-1 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg shrink-0">
                  <Star className="w-3 h-3 text-primary fill-primary" />
                  <span className="text-primary text-sm font-black">{m._rating}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
