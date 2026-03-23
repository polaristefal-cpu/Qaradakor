import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { login, logout, get2FAStatus, sendOtp, verifyOtp, smsLoginSend, smsLoginVerify, supabase } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import {
  Clapperboard, Eye, EyeOff, LogIn,
  Smartphone, ShieldCheck, RefreshCw, ArrowLeft, MessageSquare,
} from "lucide-react";

type Step = "credentials" | "checking" | "otp" | "sms-phone" | "sms-otp";

// ── OtpBoxes MUST be outside LoginPage to avoid remount on every render ──────
interface OtpBoxesProps {
  value: string[];
  onChange: (i: number, v: string) => void;
  onKeyDown: (i: number, e: React.KeyboardEvent<HTMLInputElement>) => void;
  onPaste: (e: React.ClipboardEvent) => void;
  refs: React.MutableRefObject<(HTMLInputElement | null)[]>;
}

function OtpBoxes({ value, onChange, onKeyDown, onPaste, refs }: OtpBoxesProps) {
  return (
    <div className="flex gap-2 justify-center" onPaste={onPaste}>
      {value.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          className={`w-11 text-center rounded-xl border-2 bg-muted text-foreground transition-all focus:outline-none ${
            digit
              ? "border-primary bg-primary/5 text-primary"
              : "border-border focus:border-primary focus:ring-2 focus:ring-primary/15"
          }`}
          style={{ height: "3.25rem", fontSize: "1.25rem", fontWeight: 900 }}
        />
      ))}
    </div>
  );
}

