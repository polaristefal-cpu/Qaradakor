import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  getTrending,
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getMoviesByGenre,
  getMovieVideos,
  TMDB_IMG,
  getWatchlist,
  addToWatchlist,
  removeFromWatchlist,
  getTrendingTV,
  getPopularTV,
  getTopRatedTV,
  getAiringToday,
  getKazakhMoviesTopRated,
  getKazakhMoviesNew,
  getKazakhMoviesGoldenAge,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useLang } from "../lib/lang-context";
import { SEO, generateOrganizationStructuredData, generateWebSiteStructuredData } from "../components/seo";
import {
  Zap,
  Award,
  TrendingUp,
  Clock,
  Star,
  ChevronLeft,
  ChevronRight,
  Play,
  Info,
  Film,
  Sparkles,
  LogIn,
  UserPlus,
  Clapperboard,
  Calendar,
  Flame,
  X,
  Users as Users2,
  Bot,
  Search,
  Shuffle,
  Hash,
  Heart,
  ArrowRight,
  Tv,
  MapPin,
  Trophy,
} from "lucide-react";
import { MovieCard } from "../components/movie-card";
import { TopReviewsSection } from "../components/top-reviews-section";

// ─── Shared Animations ────────────────────────────────────────────────────────
const FadeIn = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 25 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-40px" }}
    transition={{ duration: 0.5, delay, ease: "easeOut" }}
    className={className}
  >
    {children}
  </motion.div>
);

// ─── Home Search Block ─────────────────────────────────────────────────────────
function HomeSearchBlock() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { t } = useLang();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="bg-background border-b border-border sticky top-0 z-40 md:relative md:z-auto">
      <div className="max-w-7xl mx-auto px-4 py-4 md:py-6">
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-3 shadow-sm w-full focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <Search className="w-5 h-5 text-muted-foreground shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base md:text-sm outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-muted-foreground hover:text-foreground transition-colors p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="px-5 py-2 md:py-1.5 bg-primary text-primary-foreground rounded-xl text-sm font-bold hover:bg-primary/90 transition-all shrink-0 active:scale-95"
            >
              {t("searchBtn")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  release_date: string;
  genre_ids?: number[];
}

// Genre map — keys for translation
const GENRE_MAP = [
  { id: 28,    tKey: "genreAction" as const },
  { id: 12,    tKey: "genreAdventure" as const },
  { id: 16,    tKey: "genreAnimation" as const },
  { id: 35,    tKey: "genreComedy" as const },
  { id: 80,    tKey: "genreCrime" as const },
  { id: 18,    tKey: "genreDrama" as const },
  { id: 14,    tKey: "genreFantasy" as const },
  { id: 27,    tKey: "genreHorror" as const },
  { id: 10749, tKey: "genreRomance" as const },
  { id: 878,   tKey: "genreSciFi" as const },
  { id: 53,    tKey: "genreThriller" as const },
  { id: 10752, tKey: "genreWar" as const },
];

const GENRES = [
  { id: 28,    name: "Action" },
  { id: 12,    name: "Adventure" },
  { id: 16,    name: "Animation" },
  { id: 35,    name: "Comedy" },
  { id: 80,    name: "Crime" },
  { id: 18,    name: "Drama" },
  { id: 14,    name: "Fantasy" },
  { id: 27,    name: "Horror" },
  { id: 10749, name: "Romance" },
  { id: 878,   name: "Sci-Fi" },
  { id: 53,    name: "Thriller" },
  { id: 10752, name: "War" },
];

// ─── Section Header ────────────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon,
  label,
  iconClass = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  iconClass?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <div className={`w-1 h-6 rounded-full bg-primary`} />
      <Icon className={`w-5 h-5 ${iconClass}`} />
      <h2 className="text-xl md:text-2xl font-black text-foreground tracking-tight">{label}</h2>
    </div>
  );
}

