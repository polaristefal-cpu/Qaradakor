import { useState } from "react";
import { useLang } from "../lib/lang-context";
import { api } from "../lib/api";
import { Search, Shield, Loader2 } from "lucide-react";

interface UserResult {
  id: string;
  username: string;
  email: string;
  phone_number?: string;
  is_admin: boolean;
  is_blocked: boolean;
  total_ratings: number;
}

export function AdminUserSearchPage() {
  const { t, lang } = useLang();
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [user, setUser] = useState<UserResult | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function searchUser() {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setNotFound(false);
    setUser(null);

    try {
      const users = await api.get<UserResult[]>("/admin/users");
      const query = searchQuery.trim().toLowerCase();
      
      const found = users.find(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.phone_number && u.phone_number.includes(query))
      );

      if (found) {
        setUser(found);
      } else {
        setNotFound(true);
      }
    } catch (err) {
      console.error("Search error:", err);
      alert(t("errorLoadingData"));
    } finally {
      setSearching(false);
    }
  }

  async function toggleAdminStatus() {
    if (!user) return;

    if (!confirm(user.is_admin ? t("confirmRemoveAdmin") : t("confirmMakeAdmin"))) return;

    setUpdating(true);
    try {
      await api.post(`/admin/users/${user.id}/toggle-admin`, {});
      setUser({ ...user, is_admin: !user.is_admin });
      alert(`✅ ${user.is_admin ? t("removeAdmin") : t("makeAdmin")} — ${t("save")}`);
    } catch (err) {
      console.error("Toggle admin error:", err);
      alert(t("errorUpdatingUser"));
    } finally {
      setUpdating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{t("searchUsers")}</h1>
          <p className="text-foreground/60">
            {lang === "ru"
              ? "Быстрый поиск для выдачи прав администратора"
              : lang === "kz"
              ? "Әкімші құқықтарын беру үшін жылдам іздеу"
              : "Quick search to grant admin rights"}
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-background border border-border rounded-lg p-6 mb-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
              <input
                type="text"
                placeholder={
                  lang === "ru"
                    ? "Email, имя или номер телефона..."
                    : lang === "kz"
                    ? "Email, аты немесе телефон нөмірі..."
                    : "Email, name or phone number..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUser()}
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>
            <button
              onClick={searchUser}
              disabled={searching || !searchQuery.trim()}
              className="px-6 py-3 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              {t("search")}
            </button>
          </div>
        </div>

        {/* Not Found */}
        {notFound && (
          <div className="bg-background border border-border rounded-lg p-8 text-center">
            <p className="text-foreground/60">{t("noUsersFound")}</p>
          </div>
        )}

        {/* User Card */}
        {user && (
          <div className="bg-background border border-border rounded-lg p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold mb-1">{user.username}</h2>
                <p className="text-foreground/60 text-sm">{user.email}</p>
                {user.phone_number && (
                  <p className="text-foreground/60 text-sm">{user.phone_number}</p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <span
                  className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    user.is_admin
                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                      : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                  }`}
                >
                  {user.is_admin ? t("admin") : t("user")}
                </span>
                {user.is_blocked && (
                  <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                    {t("blocked")}
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-foreground/5 rounded-lg">
              <div className="text-center">
                <div className="text-2xl font-bold">{user.total_ratings}</div>
                <div className="text-xs text-foreground/60">{t("ratings")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.total_ratings}</div>
                <div className="text-xs text-foreground/60">{t("moviesWatched")}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{user.is_admin ? "✓" : "—"}</div>
                <div className="text-xs text-foreground/60">{t("admin")}</div>
              </div>
            </div>

            <button
              onClick={toggleAdminStatus}
              disabled={updating}
              className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                user.is_admin
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-purple-600 text-white hover:bg-purple-700"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {updating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              {user.is_admin ? t("removeAdmin") : t("makeAdmin")}
            </button>
          </div>
        )}

        {/* Quick Help */}
        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-900 dark:text-blue-300">
            💡{" "}
            {lang === "ru"
              ? "Введите номер +77763933336 для поиска нужного пользователя"
              : lang === "kz"
              ? "Қажетті пайдаланушыны іздеу үшін +77763933336 нөмірін енгізіңіз"
              : "Enter +77763933336 to search for the specific user"}
          </p>
        </div>
      </div>
    </div>
  );
}
