import { useState } from "react";
import { TMDB_IMG } from "../lib/api";
import { Star, Film, Check, Loader2, X, Play, Eye } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../lib/auth-context";
import { useUserData } from "../lib/user-data-context";
import { toast } from "sonner";
import { TrailerModal } from "./trailer-modal";

interface RecommendationCardProps {
  movie: any;
  onSkip: (movieId: number) => void;
}

export function RecommendationCard({ movie, onSkip }: RecommendationCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const userData = (() => {
    try { return useUserData(); } catch { return null; }
  })();

  const [actionLoading, setActionLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);
  // "idle" | "rating" | "done"
  const [mode, setMode] = useState<"idle" | "rating" | "done">("idle");
  const [hoveredRating, setHoveredRating] = useState(0);

  const watchedEntry = userData?.watchedMap[movie.id];
  const isWatched = !!watchedEntry;
  const userRating = watchedEntry?.rating;

  const handleMarkWatched = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || !userData) { toast.error("Войдите в аккаунт"); return; }
    setMode("rating");
  };

  const handleRate = async (e: React.MouseEvent, rating: number) => {
    e.stopPropagation();
    if (!userData) return;
    setActionLoading(true);
    try {
      await userData.addWatchedFn(movie.id, rating);
      toast.success(`«${movie.title}» — оценка ${rating} сохранена!`);
      setMode("done");
    } catch (err: any) {
      toast.error(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSkip(movie.id);
  };

  const handleCancelRating = (e: React.MouseEvent) => {
    e.stopPropagation();
    setMode("idle");
    setHoveredRating(0);
  };

  return (
    <div
      onClick={() =>
        mode === "idle" &&
        navigate(`/movie/${movie.id}`, { state: { from: location.pathname } })
      }
      className={`group relative rounded-xl overflow-hidden bg-card border shadow-sm transition-all duration-300 hover:shadow-lg ${
        mode === "rating"
          ? "border-primary scale-[1.03]"
          : isWatched
          ? "border-green-600/40 hover:border-green-500/60"
          : "border-border hover:scale-[1.04] hover:border-primary/40"
      } ${mode === "idle" ? "cursor-pointer" : "cursor-default"}`}
    >
      {/* Poster */}
      {movie.poster_path ? (
        <img
          src={`${TMDB_IMG}/w342${movie.poster_path}`}
          alt={movie.title}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
          <Film className="w-10 h-10 text-muted-foreground/30" />
        </div>
      )}

      {/* Default hover overlay (only in idle mode) */}
      {mode === "idle" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      )}

      {/* ── RATING MODE overlay ── */}
      {mode === "rating" && (
        <div
          className="absolute inset-0 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center gap-2 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-white text-[11px] font-bold text-center px-2 leading-tight line-clamp-2">
            {movie.title}
          </p>
          <p className="text-white/60 text-[10px]">Ваша оценка</p>

          {actionLoading ? (
            <Loader2 className="w-6 h-6 text-primary animate-spin mt-1" />
          ) : (
            <>
              {/* Rating numbers 1–5 */}
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHoveredRating(n)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={(e) => handleRate(e, n)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all ${
                      (hoveredRating || 0) >= n
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-white/15 text-white hover:bg-primary/70"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
              {/* Rating numbers 6–10 */}
              <div className="flex gap-1">
                {[6, 7, 8, 9, 10].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHoveredRating(n)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={(e) => handleRate(e, n)}
                    className={`w-7 h-7 rounded-lg text-[11px] font-black transition-all ${
                      (hoveredRating || 0) >= n
                        ? "bg-primary text-primary-foreground scale-110"
                        : "bg-white/15 text-white hover:bg-primary/70"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCancelRating}
                className="mt-1 text-white/50 hover:text-white/90 text-[10px] transition flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Отмена
              </button>
            </>
          )}
        </div>
      )}

      {/* ── IDLE mode: bottom action buttons on hover ── */}
      {mode === "idle" && session && (
        <div
          className="absolute bottom-0 left-0 right-0 flex gap-1 px-1.5 pb-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {isWatched ? (
            /* Already watched — just "Skip" */
            <button
              onClick={handleSkip}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white/80 hover:text-white hover:bg-black/90 text-[10px] font-semibold transition-all"
            >
              <X className="w-3 h-3" />
              Пропустить
            </button>
          ) : (
            <>
              {/* Mark watched */}
              <button
                onClick={handleMarkWatched}
                className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-primary/90 backdrop-blur-sm text-primary-foreground text-[10px] font-semibold hover:bg-primary transition-all"
              >
                <Eye className="w-3 h-3" />
                Просмотрено
              </button>
              {/* Skip */}
              <button
                onClick={handleSkip}
                title="Пропустить"
                className="w-8 flex items-center justify-center rounded-lg bg-black/60 backdrop-blur-sm text-white/70 hover:text-white hover:bg-black/80 transition-all"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}

      {/* Title + year on hover (idle only, above buttons) */}
      {mode === "idle" && (
        <div className="absolute bottom-9 left-0 right-0 px-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">
            {movie.title}
          </p>
          {movie.release_date && (
            <p className="text-white/55 text-[9px] mt-0.5">
              {movie.release_date.slice(0, 4)}
            </p>
          )}
        </div>
      )}

      {/* Play trailer button (idle only) */}
      {mode === "idle" && (
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <button
            onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }}
            title="Смотреть трейлер"
            className="pointer-events-auto w-10 h-10 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-110 transition-all backdrop-blur-sm mb-8"
          >
            <Play className="w-4 h-4 fill-current ml-0.5" />
          </button>
        </div>
      )}

      {/* ── Badges ── */}

      {/* TMDB score — top left (only if no user rating) */}
      {movie.vote_average > 0 && !userRating && mode === "idle" && (
        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-primary fill-primary" />
          <span className="text-white text-[10px] font-semibold">
            {movie.vote_average.toFixed(1)}
          </span>
        </div>
      )}

      {/* User rating badge — top left */}
      {userRating !== undefined && userRating > 0 && mode === "idle" && (
        <div className="absolute top-1.5 left-1.5 bg-primary/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-md">
          <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
          <span className="text-primary-foreground text-[10px] font-bold">
            {userRating}
          </span>
        </div>
      )}

      {/* AI match score — top right */}
      {movie._score && mode === "idle" && (
        <div className="absolute top-1.5 right-1.5 bg-primary/95 backdrop-blur-sm rounded-md px-2 py-1 shadow-md flex items-center justify-center min-w-[38px]">
          <span className="text-primary-foreground text-[10px] font-bold leading-none">
            {movie._score}%
          </span>
        </div>
      )}

      {/* Already watched badge — top right (when no score) */}
      {isWatched && !movie._score && mode === "idle" && (
        <div
          className="absolute top-1.5 right-1.5 w-6 h-6 rounded-lg bg-green-600/90 backdrop-blur flex items-center justify-center shadow-md"
          title="Просмотрено"
        >
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* Already watched + score: small check overlaps score */}
      {isWatched && movie._score && mode === "idle" && (
        <div
          className="absolute top-7 right-1.5 w-5 h-5 rounded-md bg-green-600/90 backdrop-blur flex items-center justify-center shadow-md"
          title="Просмотрено"
        >
          <Check className="w-3 h-3 text-white" />
        </div>
      )}

      {/* Trailer modal */}
      {showTrailer && (
        <TrailerModal
          movieId={movie.id}
          movieTitle={movie.title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
}