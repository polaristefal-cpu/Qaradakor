import { useEffect, useState } from "react";
import { getProfile, updateProfile, getWatched, getMovieBasic, savePhone, get2FAStatus, sendOtp, verifyOtp, TMDB_IMG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useNavigate } from "react-router";
import {
  Star, Film, Edit3, Check, X,
  Loader2, Library, Sparkles, Calendar,
  Users, Bot, TrendingUp, Smartphone, ShieldCheck,
  ShieldOff, ShieldAlert, RefreshCw, Phone,
} from "lucide-react";
import { toast } from "sonner";

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

  // Stats & movies
  const [watchedEntries, setWatchedEntries] = useState<WatchedEntry[]>([]);
  const [recentMovies, setRecentMovies] = useState<MovieSnap[]>([]);
  const [loadingMovies, setLoadingMovies] = useState(false);

  useEffect(() => {
    if (!session) { navigate("/login"); return; }

    Promise.all([getProfile(), getWatched()])
      .then(([p, w]) => {
        // Profile
        setProfile(p);
        setNameVal(p?.name || "");
        setBioVal(p?.bio || "");
        setGenresVal(p?.favoriteGenres || []);

        // Watched entries
        const entries: WatchedEntry[] = Array.isArray(w) ? w : [];
        setWatchedEntries(entries);

        // Load last 6 movies (basic info only — no credits)
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

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile({ name: nameVal.trim(), bio: bioVal.trim(), favoriteGenres: genresVal });
      setProfile((prev: any) => ({ ...prev, ...res.profile }));
      setEditing(false);
      toast.success("Профиль обновлён");
    } catch {
      toast.error("Не удалось обновить профиль");
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

  // Display name — prefer saved name, then email prefix, then fallback
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
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-5">

      {/* ── Profile Card ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {/* Cover banner */}
        <div className="h-28 relative overflow-hidden bg-gradient-to-br from-[#1a1f2e] via-[#232a45] to-[#2e1a47]">
          {/* decorative blobs */}
          <div className="absolute -top-4 -left-4 w-32 h-32 bg-primary/20 rounded-full blur-2xl" />
          <div className="absolute -bottom-6 right-10 w-40 h-40 bg-secondary/15 rounded-full blur-3xl" />
          <div className="absolute top-2 right-1/3 w-16 h-16 bg-primary/10 rounded-full blur-xl" />
        </div>

        <div className="px-5 pb-6">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary border-4 border-card flex items-center justify-center text-primary-foreground text-2xl font-black shadow-lg select-none">
              {initials}
            </div>

            {!editing ? (
              <button
                onClick={() => setEditing(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground hover:border-primary/30 transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Редактировать
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleCancelEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  Отмена
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
                >
                  {saving
                    ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : <Check className="w-3.5 h-3.5" />}
                  Сохранить
                </button>
              </div>
            )}
          </div>

          {/* View mode */}
          {!editing ? (
            <div className="space-y-1.5">
              <h1 className="text-xl font-black text-foreground leading-tight">{displayName}</h1>
              {displayEmail && (
                <p className="text-muted-foreground text-xs">{displayEmail}</p>
              )}
              {memberSince && (
                <p className="text-muted-foreground text-xs flex items-center gap-1.5 mt-0.5">
                  <Calendar className="w-3 h-3 shrink-0" />
                  Участник с {memberSince}
                </p>
              )}
              {profile?.bio && (
                <p className="text-foreground/80 text-sm mt-3 leading-relaxed border-t border-border pt-3">
                  {profile.bio}
                </p>
              )}
              {profile?.favoriteGenres?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-2">
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
                <p className="text-muted-foreground/50 text-xs mt-2 italic">
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
        </div>
      </div>

      {/* ─── 2FA Section ───────────────────────────────────────────────────────────── */}
      <TwoFASection />

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Фильмов",
            value: totalMovies,
            icon: Film,
            colorClass: "text-foreground",
            sub: totalMovies === 1 ? "в библиотеке" : "в библиотеке",
          },
          {
            label: "Ср. оценка",
            value: avgRating,
            icon: Star,
            colorClass: "text-primary",
            sub: totalMovies > 0 ? "из 10" : "пока нет",
          },
          {
            label: "Жанров",
            value: profile?.favoriteGenres?.length || 0,
            icon: Sparkles,
            colorClass: "text-secondary",
            sub: (profile?.favoriteGenres?.length || 0) > 0 ? "любимых" : "не выбрано",
          },
        ].map(({ label, value, icon: Icon, colorClass, sub }) => (
          <div
            key={label}
            className="bg-card border border-border rounded-2xl p-4 text-center shadow-sm hover:border-border/70 transition"
          >
            <Icon className={`w-5 h-5 ${colorClass} mx-auto mb-2 opacity-70`} />
            <p className={`text-2xl font-black ${colorClass}`}>{value}</p>
            <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mt-0.5">
              {label}
            </p>
            <p className="text-muted-foreground/50 text-[9px] mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Recent Watches ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Library className="w-4 h-4 text-primary" />
            Последние просмотренные
          </h2>
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
          <h2 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary" />
            Активность
          </h2>
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

      {/* ── Quick links ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { to: "/recommendations", icon: Sparkles, label: "Рекомендации", desc: "Персональная подборка AI" },
          { to: "/ai", icon: Bot, label: "AI-ассистент", desc: "Чат по фильмам" },
          { to: "/friends", icon: Users, label: "Друзья", desc: "Список друзей" },
        ].map(({ to, icon: Icon, label, desc }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="bg-card border border-border rounded-2xl p-4 text-left hover:border-primary/30 hover:bg-muted/30 hover:shadow-sm transition-all group"
          >
            <Icon className="w-5 h-5 text-primary mb-2.5 group-hover:scale-110 transition-transform" />
            <p className="text-foreground text-sm font-bold">{label}</p>
            <p className="text-muted-foreground text-xs mt-0.5 leading-snug">{desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── 2FA Section ─────────────────────────────────────────────────────────────
function TwoFASection() {
  const [status, setStatus] = useState<{ enabled: boolean; masked: string } | null>(null);
  const [loading, setLoading] = useState(true);

  // phone setup form
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [showPhoneForm, setShowPhoneForm] = useState(false);

  // test OTP flow
  const [testOtp, setTestOtp] = useState("");
  const [testStep, setTestStep] = useState<"idle" | "sent" | "done">("idle");
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState("");
  const [cooldown, setCooldown] = useState(0);

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

  const handleSavePhone = async () => {
    if (!phoneInput.trim()) return;
    setPhoneLoading(true);
    try {
      await savePhone(phoneInput, true);
      const s = await get2FAStatus();
      setStatus(s);
      setShowPhoneForm(false);
      setPhoneInput("");
      toast.success("2FA включена! Телефон привязан.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!confirm("Отключить двухфакторную аутентификацию?")) return;
    setPhoneLoading(true);
    try {
      // Get the real phone number from profile (masked version is not usable)
      const profile = await getProfile();
      const realPhone = profile?.phone;
      if (!realPhone) throw new Error("Номер телефона не найден в профиле");
      await savePhone(realPhone, false);
      const s = await get2FAStatus();
      setStatus(s);
      toast.success("2FA отключена");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSendTestOtp = async () => {
    if (cooldown > 0) return;
    setTestLoading(true);
    setTestError("");
    try {
      await sendOtp();
      setTestStep("sent");
      setCooldown(60);
      toast.success("Тестовый код отправлен на ваш номер");
    } catch (e: any) {
      // Handle 429 rate limit — parse remaining seconds from server message
      const waitMatch = e.message?.match(/(\d+)\s*сек/);
      if (waitMatch) {
        const waitSec = parseInt(waitMatch[1]);
        setCooldown(waitSec);
        setTestError(`Код уже был отправлен. Подождите ${waitSec} сек.`);
      } else {
        setTestError(e.message);
      }
    } finally {
      setTestLoading(false);
    }
  };

  const handleVerifyTestOtp = async () => {
    if (!testOtp || testOtp.length < 6) { setTestError("Введите 6-значный код"); return; }
    setTestLoading(true);
    setTestError("");
    try {
      await verifyOtp(testOtp);
      setTestStep("done");
      setTestOtp("");
      toast.success("Код верный! 2FA работает корректно ✓");
    } catch (e: any) {
      setTestError(e.message);
      setTestOtp("");
    } finally {
      setTestLoading(false);
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
            <p className="text-xs text-muted-foreground mt-0.5">SMS-подтверждение при входе</p>
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
        {status?.enabled ? (
          <>
            {/* Active 2FA info */}
            <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/20 rounded-xl p-3.5">
              <Smartphone className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-foreground text-xs font-semibold">Привязанный номер</p>
                <p className="text-muted-foreground text-xs mt-0.5">{status.masked}</p>
              </div>
            </div>

            {/* Test OTP */}
            <div>
              <p className="text-xs text-muted-foreground mb-2">Проверить работу 2FA:</p>
              {testStep === "idle" && (
                <div className="space-y-2">
                  <button
                    onClick={handleSendTestOtp}
                    disabled={testLoading || cooldown > 0}
                    className="flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-muted border border-border hover:border-primary/30 text-foreground disabled:opacity-50 transition-all"
                  >
                    {testLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <RefreshCw className="w-3.5 h-3.5" />}
                    {cooldown > 0 ? `Подождите ${cooldown}с` : "Отправить тестовый код"}
                  </button>
                  {testError && <p className="text-destructive text-xs">{testError}</p>}
                </div>
              )}
              {testStep === "sent" && (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      value={testOtp}
                      onChange={(e) => { setTestOtp(e.target.value.replace(/\D/g, "").slice(0, 6)); setTestError(""); }}
                      placeholder="000000"
                      className="flex-1 bg-muted border border-border rounded-xl px-3.5 py-2 text-foreground text-sm text-center tracking-[0.3em] font-black focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
                      maxLength={6}
                    />
                    <button
                      onClick={handleVerifyTestOtp}
                      disabled={testLoading || testOtp.length < 6}
                      className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold disabled:opacity-50 hover:bg-primary/90 transition"
                    >
                      {testLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "OK"}
                    </button>
                  </div>
                  {testError && <p className="text-destructive text-xs">{testError}</p>}
                </div>
              )}
              {testStep === "done" && (
                <div className="flex items-center gap-2 text-green-600 text-xs font-semibold">
                  <Check className="w-4 h-4" /> 2FA работает корректно!
                  <button onClick={() => setTestStep("idle")} className="text-muted-foreground underline ml-2">Проверить снова</button>
                </div>
              )}
            </div>

            {/* Disable */}
            <div className="pt-2 border-t border-border">
              <button
                onClick={handleDisable2FA}
                disabled={phoneLoading}
                className="flex items-center gap-2 text-xs text-destructive hover:bg-destructive/10 px-3 py-2 rounded-xl transition-colors font-medium"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Отключить 2FA
              </button>
            </div>
          </>
        ) : (
          <>
            {/* How it works */}
            <div className="flex items-start gap-3 bg-muted/50 rounded-xl p-3.5">
              <ShieldAlert className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                При включённой 2FA каждый вход потребует ввода SMS-кода, отправленного на ваш телефон. Это защищает аккаунт даже при компрометации пароля.
              </p>
            </div>

            {/* Phone form */}
            {!showPhoneForm ? (
              <button
                onClick={() => setShowPhoneForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition shadow-sm"
              >
                <Phone className="w-4 h-4" />
                Привязать номер и включить 2FA
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1.5">
                    Номер телефона
                  </label>
                  <input
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+7 (700) 000-00-00"
                    className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition placeholder:text-muted-foreground/40"
                    type="tel"
                  />
                  <p className="text-muted-foreground text-[10px] mt-1">Формат: +7XXXXXXXXXX или 8XXXXXXXXXX</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowPhoneForm(false); setPhoneInput(""); }}
                    className="flex-1 px-3 py-2 rounded-xl text-xs font-semibold text-muted-foreground bg-muted border border-border hover:text-foreground transition"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={handleSavePhone}
                    disabled={phoneLoading || !phoneInput.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-50 transition shadow-sm"
                  >
                    {phoneLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    Включить 2FA
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