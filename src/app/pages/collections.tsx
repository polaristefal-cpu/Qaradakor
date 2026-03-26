import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router";
import {
  getCollections, getMyCollections, createCollection,
  deleteCollection, toggleCollectionLike, TMDB_IMG,
} from "../lib/api";
import { useAuth } from "../lib/auth-context";
import {
  Layers, Plus, Heart, Film, MessageSquare, User,
  Loader2, Trash2, Pencil, X, Search, TrendingUp, Clock,
  ChevronRight, BookOpen,
} from "lucide-react";
import { toast } from "sonner";

// ── Create/Edit collection modal ─────────────────────────────────────────────
function CollectionModal({
  initial,
  onClose,
  onSave,
}: {
  initial?: { name: string; description: string };
  onClose: () => void;
  onSave: (name: string, description: string) => Promise<void>;
}) {
  const [name, setName] = useState(initial?.name || "");
  const [description, setDescription] = useState(initial?.description || "");
  const [saving, setSaving] = useState(false);

  const SUGGESTIONS = [
    "Мой Топ 100 фильмов",
    "Лучшие антиутопии",
    "Философские фильмы",
    "Непонятные, но крутые",
    "Комфортные для вечера",
    "Фильмы, изменившие меня",
    "Шедевры авторского кино",
    "Страшно, но смотришь",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Введите название"); return; }
    setSaving(true);
    try {
      await onSave(name.trim(), description.trim());
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="font-bold text-foreground">
            {initial ? "Редактировать подборку" : "Создать подборку"}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-muted hover:bg-accent flex items-center justify-center text-muted-foreground transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Название *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Мой топ 100 фильмов"
              maxLength={80}
              className="w-full bg-muted border border-border rounded-xl px-4 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition placeholder:text-muted-foreground/50"
            />
            {/* Suggestions */}
            {!initial && !name && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {SUGGESTIONS.slice(0, 4).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setName(s)}
                    className="text-[10px] px-2 py-1 rounded-md bg-muted border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1.5 block">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Расскажи о своей подборке..."
              maxLength={300}
              rows={3}
              className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition resize-none placeholder:text-muted-foreground/50"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-border text-muted-foreground text-sm hover:text-foreground transition">
              Отмена
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition shadow-sm"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {initial ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Collection Card ────────────────────────────────────────────────────────────
function CollectionCard({
  coll,
  isOwner,
  onDelete,
  onLike,
}: {
  coll: any;
  isOwner: boolean;
  onDelete?: () => void;
  onLike?: () => void;
}) {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [liking, setLiking] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!session) { toast.error("Войдите, чтобы ставить лайки"); return; }
    if (liking) return;
    setLiking(true);
    try { await onLike?.(); }
    finally { setLiking(false); }
  };

  // Show up to 4 poster thumbnails
  const posters = (coll.movies || [])
    .filter((m: any) => m.poster_path)
    .slice(0, 4);

  return (
    <div
      onClick={() => navigate(`/collections/${coll.id}`)}
      className="group bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/30 hover:shadow-lg transition-all cursor-pointer"
    >
      {/* Poster mosaic */}
      <div className="h-36 bg-muted relative overflow-hidden">
        {posters.length > 0 ? (
          <div className={`grid h-full ${posters.length >= 4 ? "grid-cols-4" : posters.length >= 2 ? "grid-cols-2" : "grid-cols-1"}`}>
            {posters.map((m: any, i: number) => (
              <img
                key={i}
                src={`${TMDB_IMG}/w185${m.poster_path}`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Layers className="w-12 h-12 text-muted-foreground/20" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Movie count badge */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          <Film className="w-2.5 h-2.5" />
          {coll.moviesCount || 0} фильмов
        </div>

        {/* Owner badge */}
        {isOwner && onDelete && (
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="absolute top-2 right-2 w-6 h-6 bg-destructive/90 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition hover:bg-destructive"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-bold text-foreground text-sm line-clamp-1 group-hover:text-primary transition-colors">
          {coll.name}
        </h3>
        {coll.description && (
          <p className="text-muted-foreground text-xs mt-1 line-clamp-2 leading-relaxed">
            {coll.description}
          </p>
        )}

        {/* Meta */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <User className="w-3 h-3" />
            <span className="line-clamp-1 max-w-[80px]">{coll.userName}</span>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            {/* Comments */}
            <span className="flex items-center gap-1 text-muted-foreground">
              <MessageSquare className="w-3 h-3" />
              {coll.commentsCount || 0}
            </span>

            {/* Like */}
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 transition-colors ${
                coll.likedByMe
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              {liking ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Heart className={`w-3 h-3 ${coll.likedByMe ? "fill-primary" : ""}`} />
              )}
              {coll.likesCount || 0}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export function CollectionsPage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [collections, setCollections] = useState<any[]>([]);
  const [myCollections, setMyCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"date" | "likes" | "movies">("date");

  const loadAll = async () => {
    setLoading(true);
    try {
      const data = await getCollections();
      setCollections(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Load collections error:", e.message);
      toast.error("Не удалось загрузить подборки");
    } finally {
      setLoading(false);
    }
  };

  const loadMine = async () => {
    if (!session) return;
    try {
      const data = await getMyCollections();
      setMyCollections(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.error("Load my collections error:", e.message);
    }
  };

  useEffect(() => {
    loadAll();
    if (session) loadMine();
  }, [session]);

  const handleCreate = async (name: string, description: string) => {
    try {
      const coll = await createCollection(name, description);
      toast.success("Подборка создана!");
      setShowCreate(false);
      setMyCollections((prev) => [coll, ...prev]);
      setCollections((prev) => [coll, ...prev]);
      navigate(`/collections/${coll.id}`);
    } catch (e: any) {
      toast.error(e.message || "Ошибка создания");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Удалить подборку?")) return;
    try {
      await deleteCollection(id);
      toast.success("Подборка удалена");
      setMyCollections((prev) => prev.filter((c) => c.id !== id));
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      toast.error(e.message || "Ошибка удаления");
    }
  };

  const handleLike = async (collId: string, isAllTab: boolean) => {
    try {
      const result = await toggleCollectionLike(collId);
      const update = (list: any[]) =>
        list.map((c) =>
          c.id === collId
            ? { ...c, likedByMe: result.liked, likesCount: result.likesCount }
            : c
        );
      setCollections(update);
      setMyCollections(update);
    } catch (e: any) {
      toast.error(e.message || "Ошибка");
    }
  };

  // Filter & sort
  const displayList = (tab === "mine" && session ? myCollections : collections)
    .filter((c) =>
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.userName?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "likes") return (b.likesCount || 0) - (a.likesCount || 0);
      if (sortBy === "movies") return (b.moviesCount || 0) - (a.moviesCount || 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const myUserId = session?.user?.id;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Layers className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-foreground">Подборки</h1>
            <p className="text-muted-foreground text-sm">
              Коллекции фильмов от сообщества
            </p>
          </div>
        </div>

        {session && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm shrink-0"
          >
            <Plus className="w-4 h-4" />
            Создать подборку
          </button>
        )}
      </div>

      {/* Tabs + Search + Sort */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shrink-0">
          <button
            onClick={() => setTab("all")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tab === "all"
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            }`}
          >
            <TrendingUp className="w-3 h-3" />
            Все подборки
          </button>
          {session && (
            <button
              onClick={() => setTab("mine")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                tab === "mine"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <BookOpen className="w-3 h-3" />
              Мои
              {myCollections.length > 0 && (
                <span className={`text-[9px] font-black rounded-md min-w-[16px] h-4 px-1 flex items-center justify-center ${tab === "mine" ? "bg-primary-foreground text-primary" : "bg-primary/20 text-primary"}`}>
                  {myCollections.length}
                </span>
              )}
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск подборок..."
            className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
          />
        </div>

        {/* Sort */}
        <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1 shrink-0">
          {([
            { key: "date", label: "Новые", icon: Clock },
            { key: "likes", label: "Лайки", icon: Heart },
            { key: "movies", label: "Фильмы", icon: Film },
          ] as { key: typeof sortBy; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                sortBy === key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-3 h-3" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="w-9 h-9 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm">Загрузка подборок...</p>
        </div>
      )}

      {/* Guest CTA */}
      {!session && !loading && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-bold text-foreground mb-1">Создайте свою подборку!</h3>
            <p className="text-muted-foreground text-sm">
              Зарегистрируйтесь, чтобы создавать коллекции фильмов, ставить лайки и комментировать.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Link to="/register" className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all">
              <Plus className="w-3.5 h-3.5" />
              Регистрация
            </Link>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && displayList.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center">
            <Layers className="w-8 h-8 text-muted-foreground/30" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground mb-1">
              {tab === "mine" ? "У вас пока нет подборок" : "Подборок пока нет"}
            </h2>
            <p className="text-muted-foreground text-sm">
              {tab === "mine"
                ? "Создайте первую подборку и добавьте любимые фильмы"
                : searchQuery
                  ? "По вашему запросу ничего не найдено"
                  : "Будьте первым — создайте подборку!"}
            </p>
          </div>
          {session && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Создать первую подборку
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {!loading && displayList.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {displayList.map((coll) => (
            <CollectionCard
              key={coll.id}
              coll={coll}
              isOwner={coll.userId === myUserId}
              onDelete={() => handleDelete(coll.id)}
              onLike={() => handleLike(coll.id, tab === "all")}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <CollectionModal
          onClose={() => setShowCreate(false)}
          onSave={handleCreate}
        />
      )}
    </div>
  );
}
