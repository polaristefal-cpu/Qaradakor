import { useState, useEffect, useRef } from "react";
import { getProfile, updateProfile, getWatched, getMovieBasic, get2FAStatus, setup2FASend, setup2FAConfirm, disable2FA, TMDB_IMG, uploadAvatar, getAvatarUrl } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useNavigate } from "react-router";
import {
  Star, Film, Edit3, Check, X,
  Loader2, Library, Sparkles, Calendar,
  Users, Bot, TrendingUp, Smartphone, ShieldCheck,
  ShieldOff, ShieldAlert, Eye, EyeOff, Phone, ArrowLeft,
  Camera, Mail, Clock, Bookmark,
} from "lucide-react";
import { toast } from "sonner";

// WhatsApp SVG icon
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const GENRE_OPTIONS = [
  "Боевик", "Приключения", "Анимация", "Комедия", "Криминал",
  "Драма", "Фэнтези", "Ужасы", "Мелодрама", "Фантастика", "Триллер", "Война",
];

interface WatchedEntry { movieId: number; rating: number; addedAt: string; review?: string; }
interface MovieSnap {
  id: number; title: string;
  poster_path: string | null;
  release_date: string;
  _rating: number;
}

// ─── Skeleton for movie cards ────────────────────────────────────────────────
function MovieCardSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden border border-border animate-pulse">
      <div className="w-full aspect-[2/3] bg-muted" />
    </div>
  );
}