export function LoginPage() {
  const [step, setStep] = useState<Step>("credentials");
  const { session } = useAuth();
  const navigate = useNavigate();

  // Step 1 — email + password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 2 — 2FA OTP (after email/password)
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [maskedPhone, setMaskedPhone] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // SMS Login — phone input
  const [smsPhone, setSmsPhone] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMasked, setSmsMasked] = useState("");
  const [smsCooldown, setSmsCooldown] = useState(0);

  // SMS Login — OTP input
  const smsOtpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [smsOtp, setSmsOtp] = useState(["", "", "", "", "", ""]);
  const [smsOtpError, setSmsOtpError] = useState("");
  const [smsOtpLoading, setSmsOtpLoading] = useState(false);

  // Redirect if already logged in (only from credentials step)
  useEffect(() => {
    if (session && step === "credentials") {
      navigate("/", { replace: true });
    }
  }, [session, step, navigate]);

  // Countdown timers
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  useEffect(() => {
    if (smsCooldown <= 0) return;
    const t = setInterval(() => setSmsCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [smsCooldown]);

  // ── Step 1: email + password ──────────────────────────────────────────────
  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      setStep("checking");
      const status = await get2FAStatus();
      if (status.enabled) {
        try {
          const res = await sendOtp();
          setMaskedPhone(res.masked || status.masked || "");
          setResendCooldown(60);
        } catch (otpErr: any) {
          const waitMatch = otpErr.message?.match(/(\d+)\s*сек/);
          const waitSec = waitMatch ? parseInt(waitMatch[1]) : 60;
          setResendCooldown(waitSec);
          setMaskedPhone(status.masked || "");
        }
        setStep("otp");
        setTimeout(() => inputRefs.current[0]?.focus(), 100);
      } else {
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message);
      setStep("credentials");
      try { await logout(); } catch {}
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input helpers (2FA) ───────────────────────────────────────────────
  const handleOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...otp];
    next[i] = digit;
    setOtp(next);
    setOtpError("");
    if (digit && i < 5) inputRefs.current[i + 1]?.focus();
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split("")); inputRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  // ── Step 2: verify 2FA OTP ────────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) { setOtpError("Введите 6-значный код"); return; }
    setOtpError("");
    setOtpLoading(true);
    try {
      await verifyOtp(code);
      navigate("/");
    } catch (err: any) {
      setOtpError(err.message);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setOtpError("");
    try {
      const res = await sendOtp();
      setMaskedPhone(res.masked || maskedPhone);
      setResendCooldown(60);
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err: any) { setOtpError(err.message); }
  };

  const handleCancelOtp = async () => {
    try { await logout(); } catch {}
    setStep("credentials");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
  };

  // ── SMS Login: Step 1 — send OTP ─────────────────────────────────────────
  const handleSmsLoginSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSmsError("");
    setSmsLoading(true);
    try {
      const res = await smsLoginSend(("7" + smsPhone).trim());
      setSmsMasked(res.masked || "");
      setSmsCooldown(60);
      setSmsOtp(["", "", "", "", "", ""]);
      setStep("sms-otp");
      setTimeout(() => smsOtpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const waitMatch = err.message?.match(/(\d+)\s*сек/);
      if (waitMatch) {
        setSmsCooldown(parseInt(waitMatch[1]));
        setSmsError("Код уже был отправлен. Подождите перед повторной отправкой.");
        setStep("sms-otp");
      } else {
        setSmsError(err.message);
      }
    } finally {
      setSmsLoading(false);
    }
  };

  // ── SMS OTP input helpers ─────────────────────────────────────────────────
  const handleSmsOtpChange = (i: number, val: string) => {
    const digit = val.replace(/\D/, "").slice(-1);
    const next = [...smsOtp];
    next[i] = digit;
    setSmsOtp(next);
    setSmsOtpError("");
    if (digit && i < 5) smsOtpRefs.current[i + 1]?.focus();
  };

  const handleSmsOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !smsOtp[i] && i > 0) smsOtpRefs.current[i - 1]?.focus();
  };

  const handleSmsOtpPaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) { setSmsOtp(pasted.split("")); smsOtpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  // ── SMS Login: Step 2 — verify OTP & create session ──────────────────────
  const handleSmsOtpVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = smsOtp.join("");
    if (code.length < 6) { setSmsOtpError("Введите 6-значный код"); return; }
    setSmsOtpError("");
    setSmsOtpLoading(true);
    try {
      const result = await smsLoginVerify(("7" + smsPhone).trim(), code);
      const { error } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token,
      });
      if (error) throw new Error(error.message);
      navigate("/");
    } catch (err: any) {
      setSmsOtpError(err.message);
      setSmsOtp(["", "", "", "", "", ""]);
      setTimeout(() => smsOtpRefs.current[0]?.focus(), 50);
    } finally {
      setSmsOtpLoading(false);
    }
  };

  const handleSmsResend = async () => {
    if (smsCooldown > 0) return;
    setSmsOtpError("");
    setSmsLoading(true);
    try {
      const res = await smsLoginSend(("7" + smsPhone).trim());
      setSmsMasked(res.masked || smsMasked);
      setSmsCooldown(60);
      setSmsOtp(["", "", "", "", "", ""]);
      setTimeout(() => smsOtpRefs.current[0]?.focus(), 50);
    } catch (err: any) { setSmsOtpError(err.message); }
    finally { setSmsLoading(false); }
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

        {/* ── STEP: Credentials ── */}
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Email</label>
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">Пароль</label>
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
                {loading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <LogIn className="w-4 h-4" />}
                {loading ? "Входим…" : "Войти"}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">или</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* SMS Login button */}
            <button
              onClick={() => { setStep("sms-phone"); setSmsError(""); setSmsPhone(""); }}
              className="w-full flex items-center justify-center gap-2 border border-border hover:border-primary/40 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl py-2.5 text-sm font-semibold transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              Войти по SMS коду
            </button>

            <p className="text-center text-xs text-muted-foreground">
              Нет аккаунта?{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                Зарегистрироваться
              </Link>
            </p>
          </div>
        )}

        {/* ── STEP: Checking 2FA ── */}
        {step === "checking" && (
          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <p className="text-foreground font-bold text-sm">Проверяем настройки безопасности…</p>
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mt-1" />
          </div>
        )}

        {/* ── STEP: 2FA OTP (after email/password) ── */}
        {step === "otp" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
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

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3 text-center">
                  Введите 6-значный код
                </label>
                <OtpBoxes
                  value={otp}
                  onChange={handleOtpChange}
                  onKeyDown={handleOtpKeyDown}
                  onPaste={handleOtpPaste}
                  refs={inputRefs}
                />
              </div>

              <button
                type="submit"
                disabled={otpLoading || otp.join("").length < 6}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                {otpLoading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <ShieldCheck className="w-4 h-4" />}
                {otpLoading ? "Проверяем…" : "Подтвердить"}
              </button>
            </form>

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
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `Повторить (${resendCooldown}с)` : "Отправить снова"}
              </button>
            </div>

            <div className="flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl p-3">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Код действителен <strong className="text-foreground">5 минут</strong>. До 3 попыток ввода.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: SMS Login — Phone input ── */}
        {step === "sms-phone" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep("credentials")}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-lg font-black text-foreground">Вход по SMS</h2>
                <p className="text-muted-foreground text-xs">Введите номер привязанного телефона</p>
              </div>
            </div>

            {smsError && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-xs rounded-xl p-3">
                {smsError}
              </div>
            )}

            <form onSubmit={handleSmsLoginSend} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Номер телефона
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold pointer-events-none select-none">
                    +7
                  </span>
                  <input
                    type="tel"
                    value={smsPhone}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setSmsPhone(digits);
                      setSmsError("");
                    }}
                    className="w-full bg-muted border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
                    placeholder="707 123 45 67"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={10}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
                  Номер должен быть привязан в настройках профиля (раздел 2FA)
                </p>
              </div>

              <button
                type="submit"
                disabled={smsLoading || smsPhone.replace(/\D/g, "").length < 10}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                {smsLoading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <MessageSquare className="w-4 h-4" />}
                {smsLoading ? "Отправляем…" : "Получить код"}
              </button>
            </form>

            <div className="flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl p-3">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Работает только для аккаунтов с <strong className="text-foreground">привязанным телефоном</strong>.
                Добавьте номер в разделе Профиль → 2FA.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: SMS Login — OTP verification ── */}
        {step === "sms-otp" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
                <MessageSquare className="w-7 h-7 text-primary-foreground" />
              </div>
              <h2 className="text-lg font-black text-foreground">Код отправлен</h2>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                SMS с кодом для входа отправлено на<br />
                <span className="text-foreground font-semibold">{smsMasked}</span>
              </p>
            </div>

            {/* Error */}
            {smsOtpError && (
              <div className="bg-destructive/10 border border-destructive/25 text-destructive text-xs rounded-xl p-3 text-center">
                {smsOtpError}
              </div>
            )}

            {/* OTP form */}
            <form onSubmit={handleSmsOtpVerify} className="space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-3">
                  Введите 6-значный код
                </p>
                <OtpBoxes
                  value={smsOtp}
                  onChange={handleSmsOtpChange}
                  onKeyDown={handleSmsOtpKeyDown}
                  onPaste={handleSmsOtpPaste}
                  refs={smsOtpRefs}
                />
              </div>

              <button
                type="submit"
                disabled={smsOtpLoading || smsOtp.join("").length < 6}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 font-semibold py-3 rounded-xl transition-all shadow-md shadow-primary/20 text-sm"
              >
                {smsOtpLoading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <span className="text-base">→</span>}
                {smsOtpLoading ? "Входим…" : "Войти"}
              </button>
            </form>

            {/* Bottom actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => { setStep("sms-phone"); setSmsOtp(["", "", "", "", "", ""]); setSmsOtpError(""); }}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Изменить номер
              </button>
              <button
                onClick={handleSmsResend}
                disabled={smsCooldown > 0 || smsLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${smsLoading ? "animate-spin" : ""}`} />
                {smsCooldown > 0 ? `Повторить (${smsCooldown}с)` : "Повторить"}
              </button>
            </div>

            {/* Info box */}
            <div className="flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl p-3">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Код действителен <strong className="text-foreground">5 минут</strong>. До 3 попыток ввода.{" "}
                <span className="text-primary">Никому не сообщайте код.</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
