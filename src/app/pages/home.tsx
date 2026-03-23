import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import {
  getTrending,
  getPopular,
  getTopRated,
  getUpcoming,
  getNowPlaying,
  getMoviesByGenre,
  getMovieVideos,
  TMDB_IMG,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
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
} from "lucide-react";

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

// Genre map
const GENRES = [
  { id: 28,    name: "Боевик" },
  { id: 12,    name: "Приключения" },
  { id: 16,    name: "Анимация" },
  { id: 35,    name: "Комедия" },
  { id: 80,    name: "Криминал" },
  { id: 18,    name: "Драма" },
  { id: 14,    name: "Фэнтези" },
  { id: 27,    name: "Ужасы" },
  { id: 10749, name: "Мелодрама" },
  { id: 878,   name: "Фантастика" },
  { id: 53,    name: "Триллер" },
  { id: 10752, name: "Война" },
];

// ─── Poster Card ──────────────────────────────────────────────────────────────
function PosterCard({ movie }: { movie: Movie }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={() => navigate(`/movie/${movie.id}`)}
      className="group cursor-pointer shrink-0 w-32 sm:w-36"
    >
      <div className="relative rounded-xl overflow-hidden bg-muted border border-border shadow-sm transition-all duration-300 group-hover:scale-[1.04] group-hover:shadow-xl group-hover:border-primary/40">
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-0 left-0 right-0 p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white text-[11px] font-semibold line-clamp-2 leading-snug">{movie.title}</p>
          {movie.release_date && (
            <p className="text-white/50 text-[10px] mt-0.5">{movie.release_date.slice(0, 4)}</p>
          )}
        </div>
        {/* Rating */}
        {movie.vote_average > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-black/65 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1">
            <Star className="w-2.5 h-2.5 text-primary fill-primary" />
            <span className="text-white text-[10px] font-bold">{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
      <p className="mt-1.5 text-xs font-medium text-foreground line-clamp-1 px-0.5">{movie.title}</p>
      {movie.release_date && (
        <p className="text-[10px] text-muted-foreground px-0.5">{movie.release_date.slice(0, 4)}</p>
      )}
    </div>
  );
}

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
    <div className="flex items-center gap-2.5 mb-5">
      <div className={`w-0.5 h-5 rounded-full bg-primary`} />
      <Icon className={`w-4.5 h-4.5 ${iconClass}`} />
      <h2 className="text-lg font-bold text-foreground tracking-tight">{label}</h2>
    </div>
  );
}

