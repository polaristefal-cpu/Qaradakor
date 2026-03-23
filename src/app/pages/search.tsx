import { useState } from "react";
import { searchMovies } from "../lib/api";
import { MovieCard } from "../components/movie-card";
import { Search as SearchIcon, Loader2, Film } from "lucide-react";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await searchMovies(query);
      setResults(data.results || []);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-7">
        <h1 className="text-2xl font-black text-foreground mb-1">Поиск фильмов</h1>
        <p className="text-muted-foreground text-sm">Введите название на русском или английском</p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="max-w-2xl mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Например: Интерстеллар, Inception, 2024..."
            className="w-full bg-card border border-border rounded-xl pl-11 pr-28 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition text-sm shadow-sm"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            Найти
          </button>
        </div>
      </form>

      {/* Results */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Ищем...</p>
        </div>
      ) : results.length > 0 ? (
        <>
          <p className="text-muted-foreground text-sm mb-4">
            Найдено результатов: <span className="font-semibold text-foreground">{results.length}</span>
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
            {results.map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </div>
        </>
      ) : searched ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Film className="w-8 h-8 text-muted-foreground/40" />
          </div>
          <div className="text-center">
            <p className="text-foreground font-semibold">Ничего не найдено</p>
            <p className="text-muted-foreground text-sm mt-1">Попробуйте другое название или язык</p>
          </div>
        </div>
      ) : (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <SearchIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Начните поиск</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Введите название фильма — поддерживается русский и английский язык
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
