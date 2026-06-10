import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router";
import {
  getCollection, updateCollection, deleteCollection,
  addMovieToCollection, removeMovieFromCollection,
  toggleCollectionLike, addCollectionComment, deleteCollectionComment,
  searchMovies, TMDB_IMG,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import {
  Heart, Film, MessageSquare, User, Loader2, Trash2,
  Pencil, X, Plus, Search, Star, Send, ChevronLeft,
  Layers, Calendar, ArrowRight, Check, LayoutGrid, List,
} from "lucide-react";
import { toast } from "sonner";
import { BackButton } from "../components/back-button";
import { MovieCard } from "../components/movie-card";

// ── Edit modal ─────────────────────────────────────────────────────────────────
function EditModal({
  coll,
  onClose,
  onSave,
}: {
  coll: any;
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(coll.name || "");
  const [description, setDescription] = useState(coll.description || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    try { await onSave(name.trim(), description.trim()); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground">Редактировать подборку</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Название *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">Описание</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={300}
              rows={3}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none"
            />
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition">Отмена</button>
            <button type="submit" disabled={saving || !name.trim()} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Add movie search panel ─────────────────────────────────────────────────────
function AddMoviePanel({
  collectionId,
  existingIds,
  onAdded,
  onClose,
}: {
  collectionId: string;
  existingIds: Set<number>;
  onAdded: (movie: any) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setResults([]); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchMovies(query);
        setResults(data.results?.slice(0, 8) || []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  const handleAdd = async (movie: any) => {
    if (adding) return;
    setAdding(movie.id);
    try {
      await addMovieToCollection(collectionId, {
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
      });
      setAdded((prev) => new Set([...prev, movie.id]));
      onAdded(movie);
      toast.success(`«${movie.title}» добавлен`);
    } catch (e: any) {
      toast.error(e.message || "Ошибка добавления");
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-bold text-foreground text-sm">Добавить фильм</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск фильма..."
              className="w-full bg-muted border border-border rounded-xl pl-9 pr-3 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
          )}
          {!loading && results.length === 0 && query && (
            <div className="text-center py-10 text-muted-foreground text-sm">Ничего не найдено</div>
          )}
          {!loading && !query && (
            <div className="text-center py-10 text-muted-foreground text-sm">Введите название фильма</div>
          )}
          {results.map((movie) => {
            const isInCollection = existingIds.has(movie.id) || added.has(movie.id);
            const isAdding = adding === movie.id;
            return (
              <div key={movie.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition border-b border-border/30 last:border-0">
                {movie.poster_path ? (
                  <img src={`${TMDB_IMG}/w92${movie.poster_path}`} alt={movie.title} className="w-9 h-13 rounded-lg object-cover shrink-0" loading="lazy" />
                ) : (
                  <div className="w-9 h-13 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground text-sm font-semibold line-clamp-1">{movie.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                    {movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
                    {movie.vote_average > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => !isInCollection && handleAdd(movie)}
                  disabled={isInCollection || isAdding}
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    isInCollection
                      ? "bg-primary/10 text-primary border border-primary/20 cursor-default"
                      : "bg-primary text-primary-foreground hover:bg-primary/90"
                  }`}
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : isInCollection ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Collection Detail Page ────────────────────────────────────────────────
export function CollectionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session } = useAuth();
  const [coll, setColl] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [liking, setLiking] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [sendingComment, setSendingComment] = useState(false);
  const [deletingMovie, setDeletingMovie] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showComments, setShowComments] = useState(false);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const isOwner = session && coll && coll.userId === session.user?.id;
  const existingIds = new Set<number>((coll?.movies || []).map((m: any) => m.movieId));

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getCollection(id)
      .then(setColl)
      .catch(() => setColl(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!session) { toast.error("Войдите, чтобы ставить лайки"); return; }
    if (liking) return;
    setLiking(true);
    try {
      const result = await toggleCollectionLike(id!);
      setColl((prev: any) => ({
        ...prev,
        likedByMe: result.liked,
        likesCount: result.likesCount,
      }));
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setLiking(false);
    }
  };

  const handleEdit = async (name: string, description: string) => {
    const updated = await updateCollection(id!, { name, description });
    setColl((prev: any) => ({ ...prev, ...updated }));
    toast.success("Подборка обновлена");
    setShowEdit(false);
  };

  const handleDelete = async () => {
    if (!confirm("Удалить подборку?")) return;
    try {
      await deleteCollection(id!);
      toast.success("Подборка удалена");
      navigate("/collections");
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    }
  };

  const handleMovieAdded = (movie: any) => {
    setColl((prev: any) => ({
      ...prev,
      movies: [...(prev.movies || []), {
        movieId: movie.id,
        title: movie.title,
        poster_path: movie.poster_path,
        release_date: movie.release_date,
        vote_average: movie.vote_average,
        addedAt: new Date().toISOString(),
      }],
      moviesCount: (prev.moviesCount || 0) + 1,
    }));
  };

  const handleRemoveMovie = async (movieId: number) => {
    if (!confirm("Убрать фильм из подборки?")) return;
    setDeletingMovie(movieId);
    try {
      await removeMovieFromCollection(id!, movieId);
      setColl((prev: any) => ({
        ...prev,
        movies: prev.movies.filter((m: any) => m.movieId !== movieId),
        moviesCount: Math.max(0, (prev.moviesCount || 1) - 1),
      }));
      toast.success("Фильм убран из подборки");
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    } finally {
      setDeletingMovie(null);
    }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    if (!session) { toast.error("Войдите, чтобы комментировать"); return; }
    setSendingComment(true);
    try {
      const comment = await addCollectionComment(id!, commentText.trim());
      setColl((prev: any) => ({
        ...prev,
        comments: [...(prev.comments || []), comment],
        commentsCount: (prev.commentsCount || 0) + 1,
      }));
      setCommentText("");
    } catch (e: any) {
      toast.error(e.message || "Ошибка отправки");
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteCollectionComment(id!, commentId);
      setColl((prev: any) => ({
        ...prev,
        comments: prev.comments.filter((c: any) => c.id !== commentId),
        commentsCount: Math.max(0, (prev.commentsCount || 1) - 1),
      }));
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загружаем подборку...</p>
      </div>
    );
  }

  if (!coll) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <Layers className="w-12 h-12 text-muted-foreground/20" />
        <p className="text-muted-foreground">Подборка не найдена</p>
        <Link to="/collections" className="text-primary text-sm hover:underline">← Все подборки</Link>
      </div>
    );
  }

  const movies: any[] = coll.movies || [];
  const comments: any[] = coll.comments || [];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <BackButton />

      {/* Header card */}
      <div className="bg-card border border-border rounded-2xl p-6 mb-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Breadcrumb */}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
              <Link to="/collections" className="hover:text-primary transition-colors">Подборки</Link>
              <ChevronLeft className="w-3 h-3 rotate-180" />
              <span className="text-foreground font-medium line-clamp-1">{coll.name}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-black text-foreground leading-tight mb-2">
              {coll.name}
            </h1>
            {coll.description && (
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                {coll.description}
              </p>
            )}

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <User className="w-3 h-3" />
                {coll.userName}
              </span>
              <span className="flex items-center gap-1.5">
                <Film className="w-3 h-3" />
                {coll.moviesCount || movies.length} фильмов
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3 h-3" />
                {new Date(coll.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                coll.likedByMe
                  ? "bg-primary/10 text-primary border-primary/30 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              {liking ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 ${coll.likedByMe ? "fill-primary text-primary" : ""}`} />
              )}
              <span>{coll.likesCount || 0}</span>
            </button>

            {/* Comments toggle */}
            <button
              onClick={() => setShowComments((v) => !v)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                showComments
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-foreground border-border hover:border-primary/40"
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>{comments.length}</span>
            </button>

            {/* Owner actions */}
            {isOwner && (
              <>
                <button
                  onClick={() => setShowEdit(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border bg-card text-foreground text-sm font-semibold hover:border-primary/40 transition-all"
                >
                  <Pencil className="w-4 h-4" />
                  <span className="hidden sm:inline">Изменить</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Удалить</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Movies section */}
      <div className="mb-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-black text-foreground flex items-center gap-2">
            <Film className="w-4 h-4 text-primary" />
            Фильмы
            <span className="text-sm font-normal text-muted-foreground">({movies.length})</span>
          </h2>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="flex items-center bg-muted rounded-xl p-1 border border-border">
              <button
                onClick={() => setViewMode("grid")}
                className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`w-8 h-7 rounded-lg flex items-center justify-center transition-all ${
                  viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {isOwner && (
              <button
                onClick={() => setShowAddMovie(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Добавить
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {movies.length === 0 && (
          <div className="bg-card border border-border rounded-2xl flex flex-col items-center justify-center py-16 gap-4">
            <Film className="w-12 h-12 text-muted-foreground/20" />
            <div className="text-center">
              <p className="font-semibold text-foreground mb-1">Нет фильмов</p>
              <p className="text-muted-foreground text-sm">
                {isOwner ? "Добавьте первый фильм в подборку" : "В этой подборке пока нет фильмов"}
              </p>
            </div>
            {isOwner && (
              <button
                onClick={() => setShowAddMovie(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
              >
                <Plus className="w-4 h-4" />
                Добавить фильм
              </button>
            )}
          </div>
        )}

        {/* GRID view — poster cards like home page */}
        {movies.length > 0 && viewMode === "grid" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {movies.map((movie) => {
              const tmdbMovie = {
                id: movie.movieId,
                title: movie.title,
                poster_path: movie.poster_path,
                release_date: movie.release_date,
                vote_average: movie.vote_average,
              };
              return (
                <div key={movie.movieId} className="relative group/wrap">
                  <MovieCard movie={tmdbMovie} showQuickActions={true} />
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMovie(movie.movieId)}
                      disabled={deletingMovie === movie.movieId}
                      title="Убрать из подборки"
                      className="absolute top-1.5 left-1.5 z-10 w-6 h-6 rounded-md bg-black/70 backdrop-blur text-white hover:bg-destructive flex items-center justify-center transition opacity-0 group-hover/wrap:opacity-100"
                    >
                      {deletingMovie === movie.movieId ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <X className="w-3 h-3" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* LIST view — compact rows */}
        {movies.length > 0 && viewMode === "list" && (
          <div className="space-y-2">
            {movies.map((movie, index) => (
              <div
                key={movie.movieId}
                className="group flex items-center gap-4 bg-card border border-border rounded-xl p-3 hover:border-primary/30 transition-all"
              >
                <span className="text-xl font-black text-primary/40 w-7 text-center shrink-0 group-hover:text-primary/60 transition-colors">
                  {index + 1}
                </span>
                {movie.poster_path ? (
                  <img
                    src={`${TMDB_IMG}/w92${movie.poster_path}`}
                    alt={movie.title}
                    className="w-10 h-15 rounded-lg object-cover shrink-0 shadow-sm"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-10 h-15 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <Film className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-semibold text-sm truncate">{movie.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    {movie.release_date && <span>{movie.release_date.slice(0, 4)}</span>}
                    {movie.vote_average > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                        {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => navigate(`/movie/${movie.movieId}`)}
                    className="w-8 h-8 rounded-lg bg-muted hover:bg-accent text-muted-foreground hover:text-foreground flex items-center justify-center transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  {isOwner && (
                    <button
                      onClick={() => handleRemoveMovie(movie.movieId)}
                      disabled={deletingMovie === movie.movieId}
                      className="w-8 h-8 rounded-lg bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                    >
                      {deletingMovie === movie.movieId ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Comments section — collapsible panel */}
      {showComments && (
        <div className="bg-card border border-border rounded-2xl overflow-hidden mb-6">
          <div className="flex items-center justify-between px-5 py-3 border-b border-border">
            <h2 className="font-bold text-foreground flex items-center gap-2 text-sm">
              <MessageSquare className="w-4 h-4 text-primary" />
              Комментарии
              <span className="text-muted-foreground font-normal">({comments.length})</span>
            </h2>
            <button
              onClick={() => setShowComments(false)}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Compact inline comment input */}
          <div className="px-4 py-3 border-b border-border/60">
            {session ? (
              <div className="flex items-center gap-2">
                <input
                  ref={commentInputRef}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleAddComment()}
                  placeholder="Написать комментарий..."
                  className="flex-1 bg-muted border border-border rounded-xl px-3 py-2 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!commentText.trim() || sendingComment}
                  className="w-9 h-9 flex items-center justify-center bg-primary text-primary-foreground rounded-xl disabled:opacity-40 hover:bg-primary/90 transition shrink-0"
                >
                  {sendingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">Войдите, чтобы комментировать</p>
                <Link to="/login" className="text-primary text-sm font-semibold hover:underline">Войти →</Link>
              </div>
            )}
          </div>

          {/* Comments list */}
          {comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <MessageSquare className="w-7 h-7 mx-auto mb-2 opacity-20" />
              Комментариев пока нет
            </div>
          ) : (
            <div className="divide-y divide-border/40 max-h-80 overflow-y-auto">
              {comments.map((comment) => {
                const canDelete =
                  session &&
                  (comment.userId === session.user?.id || coll.userId === session.user?.id);
                return (
                  <div key={comment.id} className="flex items-start gap-3 px-4 py-3 group hover:bg-muted/30 transition">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-xs font-black shrink-0 mt-0.5">
                      {(comment.userName || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-foreground text-xs font-semibold">{comment.userName}</span>
                        <span className="text-muted-foreground text-[10px]">
                          {new Date(comment.createdAt).toLocaleDateString("ru-RU")}
                        </span>
                      </div>
                      <p className="text-foreground/80 text-sm leading-relaxed">{comment.text}</p>
                    </div>
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-destructive transition opacity-0 group-hover:opacity-100 shrink-0"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {showEdit && (
        <EditModal coll={coll} onClose={() => setShowEdit(false)} onSave={handleEdit} />
      )}
      {showAddMovie && (
        <AddMoviePanel
          collectionId={id!}
          existingIds={existingIds}
          onAdded={handleMovieAdded}
          onClose={() => setShowAddMovie(false)}
        />
      )}
    </div>
  );
}