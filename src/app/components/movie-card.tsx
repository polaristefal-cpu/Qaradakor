import { useState } from "react";
import { TMDB_IMG } from "../lib/api";
import { Star, Film, Bookmark, BookmarkCheck, Check, Loader2, Play, Tv } from "lucide-react";
import { useNavigate, useLocation } from "react-router";
import { useAuth } from "../lib/auth-context";
import { useUserData } from "../lib/user-data-context";
import { toast } from "sonner";
import { TrailerModal } from "./trailer-modal";

interface MovieCardProps {
  movie: any;
  rating?: number;
  compact?: boolean;
  showQuickActions?: boolean;
  mediaType?: "movie" | "tv";
}

export function MovieCard({ movie, rating, compact, showQuickActions = true, mediaType: mediaTypeProp }: MovieCardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const userData = (() => {
    try { return useUserData(); } catch { return null; }
  })();

  const [actionLoading, setActionLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  // Detect media type from prop, movie.media_type, or by presence of 'name' vs 'title'
  const isTV = mediaTypeProp === "tv" || movie.media_type === "tv" || (!movie.title && !!movie.name);
  const effectiveType: "movie" | "tv" = isTV ? "tv" : "movie";

  const displayTitle = movie.title || movie.name || "";
  const displayDate = movie.release_date || movie.first_air_date || "";

  const watchedEntry = isTV
    ? userData?.tvWatchedMap[movie.id]
    : userData?.watchedMap[movie.id];
  const inWatchlist = isTV
    ? userData?.tvWatchlistSet.has(movie.id)
    : userData?.watchlistSet.has(movie.id);
  const isWatched = !!watchedEntry;

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || !userData) { toast.error("Войдите в аккаунт"); return; }
    setActionLoading(true);
    try {
      if (inWatchlist) {
        await userData.removeFromWatchlistFn(movie.id, effectiveType);
        toast.success("Удалено из «Хочу посмотреть»");
      } else {
        await userData.addToWatchlistFn({
          movieId: movie.id,
          title: displayTitle,
          poster_path: movie.poster_path,
          release_date: displayDate,
          vote_average: movie.vote_average,
          mediaType: effectiveType,
        });
        toast.success("Добавлено в «Хочу посмотреть»!");
      }
    } catch (err: any) {
      toast.error(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClick = () => {
    const path = isTV ? `/tv/${movie.id}` : `/movie/${movie.id}`;
    navigate(path, { state: { from: location.pathname + location.search } });
  };

  const userRating = rating ?? watchedEntry?.rating;

  return (
    <div
      onClick={handleClick}
      className={`group liquid-glass-card cursor-pointer relative rounded-xl overflow-hidden transition-all duration-300 hover:scale-[1.04] hover:border-primary/40 ${compact ? "w-32" : "w-full"}`}
    >
      {/* Poster */}
      {movie.poster_path ? (
        <img
          src={`${TMDB_IMG}/w342${movie.poster_path}`}
          alt={displayTitle}
          className="w-full aspect-[2/3] object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
          {isTV
            ? <Tv className="w-10 h-10 text-muted-foreground/30" />
            : <Film className="w-10 h-10 text-muted-foreground/30" />
          }
        </div>
      )}

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Play trailer button — centered on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }}
          title="Смотреть трейлер"
          className="liquid-glass-active pointer-events-auto relative w-11 h-11 overflow-hidden rounded-full flex items-center justify-center hover:scale-110 transition-all"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* Title + year at bottom on hover */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{displayTitle}</p>
        {displayDate && (
          <p className="text-white/55 text-[9px] mt-0.5">{displayDate.slice(0, 4)}</p>
        )}
      </div>

      {/* Quick actions — top right corner on hover */}
      {showQuickActions && session && (
        <div
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {isWatched ? (
            /* Already watched — green check */
            <div
              className="w-7 h-7 rounded-lg bg-green-600/90 backdrop-blur flex items-center justify-center shadow-md"
              title="Просмотрено"
            >
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
          ) : (
            /* Watchlist toggle */
            <button
              onClick={handleWatchlistToggle}
              disabled={actionLoading}
              title={inWatchlist ? "Убрать из вотчлиста" : "Хочу посмотреть"}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all shadow-md ${
                inWatchlist
                  ? "liquid-glass-active relative overflow-hidden"
                  : "liquid-glass-control relative overflow-hidden text-white hover:bg-white/15"
              }`}
            >
              {actionLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : inWatchlist
                  ? <BookmarkCheck className="w-3.5 h-3.5" />
                  : <Bookmark className="w-3.5 h-3.5" />
              }
            </button>
          )}
        </div>
      )}

      {/* TV badge */}
      {isTV && (
        <div className="absolute bottom-1.5 right-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <Tv className="w-2.5 h-2.5 text-primary" />
          <span className="text-white text-[9px] font-bold">TV</span>
        </div>
      )}

      {/* TMDB rating badge — top left */}
      {movie.vote_average > 0 && !userRating && (
        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-white fill-white" />
          <span className="text-white text-[10px] font-semibold">{movie.vote_average.toFixed(1)}</span>
        </div>
      )}

      {/* User rating badge */}
      {userRating !== undefined && userRating > 0 && (
        <div className="absolute top-1.5 left-1.5 bg-primary/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-md">
          <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
          <span className="text-primary-foreground text-[10px] font-bold">{userRating}</span>
        </div>
      )}

      {/* AI match score */}
      {movie._score && (
        <div className="absolute top-1.5 right-1.5 bg-primary/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 shadow-md">
          <span className="text-primary-foreground text-[10px] font-bold">{movie._score}%</span>
        </div>
      )}

      {/* Trailer modal */}
      {showTrailer && (
        <TrailerModal
          movieId={movie.id}
          movieTitle={displayTitle}
          mediaType={effectiveType}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
}
