import { useEffect, useState } from "react";
import { getProfile, updateProfile, getWatched, getMovieBasic, get2FAStatus, setup2FASend, setup2FAConfirm, disable2FA, TMDB_IMG } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useNavigate } from "react-router";
import {
  Star, Film, Edit3, Check, X,
  Loader2, Library, Sparkles, Calendar,
  Users, Bot, TrendingUp, Smartphone, ShieldCheck,
  ShieldOff, ShieldAlert, Eye, EyeOff, Phone, ArrowLeft,
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
        {/* ── 2FA ENABLED STATE ── */}
        {status?.enabled && (
          <>
            <div className="flex items-center gap-3 bg-green-500/8 border border-green-500/20 rounded-xl p-3.5">
              <Smartphone className="w-4 h-4 text-green-500 shrink-0" />
              <div>
                <p className="text-foreground text-xs font-semibold">Привязанный ном��р</p>
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
                  При включённой 2FA каждый вход потребует ввода SMS-кода. Это защищает аккаунт даже при утечке пароля.
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
                  <p className="text-sm font-bold text-foreground">Шаг 2 из 2 — Введите код из SMS</p>
                </div>

                <div className="flex items-center gap-3 bg-primary/8 border border-primary/20 rounded-xl p-3.5">
                  <Smartphone className="w-4 h-4 text-primary shrink-0" />
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Код отправлен на <span className="text-foreground font-semibold">{maskedPhone || phoneInput}</span>
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