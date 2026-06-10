import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  getTVShow, addWatched, removeWatched, getWatched,
  TMDB_IMG, aiExplain,
  getWatchlist,
  getFriends, sendRecommendation,
  getMyCollections, addMovieToCollection,
  getTVSeasonDetails,
} from "../lib/api";
import {
  Star, Clock, Check, Trash2, Loader2,
  Calendar, Users, Tv, Bot, Brain, LogIn, UserPlus, Sparkles,
  Bookmark, BookmarkCheck, Quote, ChevronDown, ChevronUp, Pencil,
  MessageSquare, ThumbsUp, ThumbsDown, Minus, Play, Send, X, UserCheck,
  Layers, Plus, Hash,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { useLang } from "../lib/lang-context";
import { useUserData } from "../lib/user-data-context";
import { TrailerModal } from "../components/trailer-modal";
import { BackButton } from "../components/back-button";
import { SectionHeader } from "../components/section-header";

// ─── Episode Rating Cell color helper ─────────────────────────────────────────
function ratingColor(r: number): string {
  if (!r || r === 0) return "bg-muted text-muted-foreground";
  if (r >= 9) return "bg-foreground text-background";
  if (r >= 8) return "bg-foreground/85 text-background";
  if (r >= 7) return "bg-foreground/60 text-background";
  if (r >= 6) return "bg-foreground/40 text-foreground";
  return "bg-muted text-muted-foreground";
}

// ─── Season Episodes Panel ─────────────────────────────────────────────────────
function SeasonEpisodesPanel({ tvId, seasonNumber }: { tvId: number; seasonNumber: number }) {
  const [episodes, setEpisodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<string>("");
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    getTVSeasonDetails(tvId, seasonNumber)
      .then((data) => {
        setEpisodes(data.episodes || []);
        setOverview(data.overview || "");
      })
      .catch(() => setEpisodes([]))
      .finally(() => setLoading(false));
  }, [tvId, seasonNumber]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-5 border-t border-border">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
      </div>
    );
  }

  if (!episodes.length) {
    return (
      <div className="px-4 py-3 border-t border-border">
        {overview && <p className="text-xs text-muted-foreground">{overview}</p>}
      </div>
    );
  }

  return (
    <div className="border-t border-border px-3 pt-3 pb-3">
      {/* Compact episode grid */}
      <div className="flex flex-wrap gap-1">
        {episodes.map((ep: any) => {
          const r = ep.vote_average ? Math.round(ep.vote_average * 10) / 10 : 0;
          const isHovered = hovered === ep.episode_number;
          return (
            <div
              key={ep.id}
              className="relative"
              onMouseEnter={() => setHovered(ep.episode_number)}
              onMouseLeave={() => setHovered(null)}
            >
              <div
                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center cursor-default transition-all border ${
                  r > 0
                    ? "border-border/60 " + ratingColor(r)
                    : "border-border bg-muted text-muted-foreground/50"
                } ${isHovered ? "scale-110 z-10 shadow-md" : ""}`}
              >
                <span className="text-[9px] font-medium leading-none opacity-60">E{ep.episode_number}</span>
                <span className="text-[10px] font-bold leading-none mt-0.5">
                  {r > 0 ? r.toFixed(1) : "—"}
                </span>
              </div>
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-20 pointer-events-none">
                  <div className="bg-card border border-border rounded-lg px-2 py-1.5 shadow-lg w-40">
                    <p className="text-[10px] font-bold text-foreground line-clamp-2 leading-snug">
                      {ep.name || `Episode ${ep.episode_number}`}
                    </p>
                    {ep.air_date && (
                      <p className="text-[9px] text-muted-foreground mt-0.5">{ep.air_date}</p>
                    )}
                    {r > 0 && (
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                        <span className="text-[10px] font-semibold text-foreground">{r.toFixed(1)}</span>
                        {ep.vote_count > 0 && (
                          <span className="text-[9px] text-muted-foreground ml-0.5">({ep.vote_count})</span>
                        )}
                      </div>
                    )}
                  </div>
                  {/* Arrow */}
                  <div className="flex justify-center">
                    <div className="w-2 h-2 bg-card border-r border-b border-border rotate-45 -mt-1" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-2 flex-wrap">
        {overview && (
          <p className="text-[10px] text-muted-foreground leading-snug line-clamp-2 flex-1">{overview}</p>
        )}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-muted" />
            <span className="text-[9px] text-muted-foreground">&lt;6</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-foreground/40" />
            <span className="text-[9px] text-muted-foreground">6+</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-foreground/60" />
            <span className="text-[9px] text-muted-foreground">7+</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-foreground/85" />
            <span className="text-[9px] text-muted-foreground">8+</span>
          </div>
          <div className="flex gap-1 items-center">
            <div className="w-3 h-3 rounded-sm bg-foreground" />
            <span className="text-[9px] text-muted-foreground">9+</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TVDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t, tmdbLang } = useLang();
  const userData = useUserData();
  const [show, setShow] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [savedReviewData, setSavedReviewData] = useState<{ review: string; rating: number; savedAt?: string } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);
  const [expandedSeason, setExpandedSeason] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getTVShow(Number(id))
      .then(setShow)
      .catch(() => setShow(null))
      .finally(() => setLoading(false));
  }, [id, tmdbLang]);

  useEffect(() => {
    if (!session) return;
    getWatched().then((w) => {
      if (Array.isArray(w)) {
        const e = w.find((x: any) => x.movieId === Number(id) && (x.mediaType || "movie") === "tv");
        if (e) {
          setWatched(e); setRating(e.rating || 0); setReview(e.review || "");
          if (e.review?.trim()) setSavedReviewData({ review: e.review, rating: e.rating || 0, savedAt: e.addedAt });
        }
      }
    }).catch(() => {});

    getWatchlist().then((wl) => {
      if (Array.isArray(wl)) {
        setInWatchlist(wl.some((x: any) => x.movieId === Number(id) && (x.mediaType || "movie") === "tv"));
      }
    }).catch(() => {});

    getMyCollections().then((cols) => {
      if (Array.isArray(cols)) setCollections(cols);
    }).catch(() => {}).finally(() => setLoadingCollections(false));
  }, [id, session]);

  const handleAdd = async () => {
    if (!session) { toast.error(t("signIn")); return; }
    if (rating === 0) { toast.error(t("movieYourRating")); return; }
    setSaving(true);
    try {
      await addWatched(Number(id), rating, review, show?.name, show?.poster_path, "tv");
      setWatched({ movieId: Number(id), rating, review, mediaType: "tv" });
      if (review.trim()) setSavedReviewData({ review, rating, savedAt: new Date().toISOString() });
      else setSavedReviewData(null);
      if (inWatchlist) {
        await userData.removeFromWatchlistFn(Number(id), "tv");
        setInWatchlist(false);
      }
      toast.success(t("addedToLibrary"));
    } catch { toast.error(t("error")); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await removeWatched(Number(id), "tv");
      setWatched(null); setRating(0); setReview(""); setSavedReviewData(null);
      toast.success(t("removedFromLibrary"));
    } catch { toast.error(t("error")); }
    finally { setSaving(false); }
  };

  const handleToggleWatchlist = async () => {
    if (!session) { toast.error(t("signIn")); return; }
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await userData.removeFromWatchlistFn(Number(id), "tv");
        setInWatchlist(false);
        toast.success(t("removedFromWatchlist"));
      } else {
        await userData.addToWatchlistFn({
          movieId: Number(id),
          title: show?.name || "",
          poster_path: show?.poster_path,
          release_date: show?.first_air_date || "",
          vote_average: show?.vote_average,
          mediaType: "tv",
        });
        setInWatchlist(true);
        toast.success(t("addedToWatchlist"));
      }
    } catch { toast.error(t("error")); }
    finally { setWatchlistLoading(false); }
  };

  const handleAiExplain = async () => {
    if (!show) return;
    setAiExplainLoading(true);
    try {
      const res = await aiExplain(show.id, show.name);
      setAiExplanation(res.explanation || res.text || "");
    } catch { toast.error(t("error")); }
    finally { setAiExplainLoading(false); }
  };

  const handleAddToCollection = async () => {
    if (!selectedCollection || !show) return;
    try {
      await addMovieToCollection(selectedCollection.id, {
        movieId: show.id,
        title: show.name,
        poster_path: show.poster_path,
        release_date: show.first_air_date || "",
        vote_average: show.vote_average,
      });
      toast.success(t("addedToCollection"));
      setSelectedCollection(null);
    } catch (e: any) { toast.error(e.message || t("error")); }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Tv className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-muted-foreground">{t("tvNotFound")}</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm hover:underline">{t("back")}</button>
      </div>
    );
  }

  const director = show.credits?.crew?.find((c: any) => c.job === "Series Director" || c.job === "Creator") ||
    show.created_by?.[0];
  const cast = show.credits?.cast?.slice(0, 12) || [];
  const genres = show.genres || [];
  const displayRating = hoverRating || rating;

  const ratingLabels = ["", "1 — Ужасно", "2 — Плохо", "3 — Слабо", "4 — Ниже среднего",
    "5 — Норм", "6 — Хорошо", "7 — Очень хорошо", "8 — Отлично", "9 — Шедевр", "10 — Идеал"];

  return (
    <div className="min-h-screen bg-background">
      {showTrailer && (
        <TrailerModal
          movieId={show.id}
          movieTitle={show.name}
          mediaType="tv"
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* Hero */}
      <div className="relative">
        {show.backdrop_path ? (
          <div className="relative h-72 md:h-96 overflow-hidden">
            <img
              src={`${TMDB_IMG}/w1280${show.backdrop_path}`}
              alt={show.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-transparent" />
          </div>
        ) : (
          <div className="h-48 bg-muted" />
        )}

        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-6 -mt-24 md:-mt-32 relative z-10 pb-6">
            {/* Poster */}
            <div className="shrink-0">
              {show.poster_path ? (
                <img
                  src={`${TMDB_IMG}/w342${show.poster_path}`}
                  alt={show.name}
                  className="w-36 md:w-48 rounded-2xl shadow-2xl border border-border"
                />
              ) : (
                <div className="w-36 md:w-48 aspect-[2/3] rounded-2xl bg-muted flex items-center justify-center border border-border shadow-2xl">
                  <Tv className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 pt-4 md:pt-16">
              {/* Back button */}
              <div className="mb-3">
                <BackButton />
              </div>

              {/* TV badge */}
              <div className="flex items-center gap-2 mb-2">
                <span className="flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/25">
                  <Tv className="w-2.5 h-2.5" />
                  TV Series
                </span>
                {show.status && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border">
                    {show.status}
                  </span>
                )}
              </div>

              <h1 className="text-2xl md:text-4xl font-black text-foreground tracking-tight mb-1">
                {show.name}
              </h1>
              {show.original_name && show.original_name !== show.name && (
                <p className="text-muted-foreground text-sm mb-2">{show.original_name}</p>
              )}

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-3 mb-3">
                {show.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-primary fill-primary" />
                    <span className="font-bold text-foreground">{show.vote_average.toFixed(1)}</span>
                    <span className="text-muted-foreground text-sm">/ 10</span>
                    {show.vote_count > 0 && (
                      <span className="text-muted-foreground text-xs">({show.vote_count.toLocaleString()})</span>
                    )}
                  </div>
                )}
                {show.first_air_date && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Calendar className="w-3.5 h-3.5" />
                    {show.first_air_date.slice(0, 4)}
                    {show.last_air_date && show.last_air_date.slice(0, 4) !== show.first_air_date.slice(0, 4) && (
                      <span>–{show.last_air_date.slice(0, 4)}</span>
                    )}
                  </div>
                )}
                {show.number_of_seasons > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Hash className="w-3.5 h-3.5" />
                    {show.number_of_seasons} {t("tvSeasonsLabel")}
                  </div>
                )}
                {show.number_of_episodes > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Tv className="w-3.5 h-3.5" />
                    {show.number_of_episodes} {t("tvEpisodesLabel")}
                  </div>
                )}
                {show.episode_run_time?.[0] > 0 && (
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Clock className="w-3.5 h-3.5" />
                    ~{show.episode_run_time[0]} мин/эп.
                  </div>
                )}
              </div>

              {/* Genres */}
              {genres.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {genres.map((g: any) => (
                    <span key={g.id} className="text-xs px-2.5 py-1 rounded-lg bg-muted text-muted-foreground border border-border">
                      {g.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowTrailer(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md"
                >
                  <Play className="w-4 h-4 fill-current" />
                  {t("watchTrailer")}
                </button>

                {session && (
                  <button
                    onClick={handleToggleWatchlist}
                    disabled={watchlistLoading}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all ${
                      inWatchlist
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-card text-foreground border-border hover:border-primary/40"
                    }`}
                  >
                    {watchlistLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : inWatchlist ? (
                      <BookmarkCheck className="w-4 h-4" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                    {inWatchlist ? t("inWatchlist") : t("addToWatchlist")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column (2/3) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Overview */}
            {show.overview && (
              <section>
                <SectionHeader icon={MessageSquare} label={t("movieOverview")} />
                <p className="text-foreground/85 text-sm leading-relaxed">{show.overview}</p>
              </section>
            )}

            {/* Cast */}
            {cast.length > 0 && (
              <section>
                <SectionHeader icon={Users} label={t("movieCast")} />
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {cast.map((actor: any) => (
                    <Link
                      key={actor.id}
                      to={`/person/${actor.id}`}
                      className="group text-center"
                    >
                      {actor.profile_path ? (
                        <img
                          src={`${TMDB_IMG}/w185${actor.profile_path}`}
                          alt={actor.name}
                          className="w-full aspect-square object-cover object-top rounded-xl border border-border group-hover:border-primary/40 transition-all"
                        />
                      ) : (
                        <div className="w-full aspect-square bg-muted rounded-xl flex items-center justify-center border border-border">
                          <Users className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                      <p className="text-xs font-semibold text-foreground mt-1 line-clamp-1 group-hover:text-primary transition-colors">{actor.name}</p>
                      {actor.character && (
                        <p className="text-[10px] text-muted-foreground line-clamp-1">{actor.character}</p>
                      )}
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Seasons */}
            {show.seasons && show.seasons.length > 0 && (
              <section>
                <SectionHeader icon={Tv} label={t("tvSeasonsLabel")} />
                <div className="space-y-2">
                  {show.seasons
                    .filter((s: any) => s.season_number > 0)
                    .map((season: any) => (
                      <div
                        key={season.id}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => setExpandedSeason(expandedSeason === season.season_number ? null : season.season_number)}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors text-left"
                        >
                          {season.poster_path ? (
                            <img
                              src={`${TMDB_IMG}/w92${season.poster_path}`}
                              alt={season.name}
                              className="w-10 h-14 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-14 rounded-lg bg-muted shrink-0 flex items-center justify-center">
                              <Tv className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">{season.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {season.episode_count} {t("tvEpisodesLabel")}
                              {season.air_date && ` · ${season.air_date.slice(0, 4)}`}
                            </p>
                          </div>
                          {expandedSeason === season.season_number
                            ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                            : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                          }
                        </button>
                        {expandedSeason === season.season_number && (
                          <div className="px-4 pb-4 pt-1 border-t border-border">
                            <SeasonEpisodesPanel tvId={show.id} seasonNumber={season.season_number} />
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </section>
            )}

            {/* AI Explain */}
            {session && (
              <section>
                <SectionHeader icon={Bot} label={t("aiAnalysisTitle")} />
                {aiExplanation ? (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Brain className="w-4 h-4 text-primary" />
                      </div>
                      <p className="text-sm text-foreground/85 leading-relaxed">{aiExplanation}</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleAiExplain}
                    disabled={aiExplainLoading}
                    className="flex items-center gap-2 px-5 py-3 rounded-xl border border-border bg-card text-sm font-medium hover:border-primary/40 hover:text-primary transition-all disabled:opacity-50 w-full justify-center"
                  >
                    {aiExplainLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 text-primary" />
                    )}
                    {t("aiExplainBtn")}
                  </button>
                )}
              </section>
            )}
          </div>

          {/* Right column (1/3) */}
          <div className="space-y-6">

            {/* Rating & Library */}
            <div className="bg-card border border-border rounded-2xl p-5">
              {session ? (
                <>
                  <h3 className="font-bold text-foreground mb-4 text-sm">
                    {watched ? t("inLibrary") : t("addToLibrary")}
                  </h3>

                  {watched && (
                    <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-xl">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-foreground">{t("watched")}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-bold text-sm text-foreground">{watched.rating}</span>
                      </div>
                    </div>
                  )}

                  {/* Star rating */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">{t("movieYourRating")}</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                        <button
                          key={n}
                          onMouseEnter={() => setHoverRating(n)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(n)}
                          className={`flex-1 h-7 rounded-lg text-xs font-bold transition-all ${
                            n <= displayRating
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-primary/20"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                    {displayRating > 0 && (
                      <p className="text-xs text-primary mt-1.5 font-medium">{ratingLabels[displayRating]}</p>
                    )}
                  </div>

                  {/* Review */}
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-1.5">{t("movieReviewOptional")}</p>
                    <textarea
                      value={review}
                      onChange={(e) => setReview(e.target.value)}
                      placeholder={t("movieReviewPlaceholder")}
                      className="w-full bg-muted border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/15 resize-none h-24 transition"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={handleAdd}
                      disabled={saving || rating === 0}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-50 hover:bg-primary/90 transition shadow-sm"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      {watched ? t("updateLibrary") : t("addToLibrary")}
                    </button>
                    {watched && (
                      <button
                        onClick={handleRemove}
                        disabled={saving}
                        className="w-10 h-10 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:text-destructive hover:border-destructive/30 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Saved review */}
                  {savedReviewData && (
                    <div className="mt-4 p-3 bg-muted rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-primary" />
                          <span className="text-xs font-bold text-foreground">{t("myReview")}</span>
                        </div>
                        <button
                          onClick={() => { setReview(savedReviewData.review); setRating(savedReviewData.rating); }}
                          className="text-xs text-primary hover:underline flex items-center gap-0.5"
                        >
                          <Pencil className="w-3 h-3" />
                          {t("editReview")}
                        </button>
                      </div>
                      <p className={`text-xs text-foreground/80 leading-relaxed ${!reviewExpanded ? "line-clamp-4" : ""}`}>
                        {savedReviewData.review}
                      </p>
                      {savedReviewData.review.length > 200 && (
                        <button
                          onClick={() => setReviewExpanded(v => !v)}
                          className="text-xs text-primary mt-1.5 hover:underline"
                        >
                          {reviewExpanded ? t("collapse") : t("readMore")}
                        </button>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2">
                  <Tv className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-foreground mb-1">{t("ctaLoginTitle")}</p>
                  <p className="text-xs text-muted-foreground mb-4">{t("ctaLoginDesc")}</p>
                  <div className="flex gap-2">
                    <Link to="/login" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition">
                      <LogIn className="w-3.5 h-3.5" />
                      {t("signIn")}
                    </Link>
                    <Link to="/register" className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border border-border text-sm font-medium hover:border-primary/40 transition">
                      <UserPlus className="w-3.5 h-3.5" />
                      {t("signUp")}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Show Info */}
            <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-foreground text-sm mb-3">{t("details")}</h3>
              {show.created_by?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("tvCreatedByLabel")}</p>
                  <p className="text-sm font-medium text-foreground">{show.created_by.map((c: any) => c.name).join(", ")}</p>
                </div>
              )}
              {show.networks?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("tvNetworkLabel")}</p>
                  <p className="text-sm font-medium text-foreground">{show.networks.map((n: any) => n.name).join(", ")}</p>
                </div>
              )}
              {show.production_countries?.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("movieCountry")}</p>
                  <p className="text-sm font-medium text-foreground">{show.production_countries.map((c: any) => c.name).join(", ")}</p>
                </div>
              )}
              {show.original_language && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("movieLanguage")}</p>
                  <p className="text-sm font-medium text-foreground uppercase">{show.original_language}</p>
                </div>
              )}
              {show.first_air_date && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("tvFirstAiredLabel")}</p>
                  <p className="text-sm font-medium text-foreground">{show.first_air_date}</p>
                </div>
              )}
              {show.number_of_seasons > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("tvSeasonsLabel")}</p>
                  <p className="text-sm font-medium text-foreground">{show.number_of_seasons}</p>
                </div>
              )}
              {show.number_of_episodes > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{t("tvEpisodesLabel")}</p>
                  <p className="text-sm font-medium text-foreground">{show.number_of_episodes}</p>
                </div>
              )}
            </div>

            {/* Add to Collection */}
            {session && collections.length > 0 && (
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="font-bold text-foreground text-sm mb-3 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  {t("navCollections")}
                </h3>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {loadingCollections ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary mx-auto" />
                  ) : (
                    collections.map((col) => (
                      <button
                        key={col.id}
                        onClick={() => setSelectedCollection(selectedCollection?.id === col.id ? null : col)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                          selectedCollection?.id === col.id
                            ? "bg-primary/10 border-primary/30 text-primary"
                            : "bg-muted border-transparent text-foreground hover:border-border"
                        }`}
                      >
                        {col.name}
                      </button>
                    ))
                  )}
                </div>
                {selectedCollection && (
                  <button
                    onClick={handleAddToCollection}
                    className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {t("add")} в «{selectedCollection.name}»
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
