import { useState, useEffect } from "react";
import { getWatched, getMovie, getTVShowBasic, TMDB_IMG } from "../lib/api";
import { useNavigate, Link } from "react-router";
import {
  Library as LibIcon, Loader2, Star, Clock, Search, Film,
  Grid3X3, List, SortAsc, Calendar, TrendingUp, Award,
  Flame, Heart, MessageSquare, Target, BarChart3, Activity, Tv,
} from "lucide-react";
import { useAuth } from "../lib/auth-context";
import { useLang } from "../lib/lang-context";

interface WatchedMovie {
  id: number; title: string; original_title: string;
  poster_path: string | null; release_date: string;
  vote_average: number; runtime: number;
  genres: { id: number; name: string }[];
  overview: string; _rating: number; _addedAt: string; _review: string;
  _mediaType?: "movie" | "tv";
}

export function LibraryPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [movies, setMovies] = useState<WatchedMovie[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<"date" | "rating" | "title" | "year">("date");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [mediaTypeFilter, setMediaTypeFilter] = useState<"all" | "movie" | "tv">("all");

  useEffect(() => {
    if (!session) { setMovies([]); setLoading(false); return; }
    (async () => {
      try {
        const watched = await getWatched();
        if (!watched || !Array.isArray(watched) || watched.length === 0) { setMovies([]); setLoading(false); return; }
        const details = await Promise.all(
          watched.map(async (w: any) => {
            try {
              const isTV = (w.mediaType || "movie") === "tv";
              const m = isTV ? await getTVShowBasic(w.movieId) : await getMovie(w.movieId);
              if (!m || m.success === false) return null;
              // Normalize TV show fields to movie-like fields
              const normalized = isTV ? {
                ...m,
                title: m.name || m.title,
                original_title: m.original_name || m.original_title,
                release_date: m.first_air_date || m.release_date,
                runtime: m.episode_run_time?.[0] || 0,
              } : m;
              return { ...normalized, _rating: w.rating, _addedAt: w.addedAt, _review: w.review, _mediaType: w.mediaType || "movie" };
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
      if (mediaTypeFilter !== "all" && (m._mediaType || "movie") !== mediaTypeFilter) return false;
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
  const moviesCount = movies.filter(m => (m._mediaType || "movie") === "movie").length;
  const tvCount = movies.filter(m => m._mediaType === "tv").length;

  // ── Extended Analytics ──────────────────────────────────────────────────────
  const reviewsCount = movies.filter(m => m._review?.trim()).length;
  const totalDays = Math.floor(totalRuntime / (60 * 24));
  const totalHours = Math.floor((totalRuntime % (60 * 24)) / 60);
  const perfectScores = movies.filter(m => m._rating === 10).length;
  const favGenres = movies.flatMap(m => m.genres || []);
  const genreCounts = favGenres.reduce((acc, g) => {
    acc[g.name] = (acc[g.name] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const topGenre = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  // Activity heatmap (GitHub-style)
  const activityMap = new Map<string, number>();
  movies.forEach(m => {
    if (m._addedAt) {
      const date = new Date(m._addedAt).toISOString().slice(0, 10);
      activityMap.set(date, (activityMap.get(date) || 0) + 1);
    }
  });

  // Last 52 weeks (365 days)
  const today = new Date();
  const weeks: Array<Array<{ date: string; count: number; day: number }>> = [];
  const startDate = new Date(today);
  startDate.setDate(today.getDate() - 364);
  
  let currentWeek: Array<{ date: string; count: number; day: number }> = [];
  for (let i = 0; i < 365; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const count = activityMap.get(dateStr) || 0;
    const day = date.getDay();
    
    currentWeek.push({ date: dateStr, count, day });
    
    if (day === 6 || i === 364) {
      weeks.push([...currentWeek]);
      currentWeek = [];
    }
  }

  const maxActivity = Math.max(...Array.from(activityMap.values()), 1);
  const getHeatColor = (count: number) => {
    if (count === 0) return "bg-muted/50 border-border/50";
    const intensity = Math.ceil((count / maxActivity) * 4);
    if (intensity === 1) return "bg-primary/25 border-primary/30";
    if (intensity === 2) return "bg-primary/50 border-primary/60";
    if (intensity === 3) return "bg-primary/75 border-primary/80";
    return "bg-primary border-primary shadow-sm";
  };

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const recentMovies = movies.filter(m => 
    m._addedAt && new Date(m._addedAt) >= thirtyDaysAgo
  ).length;

  // Longest streak
  const sortedDates = Array.from(activityMap.keys()).sort();
  let currentStreak = 0;
  let maxStreak = 0;
  let prevDate: Date | null = null;
  
  sortedDates.forEach(dateStr => {
    const date = new Date(dateStr);
    if (prevDate) {
      const diff = Math.floor((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) {
        currentStreak++;
      } else {
        maxStreak = Math.max(maxStreak, currentStreak);
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }
    prevDate = date;
  });
  maxStreak = Math.max(maxStreak, currentStreak);

  // Helper: navigate to correct detail page
  const goToDetail = (m: WatchedMovie) => {
    if (m._mediaType === "tv") navigate(`/tv/${m.id}`);
    else navigate(`/movie/${m.id}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">{t("loading")}</p>
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
            <h1 className="text-2xl font-black text-foreground">{t("libraryTitle")}</h1>
            <p className="text-muted-foreground text-sm">
              {movies.length} {t("totalItems")}
              {tvCount > 0 && (
                <span className="ml-2 text-xs">
                  · {moviesCount} {t("moviesCount")} · {tvCount} {t("tvCount")}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      {movies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: t("totalItems"), value: movies.length, icon: Film, color: "text-foreground" },
            { label: t("avgRating"), value: avgRating, icon: Star, color: "text-primary" },
            { label: t("watched"), value: `${Math.floor(totalRuntime / 60)}${t("libHourShort")}`, icon: Clock, color: "text-secondary" },
            { label: t("libReviews"), value: movies.filter(m => m._review).length, icon: SortAsc, color: "text-foreground" },
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

      {/* ── Extended Analytics ── */}
      {movies.length > 0 && (
        <div className="space-y-6 mb-6">
          {/* Activity Heatmap (GitHub-style) */}
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-bold text-foreground">{t("libActivityTitle")}</h3>
              </div>
              <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-3 h-3" />
                  {t("libStreak")}: {maxStreak}{t("libDayShort")}
                </span>
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="w-3 h-3" />
                  {t("libLastMonth")}: {recentMovies}
                </span>
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="overflow-x-auto pb-2">
              <div className="inline-flex gap-[2px] min-w-max">
                {weeks.map((week, i) => (
                  <div key={i} className="flex flex-col gap-[2px]">
                    {[0,1,2,3,4,5,6].map(day => {
                      const cell = week.find(c => c.day === day);
                      if (!cell) return <div key={day} className="w-[10px] h-[10px]" />;
                      return (
                        <div
                          key={day}
                          title={`${cell.date}: ${cell.count}`}
                          className={`w-[10px] h-[10px] rounded-sm border transition-all hover:scale-125 hover:shadow-sm cursor-pointer ${getHeatColor(cell.count)}`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
              <span className="text-[10px] text-muted-foreground">{t("libLessLabel")}</span>
              <div className="flex items-center gap-1">
                {[0, 1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-3 h-3 rounded-sm border ${getHeatColor(i === 0 ? 0 : Math.ceil((i / 4) * maxActivity))}`} />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">{t("libMoreLabel")}</span>
            </div>
          </div>

          {/* Additional Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: t("libPerfect10"), value: perfectScores, icon: Award },
              { label: t("libReviews"), value: reviewsCount, icon: MessageSquare },
              { label: t("libFavGenre"), value: topGenre, icon: Heart },
              { label: t("libTotalTime"), value: totalDays > 0 ? `${totalDays}${t("libDayShort")}` : `${totalHours}${t("libHourShort")}`, icon: Calendar },
              { label: t("libLast30"), value: recentMovies, icon: TrendingUp },
              { label: t("libBestStreak"), value: maxStreak > 0 ? `${maxStreak}${t("libDayShort")}` : "—", icon: Flame },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="bg-card border border-border rounded-xl px-3 py-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-muted flex items-center justify-center">
                    <Icon className="w-3 h-3 text-foreground" />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-medium leading-tight">{label}</p>
                </div>
                <p className="text-lg font-black text-foreground leading-none">
                  {value}
                </p>
              </div>
            ))}
          </div>
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
              placeholder={t("filterPlaceholder")}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>

          {/* Media type filter */}
          <div className="flex gap-1">
            {(["all", "movie", "tv"] as const).map((mt) => {
              const label = mt === "all" ? t("filterAll") : mt === "movie" ? t("filterMovies") : t("filterTV");
              const Icon = mt === "tv" ? Tv : Film;
              return (
                <button
                  key={mt}
                  onClick={() => setMediaTypeFilter(mt)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-xl border text-xs font-semibold transition-all ${
                    mediaTypeFilter === mt
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {mt !== "all" && <Icon className="w-3 h-3" />}
                  {label}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as any)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary transition cursor-pointer"
          >
            <option value="date">{t("sortByDate")}</option>
            <option value="rating">{t("sortByRating")}</option>
            <option value="title">{t("sortByTitle")}</option>
            <option value="year">{t("sortByYear")}</option>
          </select>

          {/* Rating filter */}
          <div className="flex gap-1.5 flex-wrap">
            {[10,9,8,7,6,5].map(r => (
              <button
                key={r}
                onClick={() => setRatingFilter(ratingFilter === r ? null : r)}
                className={`w-8 h-8 rounded-lg text-xs font-bold border transition-all ${ratingFilter === r ? "bg-primary text-primary-foreground border-primary shadow-sm" : "bg-card border-border text-muted-foreground hover:border-primary/40"}`}
              >
                {r}
              </button>
            ))}
            {ratingFilter !== null && (
              <button onClick={() => setRatingFilter(null)} className="px-2 h-8 rounded-lg text-xs text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 transition-all">
                {t("clearFilter")}
              </button>
            )}
          </div>

          {/* View toggle */}
          <div className="flex gap-1 ml-auto">
            <button onClick={() => setView("grid")} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${view === "grid" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
              <Grid3X3 className="w-3.5 h-3.5" />
            </button>
            <button onClick={() => setView("list")} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${view === "list" ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground hover:border-primary/30"}`}>
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {movies.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">{session ? t("noLibrary") : t("noLibraryGuest")}</h2>
            <p className="text-muted-foreground text-sm">{t("noLibraryDesc")}</p>
          </div>
          <Link to="/" className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm">
            {t("navHome")}
          </Link>
        </div>
      )}

      {/* No filter results */}
      {filtered.length === 0 && movies.length > 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>{t("noFilterResults")}</p>
        </div>
      )}

      {/* Content */}
      {filtered.length > 0 && (
        view === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {filtered.map((m) => (
              <div
                key={`${m._mediaType}-${m.id}`}
                onClick={() => goToDetail(m)}
                className="group cursor-pointer relative rounded-xl overflow-hidden bg-card border border-border shadow-sm hover:border-primary/40 hover:shadow-lg hover:scale-[1.03] transition-all duration-300"
              >
                {m.poster_path ? (
                  <img src={`${TMDB_IMG}/w342${m.poster_path}`} alt={m.title} className="w-full aspect-[2/3] object-cover" loading="lazy" />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                    <Film className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}
                {/* Rating badge */}
                {m._rating > 0 && (
                  <div className="absolute top-2 right-2 bg-primary/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                    <span className="text-primary-foreground text-[10px] font-black">{m._rating}</span>
                  </div>
                )}
                {/* TV badge */}
                {m._mediaType === "tv" && (
                  <div className="absolute top-2 left-2 bg-black/80 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
                    <Tv className="w-2.5 h-2.5 text-white" />
                    <span className="text-white text-[9px] font-bold">TV</span>
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
                key={`${m._mediaType}-${m.id}`}
                onClick={() => goToDetail(m)}
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
                  <div className="flex items-center gap-2">
                    <p className="text-foreground font-semibold text-sm truncate group-hover:text-primary transition-colors">{m.title}</p>
                    {m._mediaType === "tv" && (
                      <span className="shrink-0 flex items-center gap-0.5 text-[9px] font-bold text-muted-foreground border border-border rounded px-1 py-0.5">
                        <Tv className="w-2.5 h-2.5" /> TV
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 mt-0.5 text-xs text-muted-foreground">
                    {m.release_date && <span>{m.release_date.slice(0, 4)}</span>}
                    {m.genres?.length > 0 && <span>{m.genres.slice(0, 2).map(g => g.name).join(", ")}</span>}
                    {m.runtime > 0 && <span>{m.runtime} {t("libMinShort")}</span>}
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
        )
      )}
    </div>
  );
}
