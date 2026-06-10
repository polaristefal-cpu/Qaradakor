import { useState } from "react";
import { useNavigate } from "react-router";
import { Shield, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";
import { bootstrapAdmin } from "../lib/api";
import { useLang } from "../lib/lang-context";
import { useAuth } from "../lib/auth-context";

export function AdminBootstrapPage() {
  const { session } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; message?: string; email?: string; error?: string } | null>(null);

  async function handleBootstrap() {
    if (!session) {
      navigate("/login");
      return;
    }
    setLoading(true);
    try {
      const res = await bootstrapAdmin();
      setResult(res);
      if (res.ok) {
        setTimeout(() => navigate("/admin/dashboard"), 2000);
      }
    } catch (e: any) {
      setResult({ error: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="border border-foreground/10 rounded-xl p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 rounded-full bg-foreground/5 flex items-center justify-center">
              <Shield className="w-8 h-8 text-foreground" />
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold mb-2">Admin Bootstrap</h1>
            <p className="text-foreground/60 text-sm">
              Эта страница позволяет первому пользователю получить права администратора.
              Работает только если в системе ещё нет ни одного администратора.
            </p>
          </div>

          {session ? (
            <div className="text-sm text-foreground/60 bg-foreground/5 rounded-lg px-4 py-2">
              Текущий аккаунт: <span className="font-medium text-foreground">{session.user.email}</span>
            </div>
          ) : (
            <div className="text-sm text-foreground/60 bg-foreground/5 rounded-lg px-4 py-2">
              Войдите в систему для получения прав
            </div>
          )}

          {result && (
            <div
              className={`rounded-lg px-4 py-3 text-sm flex items-center gap-2 ${
                result.ok
                  ? "bg-foreground/5 border border-foreground/20"
                  : "bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400"
              }`}
            >
              {result.ok ? (
                <>
                  <CheckCircle className="w-4 h-4 shrink-0 text-foreground" />
                  <span>
                    {result.message || "Права администратора выданы!"} — {result.email}
                    <br />
                    <span className="text-foreground/50">Перенаправление...</span>
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{result.error}</span>
                </>
              )}
            </div>
          )}

          <button
            onClick={handleBootstrap}
            disabled={loading || !session || !!result?.ok}
            className="w-full py-3 px-4 bg-foreground text-background rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Проверка...
              </>
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Получить права администратора
              </>
            )}
          </button>

          <p className="text-xs text-foreground/40">
            После получения прав вы будете перенаправлены в панель управления.
            Повторный вызов безопасен — если вы уже администратор, ничего не изменится.
          </p>
        </div>
      </div>
    </div>
  );
}