// ─── Profile Page ─────────────────────────────────────────────────────────────
export function ProfilePage() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Editing states
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState("");
  const [bioVal, setBioVal] = useState("");
  const [genresVal, setGenresVal] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Stats & movies
  const [watchedEntries, setWatchedEntries] = useState<WatchedEntry[]>([]);
  const [recentMovies, setRecentMovies] = useState<MovieSnap[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }

    Promise.all([getProfile(), getWatched(), getAvatarUrl()])
      .then(([p, w, avatarUrlResult]) => {
        setProfile(p);
        setNameVal(p?.name || "");
        setBioVal(p?.bio || "");
        setGenresVal(p?.favoriteGenres || []);
        setAvatarUrl(avatarUrlResult);

        const entries: WatchedEntry[] = Array.isArray(w) ? w : [];
        setWatchedEntries(entries);

        if (entries.length > 0) {
          setLoadingMovies(true);
          const recent = [...entries].sort(
            (a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime()
          ).slice(0, 6);

          Promise.all(
            recent.map(async (e) => {
              try {
                const m = await getMovieBasic(e.movieId);
                return {
                  id: m.id,
                  title: m.title,
                  poster_path: m.poster_path,
                  release_date: m.release_date,
                  _rating: e.rating,
                } as MovieSnap;
              } catch { return null; }
            })
          )
            .then((res) => setRecentMovies(res.filter(Boolean) as MovieSnap[]))
            .finally(() => setLoadingMovies(false));
        }
      })
      .catch(() => {
        toast.error("Не удалось загрузить профиль");
        setProfile(null);
      })
      .finally(() => setLoadingProfile(false));
  }, [session]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Выберите изображение"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Файл слишком большой (макс. 5 МБ)"); return; }

    // Preview immediately
    const objectUrl = URL.createObjectURL(file);
    setAvatarUrl(objectUrl);
    setAvatarUploading(true);
    try {
      const result = await uploadAvatar(file);
      setAvatarUrl(result.url);
      toast.success("Фото профиля обновлено");
    } catch (err: any) {
      toast.error(err.message || "Ошибка загрузки фото");
      // Revert preview on error
      setAvatarUrl(null);
    } finally {
      setAvatarUploading(false);
      // Reset input
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({ name: nameVal.trim(), bio: bioVal.trim(), favoriteGenres: genresVal });
      setProfile((prev: any) => ({ ...prev, ...res.profile }));
      setEditing(false);
      toast.success("Профиль обнолён");
    } catch {
      toast.error("Не удал��сь обновить профиль");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditing(false);
    setNameVal(profile?.name || "");
    setBioVal(profile?.bio || "");
    setGenresVal(profile?.favoriteGenres || []);
  };

  const toggleGenre = (g: string) =>
    setGenresVal((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );

  // Derived stats
  const totalMovies = watchedEntries.length;
  const avgRating =
    totalMovies > 0
      ? (watchedEntries.reduce((s, e) => s + (e.rating || 0), 0) / totalMovies).toFixed(1)
      : "—";
  const memberSince = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString("ru-RU", {
        year: "numeric", month: "long",
      })
    : null;

  const displayName =
    profile?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "Пользователь";

  const displayEmail = profile?.email || session?.user?.email || "";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ── Loading screen ──
  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загружаем профиль…</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

      {/* ── Profile Card ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Cover banner */}
        <div className="h-36 sm:h-44 relative overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#232a45] to-[#2e1a47]">
          <div className="absolute -top-6 -left-6 w-48 h-48 bg-primary/25 rounded-full blur-3xl" />
          <div className="absolute -bottom-8 right-8 w-56 h-56 bg-secondary/20 rounded-full blur-3xl" />
          <div className="absolute top-4 right-1/3 w-20 h-20 bg-primary/15 rounded-full blur-2xl" />
          <div className="absolute bottom-4 left-1/4 w-16 h-16 bg-purple-500/10 rounded-full blur-2xl" />
        </div>

        <div className="px-5 sm:px-6 pb-6">
          {/* Avatar + Actions row */}
          <div className="flex items-end justify-between -mt-12 mb-5">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-4 border-card shadow-xl overflow-hidden bg-primary flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-primary-foreground text-3xl font-black select-none">
                    {initials}
                  </span>
                )}
                {avatarUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>
              {/* Camera button overlay */}
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={avatarUploading}
                className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-primary border-2 border-card flex items-center justify-center hover:bg-primary/90 transition-all shadow-md"
                title="Изменить фото"
              >
                <Camera className="w-3.5 h-3.5 text-primary-foreground" />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            {/* Edit / Save buttons */}
            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-foreground bg-muted border border-border hover:border-primary/40 hover:bg-muted/80 transition-all"
              >
                <Edit3 className="w-4 h-4" />
                Редактировать
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition-all"
                >
                  <X className="w-4 h-4" />
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" />}
                  Сохранить
                </button>
              </div>
            )}
          </div>

          {/* View mode */}
          {!editing ? (
            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-black text-foreground leading-tight">{displayName}</h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1.5">
                  {displayEmail && (
                    <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      {displayEmail}
                    </span>
                  )}
                  {memberSince && (
                    <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      С {memberSince}
                    </span>
                  )}
                </div>
              </div>

              {profile?.bio && (
                <p className="text-foreground/80 text-sm leading-relaxed border-t border-border pt-3">
                  {profile.bio}
                </p>
              )}

              {profile?.favoriteGenres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {profile.favoriteGenres.map((g: string) => (
                    <span
                      key={g}
                      className="text-xs px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 font-medium"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}

              {!profile?.bio && !profile?.favoriteGenres?.length && (
                <p className="text-muted-foreground/50 text-sm italic">
                  Добавьте информацию о себе — нажмите «Редактировать»
                </p>
              )}
            </div>
          ) : (
            /* Edit mode */
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  Имя
                </label>
                <input
                  value={nameVal}
                  onChange={(e) => setNameVal(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition placeholder:text-muted-foreground/40"
                  placeholder="Ваше имя"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                  О себе
                </label>
                <textarea
                  value={bioVal}
                  onChange={(e) => setBioVal(e.target.value)}
                  rows={3}
                  className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition resize-none placeholder:text-muted-foreground/40"
                  placeholder="Немного о себе и ваших кино-предпочтениях…"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">
                  Любимые жанры
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {GENRE_OPTIONS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => toggleGenre(g)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        genresVal.includes(g)
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-muted text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Stats row inside card */}
          <div className="grid grid-cols-3 border-t border-border">
            {[
              { label: "Фильмов", value: totalMovies, icon: Film, color: "text-foreground" },
              { label: "Ср. оценка", value: avgRating, icon: Star, color: "text-primary" },
              { label: "Жанров", value: profile?.favoriteGenres?.length || 0, icon: Sparkles, color: "text-secondary" },
            ].map(({ label, value, icon: Icon, color }, i) => (
              <div
                key={label}
                className={`flex flex-col items-center py-4 gap-1 ${i < 2 ? "border-r border-border" : ""}`}
              >
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <div className={`flex items-center gap-1 text-xs text-muted-foreground`}>
                  <Icon className={`w-3.5 h-3.5 ${color} opacity-70`} />
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate("/my-collection")}
          className="flex flex-col items-center gap-2.5 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Library className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Моя коллекция
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {totalMovies} фильмов
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/friends")}
          className="flex flex-col items-center gap-2.5 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Друзья
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Найти друзей
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/ai-recommendations")}
          className="flex flex-col items-center gap-2.5 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              AI & Реки
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Рекомендации
            </p>
          </div>
        </button>

        <button
          onClick={() => navigate("/collections")}
          className="flex flex-col items-center gap-2.5 p-4 bg-card border border-border rounded-2xl hover:border-primary/40 hover:shadow-md transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
            <Bookmark className="w-6 h-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              Подборки
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              Сообщество
            </p>
          </div>
        </button>
      </div>

      {/* ─── 2FA Section ───────────────────────────────────────────────────────────── */}
      <TwoFASection />

      {/* ── Recent Watches ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-5">
          <SectionHeader icon={Library} label="Последние просмотренные" />
          <button
            onClick={() => navigate("/library")}
            className="text-xs text-primary hover:underline font-semibold transition"
          >
            Вся библиотека →
          </button>
        </div>

        {/* Loading skeleton */}
        {loadingMovies && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <MovieCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loadingMovies && recentMovies.length === 0 && (
          <div className="text-center py-10">
            <Film className="w-10 h-10 text-muted-foreground/20 mx-auto mb-3" />
            <p className="text-muted-foreground text-sm font-medium">Библиотека пуста</p>
            <p className="text-muted-foreground/60 text-xs mt-1">
              Найдите фильмы и добавьте их в свою коллекцию
            </p>
            <button
              onClick={() => navigate("/search")}
              className="mt-4 text-xs font-semibold px-4 py-2 rounded-xl bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition"
            >
              Найти фильмы →
            </button>
          </div>
        )}

        {/* Movie grid */}
        {!loadingMovies && recentMovies.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {recentMovies.map((m) => (
              <div
                key={m.id}
                onClick={() => navigate(`/movie/${m.id}`)}
                className="group cursor-pointer relative rounded-xl overflow-hidden border border-border hover:border-primary/40 hover:shadow-md transition-all"
              >
                {m.poster_path ? (
                  <img
                    src={`${TMDB_IMG}/w185${m.poster_path}`}
                    alt={m.title}
                    className="w-full aspect-[2/3] object-cover group-hover:scale-[1.04] transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full aspect-[2/3] bg-muted flex items-center justify-center">
                    <Film className="w-5 h-5 text-muted-foreground/25" />
                  </div>
                )}
                {/* Rating badge */}
                {m._rating > 0 && (
                  <div className="absolute top-1.5 right-1.5 bg-black/70 backdrop-blur rounded-md px-1.5 py-0.5 flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 text-primary fill-primary" />
                    <span className="text-white text-[10px] font-black">{m._rating}</span>
                  </div>
                )}
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <p className="absolute bottom-1.5 left-1.5 right-1.5 text-white text-[9px] font-semibold leading-tight line-clamp-2">
                    {m.title}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Activity summary ── */}
      {totalMovies > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="mb-5">
            <SectionHeader icon={TrendingUp} label="Активность" />
          </div>
          <div className="space-y-2.5">
            {/* Rating distribution */}
            {[10, 9, 8, 7, 6].map((score) => {
              const count = watchedEntries.filter((e) => e.rating === score).length;
              const pct = totalMovies > 0 ? (count / totalMovies) * 100 : 0;
              return (
                <div key={score} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground font-mono w-4 text-right shrink-0">{score}</span>
                  <Star className="w-3 h-3 text-primary fill-primary shrink-0" />
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground/60 w-5 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 2FA Section ─────────────────────────────────────────────────────────────
type SetupStep = "idle" | "form" | "otp";

function TwoFASection() {
  const [status, setStatus] = useState<{ enabled: boolean; masked: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // Setup flow state
  const [setupStep, setSetupStep] = useState<SetupStep>("idle");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [otpInput, setOtpInput] = useState("");
  const [maskedPhone, setMaskedPhone] = useState("");
  const [setupChannel, setSetupChannel] = useState<"whatsapp" | "sms">("sms");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [cooldown, setCooldown] = useState(0);

  // Disable flow
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisablePassword, setShowDisablePassword] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);
  const [disableError, setDisableError] = useState("");

  useEffect(() => {
    get2FAStatus()
      .then(setStatus)
      .catch(() => setStatus({ enabled: false, masked: "" }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const resetSetup = () => {
    setSetupStep("idle");
    setPhoneInput("");
    setPasswordInput("");
    setOtpInput("");
    setMaskedPhone("");
    setSetupError("");
    setCooldown(0);
  };

  // Step 1: send OTP — verifies password on server
  const handleSendCode = async () => {
    if (!phoneInput.trim() || !passwordInput.trim()) {
      setSetupError("Заполните все поля");
      return;
    }
    setSetupLoading(true);
    setSetupError("");
    try {
      const res = await setup2FASend(phoneInput.trim(), passwordInput.trim());
      setMaskedPhone(res.masked || "");
      setSetupChannel(res.channel || "sms");
      setCooldown(60);
      setSetupStep("otp");
    } catch (e: any) {
      const waitMatch = e.message?.match(/(\d+)\s*сек/);
      if (waitMatch) {
        setCooldown(parseInt(waitMatch[1]));
        setSetupError(`Подождите перед повторной отправкой.`);
        setSetupStep("otp"); // still go to OTP step
      } else {
        setSetupError(e.message);
      }
    } finally {
      setSetupLoading(false);
    }
  };

  // Resend OTP (same credentials still in state)
  const handleResend = async () => {
    if (cooldown > 0) return;
    setSetupLoading(true);
    setSetupError("");
    try {
      const res = await setup2FASend(phoneInput.trim(), passwordInput.trim());
      setMaskedPhone(res.masked || maskedPhone);
      setSetupChannel(res.channel || "sms");
      setCooldown(60);
      setOtpInput("");
      toast.success("Новый код отправлен");
    } catch (e: any) {
      setSetupError(e.message);
    } finally {
      setSetupLoading(false);
    }
  };

  // Step 2: confirm OTP → enable 2FA
  const handleConfirmOtp = async () => {
    if (otpInput.length < 6) { setSetupError("Введите 6-значный код"); return; }
    setSetupLoading(true);
    setSetupError("");
    try {
      const res = await setup2FAConfirm(otpInput.trim());
      const s = await get2FAStatus();
      setStatus(s);
      resetSetup();
      toast.success(`2FA включена! Номер ${res.masked} привязан.`);
    } catch (e: any) {
      setSetupError(e.message);
      setOtpInput("");
    } finally {
      setSetupLoading(false);
    }
  };

  // Disable 2FA — requires password
  const handleDisable = async () => {
    if (!disablePassword.trim()) { setDisableError("Введите пароль"); return; }
    setDisableLoading(true);
    setDisableError("");
    try {
      await disable2FA(disablePassword.trim());
      const s = await get2FAStatus();
      setStatus(s);
      setShowDisableForm(false);
      setDisablePassword("");
      toast.success("2FA отключена");
    } catch (e: any) {
      setDisableError(e.message);
    } finally {
      setDisableLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-2xl p-5 flex items-center justify-center h-32">
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className={`px-5 py-4 border-b border-border flex items-center justify-between ${
        status?.enabled ? "bg-green-500/5" : "bg-muted/30"
      }`}>
        <div className="flex items-center gap-3">
          {status?.enabled
            ? <ShieldCheck className="w-5 h-5 text-green-500" />
            : <ShieldOff className="w-5 h-5 text-muted-foreground" />}
          <div>
            <p className="text-sm font-bold text-foreground">Двухфакторная аутентификация</p>
            <p className="text-xs text-muted-foreground mt-0.5">WhatsApp / SMS подтверждение при входе</p>
          </div>
        </div>
        <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border ${
          status?.enabled
            ? "text-green-600 bg-green-500/10 border-green-500/25"
            : "text-muted-foreground bg-muted border-border"
        }`}>
          {status?.enabled ? "Включена" : "Выключена"}
        </span>
      </div>

      <div className="p-5 space-y-4">
        {/* ── 2FA ENABLED STATE ── */}
        {status?.enabled && (
          <>
            <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/20 rounded-xl p-3.5">
              <Smartphone className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-foreground text-xs font-semibold">Привязанный номр</p>
                <p className="text-muted-foreground text-xs mt-0.5">{status.masked}</p>
              </div>
            </div>

            {/* Disable form */}
            <div className="pt-2 border-t border-border">
              {!showDisableForm ? (
                <button
                  onClick={() => setShowDisableForm(true)}
                  className="flex items-center gap-2 text-xs text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl transition-colors font-medium"
                >
                  <ShieldOff className="w-3.5 h-3.5" />
                  Отключить 2FA
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <ShieldOff className="w-3.5 h-3.5 text-destructive" />
                    Подтвердите отключение 2FA
                  </p>
                  <div className="relative">
                    <input
                      type={showDisablePassword ? "text" : "password"}
                      value={disablePassword}
                      onChange={(e) => { setDisablePassword(e.target.value); setDisableError(""); }}
                      placeholder="Текущий пароль"
                      className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm pr-10 focus:outline-none focus:border-destructive focus:ring-2 focus:ring-destructive/15 transition placeholder:text-muted-foreground/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDisablePassword(!showDisablePassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showDisablePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {disableError && <p className="text-destructive text-xs">{disableError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setShowDisableForm(false); setDisablePassword(""); setDisableError(""); }}
                      className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={handleDisable}
                      disabled={disableLoading || !disablePassword}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-destructive hover:bg-destructive/90 disabled:opacity-50 transition"
                    >
                      {disableLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldOff className="w-3.5 h-3.5" />}
                      Отключить
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── 2FA DISABLED STATE ── */}
        {!status?.enabled && (
          <>
            {/* Info banner */}
            {setupStep === "idle" && (
              <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3.5">
                <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  При включённой 2FA каждый вход потребует ввода кода из WhatsApp или SMS. Это защищает аккаунт даже при утечке пароля.
                </p>
              </div>
            )}

            {/* STEP: idle — show button */}
            {setupStep === "idle" && (
              <button
                onClick={() => setSetupStep("form")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm"
              >
                <Phone className="w-4 h-4" />
                Подключить двухфакторную аутентификацию
              </button>
            )}

            {/* STEP: form — phone + password */}
            {setupStep === "form" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={resetSetup} className="text-muted-foreground hover:text-foreground transition">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold text-foreground">Шаг 1 из 2 — Ваш номер телефона</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Номер телефона
                  </label>
                  <input
                    value={phoneInput}
                    onChange={(e) => {
                      const raw = e.target.value;
                      // Extract only digits
                      const digits = raw.replace(/\D/g, "").slice(0, 11);
                      if (!digits) { setPhoneInput(""); setSetupError(""); return; }
                      // Normalize: 8XXXXXXXXXX → 7XXXXXXXXXX
                      const d = digits.startsWith("8") ? "7" + digits.slice(1) : digits.startsWith("7") ? digits : "7" + digits;
                      // Format: +7 XXX XXX XX XX
                      let fmt = "+7";
                      if (d.length > 1) fmt += " " + d.slice(1, 4);
                      if (d.length > 4) fmt += " " + d.slice(4, 7);
                      if (d.length > 7) fmt += " " + d.slice(7, 9);
                      if (d.length > 9) fmt += " " + d.slice(9, 11);
                      setPhoneInput(fmt);
                      setSetupError("");
                    }}
                    placeholder="+7 700 000 00 00"
                    type="tel"
                    maxLength={16}
                    className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition placeholder:text-muted-foreground/40"
                  />
                  <p className="text-muted-foreground/60 text-[10px] mt-1">Формат: +7XXXXXXXXXX или 8XXXXXXXXXX</p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Текущий пароль (для подтверждения)
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={passwordInput}
                      onChange={(e) => { setPasswordInput(e.target.value); setSetupError(""); }}
                      placeholder="Ваш пароль от аккаунта"
                      className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm pr-10 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition placeholder:text-muted-foreground/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {setupError && (
                  <p className="text-destructive text-xs bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                    {setupError}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={resetSetup}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSendCode}
                    disabled={setupLoading || !phoneInput.trim() || !passwordInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
                  >
                    {setupLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Smartphone className="w-3.5 h-3.5" />}
                    Отправить код
                  </button>
                </div>
              </div>
            )}

            {/* STEP: otp — enter received code */}
            {setupStep === "otp" && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setSetupStep("form")} className="text-muted-foreground hover:text-foreground transition">
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <p className="text-sm font-bold text-foreground">
                   Шаг 2 из 2 — Введите код из {setupChannel === "whatsapp" ? "WhatsApp" : "SMS"}
                 </p>
                </div>

                <div className={`flex items-center gap-3 rounded-xl p-3.5 ${setupChannel === "whatsapp" ? "bg-[#25D366]/8 border border-[#25D366]/20" : "bg-primary/8 border border-primary/20"}`}>
                  {setupChannel === "whatsapp"
                    ? <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0" />
                    : <Smartphone className="w-4 h-4 text-primary shrink-0" />}
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {setupChannel === "whatsapp"
                      ? <><span className="text-[#25D366] font-semibold">WhatsApp</span> сообщение отправлено на{" "}</>
                      : "SMS с кодом отправлено на "}
                    <span className="text-foreground font-semibold">{maskedPhone || phoneInput}</span>
                  </p>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5 text-center">
                    6-значный код
                  </label>
                  <input
                    value={otpInput}
                    onChange={(e) => { setOtpInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setSetupError(""); }}
                    placeholder="000000"
                    inputMode="numeric"
                    maxLength={6}
                    className="w-full bg-muted border border-border rounded-xl px-3.5 py-3 text-foreground text-xl text-center tracking-[0.4em] font-black focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition placeholder:text-muted-foreground/30 placeholder:tracking-normal placeholder:text-sm"
                    autoFocus
                  />
                </div>

                {setupError && (
                  <p className="text-destructive text-xs bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
                    {setupError}
                  </p>
                )}

                <button
                  onClick={handleConfirmOtp}
                  disabled={setupLoading || otpInput.length < 6}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
                >
                  {setupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Подтвердить и включить 2FA
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={resetSetup}
                    className="text-xs text-muted-foreground hover:text-foreground transition flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3 h-3" /> Начать заново
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={cooldown > 0 || setupLoading}
                    className="text-xs font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition"
                  >
                    {cooldown > 0 ? `Повторить (${cooldown}с)` : "Отправить снова"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Section Header (matches home page style) ─────────────────────────────────
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
    <div className="flex items-center gap-2.5">
      <div className="w-0.5 h-5 rounded-full bg-primary" />
      <Icon className={`w-4.5 h-4.5 ${iconClass}`} />
      <h2 className="text-lg font-bold text-foreground tracking-tight">{label}</h2>
    </div>
  );
}