// ─── Carousel Row ──────────────────────────────────────────────────────────────
function MovieRow({
  label,
  icon,
  iconClass,
  movies,
}: {
  label: string;
  icon: React.ElementType;
  iconClass?: string;
  movies: Movie[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -340 : 340, behavior: "smooth" });
  };

  if (!movies.length) return null;

  return (
    <section>
      <SectionHeader icon={icon} label={label} iconClass={iconClass} />
      <div className="relative group/row">
        {/* Fade edges */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-2 w-8 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-background to-transparent z-10" />

        {/* Scroll arrows */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/3 z-20 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 opacity-0 group-hover/row:opacity-100 -translate-x-3 group-hover/row:translate-x-0 transition-all duration-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/3 z-20 w-8 h-8 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/50 opacity-0 group-hover/row:opacity-100 translate-x-3 group-hover/row:translate-x-0 transition-all duration-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-1 scrollbar-hide"
        >
          {movies.map((m) => (
            <PosterCard key={m.id} movie={m} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Trailer Modal ──────────────────────────────────────────────────────────────
function TrailerModal({ videoKey, onClose }: { videoKey: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl border border-border"
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
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Hero Slider ──────────────────────────────────────────────────────────────
function HeroSection({ movies }: { movies: Movie[] }) {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [idx, setIdx] = useState(0);
  const [trailerKey, setTrailerKey] = useState<string | null>(null);
  const [trailerLoading, setTrailerLoading] = useState(false);
  const featured = movies.slice(0, 6);
  const movie = featured[idx];

  useEffect(() => {
    if (featured.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % featured.length), 7000);
    return () => clearInterval(t);
  }, [featured.length]);

  const handleTrailer = async () => {
    if (!movie) return;
    setTrailerLoading(true);
    try {
      const data = await getMovieVideos(movie.id);
      const videos = data.results || [];
      // Prefer official YouTube trailer
      const trailer =
        videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube" && v.official) ||
        videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube") ||
        videos.find((v: any) => v.site === "YouTube");
      if (trailer) setTrailerKey(trailer.key);
      else alert("Трейлер не найден");
    } catch {
      alert("Не удалось загрузить трейлер");
    } finally {
      setTrailerLoading(false);
    }
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

      <section className="relative h-[58vh] min-h-[440px] max-h-[640px] overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0">
          {movie.backdrop_path ? (
            <img
              key={movie.id}
              src={`${TMDB_IMG}/w1280${movie.backdrop_path}`}
              alt=""
              className="w-full h-full object-cover object-center"
            />
          ) : (
            <div className="w-full h-full bg-muted" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-black/20" />
        </div>

        {/* Content */}
        <div className="relative z-10 h-full max-w-7xl mx-auto px-4 flex flex-col justify-end pb-10">
          <div className="max-w-lg">
            {/* Genres + year */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {genreNames?.map((g) => (
                <span key={g} className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-primary/15 text-primary border border-primary/25">
                  {g}
                </span>
              ))}
              {movie.release_date && (
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-md bg-foreground/8 text-muted-foreground border border-border flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {movie.release_date.slice(0, 4)}
                </span>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-[2.6rem] font-black text-foreground leading-[1.15] tracking-tight mb-3">
              {movie.title}
            </h1>

            {/* Rating */}
            {movie.vote_average > 0 && (
              <div className="flex items-center gap-1.5 mb-3">
                <Star className="w-4.5 h-4.5 text-primary fill-primary" />
                <span className="font-bold text-foreground">{movie.vote_average.toFixed(1)}</span>
                <span className="text-muted-foreground text-sm">/ 10</span>
              </div>
            )}

            {/* Overview */}
            {movie.overview && (
              <p className="text-muted-foreground text-sm leading-relaxed line-clamp-3 mb-5">
                {movie.overview}
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap gap-2.5">
              <button
                onClick={() => navigate(`/movie/${movie.id}`)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
              >
                <Info className="w-4 h-4" />
                Подробнее
              </button>
              <button
                onClick={handleTrailer}
                disabled={trailerLoading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-foreground/10 text-foreground font-semibold text-sm border border-foreground/20 hover:bg-foreground/15 transition-all backdrop-blur-sm disabled:opacity-60"
              >
                {trailerLoading ? (
                  <div className="w-4 h-4 border-2 border-foreground/40 border-t-foreground rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-foreground" />
                )}
                Трейлер
              </button>
              {!session && (
                <Link
                  to="/register"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-card text-foreground font-semibold text-sm border border-border hover:border-primary/50 hover:bg-muted transition-all shadow-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  Регистрация
                </Link>
              )}
            </div>
          </div>

          {/* Dots */}
          <div className="flex gap-1.5 mt-5">
            {featured.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i === idx ? "bg-primary w-7" : "bg-foreground/20 w-3 hover:bg-foreground/40"
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
      <SectionHeader icon={Clapperboard} label="По жанру" />

      {/* Genre pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => pick(g.id)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium border transition-all ${
              active === g.id
                ? "bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20"
                : "bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:bg-muted"
            }`}
          >
            {g.name}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-10">
          <div className="w-7 h-7 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && genreMovies.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
          {genreMovies.slice(0, 16).map((m) => (
            <PosterCard key={m.id} movie={m} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Guest CTA ─────────────────────────────────────────────────────────────────
function GuestCTA() {
  return (
    <div className="rounded-2xl overflow-hidden border border-border relative">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-secondary/70" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,165,116,0.15)_0%,_transparent_60%)]" />

      <div className="relative z-10 p-7 md:p-10 flex flex-col md:flex-row items-start md:items-center gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-primary text-xs font-bold uppercase tracking-widest">qaradakor.kz</span>
          </div>
          <h2 className="text-secondary-foreground text-xl md:text-2xl font-black mb-2 leading-tight">
            Ваша персональная кинобиблиотека
          </h2>
          <p className="text-secondary-foreground/70 text-sm leading-relaxed mb-5">
            Отслеживайте просмотренные фильмы, ставьте оценки,
            получайте AI-рекомендации и делитесь коллекцией с друзьями.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Link
              to="/register"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-all shadow-md"
            >
              <UserPlus className="w-4 h-4" />
              Создать аккаунт
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 text-white font-medium text-sm border border-white/20 hover:bg-white/20 transition-all"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-2.5 shrink-0">
          {[
            { icon: Star, label: "Система оценок" },
            { icon: Sparkles, label: "AI-рекомендации" },
            { icon: Users2, label: "Друзья" },
            { icon: Bot, label: "AI-чатбот" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 bg-white/8 rounded-xl px-3 py-2 border border-white/10">
              <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-white/80 text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── HomePage ─────────────────────────────────────────────────────────────────
export function HomePage() {
  const { session } = useAuth();
  const [trending, setTrending] = useState<Movie[]>([]);
  const [popular, setPopular] = useState<Movie[]>([]);
  const [topRated, setTopRated] = useState<Movie[]>([]);
  const [upcoming, setUpcoming] = useState<Movie[]>([]);
  const [nowPlaying, setNowPlaying] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getTrending(), getPopular(), getTopRated(), getUpcoming(), getNowPlaying()])
      .then(([t, p, tr, u, np]) => {
        setTrending(t.results || []);
        setPopular(p.results || []);
        setTopRated(tr.results || []);
        setUpcoming(u.results || []);
        setNowPlaying(np.results || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-3">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground text-sm">Загружаем каталог...</p>
      </div>
    );
  }

  return (
    <div className="pb-16">
      {/* Hero */}
      <HeroSection movies={trending} />

      <div className="max-w-7xl mx-auto px-4 mt-10 space-y-12">
        <MovieRow label="В тренде на этой неделе" icon={Zap} iconClass="text-primary" movies={trending.slice(0, 20)} />
        <MovieRow label="Сейчас в кино" icon={Flame} iconClass="text-destructive" movies={nowPlaying.slice(0, 20)} />
        <MovieRow label="Популярное" icon={TrendingUp} iconClass="text-secondary" movies={popular.slice(0, 20)} />

        {/* Guest CTA midway */}
        {!session && <GuestCTA />}

        <MovieRow label="Высокий рейтинг" icon={Award} iconClass="text-primary" movies={topRated.slice(0, 20)} />
        <MovieRow label="Скоро в кино" icon={Clock} iconClass="text-secondary" movies={upcoming.slice(0, 20)} />

        {/* Genre browser */}
        <GenreSection />

        {/* Bottom CTA */}
        {!session && (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5.5 h-5.5 text-primary" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p className="font-semibold text-foreground text-sm">Хотите AI-рекомендации?</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Войдите, чтобы получить персональный подбор фильмов на основе ваших вкусов
              </p>
            </div>
            <Link
              to="/login"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
            >
              <LogIn className="w-4 h-4" />
              Войти
            </Link>
          </div>
        )}

        {/* TMDB credit */}
        <p className="text-center text-muted-foreground/50 text-xs">
          Данные предоставлены{" "}
          <a href="https://www.themoviedb.org" target="_blank" rel="noopener noreferrer" className="hover:text-primary underline transition-colors">
            The Movie Database (TMDB)
          </a>
        </p>
      </div>
    </div>
  );
}