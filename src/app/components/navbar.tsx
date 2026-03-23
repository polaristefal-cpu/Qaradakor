import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../lib/auth-context";
import { logout, getProfile } from "../lib/api";
import {
  Clapperboard, Search, Users, Sparkles, Library,
  LogOut, LogIn, Menu, X, Bot, UserPlus,
  User, ChevronDown, Settings,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

export function Navbar() {
  const { session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load profile when session changes
  useEffect(() => {
    if (session) {
      getProfile()
        .then(setProfile)
        .catch(() => setProfile(null));
    } else {
      setProfile(null);
    }
  }, [session]);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate("/");
  };

  const publicLinks = [
    { to: "/", icon: Clapperboard, label: "Главная" },
    { to: "/search", icon: Search, label: "Поиск" },
  ];

  const authLinks = [
    { to: "/library", icon: Library, label: "Библиотека" },
    { to: "/recommendations", icon: Sparkles, label: "Рекомендации" },
    { to: "/ai", icon: Bot, label: "AI" },
    { to: "/friends", icon: Users, label: "Друзья" },
  ];

  const navLinks = session ? [...publicLinks, ...authLinks] : publicLinks;

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  // User avatar initials
  const displayName =
    profile?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    "Профиль";

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav
      className="sticky top-0 z-50 border-b border-border"
      style={{ background: "var(--nav-bg)", backdropFilter: "blur(14px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-5">
        {/* Logo */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-sm shrink-0 group"
        >
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-primary/30">
            <Clapperboard className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:flex items-baseline gap-0 text-foreground tracking-tight">
            qaradakor<span className="text-primary font-bold text-[10px]">.kz</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isActive(l.to)
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <l.icon className="w-3.5 h-3.5" />
              {l.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="hidden md:flex items-center gap-1.5 ml-auto">
          <ThemeToggle />

          {session ? (
            /* ── User Avatar Dropdown ── */
            <div ref={userMenuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen((o) => !o)}
                className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-xl transition-all border ${
                  userMenuOpen
                    ? "bg-muted border-border"
                    : "border-transparent hover:bg-muted hover:border-border"
                }`}
              >
                {/* Avatar circle */}
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-sm">
                  {initials}
                </div>
                <span className="text-xs font-semibold text-foreground max-w-[90px] truncate">
                  {displayName}
                </span>
                <ChevronDown className={`w-3 h-3 text-muted-foreground transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                  {/* User info header */}
                  <div className="px-4 py-3 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-sm font-black shadow-sm shrink-0">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground text-xs font-bold truncate">{profile?.name?.trim() || displayName}</p>
                        <p className="text-muted-foreground text-[10px] truncate">{profile?.email || session.user?.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Menu items */}
                  <div className="p-1.5">
                    <Link
                      to="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                      Мой профиль
                    </Link>
                    <Link
                      to="/library"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-foreground hover:bg-muted transition-colors"
                    >
                      <Library className="w-3.5 h-3.5 text-muted-foreground" />
                      Библиотека
                    </Link>
                    <div className="border-t border-border my-1" />
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Выйти
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <Link
                to="/login"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <LogIn className="w-3.5 h-3.5" />
                Войти
              </Link>
              <Link
                to="/register"
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition-all shadow-sm shadow-primary/20"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Регистрация
              </Link>
            </>
          )}
        </div>

        {/* Mobile: theme + burger */}
        <div className="md:hidden flex items-center gap-1.5 ml-auto">
          <ThemeToggle />
          <button
            className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-card/95 backdrop-blur-md px-3 py-2">
          {/* User card for mobile */}
          {session && (
            <div className="flex items-center gap-3 px-3 py-3 mb-1 bg-muted rounded-xl">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-sm font-black shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <p className="text-foreground text-xs font-bold truncate">{profile?.name?.trim() || displayName}</p>
                <p className="text-muted-foreground text-[10px] truncate">{profile?.email || session.user?.email}</p>
              </div>
            </div>
          )}

          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive(l.to)
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <l.icon className="w-4 h-4" />
              {l.label}
            </Link>
          ))}

          <div className="border-t border-border mt-2 pt-2">
            {session ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <User className="w-4 h-4" /> Мой профиль
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 transition-all"
                >
                  <LogOut className="w-4 h-4" /> Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <LogIn className="w-4 h-4" /> Войти
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-primary hover:bg-primary/10 transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Зарегистрироваться
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}