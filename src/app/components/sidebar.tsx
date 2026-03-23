import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuth } from "../lib/auth-context";
import { logout, getProfile } from "../lib/api";
import { useSidebar } from "../lib/sidebar-context";
import { ThemeToggle } from "./theme-toggle";
import {
  Clapperboard, Search, Users, Sparkles, Library,
  LogOut, LogIn, Bot, UserPlus, User, Bookmark,
  ChevronLeft, ChevronRight, Home,
} from "lucide-react";
import { useUserData } from "../lib/user-data-context";

export function Sidebar() {
  const { session } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);

  // Watchlist count badge
  const userData = (() => { try { return useUserData(); } catch { return null; } })();
  const watchlistCount = userData?.watchlistSet.size ?? 0;

  useEffect(() => {
    if (session) {
      getProfile().then(setProfile).catch(() => setProfile(null));
    } else {
      setProfile(null);
    }
  }, [session]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

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

  const publicLinks = [
    { to: "/", icon: Home, label: "Главная" },
  ];

  const authLinks = [
    { to: "/library", icon: Library, label: "Библиотека" },
    { to: "/watchlist", icon: Bookmark, label: "Вотчлист", badge: watchlistCount },
    { to: "/recommendations", icon: Sparkles, label: "Рекомендации" },
    { to: "/ai", icon: Bot, label: "AI-чат" },
    { to: "/friends", icon: Users, label: "Друзья" },
  ];

  // ── Mobile bottom nav items ────────────────────────────────────────────────
  // Auth: Home, Library, Watchlist, AI, Profile
  // Guest: Home, Search, Login, Register
  const mobileAuthNav = [
    { to: "/", icon: Home, label: "Главная", badge: 0 },
    { to: "/library", icon: Library, label: "Библиотека", badge: 0 },
    { to: "/watchlist", icon: Bookmark, label: "Вотчлист", badge: watchlistCount },
    { to: "/ai", icon: Bot, label: "AI-чат", badge: 0 },
    { to: "/profile", icon: User, label: "Профиль", badge: 0 },
  ];

  const mobileGuestNav = [
    { to: "/", icon: Home, label: "Главная" },
    { to: "/search", icon: Search, label: "Поиск" },
    { to: "/login", icon: LogIn, label: "Войти" },
    { to: "/register", icon: UserPlus, label: "Регистрация" },
  ];

  const mobileNav = session ? mobileAuthNav : mobileGuestNav;

  // ── Shared NavLink component ──────────────────────────────────────────────
  function NavItem({
    to, icon: Icon, label, badge, onClick,
  }: {
    to: string; icon: any; label: string; badge?: number; onClick?: () => void;
  }) {
    const active = isActive(to);
    return (
      <Link
        to={to}
        onClick={onClick}
        title={collapsed ? label : undefined}
        className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 group
          ${collapsed ? "px-0 justify-center w-10 h-10 mx-auto" : "px-3 py-2.5 w-full"}
          ${active
            ? "bg-primary/12 text-primary"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
          }`}
      >
        <Icon className={`shrink-0 transition-all ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
        {!collapsed && (
          <span className="text-sm font-semibold truncate">{label}</span>
        )}
        {/* Active indicator */}
        {active && !collapsed && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-primary rounded-r-full" />
        )}
        {/* Badge */}
        {badge !== undefined && badge > 0 && (
          <span className={`absolute bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center
            ${collapsed ? "top-0 right-0 w-4 h-4" : "right-2.5 top-1/2 -translate-y-1/2 min-w-[18px] h-[18px] px-1"}`}>
            {badge > 99 ? "99+" : badge}
          </span>
        )}
        {/* Tooltip when collapsed */}
        {collapsed && (
          <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-popover border border-border text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            {label}
          </span>
        )}
      </Link>
    );
  }

  // ── Section label ─────────────────────────────────────────────────────────
  function SectionLabel({ children }: { children: string }) {
    if (collapsed) return <div className="h-px bg-border mx-2 my-2" />;
    return (
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 px-3 mb-1.5 mt-4">
        {children}
      </p>
    );
  }

  // ── Sidebar inner content ─────────────────────────────────────────────────
  function SidebarContent() {
    return (
      <div className="flex flex-col h-full">

        {/* ── Logo ── */}
        <div className={`flex items-center mb-6 ${collapsed ? "justify-center px-0 pt-5" : "px-4 pt-5 gap-2.5"}`}>
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/25 group-hover:scale-105 transition-transform shrink-0">
              <Clapperboard className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <div className="leading-none">
                <span className="text-foreground font-black tracking-tight text-sm">qaradakor</span>
                <span className="text-primary font-black text-sm">.kz</span>
              </div>
            )}
          </Link>
        </div>

        {/* ── Navigation ── */}
        <nav className={`flex-1 overflow-y-auto overflow-x-hidden space-y-0.5 ${collapsed ? "px-2" : "px-3"}`}>
          <SectionLabel>Навигация</SectionLabel>
          {publicLinks.map(l => (
            <NavItem key={l.to} {...l} />
          ))}

          <SectionLabel>Моё</SectionLabel>
          {authLinks.map(l => (
            <NavItem key={l.to} {...l} />
          ))}
        </nav>

        {/* ── Bottom section ── */}
        <div className={`border-t border-border pt-3 pb-4 space-y-1 ${collapsed ? "px-2" : "px-3"}`}>

          {/* Theme toggle */}
          <div className={`flex items-center ${collapsed ? "justify-center py-2" : "px-3 py-2"}`}>
            {!collapsed && <span className="text-sm font-semibold text-muted-foreground flex-1">Тема</span>}
            <ThemeToggle />
          </div>

          {session ? (
            <>
              {/* Profile link */}
              <Link
                to="/profile"
                title={collapsed ? "Мой профиль" : undefined}
                className={`relative flex items-center gap-3 rounded-xl transition-all hover:bg-muted group
                  ${collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5"}`}
              >
                <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shrink-0 shadow-sm">
                  {initials}
                </div>
                {!collapsed && (
                  <div className="flex-1 min-w-0">
                    <p className="text-foreground text-xs font-bold truncate leading-tight">{displayName}</p>
                    <p className="text-muted-foreground text-[10px] truncate leading-tight">{profile?.email || session.user?.email}</p>
                  </div>
                )}
                {collapsed && (
                  <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-popover border border-border text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    {displayName}
                  </span>
                )}
              </Link>

              {/* Logout */}
              <button
                onClick={handleLogout}
                title={collapsed ? "Выйти" : undefined}
                className={`relative flex items-center gap-3 rounded-xl transition-all text-destructive hover:bg-destructive/10 group w-full
                  ${collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2"}`}
              >
                <LogOut className={`shrink-0 ${collapsed ? "w-4.5 h-4.5" : "w-4 h-4"}`} />
                {!collapsed && <span className="text-sm font-semibold">Выйти</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-popover border border-border text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    Выйти
                  </span>
                )}
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                title={collapsed ? "Войти" : undefined}
                className={`relative flex items-center gap-3 rounded-xl transition-all text-muted-foreground hover:text-foreground hover:bg-muted group
                  ${collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5"}`}
              >
                <LogIn className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
                {!collapsed && <span className="text-sm font-semibold">Войти</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-popover border border-border text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    Войти
                  </span>
                )}
              </Link>
              <Link
                to="/register"
                title={collapsed ? "Регистрация" : undefined}
                className={`relative flex items-center gap-3 rounded-xl transition-all bg-primary text-primary-foreground hover:bg-primary/90 group shadow-sm
                  ${collapsed ? "justify-center w-10 h-10 mx-auto" : "px-3 py-2.5"}`}
              >
                <UserPlus className={`shrink-0 ${collapsed ? "w-5 h-5" : "w-4 h-4"}`} />
                {!collapsed && <span className="text-sm font-semibold">Регистрация</span>}
                {collapsed && (
                  <span className="pointer-events-none absolute right-full mr-2.5 top-1/2 -translate-y-1/2 whitespace-nowrap bg-popover border border-border text-foreground text-xs font-semibold px-2.5 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-50">
                    Регистрация
                  </span>
                )}
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      {/* ── Desktop Sidebar (right, fixed) ── */}
      <aside
        className="hidden md:flex flex-col fixed top-0 right-0 h-screen z-40 border-l border-border transition-all duration-300 ease-in-out"
        style={{
          width: collapsed ? 68 : 224,
          background: "var(--sidebar)",
        }}
      >
        <SidebarContent />

        {/* Collapse toggle button */}
        <button
          onClick={toggle}
          className="absolute -left-3.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-card border border-border shadow-md flex items-center justify-center text-muted-foreground hover:text-primary hover:border-primary/40 transition-all z-50"
          title={collapsed ? "Развернуть" : "Свернуть"}
        >
          {collapsed
            ? <ChevronLeft className="w-3.5 h-3.5" />
            : <ChevronRight className="w-3.5 h-3.5" />
          }
        </button>
      </aside>

      {/* ── Mobile top bar ── */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-40 h-13 flex items-center justify-between px-4 border-b border-border"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(14px)" }}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30 group-hover:scale-105 transition-transform">
            <Clapperboard className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-foreground font-black tracking-tight text-sm">
            qaradakor<span className="text-primary text-[10px]">.kz</span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          {session && (
            <Link
              to="/profile"
              className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center text-primary-foreground text-xs font-black shadow-sm"
            >
              {initials}
            </Link>
          )}
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border"
        style={{ background: "var(--nav-bg)", backdropFilter: "blur(14px)" }}
      >
        {/* Safe area for devices with home indicator */}
        <div className="flex items-center justify-around px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {mobileNav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const badge = "badge" in item ? item.badge : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all min-w-[3rem]"
              >
                <div className={`relative w-10 h-9 flex items-center justify-center rounded-xl transition-all duration-200 ${
                  active ? "bg-primary/15" : "hover:bg-muted"
                }`}>
                  <Icon className={`w-5 h-5 transition-colors duration-200 ${
                    active ? "text-primary" : "text-muted-foreground"
                  }`} />
                  {/* Badge */}
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-primary text-primary-foreground text-[9px] font-black rounded-full flex items-center justify-center">
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold transition-colors duration-200 leading-none ${
                  active ? "text-primary" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
