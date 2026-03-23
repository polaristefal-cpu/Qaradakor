import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { signup, login } from "../lib/api";
import { Clapperboard, UserPlus } from "lucide-react";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signup(email, password, name);
      await login(email, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition";
  const labelClass = "text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--color-primary)/8%_0%,_transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform">
              <Clapperboard className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-2xl font-black text-foreground">
              qaradakor<span className="text-primary text-lg">.kz</span>
            </span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">Создайте аккаунт — это бесплатно</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-lg font-black text-foreground">Регистрация</h2>
            <p className="text-muted-foreground text-xs mt-0.5">Заполните данные для создания аккаунта</p>
          </div>

          {error && (
            <div className="bg-destructive/10 border border-destructive/25 text-destructive text-xs rounded-xl p-3">
              {error}
            </div>
          )}

          <div>
            <label className={labelClass}>Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
              placeholder="Ваше имя"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
              placeholder="Минимум 6 символов"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 text-sm"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {loading ? "Создание аккаунта..." : "Создать аккаунт"}
          </button>

          {/* Benefits */}
          <div className="bg-muted rounded-xl p-3 space-y-1.5">
            {["Личная кинобиблиотека", "AI-рекомендации", "Система друзей", "AI-чатбот"].map((f) => (
              <div key={f} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-primary shrink-0" />
                <span className="text-muted-foreground text-xs">{f}</span>
              </div>
            ))}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Уже есть аккаунт?{" "}
            <Link to="/login" className="text-primary hover:underline font-semibold">
              Войти
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
