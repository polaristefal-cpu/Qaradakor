import { useEffect, useState } from "react";
import {
  getFriends, getFriendRequests, sendFriendRequest,
  acceptFriend, rejectFriend, removeFriend, getFriendWatched, getMovie,
} from "../lib/api";
import { MovieCard } from "../components/movie-card";
import { Users, UserPlus, Check, X, Trash2, Loader2, ChevronDown, ChevronUp, Mail } from "lucide-react";
import { toast } from "sonner";

export function FriendsPage() {
  const [friends, setFriends] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [friendMovies, setFriendMovies] = useState<Record<string, any[]>>({});
  const [loadingMovies, setLoadingMovies] = useState<string | null>(null);

  const load = async () => {
    try {
      const [f, r] = await Promise.all([getFriends(), getFriendRequests()]);
      setFriends(f); setRequests(r);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    try { await sendFriendRequest(email); toast.success("Запрос отправлен!"); setEmail(""); }
    catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  };

  const handleAccept = async (fromId: string) => { await acceptFriend(fromId); toast.success("Друг добавлен!"); load(); };
  const handleReject = async (fromId: string) => { await rejectFriend(fromId); load(); };
  const handleRemove = async (friendId: string) => { await removeFriend(friendId); toast.success("Удалён из друзей"); load(); };

  const toggleFriend = async (friendId: string) => {
    if (expanded === friendId) { setExpanded(null); return; }
    setExpanded(friendId);
    if (friendMovies[friendId]) return;
    setLoadingMovies(friendId);
    try {
      const watched = await getFriendWatched(friendId);
      if (watched.length === 0) { setFriendMovies(prev => ({ ...prev, [friendId]: [] })); return; }
      const details = await Promise.all(watched.slice(0, 10).map(async (w: any) => {
        try { const m = await getMovie(w.movieId); return { ...m, _rating: w.rating }; }
        catch { return null; }
      }));
      setFriendMovies(prev => ({ ...prev, [friendId]: details.filter(Boolean) }));
    } finally { setLoadingMovies(null); }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-9 h-9 text-primary animate-spin" />
        <p className="text-muted-foreground text-sm">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-7">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Users className="w-5.5 h-5.5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-foreground">Друзья</h1>
          <p className="text-muted-foreground text-sm">Смотрите библиотеки и рекомендации друзей</p>
        </div>
      </div>

      {/* Add friend */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="text-foreground font-bold flex items-center gap-2 mb-4 text-sm">
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
            type="submit" disabled={sending}
            className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Отправить"}
          </button>
        </form>
      </div>

      {/* Incoming requests */}
      {requests.length > 0 && (
        <div>
          <h3 className="text-foreground font-bold text-sm mb-3 flex items-center gap-2">
            Входящие запросы
            <span className="bg-primary text-primary-foreground text-[10px] font-black px-1.5 py-0.5 rounded-full">{requests.length}</span>
          </h3>
          <div className="space-y-2">
            {requests.map((r: any) => (
              <div key={r.fromId} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-foreground font-semibold text-sm">{r.fromName}</p>
                  <p className="text-muted-foreground text-xs">{r.fromEmail}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleAccept(r.fromId)} className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground border border-primary/20 flex items-center justify-center transition-all">
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleReject(r.fromId)} className="w-8 h-8 rounded-lg bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive border border-border flex items-center justify-center transition-all">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <h3 className="text-foreground font-bold text-sm flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-primary" />
          Друзья ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-14 bg-card border border-border rounded-2xl">
            <div className="w-14 h-14 rounded-2xl bg-muted border border-border inline-flex items-center justify-center mb-4">
              <Users className="w-7 h-7 text-muted-foreground/30" />
            </div>
            <p className="text-foreground font-semibold text-sm">Нет друзей</p>
            <p className="text-muted-foreground text-xs mt-1">Отправьте запрос по email выше</p>
          </div>
        ) : (
          <div className="space-y-2">
            {friends.map((f: any) => (
              <div key={f.id} className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                <div className="p-4 flex items-center gap-3">
                  <button onClick={() => toggleFriend(f.id)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-sm shrink-0">
                      {(f.name || "?")[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground font-semibold text-sm">{f.name}</p>
                      <p className="text-muted-foreground text-xs truncate">{f.email}</p>
                    </div>
                    {expanded === f.id
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
                  </button>
                  <button onClick={() => handleRemove(f.id)} className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex items-center justify-center transition-all shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {expanded === f.id && (
                  <div className="border-t border-border p-4">
                    {loadingMovies === f.id ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : (friendMovies[f.id]?.length || 0) === 0 ? (
                      <p className="text-muted-foreground text-sm text-center py-4">Библиотека пуста</p>
                    ) : (
                      <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-10 gap-2">
                        {friendMovies[f.id]?.map((m: any) => (
                          <MovieCard key={m.id} movie={m} rating={m._rating} compact />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