// ─── Carousel Row ──────────────────────────────────────────────────────────────
function MovieRow({
  label,
  icon,
  iconClass,
  movies,
  mediaType = "movie",
}: {
  label: string;
  icon: React.ElementType;
  iconClass?: string;
  movies: any[];
  mediaType?: "movie" | "tv";
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  if (!movies.length) return null;

  return (
    <section>
      <SectionHeader icon={icon} label={label} iconClass={iconClass} />
      <div className="relative group/row -mx-4 px-4 sm:mx-0 sm:px-0">
        <button
          onClick={() => scroll("left")}
          className="hidden md:flex absolute left-0 top-[40%] z-20 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 opacity-0 group-hover/row:opacity-100 -translate-x-4 group-hover/row:translate-x-0 transition-all duration-300"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="hidden md:flex absolute right-0 top-[40%] z-20 w-10 h-10 rounded-full bg-card/90 backdrop-blur border border-border shadow-lg items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 opacity-0 group-hover/row:opacity-100 translate-x-4 group-hover/row:translate-x-0 transition-all duration-300"
        >
          <ChevronRight className="w-5 h-5" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        >
          {movies.map((m) => {
            const displayTitle = m.title || m.name || "";
            const displayDate = m.release_date || m.first_air_date || "";
            return (
              <div key={m.id} className="snap-start shrink-0 w-[130px] sm:w-[150px] group/item flex flex-col">
                <MovieCard movie={m} mediaType={mediaType} />
                <p className="mt-2.5 text-sm font-bold text-foreground line-clamp-1 px-0.5 group-hover/item:text-primary transition-colors">{displayTitle}</p>
                {displayDate && (
                  <p className="text-[11px] font-medium text-muted-foreground px-0.5 mt-0.5">{displayDate.slice(0, 4)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Trailer Modal ─────────────────────────────────────────────────────────────
function TrailerModal({ videoKey, onClose }: { videoKey: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl rounded-2xl overflow-hidden shadow-2xl border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="aspect-video bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0`}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black transition-colors backdrop-blur-sm"
        >
          <X className="w-5 h-5" />
        </button>
      </motion.div>
    </div>
  );
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSection({ movies }: { movies: Movie[] }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const { t } = useLang();
  const [idx, setIdx] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const [fadeIn, setFadeIn] = useState(true);
  
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  
  const featured = movies.slice(0, 6);
  const movie = featured[idx];

  useEffect(() => {
    if (featured.length <= 1) return;
    const timer = setInterval(() => {
      setFadeIn(false);
      setTimeout(() => {
        setIdx((i) => (i + 1) % featured.length);
        setFadeIn(true);
      }, 300);
    }, 7000);
    return () => clearInterval(timer);
  }, [featured.length, idx]);

  const handleTrailer = async () => {
    if (!movie) return;
    setTrailerLoading(true);
    try {
      const data = await getMovieVideos(movie.id);
      const videos = data.results || [];
      const trailer =
        videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
        videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
        videos.find((v: any) => v.site === "YouTube");
      if (trailer) setTrailerKey(trailer.key);
      else alert(t("trailerNotFound"));
    } catch {
      alert(t("trailerLoadError"));
    } finally {
      setTrailerLoading(false);
    }
  };
  
  const minSwipeDistance = 50;
  
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  
  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };
  
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      changeSlideTo((idx + 1) % featured.length);
    }
    if (isRightSwipe) {
      changeSlideTo((idx - 1 + featured.length) % featured.length);
    }
  };
  
  const changeSlideTo = (newIdx: number) => {
    setFadeIn(false);
    setTimeout(() => {
      setIdx(newIdx);
      setFadeIn(true);
    }, 300);
  };

  if (!movie) return null;

  const genreNames = movie.genre_ids
    ?.slice(0, 3)
    .map((id) => GENRES.find((g) => g.id === id)?.name)
    .filter(Boolean) as string[];

  return (
    <>
      {trailerKey && (
        <TrailerModal videoKey={trailerKey} onClose={() => setTrailerKey(null)} />
      )}

      <section
        className="relative h-[80svh] md:h-[90vh] min-h-[550px] overflow-hidden cursor-pointer group"
        onClick={() => navigate(`/movie/${movie.id}`)}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Backdrop */}
        <div className="absolute inset-0">
          {movie.backdrop_path ? (
            <img
              key={`${movie.id}-${idx}`}
              src={`${TMDB_IMG}/w1280${movie.backdrop_path}`}
              alt=""
              className={`hidden md:block w-full h-full object-cover object-center transition-opacity duration-500 ease-out ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            />
          ) : (
            <div className="hidden md:block w-full h-full bg-muted" />
          )}
          
          {movie.poster_path ? (
            <img
              key={`${movie.id}-${idx}-mobile`}
              src={`${TMDB_IMG}/w780${movie.poster_path}`}
              alt=""
              className={`md:hidden w-full h-full object-cover object-center transition-opacity duration-500 ease-out ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            />
          ) : movie.backdrop_path ? (
            <img
              key={`${movie.id}-${idx}-fallback`}
              src={`${TMDB_IMG}/w1280${movie.backdrop_path}`}
              alt=""
              className={`md:hidden w-full h-full object-cover object-center transition-opacity duration-500 ease-out ${fadeIn ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}`}
            />
          ) : (
            <div className="md:hidden w-full h-full bg-muted" />
          )}
          
          <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent md:bg-gradient-to-t md:from-black/95 md:via-transparent md:to-black/30" />
        </div>
        
        {/* Content */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-12 md:pb-16">
          <AnimatePresence mode="wait">
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-xl"
            >
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {genreNames?.map((g) => (
                  <span key={g} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-primary text-primary-foreground shadow-sm">
                    {g}
                  </span>
                ))}
                {movie.release_date && (
                  <span className="text-xs font-bold px-3 py-1.5 rounded-lg bg-white/10 text-white backdrop-blur-md border border-white/20 flex items-center gap-1.5">
                    <Calendar className="w-3 h-3" />
                    {movie.release_date.slice(0, 4)}
                  </span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white leading-[1.1] tracking-tight mb-4 drop-shadow-md">
                {movie.title}
              </h1>

              {movie.vote_average > 0 && (
                <div className="flex items-center gap-2 mb-4 bg-black/40 w-fit px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/10">
                  <Star className="w-5 h-5 text-primary fill-primary drop-shadow" />
                  <span className="font-bold text-white text-lg">{movie.vote_average.toFixed(1)}</span>
                  <span className="text-white/60 text-sm font-medium">/ 10</span>
                </div>
              )}

              {movie.overview && (
                <p className="text-white/80 text-sm md:text-base leading-relaxed line-clamp-3 md:line-clamp-4 mb-8 drop-shadow">
                  {movie.overview}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button
                  onClick={(e) => { e.stopPropagation(); handleTrailer(); }}
                  disabled={trailerLoading}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/15 text-white font-bold text-sm md:text-base border border-white/25 hover:bg-white/25 active:scale-95 transition-all backdrop-blur-md disabled:opacity-60 flex-1 sm:flex-none shadow-lg"
                >
                  {trailerLoading ? (
                    <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-5 h-5 fill-white" />
                  )}
                  {t("trailerBtn")}
                </button>
                {!session && (
                  <Link
                    to="/register"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm md:text-base hover:bg-primary/90 active:scale-95 transition-all shadow-lg flex-1 sm:flex-none"
                  >
                    <UserPlus className="w-5 h-5" />
                    {t("signUp")}
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex gap-2 mt-8 md:mt-10">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={(e) => { e.stopPropagation(); changeSlideTo(i); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === idx ? "bg-primary w-8" : "bg-white/30 w-3 hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ─── Genre Browser ─────────────────────────────────────────────────────────────
function GenreSection() {
  const [active, setActive] = useState<number | null>(null);
  const [genreMovies, setGenreMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(false);
  const { t } = useLang();

  const pick = async (id: number) => {
    if (active === id) { setActive(null); setGenreMovies([]); return; }
    setActive(id);
    setLoading(true);
    try {
      const d = await getMoviesByGenre(id);
      setGenreMovies(d.results || []);
    } catch { setGenreMovies([]); }
    finally { setLoading(false); }
  };

  return (
    <section>
      <SectionHeader icon={Clapperboard} label={t("byGenreSection")} />

      <div className="flex flex-wrap gap-2.5 mb-8">
        {GENRE_MAP.map((g) => (
          <button
            key={g.id}
            onClick={() => pick(g.id)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all active:scale-95 ${
              active === g.id
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:bg-muted"
            }`}
          >
            {t(g.tKey)}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center py-12"
          >
            <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          </motion.div>
        ) : genreMovies.length > 0 ? (
          <motion.div
            key="grid"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
          >
            {genreMovies.slice(0, 16).map((m) => (
              <MovieCard key={m.id} movie={m} />
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}

// ─── Guest CTA ─────────────────────────────────────────────────────────────────
function GuestCTA() {
  const { t } = useLang();
  return (
    <div className="rounded-3xl overflow-hidden border border-border relative bg-card shadow-sm group">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10 p-6 md:p-12 flex flex-col lg:flex-row items-start lg:items-center gap-10 lg:gap-16">
        <div className="flex-1 w-full">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-foreground" />
            <span className="text-foreground text-sm font-black uppercase tracking-widest">qaradakor.kz</span>
          </div>
          <h2 className="text-[28px] md:text-5xl font-black mb-4 leading-tight text-foreground tracking-tight">
            {t("ctaTitle")}
          </h2>
          <p className="text-[15px] md:text-lg leading-relaxed mb-8 text-muted-foreground max-w-xl">
            {t("ctaDesc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full lg:max-w-md">
            <Link
              to="/register"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-foreground text-background font-bold text-base hover:opacity-90 active:scale-95 transition-all w-full"
            >
              <UserPlus className="w-5 h-5" />
              {t("createAccount")}
            </Link>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-full font-bold text-base border border-border text-foreground hover:bg-border/20 active:scale-95 transition-all w-full"
            >
              <LogIn className="w-5 h-5" />
              {t("signIn")}
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 w-full lg:w-[480px] shrink-0 mt-4 lg:mt-0">
          {[
            { icon: Star, labelKey: "featureRatings" as const },
            { icon: Sparkles, labelKey: "featureAI" as const },
            { icon: Users2, labelKey: "featureFriends" as const },
            { icon: Bot, labelKey: "featureBot" as const },
          ].map(({ icon: Icon, labelKey }) => (
            <div
              key={labelKey}
              className="flex flex-row items-center gap-2 sm:gap-3 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 border border-border bg-transparent hover:bg-border/20 transition-colors"
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-foreground shrink-0" />
              <span className="text-xs sm:text-sm font-bold text-foreground leading-tight flex-1 min-w-0 break-words">{t(labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Top-10 Numbered List ──────────────────────────────────────────────────────
function Top10Section({ movies }: { movies: Movie[] }) {
  const navigate = useNavigate();
  const { t } = useLang();
  const top = movies.slice(0, 10);
  if (!top.length) return null;

  return (
    <section>
      <SectionHeader icon={Hash} label={t("top10Section")} iconClass="text-primary" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {top.map((m, i) => (
          <FadeIn key={m.id} delay={i * 0.05}>
            <button
              onClick={() => navigate(`/movie/${m.id}`)}
              className="flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 hover:bg-accent/30 transition-all text-left group w-full shadow-sm hover:shadow-md"
            >
              <span className="text-3xl font-black text-foreground w-10 text-center shrink-0 group-hover:text-primary transition-colors">
                {i + 1}
              </span>
              {m.poster_path ? (
                <img
                  src={`${TMDB_IMG}/w92${m.poster_path}`}
                  alt={m.title}
                  className="w-14 h-20 rounded-xl object-cover shrink-0 shadow-sm"
                />
              ) : (
                <div className="w-14 h-20 rounded-xl bg-muted shrink-0 flex items-center justify-center">
                  <Film className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-black text-foreground line-clamp-1 mb-1.5">{m.title}</p>
                <div className="flex items-center gap-3">
                  {m.vote_average > 0 && (
                    <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                      <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                      {m.vote_average.toFixed(1)}
                    </span>
                  )}
                  {m.release_date && (
                    <span className="text-xs font-bold text-muted-foreground bg-background px-2.5 py-1 rounded-md border border-border">
                      {m.release_date.slice(0, 4)}
                    </span>
                  )}
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all shrink-0 mr-2" />
            </button>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─── Random Movie Card ─────────────────────────────────────────────────────────
function RandomMovieCard({ movies }: { movies: Movie[] }) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { t } = useLang();
  const [movie, setMovie] = useState<Movie | null>(null);

  const pickRandom = () => {
    if (!movies.length) return;
    const m = movies[Math.floor(Math.random() * movies.length)];
    setMovie(m);
  };

  useEffect(() => { pickRandom(); }, [movies.length]);

  if (!movie) return null;

  return (
    <section>
      <SectionHeader icon={Shuffle} label={t("randomMovieSection")} iconClass="text-primary" />
      <div className="flex flex-col sm:flex-row gap-5 bg-card border border-border rounded-3xl p-5 md:p-6 shadow-sm">
        {movie.backdrop_path ? (
          <img
            src={`${TMDB_IMG}/w780${movie.backdrop_path}`}
            alt={movie.title}
            className="w-full sm:w-72 aspect-video sm:aspect-auto sm:h-48 rounded-2xl object-cover shrink-0 shadow-sm"
          />
        ) : movie.poster_path ? (
          <img
            src={`${TMDB_IMG}/w342${movie.poster_path}`}
            alt={movie.title}
            className="w-full sm:w-72 aspect-video sm:aspect-auto sm:h-48 rounded-2xl object-cover shrink-0 shadow-sm"
          />
        ) : (
          <div className="w-full sm:w-72 aspect-video sm:aspect-auto sm:h-48 rounded-2xl bg-muted shrink-0 flex items-center justify-center">
            <Film className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        
        <div className="flex-1 flex flex-col justify-between min-w-0 py-1">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-foreground mb-3">{movie.title}</h3>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {movie.vote_average > 0 && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-accent px-3 py-1.5 rounded-lg border border-border">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  {movie.vote_average.toFixed(1)}
                </span>
              )}
              {movie.release_date && (
                <span className="text-xs font-bold text-foreground bg-accent px-3 py-1.5 rounded-lg border border-border">
                  {movie.release_date.slice(0, 4)}
                </span>
              )}
            </div>
            {movie.overview && (
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed mb-4">
                {movie.overview}
              </p>
            )}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => navigate(`/movie/${movie.id}`)}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              <Info className="w-4 h-4" />
              {t("moreInfo")}
            </button>
            <button
              onClick={pickRandom}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-border font-bold text-sm text-foreground hover:bg-accent hover:border-primary/30 transition-all active:scale-95"
            >
              <Shuffle className="w-4 h-4" />
              Roll Again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Platform Stats ────────────────────────────────────────────────────────────
function PlatformStats() {
  const { t } = useLang();
  const stats = [
    { icon: Film, value: "700K+", labelKey: "statsMovies" as const },
    { icon: Star, value: "∞", labelKey: "statsRatings" as const },
    { icon: Users2, value: t("statsFree"), labelKey: "statsFree" as const },
    { icon: Bot, value: "AI", labelKey: "statsAI" as const },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <FadeIn key={s.labelKey} delay={i * 0.1}>
          <div className="bg-card border border-border rounded-3xl p-6 md:p-8 text-center hover:border-primary/50 hover:bg-accent/20 transition-colors group shadow-sm">
            <div className="w-12 h-12 md:w-16 md:h-16 mx-auto bg-primary/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <s.icon className="w-6 h-6 md:w-8 md:h-8 text-primary" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-foreground mb-1">{s.value}</p>
            <p className="text-xs md:text-sm font-bold text-muted-foreground">{t(s.labelKey)}</p>
          </div>
        </FadeIn>
      ))}
    </div>
  );
}

// ─── How It Works (guest) ───────────────────────────────────────────────────────
function HowItWorks() {
  const { t } = useLang();
  const steps = [
    { icon: UserPlus, titleKey: "step1Title" as const, descKey: "step1Desc" as const },
    { icon: Heart, titleKey: "step2Title" as const, descKey: "step2Desc" as const },
    { icon: Sparkles, titleKey: "step3Title" as const, descKey: "step3Desc" as const },
    { icon: Users2, titleKey: "step4Title" as const, descKey: "step4Desc" as const },
  ];

  return (
    <section>
      <SectionHeader icon={Info} label={t("howItWorksSection")} iconClass="text-primary" />
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {steps.map((s, i) => (
          <FadeIn key={s.titleKey} delay={i * 0.1}>
            <div className="bg-card border border-border rounded-3xl p-6 relative group hover:border-primary/40 hover:bg-accent/20 transition-all shadow-sm h-full">
              <span className="absolute top-5 right-5 text-4xl font-black text-foreground group-hover:text-primary transition-colors">
                {i + 1}
              </span>
              <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-5">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-black text-foreground mb-2 pr-6">{t(s.titleKey)}</h3>
              <p className="text-sm font-medium text-muted-foreground leading-relaxed">{t(s.descKey)}</p>
            </div>
          </FadeIn>
        ))}
      </div>
    </section>
  );
}

// ─── Kazakh Cinema Section ─────────────────────────────────────────────────────
function KazakhCinemaSection() {
  const { t, tmdbLang } = useLang();
  const [topRated, setTopRated] = useState<any[]>([]);
  const [newReleases, setNewReleases] = useState<any[]>([]);
  const [goldenAge, setGoldenAge] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getKazakhMoviesTopRated(),
      getKazakhMoviesNew(),
      getKazakhMoviesGoldenAge(),
    ])
      .then(([tr, nr, ga]) => {
        setTopRated(tr.results || []);
        setNewReleases(nr.results || []);
        setGoldenAge(ga.results || []);
      })
      .catch((err) => console.error("Kazakh cinema fetch error:", err))
      .finally(() => setLoading(false));
  }, [tmdbLang]);

  const hasData = topRated.length > 0 || newReleases.length > 0 || goldenAge.length > 0;

  return (
    <div>
      <FadeIn>
        <div className="relative rounded-3xl overflow-hidden mb-10 border border-border shadow-sm group">
          <div className="relative z-10 px-6 py-8 md:p-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight mb-2">{t("kazakhCinemaSection")}</h2>
              <p className="text-sm md:text-base font-medium text-muted-foreground">{t("kazakhGoldenAgeDesc")}</p>
            </div>
          </div>
        </div>
      </FadeIn>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : !hasData ? (
        <div className="text-center py-12 text-muted-foreground text-sm font-bold bg-card border border-border rounded-2xl">{t("kazakhCinemaEmpty")}</div>
      ) : (
        <div className="space-y-12">
          {topRated.length > 0 && (
            <FadeIn>
              <MovieRow label={t("kazakhBestSection")} icon={Trophy} iconClass="text-primary" movies={topRated.slice(0, 20)} />
            </FadeIn>
          )}
          {newReleases.length > 0 && (
            <FadeIn>
              <MovieRow label={t("kazakhNewSection")} icon={Zap} iconClass="text-primary" movies={newReleases.slice(0, 20)} />
            </FadeIn>
          )}
          {goldenAge.length > 0 && (
            <FadeIn>
              <MovieRow label={t("kazakhGoldenAgeSection")} icon={Award} iconClass="text-primary" movies={goldenAge.slice(0, 20)} />
            </FadeIn>
          )}
        </div>
      )}
    </div>
  );
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export function HomePage() {
  const { session } = useAuth();
  const { t, tmdbLang, lang } = useLang();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [tvTrending, setTvTrending] = useState<any[]>([]);
  const [tvPopular, setTvPopular] = useState<any[]>([]);
  const [tvTopRated, setTvTopRated] = useState<any[]>([]);
  const [tvAiring, setTvAiring] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getTrending(), getPopular(), getTopRated(), getUpcoming(), getNowPlaying(),
      getTrendingTV(), getPopularTV(), getTopRatedTV(), getAiringToday(),
    ])
      .then(([tr, p, tR, u, np, tvTr, tvP, tvTR, tvAir]) => {
        setTrending(tr.results || []);
        setPopular(p.results || []);
        setTopRated(tR.results || []);
        setUpcoming(u.results || []);
        setNowPlaying(np.results || []);
        setTvTrending(tvTr.results || []);
        setTvPopular(tvP.results || []);
        setTvTopRated(tvTR.results || []);
        setTvAiring(tvAir.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tmdbLang]);
  
  // SEO структурированные данные
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      generateOrganizationStructuredData(),
      generateWebSiteStructuredData()
    ]
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <p className="text-muted-foreground font-bold text-sm animate-pulse">{t("loadingCatalog")}</p>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={lang === "ru" ? "Qaradakor.kz — Персональная библиотека фильмов | Кино қазақша" : 
               lang === "kk" ? "Qaradakor.kz — Жеке кино кітапханасы" : 
               "Qaradakor.kz — Your Personal Movie Library"}
        description={lang === "ru" ? "Откройте для себя мир кино с qaradakor.kz — современной платформой для поиска, изучения и отслеживания фильмов и сериалов с AI-рекомендациями на казахском, русском и английском языках. Создавайте списки, оценивайте фильмы, делитесь с друзьями." :
                     lang === "kk" ? "Qaradakor.kz арқылы кино әлеміне саяхат жасаңыз — фильмдер мен сериалдарды іздеуге, зерттеуге және бақылауға арналған заманауи платформа қазақ, орыс және ағылшын тілдерінде AI ұсыныстарымен." :
                     "Discover the world of cinema with qaradakor.kz — a modern platform for searching, exploring, and tracking movies and TV shows with AI recommendations in Kazakh, Russian, and English."}
        keywords={["кино", "фильмы", "сериалы", "библиотека фильмов", "казахстан", "рекомендации фильмов", "qaradakor", "қарадакор", "кино қазақша", "AI рекомендации", "TMDB", "трекинг фильмов", "рецензии фильмов"]}
        structuredData={structuredData}
      />
      <div className="pb-20">
        <HeroSection movies={trending} />
        <HomeSearchBlock />

        <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12 md:mt-16 space-y-16 md:space-y-20 overflow-x-hidden">
          
          <FadeIn>
            <MovieRow label={t("trendingSection")} icon={Zap} iconClass="text-primary" movies={trending.slice(0, 20)} />
          </FadeIn>
          
          <FadeIn>
            <MovieRow label={t("nowPlayingSection")} icon={Flame} iconClass="text-foreground" movies={nowPlaying.slice(0, 20)} />
          </FadeIn>

          <FadeIn>
            <TopReviewsSection />
          </FadeIn>

          <FadeIn>
            <MovieRow label={t("popularSection")} icon={TrendingUp} iconClass="text-muted-foreground" movies={popular.slice(0, 20)} />
          </FadeIn>

          {!session && (
            <FadeIn>
              <GuestCTA />
            </FadeIn>
          )}

          <FadeIn>
            <PlatformStats />
          </FadeIn>

          <FadeIn>
            <MovieRow label={t("topRatedSection")} icon={Award} iconClass="text-primary" movies={topRated.slice(0, 20)} />
          </FadeIn>

          <Top10Section movies={topRated} />

          <FadeIn>
            <RandomMovieCard movies={[...popular, ...topRated, ...trending]} />
          </FadeIn>

          <FadeIn>
            <MovieRow label={t("upcomingSection")} icon={Clock} iconClass="text-muted-foreground" movies={upcoming.slice(0, 20)} />
          </FadeIn>

          <FadeIn>
            <GenreSection />
          </FadeIn>

          {/* ── TV Shows Section ── */}
          <FadeIn>
            <div>
              <div className="flex items-center gap-3 mb-8 pb-4 border-b border-border">
                <div className="w-1 h-6 rounded-full bg-primary" />
                <Tv className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-black text-foreground tracking-tight">{t("tvShowsSection")}</h2>
              </div>
              <div className="space-y-12">
                <FadeIn>
                  <MovieRow label={t("trendingTVSection")} icon={Zap} iconClass="text-primary" movies={tvTrending.slice(0, 20)} mediaType="tv" />
                </FadeIn>
                <FadeIn>
                  <MovieRow label={t("airingTodaySection")} icon={Flame} iconClass="text-foreground" movies={tvAiring.slice(0, 20)} mediaType="tv" />
                </FadeIn>
                <FadeIn>
                  <MovieRow label={t("popularTVSection")} icon={TrendingUp} iconClass="text-muted-foreground" movies={tvPopular.slice(0, 20)} mediaType="tv" />
                </FadeIn>
                <FadeIn>
                  <MovieRow label={t("topRatedTVSection")} icon={Award} iconClass="text-primary" movies={tvTopRated.slice(0, 20)} mediaType="tv" />
                </FadeIn>
              </div>
            </div>
          </FadeIn>

          {/* ── Kazakh Cinema Section ── */}
          <KazakhCinemaSection />

          {/* How it works (guest) */}
          {!session && <HowItWorks />}

          {/* Bottom CTA */}
          {!session && (
            <FadeIn>
              <div className="flex flex-col sm:flex-row items-center gap-5 bg-card border-2 border-border rounded-3xl p-6 md:p-8 shadow-sm group hover:border-primary/30 transition-colors">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="font-black text-foreground text-lg md:text-xl mb-1">{t("ctaTitle")}</p>
                  <p className="text-muted-foreground text-sm font-medium">
                    {t("ctaDesc")}
                  </p>
                </div>
                <Link
                  to="/register"
                  className="flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-primary text-primary-foreground font-black text-sm hover:bg-primary/90 transition-all shadow-md w-full sm:w-auto active:scale-95"
                >
                  <UserPlus className="w-5 h-5" />
                  {t("createAccount")}
                </Link>
              </div>
            </FadeIn>
          )}
        </div>
      </div>
    </>
  );
}