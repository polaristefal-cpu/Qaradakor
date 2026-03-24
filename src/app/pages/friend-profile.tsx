import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router";
import {
  getFriendWatched, getMovie, searchMovies, sendRecommendation,
  TMDB_IMG,
} from "../lib/api";
import {
  ArrowLeft, Loader2, Film, Star, Send, Search, X,
  BookOpen, Clock, Award, ChevronDown, MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate as useNav } from "react-router";

// ── Avatar initials ────────────────────────────────────────────────────────────
function Avatar({ name, size = "lg" }: { name: string; size?: "sm" | "lg" }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  const base =
    size === "lg"
      ? "w-20 h-20 text-2xl rounded-2xl"
      : "w-10 h-10 text-sm rounded-xl";
  return (
    <div
      className={`${base} bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/30 flex items-center justify-center font-black text-primary shrink-0`}
    >
      {initials || "?"}
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
function WatchedRow({ entry, onMovieClick }: { entry: any; onMovieClick: (id: number) => void }) {
  const [expanded, setExpanded] = useState(false);
  const hasReview = !!entry._review?.trim();

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all">
      <div className="flex items-center gap-3 p-3">
        {/* Poster */}
        <button onClick={() => onMovieClick(entry._movieId || entry.id)} className="shrink-0">
          {entry.poster_path ? (
            <img
              src={`${TMDB_IMG}/w92${entry.poster_path}`}
              alt={entry.title}
              className="w-10 h-[60px] object-cover rounded-lg hover:opacity-80 transition"
            />
          ) : (
            <div className="w-10 h-[60px] bg-muted rounded-lg flex items-center justify-center">
              <Film className="w-4 h-4 text-muted-foreground/30" />
            </div>
          )}
        </button>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <button
            onClick={() => onMovieClick(entry._movieId || entry.id)}
            className="text-foreground font-semibold text-sm text-left hover:text-primary transition line-clamp-1"
          >
            {entry.title}
          </button>
          <p className="text-muted-foreground text-xs">
            {entry.release_date?.slice(0, 4)}
            {entry.genres?.length > 0 && ` · ${entry.genres.slice(0, 2).map((g: any) => g.name).join(", ")}`}
          </p>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 shrink-0">
          {entry._rating > 0 && (
            <span className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/25 px-2 py-0.5 rounded-lg text-xs font-bold">
              <Star className="w-3 h-3 fill-primary" />
              {entry._rating}
            </span>
          )}
          {hasReview && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-accent border border-border flex items-center justify-center text-muted-foreground transition"
            >
              {expanded ? <ChevronDown className="w-3.5 h-3.5 rotate-180" /> : <MessageSquare className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Review */}
      {expanded && hasReview && (
        <div className="border-t border-border px-3 py-2.5 bg-muted/40">
          <p className="text-foreground/80 text-xs leading-relaxed italic">«{entry._review}»</p>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function FriendProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Friend basic info — passed via navigation state from friends list
  const friendFromState = location.state as { name?: string; email?: string } | null;
  const [friendName, setFriendName] = useState(friendFromState?.name || "Друг");
  const [friendEmail] = useState(friendFromState?.email || "");

  const [watched, setWatched] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRecommend, setShowRecommend] = useState(false);
  const [sortBy, setSortBy] = useState<"rating" | "recent">("recent");
  const [filterRating, setFilterRating] = useState(0);

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

  // Sorted + filtered
  const displayed = watched
    .filter((m) => filterRating === 0 || m._rating >= filterRating)
    .sort((a, b) =>
      sortBy === "rating"
        ? (b._rating || 0) - (a._rating || 0)
        : new Date(b._addedAt || 0).getTime() - new Date(a._addedAt || 0).getTime()
    );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/friends")}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Назад к друзьям
      </button>

      {/* Profile header */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <Avatar name={friendName} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-foreground">{friendName}</h1>
            {friendEmail && (
              <p className="text-muted-foreground text-sm mt-0.5">{friendEmail}</p>
            )}

            {/* Stats */}
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-lg">
                <BookOpen className="w-3.5 h-3.5 text-primary" />
                <span className="text-foreground text-xs font-semibold">{watched.length}</span>
                <span className="text-muted-foreground text-xs">просмотрено</span>
              </div>
              <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-lg">
                <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                <span className="text-foreground text-xs font-semibold">{avgRating}</span>
                <span className="text-muted-foreground text-xs">средняя оценка</span>
              </div>
              {withReview > 0 && (
                <div className="flex items-center gap-1.5 bg-muted border border-border px-3 py-1.5 rounded-lg">
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
      </div>

      {/* Watch history */}
      <div>
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h2 className="font-bold text-foreground flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
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
                className="bg-muted border border-border rounded-lg px-2.5 py-1.5 text-xs text-foreground focus:outline-none focus:border-primary transition"
              >
                <option value={0}>Все оценки</option>
                {[5, 6, 7, 8, 9].map((n) => (
                  <option key={n} value={n}>от {n}★</option>
                ))}
              </select>

              {/* Sort */}
              <div className="flex rounded-lg border border-border overflow-hidden text-xs">
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
          <div className="space-y-2">
            {displayed.map((entry) => (
              <WatchedRow
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
