import { useState, useEffect } from "react";
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
import { useLang } from "../lib/lang-context";

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
function RecommendationCard({ rec, onOpen }: { rec: any; onOpen: () => void }) {
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
              onClick={() => onOpen()}
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

// ── Request card ───────────────────────────────────────────────────────────────
function RequestCard({
  request,
  onAccept,
  onDecline,
  loading,
}: {
  request: any;
  onAccept: () => void;
  onDecline: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3 shadow-sm"
    >
      <Avatar name={request.fromName || "?"} />
      <div className="flex-1 min-w-0">
        <p className="text-foreground font-semibold text-sm">{request.fromName}</p>
        <p className="text-muted-foreground text-xs">{request.fromEmail}</p>
      </div>
      <div className="flex gap-2 shrink-0">
        <button
          onClick={onAccept}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition"
        >
          <Check className="w-3.5 h-3.5" /> Принять
        </button>
        <button
          onClick={onDecline}
          className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border flex items-center justify-center transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export function FriendsPage() {
  const navigate = useNavigate();
  const { t } = useLang();
  const [tab, setTab] = useState<Tab>("friends");
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchEmail, setSearchEmail] = useState("");
  const [sendingReq, setSendingReq] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

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

  const handleSendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSendingReq(true);
    try {
      await sendFriendRequest(searchEmail);
      toast.success("Запрос дружбы отправлен!");
      setSearchEmail("");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSendingReq(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionId(id);
    await acceptFriend(id);
    toast.success("Друг добавлен!");
    load();
    setActionId(null);
  };

  const handleDecline = async (id: string) => {
    setActionId(id);
    await rejectFriend(id);
    toast.info("Запрос отклонён");
    load();
    setActionId(null);
  };

  const handleRemoveFriend = async (id: string) => {
    if (!confirm("Удалить из друзей?")) return;
    await removeFriend(id);
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Users className="w-5.5 h-5.5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">{t("friendsTitle")}</h1>
          <p className="text-muted-foreground text-sm">{friends.length} {t("myFriendsList")}</p>
        </div>
      </div>

      {/* Add friend */}
      <form onSubmit={handleSendRequest} className="flex gap-2.5 mb-6">
        <div className="relative flex-1">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder={t("searchByEmail")}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-3 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
          />
        </div>
        <button
          type="submit"
          disabled={sendingReq || !searchEmail.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm"
        >
          {sendingReq ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
          {t("sendRequest")}
        </button>
      </form>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-muted p-1 rounded-xl">
        {(["friends", "requests", "recommendations"] as Tab[]).map((tabKey) => (
          <button
            key={tabKey}
            onClick={() => setTab(tabKey)}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === tabKey ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
          >
            {tabKey === "friends" ? t("myFriendsList") : tabKey === "requests" ? `${t("requestsTab")} ${requests.length > 0 ? `(${requests.length})` : ""}` : t("recommendationsTab")}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <div className="flex justify-center py-20"><Loader2 className="w-7 h-7 text-primary animate-spin" /></div>}

      {/* Friends tab */}
      {!loading && tab === "friends" && (
        <div className="space-y-2">
          {friends.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Users className="w-12 h-12 text-muted-foreground/20" />
              <div>
                <p className="font-semibold text-foreground">{t("noFriends")}</p>
                <p className="text-muted-foreground text-sm mt-1">{t("noFriendsDesc")}</p>
              </div>
            </div>
          ) : (
            friends.map((f) => (
              <FriendCard
                key={f.id}
                friend={f}
                onRemove={() => handleRemoveFriend(f.id)}
                onProfile={() => navigate(`/friends/${f.id}`)}
              />
            ))
          )}
        </div>
      )}

      {/* Requests tab */}
      {!loading && tab === "requests" && (
        <div className="space-y-2">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Bell className="w-12 h-12 text-muted-foreground/20" />
              <p className="text-muted-foreground">{t("noRequests")}</p>
            </div>
          ) : (
            <>
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">{t("incomingRequests")}</p>
              {requests.map((r) => (
                <RequestCard
                  key={r.id}
                  request={r}
                  onAccept={() => handleAccept(r.id)}
                  onDecline={() => handleDecline(r.id)}
                  loading={actionId === r.id}
                />
              ))}
            </>
          )}
        </div>
      )}

      {/* Recommendations tab */}
      {!loading && tab === "recommendations" && (
        <div className="space-y-3">
          {recommendations.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-20 text-center">
              <Film className="w-12 h-12 text-muted-foreground/20" />
              <p className="text-muted-foreground">{t("noRecommendations")}</p>
            </div>
          ) : (
            recommendations.map((rec) => (
              <RecommendationCard
                key={rec.id}
                rec={rec}
                onOpen={() => { navigate(`/movie/${rec.movieId}`); markRecommendationSeen(rec.id).catch(() => {}); }}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}