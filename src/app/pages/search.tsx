import { useState, useRef, useEffect } from "react";
import { searchMovies, searchPeople, getPersonMovies, TMDB_IMG } from "../lib/api";
import { MovieCard } from "../components/movie-card";
import { SectionHeader } from "../components/section-header";
import { useLang } from "../lib/lang-context";
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
  const { t, tmdbLang } = useLang();

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

  // Re-run search when language changes (if there was a query)
  useEffect(() => {
    if (query.trim()) doSearch(query);
  }, [tmdbLang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    doSearch(inputVal);
  };

  const handlePersonClick = async (person: PersonResult) => {
    if (selectedPerson?.id === person.id) {
      setSelectedPerson(null);
      setPersonMovies([]);
      return;
    }
    setSelectedPerson(person);
    setPersonMoviesLoading(true);
    setPersonMovies([]);
    try {
      const data = await getPersonMovies(person.id);
      const credits: any[] = [
        ...(data.cast || []),
        ...(data.crew?.filter((c: any) => c.job === "Director" || c.job === "Producer") || []),
      ];
      const seen = new Set<number>();
      const unique = credits.filter((m: any) => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
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
      <h1 className="text-2xl font-black text-foreground mb-6">{t("searchPageTitle")}</h1>

      {/* Search form */}
      <form onSubmit={(e) => { e.preventDefault(); doSearch(inputVal); }} className="flex gap-2.5 mb-8">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t("searchInputPlaceholder")}
            className="w-full bg-card border border-border rounded-2xl pl-10 pr-10 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition shadow-sm"
            autoFocus
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => { setInputVal(""); setQuery(""); setMovieResults([]); setPeopleResults([]); setSearched(false); }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="px-5 py-2.5 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm hover:bg-primary/90 transition-all shadow-sm"
        >
          {t("searchBtn")}
        </button>
      </form>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* No results */}
      {searched && !loading && movieResults.length === 0 && peopleResults.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <Film className="w-12 h-12 text-muted-foreground/20" />
          <p className="text-muted-foreground">{t("noResults")}</p>
        </div>
      )}

      {/* Initial state */}
      {!searched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center text-muted-foreground">
          <SearchIcon className="w-12 h-12 opacity-20" />
          <p className="text-sm">{t("searchPrompt")}</p>
        </div>
      )}

      {/* People results */}
      {!loading && peopleResults.length > 0 && (
        <div className="mb-8">
          <SectionHeader icon={Users} label={t("peopleTab")} />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {peopleResults.map((person) => (
              <button
                key={person.id}
                onClick={() => handlePersonClick(person)}
                className={`group bg-card border rounded-xl overflow-hidden text-left shadow-sm transition-all hover:shadow-md ${
                  selectedPerson?.id === person.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {person.profile_path ? (
                  <img
                    src={`${TMDB_IMG}/w185${person.profile_path}`}
                    alt={person.name}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-[1.02] transition-transform duration-300"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground/20" />
                  </div>
                )}
                <div className="p-2.5">
                  <p className="text-foreground text-xs font-bold line-clamp-1">{person.name}</p>
                  <p className="text-muted-foreground text-[10px] mt-0.5">{person.known_for_department}</p>
                  {selectedPerson?.id === person.id && (
                    <p className="text-primary text-[10px] font-semibold mt-0.5">{t("filmography")} →</p>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Person filmography */}
          {selectedPerson && (
            <div className="mt-6">
              <div className="flex items-center gap-2.5 mb-4">
                <ChevronRight className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-black text-foreground">{selectedPerson.name} — {t("filmography")}</h3>
              </div>
              {personMoviesLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-7 h-7 text-primary animate-spin" />
                </div>
              ) : personMovies.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2.5">
                  {personMovies.map((m: any) => (
                    <MovieCard key={`${m.id}-${m.character || ""}`} movie={m} />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm text-center py-8">{t("noResults")}</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Movie results */}
      {!loading && movieResults.length > 0 && (
        <div>
          <SectionHeader icon={Clapperboard} label={t("moviesTab")} />
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2.5">
            {movieResults.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}