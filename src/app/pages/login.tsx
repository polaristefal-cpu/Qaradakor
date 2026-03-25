import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { login, logout, get2FAStatus, sendOtp, verifyOtp, smsLoginSend, smsLoginVerify, supabase } from "../lib/api";
import { useAuth } from "../lib/auth-context";
import { useLang } from "../lib/lang-context";
import {
  Clapperboard, Eye, EyeOff, LogIn,
  Smartphone, ShieldCheck, RefreshCw, ArrowLeft, MessageSquare,
} from "lucide-react";

// WhatsApp SVG icon
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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
  const { t } = useLang();
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
  const [otpChannel, setOtpChannel] = useState<"whatsapp" | "sms">("sms");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // SMS Login — phone input
  const [smsPhone, setSmsPhone] = useState("");
  const [smsError, setSmsError] = useState("");
  const [smsLoading, setSmsLoading] = useState(false);
  const [smsMasked, setSmsMasked] = useState("");
  const [smsChannel, setSmsChannel] = useState<"whatsapp" | "sms">("sms");
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

  // ── Step 1: email + password ─────────────────────────────────────────────
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
          setOtpChannel(res.channel || "sms");
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
    if (digit && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    if (digit && i === 5 && next.every(d => d)) {
      setTimeout(async () => {
        const code = next.join("");
        if (code.length === 6 && !otpLoading) {
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
        }
      }, 150);
    }
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
      setOtpChannel(res.channel || "sms");
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
      setSmsChannel(res.channel || "sms");
      setSmsCooldown(60);
      setSmsOtp(["", "", "", "", "", ""]);
      setStep("sms-otp");
      setTimeout(() => smsOtpRefs.current[0]?.focus(), 100);
    } catch (err: any) {
      const waitMatch = err.message?.match(/(\d+)\s*ск/);
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
    if (digit && i < 5) {
      smsOtpRefs.current[i + 1]?.focus();
    }
    
    // Auto-submit when all 6 digits are entered
    if (digit && i === 5 && next.every(d => d)) {
      setTimeout(async () => {
        const code = next.join("");
        if (code.length === 6 && !smsOtpLoading) {
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
        }
      }, 150);
    }
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
      setSmsChannel(res.channel || "sms");
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
              qaradakor<span className="text-primary">.kz</span>
            </span>
          </Link>
          <p className="text-muted-foreground text-sm mt-2">{t("siteTagline")}</p>
        </div>

        {/* ── STEP: Credentials ── */}
        {step === "credentials" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-black text-foreground">{t("loginTitle")}</h2>
              <p className="text-muted-foreground text-xs mt-0.5">{t("loginSubheading")}</p>
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
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1.5">{t("passwordLabel")}</label>
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
                {loading ? t("signingIn") : t("signIn")}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">{t("or")}</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* WhatsApp / SMS Login button */}
            <button
              onClick={() => { setStep("sms-phone"); setSmsError(""); setSmsPhone(""); }}
              className="w-full flex items-center justify-center gap-2 border border-border hover:border-[#25D366]/40 text-muted-foreground hover:text-foreground bg-muted/50 hover:bg-muted rounded-xl py-2.5 text-sm font-semibold transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 text-[#25D366]" />
              {t("loginByWhatsApp")}
            </button>

            <p className="text-center text-xs text-muted-foreground">
              {t("noAccount")}{" "}
              <Link to="/register" className="text-primary hover:underline font-semibold">
                {t("registerLink")}
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
            <p className="text-foreground font-bold text-sm">{t("checkingSecurity")}</p>
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mt-1" />
          </div>
        )}

        {/* ── STEP: 2FA OTP (after email/password) ── */}
        {step === "otp" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 ${otpChannel === "whatsapp" ? "bg-[#25D366]/15 border border-[#25D366]/30" : "bg-primary/10 border border-primary/20"}`}>
                {otpChannel === "whatsapp"
                  ? <WhatsAppIcon className="w-7 h-7 text-[#25D366]" />
                  : <ShieldCheck className="w-7 h-7 text-primary" />}
              </div>
              <h2 className="text-lg font-black text-foreground">{t("twoFATitle")}</h2>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                {otpChannel === "whatsapp" ? t("codeSentWhatsApp") : t("codeSentSMS")}{" "}
                {otpChannel === "whatsapp" && <span className="text-[#25D366] font-bold">WhatsApp</span>}
                {otpChannel === "whatsapp" ? " на номер" : ""}<br />
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
                  {t("enterSixDigit")}
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
                {otpLoading ? t("verifying") : t("confirm")}
              </button>
            </form>

            <div className="flex items-center justify-between pt-1">
              <button
                onClick={handleCancelOtp}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("back")}
              </button>
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {resendCooldown > 0 ? `${t("resendIn")} (${resendCooldown}с)` : t("resend")}
              </button>
            </div>

            <div className={`flex items-start gap-2.5 rounded-xl p-3 ${otpChannel === "whatsapp" ? "bg-[#25D366]/8 border border-[#25D366]/20" : "bg-muted/60 border border-border"}`}>
              {otpChannel === "whatsapp"
                ? <WhatsAppIcon className="w-4 h-4 text-[#25D366] shrink-0 mt-0.5" />
                : <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />}
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {otpChannel === "whatsapp"
                  ? <>{t("codeWhatsAppInfo")}</>
                  : <>{t("codeSMSInfo")}</>}
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
                <h2 className="text-lg font-black text-foreground">{t("smsLoginTitle")}</h2>
                <p className="text-muted-foreground text-xs">{t("smsLoginSubheading")}</p>
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
                  {t("phoneLabel")}
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-semibold pointer-events-none select-none">
                    +7
                  </span>
                  <input
                    type="tel"
                    value={smsPhone.replace(/(\d{3})(\d{3})(\d{2})(\d{2})/, '$1-$2-$3-$4').replace(/(\d{3})(\d{3})(\d{1,2})$/, '$1-$2-$3').replace(/(\d{3})(\d{1,3})$/, '$1-$2')}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setSmsPhone(digits);
                      setSmsError("");
                    }}
                    className="w-full bg-muted border border-border rounded-xl pl-10 pr-3.5 py-2.5 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition"
                    placeholder="776-393-33-36"
                    inputMode="numeric"
                    autoComplete="tel"
                    maxLength={13}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
                  {t("phoneMustBeLinked")}
                </p>
              </div>

              <button
                type="submit"
                disabled={smsLoading || smsPhone.replace(/\D/g, "").length < 10}
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 font-semibold py-2.5 rounded-xl transition-all shadow-sm text-sm"
              >
                {smsLoading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <WhatsAppIcon className="w-4 h-4 text-primary-foreground" />}
                {smsLoading ? t("sendingCode") : t("getCodeBtn")}
              </button>
            </form>

            <div className="flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl p-3">
              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                {t("smsLoginInfo")}
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: SMS Login — OTP verification ── */}
        {step === "sms-otp" && (
          <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
            {/* Header */}
            <div className="text-center">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg ${smsChannel === "whatsapp" ? "bg-[#25D366]/15 border border-[#25D366]/30 shadow-[#25D366]/20" : "bg-primary shadow-primary/30"}`}>
                {smsChannel === "whatsapp"
                  ? <WhatsAppIcon className="w-7 h-7 text-[#25D366]" />
                  : <MessageSquare className="w-7 h-7 text-primary-foreground" />}
              </div>
              <h2 className="text-lg font-black text-foreground">{t("codeSentTitle")}</h2>
              <p className="text-muted-foreground text-xs mt-1.5 leading-relaxed">
                {smsChannel === "whatsapp"
                  ? <><span className="text-[#25D366] font-bold">WhatsApp</span> {t("codeSentWhatsApp")}</>
                  : t("codeSentSMSDesc")}<br />
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
                  {t("enterSixDigit")}
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
                className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 font-semibold py-3 rounded-xl transition-all shadow-sm text-sm"
              >
                {smsOtpLoading
                  ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  : <ShieldCheck className="w-4 h-4" />}
                {smsOtpLoading ? t("verifying") : t("signIn")}
              </button>
            </form>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep("sms-phone")}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                {t("back")}
              </button>
              <button
                onClick={handleSmsResend}
                disabled={smsCooldown > 0 || smsLoading}
                className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {smsCooldown > 0 ? `${t("resendIn")} (${smsCooldown}с)` : t("resend")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}