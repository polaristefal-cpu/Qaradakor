import { useState } from "react";
import { TMDB_IMG } from "../lib/api";
import { Star, Film, Bookmark, BookmarkCheck, Check, Loader2, Play } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../lib/auth-context";
import { useUserData } from "../lib/user-data-context";
import { toast } from "sonner";
import { TrailerModal } from "./trailer-modal";

interface MovieCardProps {
  movie: any;
  rating?: number;
  compact?: boolean;
  showQuickActions?: boolean;
}

export function MovieCard({ movie, rating, compact, showQuickActions = true }: MovieCardProps) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const userData = (() => {
    try { return useUserData(); } catch { return null; }
  })();

  const [actionLoading, setActionLoading] = useState(false);
  const [showTrailer, setShowTrailer] = useState(false);

  const watchedEntry = userData?.watchedMap[movie.id];
  const inWatchlist = userData?.watchlistSet.has(movie.id);
  const isWatched = !!watchedEntry;

  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session || !userData) { toast.error("Войдите в аккаунт"); return; }
    setActionLoading(true);
    try {
      if (inWatchlist) {
        await userData.removeFromWatchlistFn(movie.id);
        toast.success("Удалено из «Хочу посмотреть»");
      } else {
        await userData.addToWatchlistFn({
          movieId: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          vote_average: movie.vote_average,
        });
        toast.success("Добавлено в «Хочу посмотреть»!");
      }
    } catch (err: any) {
      toast.error(err.message || "Ошибка");
    } finally {
      setActionLoading(false);
    }
  };

  const userRating = rating ?? watchedEntry?.rating;

  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      className={`group cursor-pointer relative rounded-xl overflow-hidden bg-card border border-border shadow-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-lg hover:border-primary/40 ${compact ? "w-32" : "w-full"}`}
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

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

      {/* Play trailer button — centered on hover */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <button
          onClick={(e) => { e.stopPropagation(); setShowTrailer(true); }}
          title="Смотреть трейлер"
          className="pointer-events-auto w-11 h-11 rounded-full bg-primary/90 hover:bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/40 hover:scale-110 transition-all backdrop-blur-sm"
        >
          <Play className="w-5 h-5 fill-current ml-0.5" />
        </button>
      </div>

      {/* Title + year at bottom on hover */}
      <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{movie.title}</p>
        {movie.release_date && (
          <p className="text-white/55 text-[9px] mt-0.5">{movie.release_date.slice(0, 4)}</p>
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
                  ? "bg-primary text-primary-foreground"
                  : "bg-black/60 backdrop-blur text-white hover:bg-primary"
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

      {/* TMDB rating badge — top left */}
      {movie.vote_average > 0 && !userRating && (
        <div className="absolute top-1.5 left-1.5 bg-black/70 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-primary fill-primary" />
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
          movieTitle={movie.title}
          onClose={() => setShowTrailer(false)}
        />
      )}
    </div>
  );
}