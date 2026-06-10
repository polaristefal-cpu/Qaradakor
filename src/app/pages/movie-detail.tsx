import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  getMovie, addWatched, removeWatched, getWatched,
  TMDB_IMG, aiExplain, aiAnalyzeReview,
  addToWatchlist, removeFromWatchlist, getWatchlist,
  getFriends, sendRecommendation,
  getMyCollections, addMovieToCollection,
} from "../lib/api";
import {
  Star, Clock, Check, Trash2, Loader2,
  Calendar, Users, Film, Bot, Brain, LogIn, UserPlus, Sparkles,
  Bookmark, BookmarkCheck, Quote, ChevronDown, ChevronUp, Pencil,
  MessageSquare, ThumbsUp, ThumbsDown, Minus, Play, Send, X, UserCheck,
  Layers, Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../lib/auth-context";
import { useLang } from "../lib/lang-context";
import { TrailerModal } from "../components/trailer-modal";
import { MovieReviews } from "../components/movie-reviews";
import { BackButton } from "../components/back-button";
import { SectionHeader } from "../components/section-header";

// ── Recommend to Friend Modal ──────────────────────────────────────────────────
function RecommendFriendModal({
  movie,
  onClose,
}: {
  movie: any;
  onClose: () => void;
}) {
  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const { t } = useLang();

  useEffect(() => {
    getFriends()
      .then((data) => setFriends(Array.isArray(data) ? data : []))
      .catch(() => setFriends([]))
      .finally(() => setLoadingFriends(false));
  }, []);

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await sendRecommendation(selected.id, movie.id, note.trim() || undefined);
      toast.success(`${t("recommendSent")} «${movie.title}» → ${selected.name || selected.email}`);
      onClose();
    } catch (e: any) {
      toast.error(e.message || t("error"));
    } finally {
      setSending(false);
    }
  };

  const initials = (name: string) =>
    (name || "?")
      .split(" ")
      .slice(0, 2)
      .map((w: string) => w[0]?.toUpperCase())
      .join("") || "?";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">{t("recommendMovieTitle")}</h2>
            <p className="text-muted-foreground text-xs mt-0.5 line-clamp-1">«{movie.title}»</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Friends list */}
          <div>
            <p className="text-xs text-muted-foreground mb-2.5 font-medium">{t("recommendSelectFriend")}</p>
            {loadingFriends ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                {t("recommendNoFriends")}
              </div>
            ) : (
              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-0.5">
                {friends.map((f) => {
                  const isSelected = selected?.id === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setSelected(isSelected ? null : f)}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl border transition-all text-left ${
                        isSelected
                          ? "bg-primary/10 border-primary/40 text-foreground"
                          : "bg-muted border-transparent hover:border-border"
                      }`}
                    >
                      {/* Avatar */}
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
                        {initials(f.name || f.email || "")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-semibold line-clamp-1">
                          {f.name || f.email}
                        </p>
                        {f.name && f.email && (
                          <p className="text-muted-foreground text-xs line-clamp-1">{f.email}</p>
                        )}
                      </div>
                      {isSelected && (
                        <UserCheck className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Note */}
          {selected && (
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block font-medium">
                {t("recommendNote")}
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("recommendNotePlaceholder")}
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none h-20 placeholder:text-muted-foreground/50"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground hover:border-primary/30 transition"
            >
              {t("cancel")}
            </button>
            <button
              onClick={handleSend}
              disabled={!selected || sending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {t("send")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MovieDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t, tmdbLang } = useLang();
  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [watched, setWatched] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiExplainLoading, setAiExplainLoading] = useState(false);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [savedReviewData, setSavedReviewData] = useState<{ review: string; rating: number; savedAt?: string; sentiment?: any } | null>(null);
  const [showTrailer, setShowTrailer] = useState(false);
  const [recommendFriendModal, setRecommendFriendModal] = useState(false);
  const [collections, setCollections] = useState<any[]>([]);
  const [loadingCollections, setLoadingCollections] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState<any>(null);

  // Load movie + watchlist state
  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getMovie(Number(id))
      .then(setMovie)
      .catch(() => setMovie(null))
      .finally(() => setLoading(false));
  }, [id, tmdbLang]); // re-fetch when language changes

  useEffect(() => {
    if (!session) return;
    getWatched().then((w) => {
      if (Array.isArray(w)) {
        const e = w.find((x: any) => x.movieId === Number(id));
        if (e) {
          setWatched(e); setRating(e.rating || 0); setReview(e.review || "");
          if (e.review?.trim()) {
            setSavedReviewData({
              review: e.review,
              rating: e.rating || 0,
              savedAt: e.addedAt,
              sentiment: e.sentiment || null,
            });
          }
        }
      }
    }).catch(() => {});

    getWatchlist().then((wl) => {
      if (Array.isArray(wl)) {
        setInWatchlist(wl.some((x: any) => x.movieId === Number(id)));
      }
    }).catch(() => {});

    getMyCollections().then((cols) => {
      if (Array.isArray(cols)) {
        setCollections(cols);
      }
    }).catch(() => {}).finally(() => setLoadingCollections(false));
  }, [id, session]);

  const handleAdd = async () => {
    if (!session) { toast.error(t("signIn")); return; }
    if (rating === 0) { toast.error(t("movieYourRating")); return; }
    setSaving(true);
    try {
      await addWatched(Number(id), rating, review, movie?.title, movie?.poster_path);
      setWatched({ movieId: Number(id), rating, review });
      if (review.trim()) {
        setSavedReviewData({ review, rating, savedAt: new Date().toISOString(), sentiment: sentimentData || null });
      } else {
        setSavedReviewData(null);
      }
      if (inWatchlist) {
        await removeFromWatchlist(Number(id));
        setInWatchlist(false);
      }
      toast.success(t("addedToLibrary"));
    } catch { toast.error(t("error")); }
    finally { setSaving(false); }
  };

  const handleRemove = async () => {
    setSaving(true);
    try {
      await removeWatched(Number(id));
      setWatched(null); setRating(0); setReview(""); setSavedReviewData(null); setSentimentData(null);
      toast.success(t("removedFromLibrary"));
    } catch { toast.error(t("error")); }
    finally { setSaving(false); }
  };

  const handleToggleWatchlist = async () => {
    if (!session) { toast.error(t("signIn")); return; }
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(Number(id));
        setInWatchlist(false);
        toast.success(t("removedFromWatchlist"));
      } else {
        await addToWatchlist({
          movieId: Number(id),
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
        });
        setInWatchlist(true);
        toast.success(t("addedToWatchlist"));
      }
    } catch (e: any) {
      toast.error(e.message || t("error"));
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleAddToCollection = async () => {
    if (!session) { toast.error(t("signIn")); return; }
    if (!selectedCollection) return;
    setSaving(true);
    try {
      await addMovieToCollection(selectedCollection.id, {
        movieId: Number(id),
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      });
      toast.success(t("addedToCollection"));
    } catch (e: any) {
      toast.error(e.message || t("error"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="w-9 h-9 text-primary animate-spin" />
    </div>
  );

  if (!movie || movie.success === false) return (
    <div className="flex flex-col items-center justify-center py-32 gap-4">
      <Film className="w-14 h-14 text-muted-foreground/30" />
      <p className="text-muted-foreground text-lg">{t("movieNotFound")}</p>
      <button onClick={() => navigate("/")} className="text-primary hover:underline text-sm">{t("toHome")}</button>
    </div>
  );

  const directors = movie.credits?.crew?.filter((c: any) => c.job === "Director") || [];
  const cast = movie.credits?.cast?.slice(0, 12) || [];
  const year = movie.release_date?.slice(0, 4);
  const budget = movie.budget ? `$${(movie.budget / 1_000_000).toFixed(1)}M` : null;
  const revenue = movie.revenue ? `$${(movie.revenue / 1_000_000).toFixed(1)}M` : null;
  const langs = movie.spoken_languages?.map((l: any) => l.name).join(", ");
  const countries = movie.production_countries?.map((c: any) => c.name).join(", ");
  const companies = movie.production_companies?.slice(0, 4) || [];
  const handleGenreClick = (genre: { id: number; name: string }) => {
    const params = new URLSearchParams({
      genre: String(genre.id),
      genreName: genre.name,
    });
    navigate(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Backdrop */}
      {movie.backdrop_path && (
        <div className="relative h-60 md:h-[360px] overflow-hidden">
          <img
            src={`${TMDB_IMG}/w1280${movie.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/75 to-transparent" />
          {/* Trailer button removed from here — now lives below the poster */}
        </div>
      )}

      <div
        className="max-w-7xl mx-auto px-4 pb-16 relative z-10"
        style={{ marginTop: movie.backdrop_path ? "-140px" : "2rem" }}
      >
        {/* Back */}
        <BackButton />

        <div className="flex flex-col md:flex-row gap-7">
          {/* Poster */}
          <div className="shrink-0 flex flex-col items-center gap-3">
            {movie.poster_path ? (
              <img
                src={`${TMDB_IMG}/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-44 md:w-56 aspect-[2/3] object-cover rounded-2xl shadow-2xl border border-border"
              />
            ) : (
              <div className="w-44 md:w-56 aspect-[2/3] bg-muted rounded-2xl flex items-center justify-center border border-border">
                <Film className="w-14 h-14 text-muted-foreground/30" />
              </div>
            )}
            
            {/* Action buttons - Mobile optimized */}
            <div className="w-full space-y-2">
              {/* Trailer button - Primary action */}
              <button
                onClick={() => setShowTrailer(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              >
                <Play className="w-4 h-4 fill-current" />
                Смотреть трейлер
              </button>

              {/* Watchlist button */}
              {session && !watched && (
                <button
                  onClick={handleToggleWatchlist}
                  disabled={watchlistLoading}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                    inWatchlist
                      ? "bg-primary/10 text-primary border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  {watchlistLoading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : inWatchlist
                      ? <BookmarkCheck className="w-4 h-4" />
                      : <Bookmark className="w-4 h-4" />
                  }
                  {inWatchlist ? t("inWatchlist") : t("addToWatchlist")}
                </button>
              )}

              {/* Recommend to friend button */}
              {session && (
                <button
                  onClick={() => setRecommendFriendModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border bg-card text-foreground hover:border-primary/40 transition-all"
                >
                  <Send className="w-4 h-4" />
                  {t("recommendToFriend")}
                </button>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">{movie.title}</h1>
              {movie.original_title !== movie.title && (
                <p className="text-muted-foreground text-sm mt-1 italic">{movie.original_title}</p>
              )}
              {movie.tagline && (
                <p className="text-muted-foreground text-sm mt-2 italic border-l-2 border-primary/40 pl-3">«{movie.tagline}»</p>
              )}
            </div>

            {/* Badges */}
            <div className="flex flex-wrap gap-2 text-xs">
              {year && (
                <span className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg border border-border">
                  <Calendar className="w-3 h-3" /> {year}
                </span>
              )}
              {movie.runtime > 0 && (
                <span className="flex items-center gap-1 bg-muted text-muted-foreground px-3 py-1.5 rounded-lg border border-border">
                  <Clock className="w-3 h-3" />
                  {Math.floor(movie.runtime / 60)}ч {movie.runtime % 60}мин
                </span>
              )}
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1.5 rounded-lg border border-primary/25 font-semibold">
                  <Star className="w-3 h-3 fill-primary" />
                  {movie.vote_average.toFixed(1)}
                  <span className="text-primary/50 font-normal">/ {movie.vote_count?.toLocaleString()}</span>
                </span>
              )}
            </div>

            {/* Genres */}
            {movie.genres?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {movie.genres.map((g: any) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => handleGenreClick(g)}
                    title={`${t("openGenreMovies")}: ${g.name}`}
                    className="text-xs px-2.5 py-1 rounded-md bg-accent text-accent-foreground border border-border hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 transition-colors"
                  >
                    {g.name}
                  </button>
                ))}
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{t("movieOverview")}</h3>
                <p className="text-foreground/80 leading-relaxed text-sm">{movie.overview}</p>
              </div>
            )}

            {/* AI Explain */}
            {session && (
              <div>
                {!aiExplanation ? (
                  <button
                    onClick={async () => {
                      setAiExplainLoading(true);
                      try { const d = await aiExplain(Number(id)); setAiExplanation(d.explanation); }
                      catch { setAiExplanation("Не удалось сгенерировать"); }
                      finally { setAiExplainLoading(false); }
                    }}
                    disabled={aiExplainLoading}
                    className="flex items-center gap-2 text-xs font-medium text-muted-foreground bg-muted hover:bg-accent border border-border hover:border-primary/30 px-3.5 py-2 rounded-xl transition-all"
                  >
                    {aiExplainLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bot className="w-3.5 h-3.5" />}
                    {t("aiExplainBtn")}
                  </button>
                ) : (
                  <div className="bg-muted border border-border rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Bot className="w-3.5 h-3.5 text-primary" />
                      <span className="text-primary text-[11px] font-bold uppercase tracking-wider">{t("aiAnalysisTitle")}</span>
                    </div>
                    <p className="text-foreground/80 text-sm leading-relaxed">{aiExplanation}</p>
                  </div>
                )}
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              {directors.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("movieDirector")}</p>
                  <div className="flex flex-wrap gap-1">
                    {directors.map((d: any) => (
                      <button
                        key={d.id}
                        onClick={() => navigate(`/person/${d.id}`)}
                        className="text-sm text-primary hover:underline"
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {countries && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("movieCountry")}</p><p className="text-sm text-foreground">{countries}</p></div>
              )}
              {langs && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("movieLanguage")}</p><p className="text-sm text-foreground">{langs}</p></div>
              )}
              {budget && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("movieBudget")}</p><p className="text-sm text-foreground">{budget}</p></div>
              )}
              {revenue && (
                <div><p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">{t("movieRevenue")}</p><p className="text-sm text-foreground">{revenue}</p></div>
              )}
            </div>
          </div>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <div className="mt-10">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
              <Users className="w-3.5 h-3.5" /> {t("movieCast")}
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {cast.map((c: any) => (
                <div
                  key={c.id}
                  onClick={() => navigate(`/person/${c.id}`)}
                  className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group"
                >
                  {c.profile_path ? (
                    <img src={`${TMDB_IMG}/w185${c.profile_path}`} alt={c.name} className="w-full aspect-[2/3] object-cover group-hover:scale-[1.03] transition-transform duration-300" loading="lazy" />
                  ) : (
                    <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                      <Users className="w-7 h-7 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="p-2">
                    <p className="text-foreground text-[11px] font-semibold line-clamp-1">{c.name}</p>
                    <p className="text-muted-foreground text-[10px] line-clamp-1">{c.character}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Companies */}
        {companies.length > 0 && (
          <div className="mt-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{t("movieProduction")}</h3>
            <div className="flex flex-wrap gap-2">
              {companies.map((c: any) => (
                <div key={c.id} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-sm">
                  {c.logo_path && <img src={`${TMDB_IMG}/w92${c.logo_path}`} alt={c.name} className="h-4 object-contain opacity-70 dark:invert dark:opacity-60" />}
                  <span className="text-muted-foreground text-xs">{c.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── Rating panel ─────────────────────────── */}
        <div className="mt-10">
          {session ? (
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-foreground text-base">
                  {watched ? t("alreadyWatched") : t("markWatched")}
                </h3>
                {watched && (
                  <span className="text-xs font-semibold bg-primary/10 text-primary border border-primary/25 px-2.5 py-1 rounded-full">
                    {t("inLibrary")}
                  </span>
                )}
              </div>

              {/* Stars */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("movieYourRating")}</p>
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverRating(n)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setRating(n)}
                      className="p-0.5 transition-transform hover:scale-125"
                    >
                      <Star className={`w-6 h-6 transition-colors ${n <= (hoverRating || rating) ? "text-primary fill-primary" : "text-border hover:text-muted-foreground"}`} />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-3 text-primary font-black text-xl leading-none">
                      {rating}<span className="text-muted-foreground text-sm font-normal">/10</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Review */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">{t("movieReviewOptional")}</p>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder={t("movieReviewPlaceholder")}
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition resize-none h-24 placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2.5">
                <button
                  onClick={handleAdd} disabled={saving}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {watched ? t("updateLibrary") : t("addToLibrary")}
                </button>

                {review.trim().length >= 10 && (
                  <button
                    onClick={async () => {
                      setSentimentLoading(true);
                      try {
                        const d = await aiAnalyzeReview(review, movie?.title || "");
                        setSentimentData(d);
                        if (savedReviewData) {
                          setSavedReviewData({ ...savedReviewData, sentiment: d });
                        }
                      }
                      catch { toast.error("Ошибка анализа"); }
                      finally { setSentimentLoading(false); }
                    }}
                    disabled={sentimentLoading}
                    className="flex items-center gap-2 bg-muted text-muted-foreground hover:text-foreground border border-border hover:border-primary/30 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    {sentimentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {t("aiAnalyzeBtn")}
                  </button>
                )}

                {watched && (
                  <button
                    onClick={handleRemove} disabled={saving}
                    className="flex items-center gap-2 bg-destructive/10 text-destructive hover:bg-destructive/15 border border-destructive/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
                  >
                    <Trash2 className="w-4 h-4" /> Удалить
                  </button>
                )}
              </div>

              {/* Sentiment */}
              {sentimentData && (
                <div className="bg-muted border border-border rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Brain className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-[11px] font-bold uppercase tracking-wider">{t("aiSentimentTitle")}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      sentimentData.sentiment === "positive" ? "bg-green-500/15 text-green-600 dark:text-green-400" :
                      sentimentData.sentiment === "negative" ? "bg-destructive/15 text-destructive" :
                      sentimentData.sentiment === "mixed" ? "bg-primary/15 text-primary" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {sentimentData.sentiment === "positive" ? t("sentimentPositive") :
                       sentimentData.sentiment === "negative" ? t("sentimentNegative") :
                       sentimentData.sentiment === "mixed" ? t("sentimentMixed") : t("sentimentNeutral")}
                    </span>
                    <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${(sentimentData.score||0.5)>0.6?"bg-green-500":(sentimentData.score||0.5)<0.4?"bg-destructive":"bg-primary"}`}
                        style={{ width: `${(sentimentData.score||0.5)*100}%` }}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs">{((sentimentData.score||0.5)*100).toFixed(0)}%</span>
                  </div>
                  <p className="text-foreground/70 text-sm">{sentimentData.summary}</p>
                  {sentimentData.emotions?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {sentimentData.emotions.map((e: string, i: number) => (
                        <span key={i} className="text-[11px] bg-accent text-accent-foreground px-2 py-0.5 rounded-full border border-border">{e}</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Guest CTA */
            <div className="bg-card border border-border rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h3 className="font-bold text-foreground mb-1">{t("ctaLoginTitle")}</h3>
                <p className="text-muted-foreground text-sm">
                  {t("ctaLoginDesc")}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link to="/login" className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
                  <LogIn className="w-4 h-4" /> {t("signIn")}
                </Link>
                <Link to="/register" className="flex items-center gap-1.5 px-4 py-2 bg-muted text-foreground border border-border rounded-xl text-sm font-medium hover:border-primary/30 transition-all">
                  <UserPlus className="w-4 h-4" /> {t("signUp")}
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* ─── Блок рецензии ─────────────────────────── */}
        {savedReviewData && savedReviewData.review.trim().length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{t("myReview")}</h3>
            </div>

            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div className="h-0.5 bg-gradient-to-r from-primary via-primary/50 to-transparent" />

              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-0.5">
                      {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                        <Star
                          key={n}
                          className={`w-3.5 h-3.5 ${n <= savedReviewData.rating ? "text-primary fill-primary" : "text-border"}`}
                        />
                      ))}
                    </div>
                    <span className="text-primary font-black text-lg leading-none">
                      {savedReviewData.rating}
                      <span className="text-muted-foreground text-xs font-normal">/10</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {savedReviewData.sentiment && (
                      <span className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        savedReviewData.sentiment.sentiment === "positive"
                          ? "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20"
                          : savedReviewData.sentiment.sentiment === "negative"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : savedReviewData.sentiment.sentiment === "mixed"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}>
                        {savedReviewData.sentiment.sentiment === "positive"
                          ? <ThumbsUp className="w-3 h-3" />
                          : savedReviewData.sentiment.sentiment === "negative"
                          ? <ThumbsDown className="w-3 h-3" />
                          : <Minus className="w-3 h-3" />}
                        {savedReviewData.sentiment.sentiment === "positive" ? t("sentimentPositiveReview")
                          : savedReviewData.sentiment.sentiment === "negative" ? t("sentimentNegativeReview")
                          : savedReviewData.sentiment.sentiment === "mixed" ? t("sentimentMixedReview")
                          : t("sentimentNeutralReview")}
                      </span>
                    )}
                    {savedReviewData.savedAt && (
                      <span className="text-[11px] text-muted-foreground/60">
                        {new Date(savedReviewData.savedAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <Quote className="w-8 h-8 text-primary/10 absolute -top-1 -left-1 shrink-0" />
                  <div className={`relative pl-5 transition-all duration-300 ${!reviewExpanded && savedReviewData.review.length > 280 ? "max-h-[96px] overflow-hidden" : ""}`}>
                    <p className="text-foreground/85 text-sm leading-relaxed whitespace-pre-wrap">
                      {savedReviewData.review}
                    </p>
                    {!reviewExpanded && savedReviewData.review.length > 280 && (
                      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-card to-transparent pointer-events-none" />
                    )}
                  </div>

                  {savedReviewData.review.length > 280 && (
                    <button
                      onClick={() => setReviewExpanded(!reviewExpanded)}
                      className="mt-2 pl-5 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                    >
                      {reviewExpanded ? (
                        <><ChevronUp className="w-3.5 h-3.5" /> {t("collapse")}</>
                      ) : (
                        <><ChevronDown className="w-3.5 h-3.5" /> {t("readMore")}</>
                      )}
                    </button>
                  )}
                </div>

                {savedReviewData.sentiment?.keywords?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {savedReviewData.sentiment.keywords.slice(0, 6).map((kw: string, i: number) => (
                      <span key={i} className="text-[10px] bg-primary/8 text-primary/70 border border-primary/15 px-2 py-0.5 rounded-full">
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
                      <span className="text-primary text-[10px] font-black">Я</span>
                    </div>
                    <span className="text-xs text-muted-foreground">Моя рецензия</span>
                  </div>
                  <button
                    onClick={() => {
                      document.querySelector("[data-rating-panel]")?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }}
                    className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> {t("editReview")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <p className="text-center text-muted-foreground/40 text-xs mt-10">
          {t("tmdbNotice")}
        </p>

        {/* Community Reviews */}
        <MovieReviews movieId={Number(id)} />
      </div>

      {/* Trailer modal */}
      {showTrailer && movie && (
        <TrailerModal
          movieId={Number(id)}
          movieTitle={movie.title}
          onClose={() => setShowTrailer(false)}
        />
      )}

      {/* Recommend to Friend Modal */}
      {recommendFriendModal && movie && (
        <RecommendFriendModal
          movie={movie}
          onClose={() => setRecommendFriendModal(false)}
        />
      )}
    </div>
  );
}
