import { useEffect, useState } from "react";
import { getRecommendations } from "../lib/api";
import { MovieCard } from "../components/movie-card";
import { Sparkles, Loader2, Film, Library } from "lucide-react";
import { Link } from "react-router";

export function RecommendationsPage() {
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRecommendations()
      .then(setMovies)
      .catch(() => setMovies([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Анализируем ваши вкусы...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Sparkles className="w-5.5 h-5.5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Рекомендации для вас</h1>
          <p className="text-muted-foreground text-sm">
            Content-Based Filtering по вашим жанрам, режиссёрам и актёрам
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-card border border-border rounded-xl px-4 py-3 mb-7 flex items-start gap-3">
        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
        <p className="text-muted-foreground text-xs leading-relaxed">
          Рекомендации формируются на основе AI-анализа вашей библиотеки: популярные жанры, любимые режиссёры и актёры.
          Чем больше фильмов в библиотеке — тем точнее подборка.
        </p>
      </div>

      {movies.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 rounded-2xl bg-muted border border-border inline-flex items-center justify-center mb-5">
            <Film className="w-10 h-10 text-muted-foreground/30" />
          </div>
          <p className="text-foreground font-bold text-lg">Нет данных для рекомендаций</p>
          <p className="text-muted-foreground text-sm mt-2 max-w-sm mx-auto">
            Добавьте хотя бы несколько фильмов в библиотеку, чтобы мы смогли подобрать что-то для вас.
          </p>
          <Link
            to="/library"
            className="inline-flex items-center gap-2 mt-5 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary/90 transition shadow-sm"
          >
            <Library className="w-4 h-4" /> Перейти в библиотеку
          </Link>
        </div>
      ) : (
        <>
          <p className="text-muted-foreground text-sm mb-4">
            Найдено подходящих фильмов: <span className="font-semibold text-foreground">{movies.length}</span>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {movies.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
