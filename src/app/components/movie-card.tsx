import { TMDB_IMG } from "../lib/api";
import { Star, Film } from "lucide-react";
import { useNavigate } from "react-router";

interface MovieCardProps {
  movie: any;
  rating?: number;
  compact?: boolean;
}

export function MovieCard({ movie, rating, compact }: MovieCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      className={`group cursor-pointer relative rounded-xl overflow-hidden bg-card border border-border shadow-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-lg hover:border-primary/40 ${compact ? "w-32" : "w-full"}`}
    >
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
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white text-xs font-semibold line-clamp-2 leading-tight">{movie.title}</p>
        {movie.release_date && (
          <p className="text-white/60 text-[10px] mt-0.5">{movie.release_date.slice(0, 4)}</p>
        )}
      </div>

      {/* User rating badge */}
      {rating !== undefined && rating > 0 && (
        <div className="absolute top-2 right-2 bg-primary/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1 shadow-md">
          <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
          <span className="text-primary-foreground text-[10px] font-bold">{rating}</span>
        </div>
      )}

      {/* TMDB rating badge */}
      {movie.vote_average > 0 && !rating && (
        <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm rounded-full px-1.5 py-0.5 flex items-center gap-1">
          <Star className="w-2.5 h-2.5 text-primary fill-primary" />
          <span className="text-white text-[10px] font-semibold">{movie.vote_average.toFixed(1)}</span>
        </div>
      )}

      {/* AI match score */}
      {movie._score && (
        <div className="absolute top-2 right-2 bg-primary/95 backdrop-blur-sm rounded-full px-1.5 py-0.5 shadow-md">
          <span className="text-primary-foreground text-[10px] font-bold">{movie._score}%</span>
        </div>
      )}
    </div>
  );
}
