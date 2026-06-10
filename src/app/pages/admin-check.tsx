import { useState } from "react";
import { Shield, User, Loader2 } from "lucide-react";
import { api } from "../lib/api";

interface AdminInfo {
  id: string;
  username: string;
  email: string;
  phone_number?: string;
}

export function AdminCheckPage() {
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<AdminInfo[]>([]);
  const [error, setError] = useState("");

  async function checkAdmins() {
    setLoading(true);
    setError("");
    try {
      const users = await api.get<any[]>("/admin/users");
      const adminUsers = users.filter(u => u.is_admin);
      setAdmins(adminUsers);
      if (adminUsers.length === 0) {
        setError("В системе нет ни одного администратора! Используйте /admin/bootstrap");
      }
    } catch (err: any) {
      // Если получили 403 - значит мы не админ, но можем попробовать bootstrap
      if (err.message?.includes("403") || err.message?.includes("Forbidden")) {
        setError("У вас нет прав для просмотра. Попробуйте /admin/bootstrap если вы первый пользователь.");
      } else {
        setError(`Ошибка: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        <div className="border border-foreground/10 rounded-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold">Проверка администраторов</h1>
              <p className="text-sm text-foreground/60">
                Проверьте, кто в системе имеет права администратора
              </p>
            </div>
          </div>

          <button
            onClick={checkAdmins}
            disabled={loading}
            className="w-full py-3 px-4 bg-foreground text-background rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 mb-6"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Проверка...
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                Проверить администраторов
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-lg p-4 mb-6 text-sm">
              {error}
            </div>
          )}

          {admins.length > 0 && (
            <div className="space-y-3">
              <h2 className="font-semibold text-lg mb-3">
                Администраторы в системе ({admins.length}):
              </h2>
              {admins.map((admin) => (
                <div
                  key={admin.id}
                  className="bg-foreground/5 border border-foreground/10 rounded-lg p-4"
                >
                  <div className="flex items-start gap-3">
                    <User className="w-5 h-5 text-foreground/60 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-medium">{admin.username}</div>
                      <div className="text-sm text-foreground/60">{admin.email}</div>
                      {admin.phone_number && (
                        <div className="text-sm text-foreground/60">{admin.phone_number}</div>
                      )}
                    </div>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400">
                      Админ
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm">
            <p className="font-medium mb-2">💡 Как получить права администратора:</p>
            <ul className="space-y-1 text-blue-900 dark:text-blue-300">
              <li>• Если вы <strong>первый пользователь</strong> → перейдите на <strong>/admin/bootstrap</strong></li>
              <li>• Если уже есть администратор → попросите его выдать вам права</li>
              <li>• Администратор может выдать права через <strong>/admin/user-search</strong></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
