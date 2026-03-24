import { useEffect, useState, useCallback } from "react";
import { X, Loader2, PlayCircle, AlertCircle } from "lucide-react";
import { getMovieVideos } from "../lib/api";

interface TrailerModalProps {
  movieId: number;
  movieTitle: string;
  onClose: () => void;
}

interface VideoResult {
  id: string;
  key: string;
  name: string;
  site: string;
  type: string;
  official: boolean;
  published_at: string;
}

function pickBestTrailer(videos: VideoResult[]): VideoResult | null {
  const youtube = videos.filter((v) => v.site === "YouTube");
  if (!youtube.length) return null;

  // Priority: official Trailer → any Trailer → official Teaser → any Teaser → first YT video
  return (
    youtube.find((v) => v.type === "Trailer" && v.official) ||
    youtube.find((v) => v.type === "Trailer") ||
    youtube.find((v) => v.type === "Teaser" && v.official) ||
    youtube.find((v) => v.type === "Teaser") ||
    youtube[0]
  );
}

export function TrailerModal({ movieId, movieTitle, onClose }: TrailerModalProps) {
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMovieVideos(movieId)
      .then((data) => {
        const best = pickBestTrailer(data?.results || []);
        if (best) {
          setTrailerKey(best.key);
        } else {
          setError("Трейлер не найден");
        }
      })
      .catch(() => setError("Не удалось загрузить трейлер"))
      .finally(() => setLoading(false));
  }, [movieId]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <PlayCircle className="w-4 h-4 text-primary" />
            <span className="text-white text-sm font-semibold line-clamp-1">{movieTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video container */}
        <div className="relative w-full rounded-2xl overflow-hidden bg-black border border-white/10 shadow-2xl"
          style={{ aspectRatio: "16/9" }}
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-white/50 text-sm">Загружаем трейлер…</p>
            </div>
          )}

          {!loading && error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black">
              <AlertCircle className="w-10 h-10 text-muted-foreground/40" />
              <p className="text-white/50 text-sm">{error}</p>
              <p className="text-white/30 text-xs">Попробуйте поискать на YouTube</p>
            </div>
          )}

          {!loading && trailerKey && (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`}
              title={`${movieTitle} — Трейлер`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          )}
        </div>

        {/* Footer hint */}
        <p className="text-center text-white/25 text-[11px] mt-3">
          Нажмите Esc или кликните вне окна, чтобы закрыть
        </p>
      </div>
    </div>
  );
}
