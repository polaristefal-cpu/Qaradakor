import { useState, useEffect, useRef } from "react";
import { searchMovies, searchPeople, getPersonMovies, TMDB_IMG } from "../lib/api";
import { MovieCard } from "../components/movie-card";
import {
  Search as SearchIcon, Loader2, Film, User,
  ChevronRight, X, Users, Star, Clapperboard,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

interface PersonResult {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  popularity: number;
  known_for: any[];
}

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [inputVal, setInputVal] = useState(initialQuery);
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  // Person filmography
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);
  const [personMovies, setPersonMovies] = useState<any[]>([]);
  const [personMoviesLoading, setPersonMoviesLoading] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  const doSearch = async (q: string) => {
    if (!q.trim()) return;
    setSearched(true);
    setSelectedPerson(null);
    setPersonMovies([]);
    setLoading(true);
    setMovieResults([]);
    setPeopleResults([]);
    setSearchParams({ q: q.trim() });

    try {
      const [moviesData, peopleData] = await Promise.allSettled([
        searchMovies(q),
        searchPeople(q),
      ]);
      if (moviesData.status === "fulfilled") setMovieResults(moviesData.value?.results || []);
      if (peopleData.status === "fulfilled") {
        const people = (peopleData.value?.results || []) as PersonResult[];
        setPeopleResults(people.slice(0, 8));
      }
    } finally {
      setLoading(false);
    }
  };

  // On mount, search if initial query present
  useEffect(() => {
    if (initialQuery) doSearch(initialQuery);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputVal);
  };

  const handleSelectPerson = async (person: PersonResult) => {
    setSelectedPerson(person);
    setPersonMoviesLoading(true);
    setPersonMovies([]);
    try {
      const data = await getPersonMovies(person.id);
      const credits: any[] = [
        ...(data.cast || []),
        ...(data.crew?.filter((c: any) => c.job === "Director" || c.job === "Producer") || []),
      ];
      // Deduplicate
      const seen = new Set<number>();
      const unique = credits.filter((m: any) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      // Sort by release date descending
      unique.sort((a, b) => (b.release_date || "").localeCompare(a.release_date || ""));
      setPersonMovies(unique);
    } catch {
      setPersonMovies([]);
    } finally {
      setPersonMoviesLoading(false);
    }
  };

  const deptLabel = (dept: string) => {
    if (dept === "Acting") return "Актёр / Актриса";
    if (dept === "Directing") return "Режиссёр";
    if (dept === "Writing") return "Сценарист";
    if (dept === "Production") return "Продюсер";
    return dept;
  };

  const totalResults = movieResults.length + peopleResults.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-7">
        <h1 className="text-2xl font-black text-foreground mb-1">Поиск</h1>
        <p className="text-muted-foreground text-sm">
          Ищите фильмы, актёров и режиссёров
        </p>
      </div>

      {/* Search bar */}
      <form onSubmit={handleSubmit} className="max-w-2xl mb-8">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Фильм, актёр, режиссёр…"
            className="w-full bg-card border border-border rounded-xl pl-11 pr-28 py-3 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition text-sm shadow-sm"
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => { setInputVal(""); setMovieResults([]); setPeopleResults([]); setSearched(false); setSelectedPerson(null); setSearchParams({}); }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            disabled={loading || !inputVal.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-40 transition-all"
          >
            Найти
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Ищем…</p>
        </div>
      )}

      {/* Results */}
      {!loading && searched && (
        <>
          {/* Summary */}
          {totalResults > 0 && !selectedPerson && (
            <p className="text-muted-foreground text-sm mb-5">
              Найдено: <span className="font-semibold text-foreground">{movieResults.length}</span> фильмов
              {peopleResults.length > 0 && (
                <>, <span className="font-semibold text-foreground">{peopleResults.length}</span> персон</>
              )}
            </p>
          )}

          {/* Person filmography view */}
          {selectedPerson && (
            <div>
              {/* Person header */}
              <div className="bg-card border border-border rounded-2xl p-5 mb-6 flex items-center gap-5 shadow-sm">
                <div
                  onClick={() => navigate(`/person/${selectedPerson.id}`)}
                  className="shrink-0 w-20 h-20 rounded-2xl overflow-hidden bg-muted border border-border cursor-pointer hover:border-primary/40 transition"
                >
                  {selectedPerson.profile_path ? (
                    <img
                      src={`${TMDB_IMG}/w185${selectedPerson.profile_path}`}
                      alt={selectedPerson.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-black text-foreground">{selectedPerson.name}</h2>
                    <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg font-medium">
                      {deptLabel(selectedPerson.known_for_department)}
                    </span>
                  </div>
                  {personMovies.length > 0 && (
                    <p className="text-muted-foreground text-sm mt-1">{personMovies.length} фильмов</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => navigate(`/person/${selectedPerson.id}`)}
                      className="text-xs text-primary hover:underline flex items-center gap-1"
                    >
                      Полная страница <ChevronRight className="w-3 h-3" />
                    </button>
                    <span className="text-muted-foreground/40">·</span>
                    <button
                      onClick={() => setSelectedPerson(null)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Вернуться к результатам
                    </button>
                  </div>
                </div>
              </div>

              {personMoviesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                  {personMovies.map((m) => (
                    <MovieCard key={m.id} movie={m} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Normal results */}
          {!selectedPerson && (
            <>
              {/* People section */}
              {peopleResults.length > 0 && (
                <section className="mb-8">
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                    <Users className="w-3.5 h-3.5" /> Персоны
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {peopleResults.map((person) => (
                      <button
                        key={person.id}
                        onClick={() => handleSelectPerson(person)}
                        className="bg-card border border-border rounded-xl p-3 flex items-center gap-3 hover:border-primary/40 hover:shadow-md transition-all text-left group"
                      >
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border group-hover:border-primary/30 transition">
                          {person.profile_path ? (
                            <img
                              src={`${TMDB_IMG}/w92${person.profile_path}`}
                              alt={person.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-foreground text-sm font-bold truncate">{person.name}</p>
                          <p className="text-muted-foreground text-[10px] mt-0.5">{deptLabel(person.known_for_department)}</p>
                          {person.known_for?.length > 0 && (
                            <p className="text-muted-foreground/60 text-[10px] mt-0.5 truncate">
                              {person.known_for.map((m: any) => m.title || m.name).join(", ")}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary shrink-0 transition" />
                      </button>
                    ))}
                  </div>
                </section>
              )}

              {/* Movies section */}
              {movieResults.length > 0 && (
                <section>
                  {peopleResults.length > 0 && (
                    <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
                      <Clapperboard className="w-3.5 h-3.5" /> Фильмы
                    </h2>
                  )}
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 gap-3">
                    {movieResults.map((m) => (
                      <MovieCard key={m.id} movie={m} />
                    ))}
                  </div>
                </section>
              )}

              {/* Empty */}
              {totalResults === 0 && (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
                    <Film className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                  <div className="text-center">
                    <p className="text-foreground font-semibold">Ничего не найдено</p>
                    <p className="text-muted-foreground text-sm mt-1">Попробуйте другой запрос</p>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Initial empty state */}
      {!loading && !searched && (
        <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <SearchIcon className="w-7 h-7 text-primary" />
          </div>
          <div>
            <p className="text-foreground font-semibold">Начните поиск</p>
            <p className="text-muted-foreground text-sm mt-1 max-w-xs">
              Введите название фильма, имя актёра или режиссёра
            </p>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {["Кристофер Нолан", "Tom Hanks", "Интерстеллар", "Леонардо ДиКаприо"].map(hint => (
              <button
                key={hint}
                onClick={() => { setInputVal(hint); doSearch(hint); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
              >
                {hint}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
