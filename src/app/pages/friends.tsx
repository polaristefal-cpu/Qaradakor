import { useEffect, useState } from "react";
import {
  getFriends, getFriendRequests, sendFriendRequest,
  acceptFriend, rejectFriend, removeFriend,
  getFriendRecommendations, markRecommendationSeen,
  TMDB_IMG,
} from "../lib/api";
import {
  Users, UserPlus, Check, X, Trash2, Loader2,
  Mail, Film, Star, Send, Bell, Eye, ChevronRight, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router";

type Tab = "friends" | "requests" | "recommendations";

// ── Avatar initials ────────────────────────────────────────────────────────────
function Avatar({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
  return (
    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 border-2 border-primary/25 flex items-center justify-center font-black text-primary text-sm shrink-0">
      {initials || "?"}
    </div>
  );
}

// ── Friend card ────────────────────────────────────────────────────────────────
function FriendCard({
  friend,
  onRemove,
  onProfile,
}: {
  friend: any;
  onRemove: () => void;
  onProfile: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:border-primary/20 transition-all group">
      <Avatar name={friend.name || "?"} />

      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold text-sm">{friend.name}</p>
        <p className="text-muted-foreground text-xs truncate">{friend.email}</p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        {/* View profile */}
        <button
          onClick={onProfile}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-all"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Профиль</span>
          <ChevronRight className="w-3 h-3" />
        </button>

        {/* Remove */}
        <button
          onClick={onRemove}
          className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all"
          title="Удалить из друзей"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Recommendation card ────────────────────────────────────────────────────────
function RecommendCard({ rec, onMarkSeen }: { rec: any; onMarkSeen: (id: string) => void }) {
  const navigate = useNavigate();
  return (
    <div
      className={`bg-card border rounded-2xl p-4 shadow-sm transition-all ${
        rec.seen ? "border-border opacity-70" : "border-primary/30 shadow-primary/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Poster */}
        <button onClick={() => navigate(`/movie/${rec.movieId}`)} className="shrink-0">
          {rec.posterPath ? (
            <img
              src={`${TMDB_IMG}/w92${rec.posterPath}`}
              alt={rec.movieTitle}
              className="w-12 h-[72px] object-cover rounded-xl hover:opacity-80 transition"
            />
          ) : (
            <div className="w-12 h-[72px] bg-muted rounded-xl flex items-center justify-center">
              <Film className="w-5 h-5 text-muted-foreground/30" />
            </div>
          )}
        </button>

        <div className="flex-1 min-w-0">
          {/* From badge */}
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-4 h-4 rounded-md bg-primary/15 flex items-center justify-center text-primary text-[9px] font-black">
              {(rec.fromName || "?")[0].toUpperCase()}
            </div>
            <span className="text-muted-foreground text-[11px]">{rec.fromName} советует</span>
            {!rec.seen && (
              <span className="bg-primary text-primary-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full">НОВОЕ</span>
            )}
          </div>

          {/* Movie title */}
          <button
            onClick={() => navigate(`/movie/${rec.movieId}`)}
            className="text-foreground font-semibold text-sm text-left hover:text-primary transition line-clamp-1"
          >
            {rec.movieTitle}
          </button>

          {/* Note */}
          {rec.note && (
            <p className="text-muted-foreground text-xs mt-1 line-clamp-2 italic">«{rec.note}»</p>
          )}

          {/* Date */}
          <p className="text-muted-foreground/50 text-[10px] mt-1.5 flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {rec.createdAt
              ? new Date(rec.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })
              : ""}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={() => navigate(`/movie/${rec.movieId}`)}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
          >
            Смотреть
          </button>
          {!rec.seen && (
            <button
              onClick={() => onMarkSeen(rec.id)}
              className="px-3 py-1.5 rounded-lg bg-muted border border-border text-muted-foreground text-xs hover:text-foreground transition text-center"
            >
              Отметить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function FriendsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [f, r] = await Promise.all([getFriends(), getFriendRequests()]);
      setFriends(f || []);
      setRequests(r || []);
    } catch { /* ignore */ }

    try {
      const recs = await getFriendRecommendations();
      setRecommendations(Array.isArray(recs) ? recs : []);
    } catch {
      setRecommendations([]);
    }

    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try {
      await sendFriendRequest(email);
      toast.success("Запрос дружбы отправлен!");
      setEmail("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleAccept = async (fromId: string) => {
    await acceptFriend(fromId);
    toast.success("Друг добавлен!");
    load();
  };

  const handleReject = async (fromId: string) => {
    await rejectFriend(fromId);
    toast.info("Запрос отклонён");
    load();
  };

  const handleRemove = async (friendId: string) => {
    if (!confirm("Удалить из друзей?")) return;
    await removeFriend(friendId);
    toast.success("Удалён из друзей");
    load();
  };

  const handleMarkSeen = async (recId: string) => {
    try {
      await markRecommendationSeen(recId);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === recId ? { ...r, seen: true } : r))
      );
    } catch { /* ignore */ }
  };

  const newRecs = recommendations.filter((r) => !r.seen).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Users className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Друзья</h1>
          <p className="text-muted-foreground text-sm">
            {friends.length} друг{friends.length === 1 ? "" : friends.length < 5 ? "а" : "ей"} · смотрите профили и рекомендации
          </p>
        </div>
      </div>

      {/* Add friend */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-foreground font-bold flex items-center gap-2 mb-3 text-sm">
          <UserPlus className="w-4 h-4 text-primary" /> Добавить друга по email
        </h3>
        <form onSubmit={handleSend} className="flex gap-2.5">
          <div className="relative flex-1">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              className="w-full bg-muted border border-border rounded-xl pl-9 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground/50 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition"
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0 flex items-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Отправить
          </button>
        </form>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted p-1 rounded-xl border border-border">
        {([
          { key: "friends", label: "Друзья", count: friends.length },
          { key: "requests", label: "Запросы", count: requests.length },
          { key: "recommendations", label: "Рекомендации", count: newRecs },
        ] as { key: Tab; label: string; count: number }[]).map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === key
                ? "bg-card text-foreground shadow-sm border border-border"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {count > 0 && (
              <span
                className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  tab === key ? "bg-primary text-primary-foreground" : "bg-border text-muted-foreground"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab: Friends ───────────────────────────────────────────────────── */}
      {tab === "friends" && (
        <div>
          {friends.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-muted border border-border inline-flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-foreground font-semibold text-sm">Нет друзей</p>
              <p className="text-muted-foreground text-xs mt-1">Отправьте запрос по email выше</p>
            </div>
          ) : (
            <div className="space-y-2">
              {friends.map((f: any) => (
                <FriendCard
                  key={f.id}
                  friend={f}
                  onRemove={() => handleRemove(f.id)}
                  onProfile={() =>
                    navigate(`/friends/${f.id}`, {
                      state: { name: f.name, email: f.email },
                    })
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Requests ──────────────────────────────────────────────────── */}
      {tab === "requests" && (
        <div>
          {requests.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-muted border border-border inline-flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-foreground font-semibold text-sm">Нет входящих запросов</p>
              <p className="text-muted-foreground text-xs mt-1">Когда кто-то пришлёт запрос, он появится здесь</p>
            </div>
          ) : (
            <div className="space-y-2">
              {requests.map((r: any) => (
                <div
                  key={r.fromId}
                  className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm"
                >
                  <Avatar name={r.fromName || "?"} />
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground font-semibold text-sm">{r.fromName}</p>
                    <p className="text-muted-foreground text-xs">{r.fromEmail}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleAccept(r.fromId)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
                    >
                      <Check className="w-3.5 h-3.5" /> Принять
                    </button>
                    <button
                      onClick={() => handleReject(r.fromId)}
                      className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border flex items-center justify-center transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Recommendations ───────────────────────────────────────────── */}
      {tab === "recommendations" && (
        <div>
          {recommendations.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border rounded-2xl">
              <div className="w-14 h-14 rounded-2xl bg-muted border border-border inline-flex items-center justify-center mb-4">
                <Film className="w-7 h-7 text-muted-foreground/30" />
              </div>
              <p className="text-foreground font-semibold text-sm">Нет рекомендаций</p>
              <p className="text-muted-foreground text-xs mt-1">
                Друзья могут рекомендовать фильмы прямо из профиля
              </p>
              <button
                onClick={() => setTab("friends")}
                className="mt-4 text-primary text-sm hover:underline"
              >
                Перейти к друзьям →
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Unseen first */}
              {recommendations
                .slice()
                .sort((a, b) => (a.seen === b.seen ? 0 : a.seen ? 1 : -1))
                .map((rec) => (
                  <RecommendCard
                    key={rec.id}
                    rec={rec}
                    onMarkSeen={handleMarkSeen}
                  />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
