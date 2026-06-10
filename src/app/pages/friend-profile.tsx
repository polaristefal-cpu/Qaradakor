import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  getFriendProfile,
  getFriendWatched,
  getMovie,
  searchMovies,
  sendRecommendation,
  getFriendAvatarUrl,
  TMDB_IMG,
} from "../lib/api";
import {
  ArrowLeft, Loader2, Film, Star, Send, Search, X,
  BookOpen, Clock, ChevronDown, MessageSquare, User,
} from "lucide-react";
import { toast } from "sonner";
import { useLang } from "../lib/lang-context";
import { BackButton } from "../components/back-button";

// ── Avatar: shows real photo or initials fallback ──────────────────────────────
function Avatar({
  name,
  avatarUrl,
  size = "lg",
}: {
  name: string;
  avatarUrl?: string | null;
  size?: "sm" | "lg";
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const base =
    size === "lg"
      ? "w-20 h-20 text-2xl rounded-2xl"
      : "w-10 h-10 text-sm rounded-xl";

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`${base} object-cover border-2 border-primary/30 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${base} bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center font-black text-primary shrink-0`}
    >
      {initials || <User className="w-6 h-6" />}
    </div>
  );
}

// ── Send Recommendation Modal ──────────────────────────────────────────────────
function RecommendModal({
  friendId,
  friendName,
  onClose,
}: {
  friendId: string;
  friendName: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<any>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearch = (val: string) => {
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const data = await searchMovies(val);
        setResults((data.results || []).slice(0, 6));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
  };

  const handleSend = async () => {
    if (!selected) return;
    setSending(true);
    try {
      await sendRecommendation(friendId, selected.id, note.trim() || undefined);
      toast.success(`Рекомендация «${selected.title}» отправлена ${friendName}!`);
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Ошибка при отправке");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="font-bold text-foreground">Отправить рекомендацию</h2>
            <p className="text-muted-foreground text-xs mt-0.5">для {friendName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Search */}
          {!selected ? (
            <div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  autoFocus
                  type="text"
                  value={query}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Найти фильм..."
                  className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
                />
                {searching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary animate-spin" />
                )}
              </div>

              {results.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
                  {results.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setSelected(m)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-accent border border-transparent hover:border-border transition-all text-left"
                    >
                      {m.poster_path ? (
                        <img
                          src={`${TMDB_IMG}/w92${m.poster_path}`}
                          alt={m.title}
                          className="w-9 h-[54px] object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-[54px] bg-muted rounded-lg flex items-center justify-center shrink-0">
                          <Film className="w-4 h-4 text-muted-foreground/30" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-foreground text-sm font-semibold line-clamp-1">{m.title}</p>
                        <p className="text-muted-foreground text-xs">
                          {m.release_date?.slice(0, 4)}
                          {m.vote_average > 0 && ` · ★ ${m.vote_average.toFixed(1)}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {query.trim() && !searching && results.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">Ничего не найдено</p>
              )}
            </div>
          ) : (
            /* Selected movie */
            <div>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-xl border border-border mb-3">
                {selected.poster_path ? (
                  <img
                    src={`${TMDB_IMG}/w92${selected.poster_path}`}
                    alt={selected.title}
                    className="w-10 h-[60px] object-cover rounded-lg shrink-0"
                  />
                ) : (
                  <div className="w-10 h-[60px] bg-accent rounded-lg flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-semibold text-sm line-clamp-1">{selected.title}</p>
                  <p className="text-muted-foreground text-xs">{selected.release_date?.slice(0, 4)}</p>
                </div>
                <button
                  onClick={() => { setSelected(null); setQuery(""); setResults([]); }}
                  className="text-muted-foreground hover:text-foreground transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  Сообщение (необязательно)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Напишите почему советуете этот фильм..."
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none h-20 placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground hover:border-primary/30 transition"
            >
              Отмена
            </button>
            <button
              onClick={handleSend}
              disabled={!selected || sending}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition shadow-sm"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Watched movie row ──────────────────────────────────────────────────────────
function WatchedMovieCard({ entry, onMovieClick }: { entry: any; onMovieClick: (id: number) => void }) {
  const [showReview, setShowReview] = useState(false);
  const hasReview = !!entry._review?.trim();

  return (
    <>
      <div
        onClick={() => onMovieClick(entry._movieId || entry.id)}
        className="group cursor-pointer relative rounded-xl overflow-hidden bg-card border border-border shadow-sm transition-all duration-300 hover:scale-[1.04] hover:shadow-lg hover:border-primary/40"
      >
        {/* Poster */}
        {entry.poster_path ? (
          <img
            src={`${TMDB_IMG}/w342${entry.poster_path}`}
            alt={entry.title}
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

        {/* Title + year at bottom on hover */}
        <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
          <p className="text-white text-[11px] font-semibold line-clamp-2 leading-tight">{entry.title}</p>
          {entry.release_date && (
            <p className="text-white/55 text-[9px] mt-0.5">{entry.release_date.slice(0, 4)}</p>
          )}
        </div>

        {/* User rating badge — top left */}
        {entry._rating > 0 && (
          <div className="absolute top-1.5 left-1.5 bg-primary/95 backdrop-blur-sm rounded-md px-1.5 py-0.5 flex items-center gap-1 shadow-md">
            <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
            <span className="text-primary-foreground text-[10px] font-bold">{entry._rating}</span>
          </div>
        )}

        {/* Review indicator — top right */}
        {hasReview && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowReview(true); }}
            className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/70 backdrop-blur-sm flex items-center justify-center shadow-md hover:bg-primary transition-all"
            title="Есть рецензия"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </button>
        )}
      </div>

      {/* Review modal */}
      {showReview && hasReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setShowReview(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md"
          >
            <div className="flex items-start gap-3 p-5 border-b border-border">
              {entry.poster_path && (
                <img
                  src={`${TMDB_IMG}/w92${entry.poster_path}`}
                  alt={entry.title}
                  className="w-12 h-[72px] object-cover rounded-lg shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground text-sm line-clamp-2">{entry.title}</h3>
                <p className="text-muted-foreground text-xs mt-0.5">
                  {entry.release_date?.slice(0, 4)}
                  {entry._rating > 0 && (
                    <span className="ml-2 inline-flex items-center gap-0.5">
                      <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                      {entry._rating}
                    </span>
                  )}
                </p>
              </div>
              <button
                onClick={() => setShowReview(false)}
                className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5">
              <p className="text-foreground text-sm leading-relaxed italic">«{entry._review}»</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Friend basic info — passed via navigation state from friends list
  const friendFromState = location.state as { name?: string; email?: string } | null;
  const [friendName, setFriendName] = useState(friendFromState?.name || "Друг");
  const [friendEmail, setFriendEmail] = useState(friendFromState?.email || "");
  const [friendAvatarUrl, setFriendAvatarUrl] = useState<string | null>(null);

  const [watched, setWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecommend, setShowRecommend] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "recent">("recent");
  const [filterRating, setFilterRating] = useState(0);

  // Load friend profile (name, bio) and avatar in parallel
  useEffect(() => {
    if (!id) return;
    getFriendProfile(id)
      .then((p: any) => {
        if (p.name) setFriendName(p.name);
        if (p.email) setFriendEmail(p.email);
      })
      .catch(() => {});

    getFriendAvatarUrl(id)
      .then((url) => setFriendAvatarUrl(url))
      .catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getFriendWatched(id)
      .then(async (entries) => {
        if (!entries?.length) { setWatched([]); return; }
        const details = await Promise.all(
          entries.map(async (e: any) => {
            try {
              const m = await getMovie(e.movieId);
              return { ...m, _rating: e.rating, _review: e.review || "", _movieId: e.movieId, _addedAt: e.addedAt };
            } catch {
              return null;
            }
          })
        );
        setWatched(details.filter(Boolean));
      })
      .catch(() => setWatched([]))
      .finally(() => setLoading(false));
  }, [id]);

  // Stats
  const avgRating =
    watched.length > 0
      ? (watched.reduce((s, m) => s + (m._rating || 0), 0) / watched.length).toFixed(1)
      : "—";
  const withReview = watched.filter((m) => m._review?.trim()).length;

  // Top 5 highest rated movies
  const topFive = watched
    .filter((m) => m._rating > 0)
    .sort((a, b) => b._rating - a._rating)
    .slice(0, 5);

  // Sorted + filtered
  const displayed = watched
    .filter((m) => filterRating === 0 || m._rating >= filterRating)
    .sort((a, b) =>
      sortBy === "rating"
        ? (b._rating || 0) - (a._rating || 0)
        : new Date(b._addedAt || 0).getTime() - new Date(a._addedAt || 0).getTime()
    );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <BackButton fallbackPath="/friends" />

      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* ── Top row: avatar / info / button ── */}
        <div className="flex items-start gap-4 p-6">
          <Avatar name={friendName} avatarUrl={friendAvatarUrl} size="lg" />

          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-foreground">{friendName}</h1>
            {friendEmail && (
              <p className="text-muted-foreground text-sm mt-0.5">{friendEmail}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-2 mt-3">
              <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground text-xs font-semibold">{watched.length}</span>
                <span className="text-muted-foreground text-xs">просмотрено</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl">
                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                <span className="text-foreground text-xs font-semibold">{avgRating}</span>
                <span className="text-muted-foreground text-xs">средняя оценка</span>
              </div>
              {withReview > 0 && (
                <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-xl">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" />
                  <span className="text-foreground text-xs font-semibold">{withReview}</span>
                  <span className="text-muted-foreground text-xs">рецензий</span>
                </div>
              )}
            </div>
          </div>

          {/* Recommend button */}
          <button
            onClick={() => setShowRecommend(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Рекомендовать</span>
          </button>
        </div>

        {/* ── Top-5 showcase ── */}
        {!loading && topFive.length > 0 && (
          <div className="border-t border-border">
            {/* Label */}
            <div className="px-6 pt-4 pb-3 flex items-center gap-2">
              <Star className="w-3.5 h-3.5 text-primary fill-primary" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Топ-5 фильмов
              </span>
            </div>

            {/* Posters grid — desktop: 5 equal columns, mobile: horizontal scroll */}
            <div className="px-4 pb-4">
              {/* Desktop */}
              <div className="hidden sm:grid grid-cols-5 gap-3">
                {topFive.map((movie, idx) => (
                  <button
                    key={movie.id}
                    onClick={() => navigate(`/movie/${movie._movieId || movie.id}`)}
                    className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/60 hover:scale-[1.03] transition-all duration-200 shadow-md"
                  >
                    {movie.poster_path ? (
                      <img
                        src={`${TMDB_IMG}/w342${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                        <Film className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                    {/* Rank badge top-left */}
                    <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-[10px] font-black">#{idx + 1}</span>
                    </div>
                    {/* Rating badge bottom */}
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center">
                      <div className="flex items-center gap-1 bg-primary/95 backdrop-blur-sm rounded-lg px-2.5 py-1 shadow-lg">
                        <Star className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                        <span className="text-primary-foreground text-xs font-bold">{movie._rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Mobile: horizontal scroll */}
              <div className="sm:hidden flex gap-3 overflow-x-auto pb-1 -mx-1 px-1" style={{ scrollbarWidth: 'none' }}>
                {topFive.map((movie, idx) => (
                  <button
                    key={movie.id}
                    onClick={() => navigate(`/movie/${movie._movieId || movie.id}`)}
                    className="group relative rounded-xl overflow-hidden border border-border hover:border-primary/60 transition-all duration-200 shadow-md shrink-0"
                    style={{ width: '100px' }}
                  >
                    {movie.poster_path ? (
                      <img
                        src={`${TMDB_IMG}/w185${movie.poster_path}`}
                        alt={movie.title}
                        className="w-full aspect-[2/3] object-cover"
                      />
                    ) : (
                      <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                        <Film className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <span className="text-white text-[9px] font-black">#{idx + 1}</span>
                    </div>
                    <div className="absolute bottom-1.5 left-0 right-0 flex justify-center">
                      <div className="flex items-center gap-0.5 bg-primary/95 backdrop-blur-sm rounded-md px-2 py-0.5 shadow-lg">
                        <Star className="w-2.5 h-2.5 text-primary-foreground fill-primary-foreground" />
                        <span className="text-primary-foreground text-[10px] font-bold">{movie._rating}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Watch history */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4.5 h-4.5 text-primary" />
            История просмотра
            {!loading && (
              <span className="text-muted-foreground text-sm font-normal">({watched.length})</span>
            )}
          </h2>

          {watched.length > 0 && (
            <div className="flex items-center gap-2">
              {/* Filter by min rating */}
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(Number(e.target.value))}
                className="bg-muted border border-border rounded-xl px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition"
              >
                <option value={0}>Все оценки</option>
                {[5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>от {n}★</option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex rounded-xl border border-border overflow-hidden text-xs">
                <button
                  onClick={() => setSortBy("recent")}
                  className={`px-3 py-1.5 transition ${sortBy === "recent" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  Новые
                </button>
                <button
                  onClick={() => setSortBy("rating")}
                  className={`px-3 py-1.5 transition ${sortBy === "rating" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"}`}
                >
                  По оценке
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-14 bg-card border border-border rounded-2xl">
            <Film className="w-12 h-12 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-foreground font-semibold text-sm">
              {watched.length === 0 ? "Библиотека пуста" : "Нет фильмов по фильтру"}
            </p>
            <p className="text-muted-foreground text-xs mt-1">
              {watched.length === 0 ? `${friendName} ещё ничего не смотрел(а)` : "Попробуйте другие параметры"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {displayed.map((entry) => (
              <WatchedMovieCard
                key={entry.id}
                entry={entry}
                onMovieClick={(movieId) => navigate(`/movie/${movieId}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recommend modal */}
      {showRecommend && id && (
        <RecommendModal
          friendId={id}
          friendName={friendName}
          onClose={() => setShowRecommend(false)}
        />
      )}
    </div>
  );
}