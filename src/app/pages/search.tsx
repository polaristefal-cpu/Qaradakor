import { useState, useRef, useEffect } from "react";
import { searchMovies, searchTVShows, searchPeople, getPersonMovies, getMoviesByGenre, TMDB_IMG } from "../lib/api";
import { MovieCard } from "../components/movie-card";
import { SectionHeader } from "../components/section-header";
import { useLang } from "../lib/lang-context";
import {
  Search as SearchIcon, Loader2, Film, User,
  ChevronRight, X, Users, Star, Clapperboard, Tv,
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

type SearchTab = "all" | "movies" | "tv" | "people";

export function SearchPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const searchParamString = searchParams.toString();
  const genreId = Number(searchParams.get("genre") || 0);
  const genreName = searchParams.get("genreName") || "";
  const isGenreMode = Number.isFinite(genreId) && genreId > 0;
  const { t, tmdbLang } = useLang();

  const [inputVal, setInputVal] = useState(initialQuery);
  const [movieResults, setMovieResults] = useState<any[]>([]);
  const [tvResults, setTvResults] = useState<any[]>([]);
  const [peopleResults, setPeopleResults] = useState<PersonResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>("all");

  // Person filmography
  const [selectedPerson, setSelectedPerson] = useState<PersonResult | null>(null);
  const [personMovies, setPersonMovies] = useState<any[]>([]);
  const [personMoviesLoading, setPersonMoviesLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const resetPeople = () => {
      setSelectedPerson(null);
      setPersonMovies([]);
      setPersonMoviesLoading(false);
    };

    const clearResults = () => {
      setMovieResults([]);
      setTvResults([]);
      setPeopleResults([]);
      resetPeople();
    };

    const load = async () => {
      const params = new URLSearchParams(searchParamString);
      const q = params.get("q") || "";
      const currentGenreId = Number(params.get("genre") || 0);
      const hasGenre = Number.isFinite(currentGenreId) && currentGenreId > 0;

      if (hasGenre) {
        setInputVal("");
        setSearched(true);
        setLoading(true);
        setActiveTab("movies");
        clearResults();

        try {
          const data = await getMoviesByGenre(currentGenreId);
          if (!cancelled) setMovieResults(data?.results || []);
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      if (q.trim()) {
        setInputVal(q);
        setSearched(true);
        setLoading(true);
        setActiveTab("all");
        clearResults();

        try {
          const [moviesData, tvData, peopleData] = await Promise.allSettled([
            searchMovies(q),
            searchTVShows(q),
            searchPeople(q),
          ]);
          if (cancelled) return;
          if (moviesData.status === "fulfilled") setMovieResults(moviesData.value?.results || []);
          if (tvData.status === "fulfilled") setTvResults(tvData.value?.results || []);
          if (peopleData.status === "fulfilled") {
            const people = (peopleData.value?.results || []) as PersonResult[];
            setPeopleResults(people.slice(0, 8));
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      setInputVal("");
      setSearched(false);
      setLoading(false);
      setActiveTab("all");
      clearResults();
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [searchParamString, tmdbLang]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputVal.trim();
    if (q) setSearchParams({ q });
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

  const totalResults = movieResults.length + tvResults.length + peopleResults.length;
  const genreLabel = genreName || t("moviesTab");
  const pageTitle = isGenreMode
    ? `${t("bestGenreMovies")}: ${genreLabel}`
    : t("searchPageTitle");
  const movieSectionLabel = isGenreMode ? pageTitle : t("moviesTab");

  const tabs: { id: SearchTab; label: string; icon: any; count: number }[] = [
    { id: "all", label: t("search"), icon: SearchIcon, count: totalResults },
    { id: "movies", label: t("moviesTab"), icon: Clapperboard, count: movieResults.length },
    { id: "tv", label: t("tvTab"), icon: Tv, count: tvResults.length },
    { id: "people", label: t("peopleTab"), icon: Users, count: peopleResults.length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black text-foreground mb-6">{pageTitle}</h1>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="liquid-glass-card relative flex gap-2.5 mb-6 overflow-hidden rounded-[1.75rem] p-1.5">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder={t("searchInputPlaceholder")}
            className="w-full bg-transparent rounded-2xl pl-10 pr-10 py-3 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/15 transition"
            autoFocus
          />
          {inputVal && (
            <button
              type="button"
              onClick={() => {
                setInputVal("");
                setMovieResults([]);
                setTvResults([]);
                setPeopleResults([]);
                setSearched(false);
                setSearchParams({});
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          type="submit"
          className="liquid-glass-active relative overflow-hidden px-5 py-2.5 rounded-2xl font-semibold text-sm transition-all hover:scale-[1.02]"
        >
          {t("searchBtn")}
        </button>
      </form>

      {/* Tabs (only when results exist) */}
      {searched && !loading && totalResults > 0 && (
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-1.5 overflow-hidden px-3.5 py-1.5 rounded-xl text-sm font-semibold border transition-all ${
                activeTab === tab.id
                  ? "liquid-glass-active"
                  : "liquid-glass-control text-muted-foreground hover:text-foreground"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                  activeTab === tab.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      )}

      {/* No results */}
      {searched && !loading && totalResults === 0 && (
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

      {!loading && searched && totalResults > 0 && (
        <div className="space-y-10">
          {/* People results */}
          {(activeTab === "all" || activeTab === "people") && peopleResults.length > 0 && (
            <div>
              <SectionHeader icon={Users} label={t("peopleTab")} />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {peopleResults.map((person) => (
                  <button
                    key={person.id}
                    onClick={() => handlePersonClick(person)}
                    className={`group liquid-glass-card relative rounded-xl overflow-hidden text-left transition-all hover:shadow-md ${
                      selectedPerson?.id === person.id
                        ? "ring-2 ring-primary/20"
                        : "hover:border-primary/40"
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
          {(activeTab === "all" || activeTab === "movies") && movieResults.length > 0 && (
            <div>
              <SectionHeader icon={Clapperboard} label={movieSectionLabel} />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2.5">
                {movieResults.map((movie) => (
                  <MovieCard key={movie.id} movie={movie} mediaType="movie" />
                ))}
              </div>
            </div>
          )}

          {/* TV results */}
          {(activeTab === "all" || activeTab === "tv") && tvResults.length > 0 && (
            <div>
              <SectionHeader icon={Tv} label={t("tvTab")} />
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-7 xl:grid-cols-9 gap-2.5">
                {tvResults.map((show) => (
                  <MovieCard key={show.id} movie={show} mediaType="tv" />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
