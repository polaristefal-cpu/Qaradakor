import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { login, logout, get2FAStatus, sendOtp, verifyOtp } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import {
  Clapperboard, Eye, EyeOff, LogIn,
  Smartphone, ShieldCheck, RefreshCw, ArrowLeft,
} from "lucide-react";

type Step = "credentials" | "otp";

export function LoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const { session } = useAuth();
  const navigate = useNavigate();

  // Step 1
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 2 — OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If user is already logged in and NOT in 2FA OTP step → redirect to home
  useEffect(() => {
    if (session && step === "credentials") {
      navigate("/", { replace: true });
    }
  }, [session, step, navigate]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // ── Step 1: email + password ──────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      // Check if 2FA is enabled for this user
      const status = await get2FAStatus();
      if (status.enabled) {
        // Send OTP — handle 429 (too many requests) gracefully
        try {
          const res = await sendOtp();
          setMaskedPhone(res.masked || status.masked || "");
          setResendCooldown(60);
        } catch (otpErr: any) {
          // Parse remaining wait time from server error message (e.g. "Подождите 45 сек.")
          const waitMatch = otpErr.message?.match(/(\d+)\s*сек/);
          const waitSec = waitMatch ? parseInt(waitMatch[1]) : 60;
          setResendCooldown(waitSec);
          setMaskedPhone(status.masked || "");
          // Still proceed to OTP step — user can wait and resend
        }
        setStep("otp");
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
      // If login succeeded but something else failed, sign out to be safe
      try { await logout(); } catch {}
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input helpers ─────────────────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // ── Step 2: verify OTP ────────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setOtpError("Введите 6-значный код");
      return;
    }
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyOtp(code);
      navigate("/");
    } catch (err: any) {
      setOtpError(err.message);
      // clear input on error
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const res = await sendOtp();
      setMaskedPhone(res.masked || maskedPhone);
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: any) {
      setOtpError(err.message);
    }
  };

  // ── Cancel 2FA → sign out ─────────────────────────────────────────────────
  const handleCancelOtp = async () => {
    try { await logout(); } catch {}
    setStep("credentials");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
  };

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
          <p className="text-muted-foreground text-sm mt-2">Ваша персональная кинобиблиотека</p>
        </div>

        {/* ── STEP 1: Credentials ── */}
        {step === "credentials" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black text-foreground">Вход в аккаунт</h2>
              <p className="text-muted-foreground text-xs mt-0.5">Введите ваш email и пароль</p>
            </div>

            {error && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-xs rounded-xl p-3">
                {error}
              </div>
            )}

            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-muted border border-border rounded-xl px-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition pr-10"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 text-sm"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                {loading ? "Входим…" : "Войти"}
              </button>
            </form>

            <p className="text-center text-xs text-muted-foreground">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: OTP ── */}
        {step === "otp" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
                <ShieldCheck className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-black text-foreground">Двухфакторная аутентификация</h2>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                SMS с кодом отправлено на<br />
                <span className="text-foreground font-semibold">{maskedPhone}</span>
              </p>
            </div>

            {otpError && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-xs rounded-xl p-3 text-center">
                {otpError}
              </div>
            )}

            {/* OTP boxes */}
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3 text-center">
                  Введите 6-значный код
                </label>
                <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { inputRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      className={`w-11 h-13 text-center text-xl font-black rounded-xl border-2 bg-muted text-foreground transition-all focus:outline-none ${
                        digit
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border focus:border-primary focus:ring-2 focus:ring-primary/15"
                      }`}
                      style={{ height: "3.25rem" }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.join("").length < 6}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:shadow-primary/20 text-sm"
              >
                {otpLoading ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShieldCheck className="w-4 h-4" />
                )}
                {otpLoading ? "Проверяем…" : "Подтвердить"}
              </button>
            </form>

            {/* Resend + back */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleCancelOtp}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Назад
              </button>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "" : "hover:rotate-180 transition-transform"}`} />
                {resendCooldown > 0 ? `Повторить (${resendCooldown}с)` : "Отправить снова"}
              </button>
            </div>

            {/* Info badge */}
            <div className="flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl p-3">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Код действителен <strong className="text-foreground">5 минут</strong>. До 3 попыток ввода. Если SMS не пришло — проверьте правильность номера в настройках профиля.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}