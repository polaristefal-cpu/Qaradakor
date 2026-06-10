import { logout, getProfile, getAvatarUrl } from "../lib/api";
import { Logo } from "./logo";
import { useAuth } from "../lib/auth-context";
import { useSidebar } from "../lib/sidebar-context";
import { ThemeToggle } from "./theme-toggle";
import { useLang } from "../lib/lang-context";
import { Lang } from "../lib/translations";
import { Link, useLocation, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import {
  Clapperboard, Search, Users, Sparkles, Library,
  LogOut, LogIn, Bot, UserPlus, User, Bookmark,
  ChevronLeft, ChevronRight, Home, Globe, Layers,
  Settings, Menu, X
} from "lucide-react";
import { useUserData } from "../lib/user-data-context";
import { motion, AnimatePresence } from "motion/react";

// ── Language Setup ────────────────────────────────────────────────────────
const LANGS: { code: Lang; label: string; flag: string }[] = [
  { code: "ru", label: "Рус", flag: "🇷🇺" },
  { code: "en", label: "Eng", flag: "🇬🇧" },
  { code: "kz", label: "Қаз", flag: "🇰🇿" },
];

export function Sidebar() {
  const { session } = useAuth();
  const { collapsed, toggle } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, lang, setLang } = useLang();
  const [profile, setProfile] = useState<{ name?: string; email?: string } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Watchlist count badge
  const userData = (() => { try { return useUserData(); } catch { return null; } })();
  const watchlistCount = userData?.watchlistSet.size ?? 0;

  useEffect(() => {
    if (session) {
      getProfile().then(setProfile).catch(() => setProfile(null));
      getAvatarUrl().then(setAvatarUrl).catch(() => setAvatarUrl(null));
    } else {
      setProfile(null);
      setAvatarUrl(null);
    }
  }, [session]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isActive = (to: string) =>
    to === "/" ? location.pathname === "/" : location.pathname.startsWith(to);

  const displayName =
    profile?.name?.trim() ||
    session?.user?.email?.split("@")[0] ||
    t("myProfile");

  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const publicLinks = [
    { to: "/", icon: Home, label: t("navHome") },
    { to: "/collections", icon: Layers, label: t("navCollections") },
  ];

  const authLinks = [
    { to: "/library", icon: Library, label: t("navLibrary") },
    { to: "/watchlist", icon: Bookmark, label: t("navWatchlist"), badge: watchlistCount },
    { to: "/recommendations", icon: Sparkles, label: t("navRecommendations") },
    { to: "/ai", icon: Bot, label: t("navAiChat") },
    { to: "/friends", icon: Users, label: t("navFriends") },
  ];

  const mobileAuthNav = [
    { to: "/", icon: Home, label: t("navHome"), badge: 0 },
    { to: "/search", icon: Search, label: t("navSearch"), badge: 0 },
    { to: "/watchlist", icon: Bookmark, label: t("tabWatchlist"), badge: watchlistCount },
    { to: "/recommendations", icon: Sparkles, label: t("tabRecommendations"), badge: 0 },
    { to: "/ai", icon: Bot, label: t("tabAiChat"), badge: 0 },
  ];

  const mobileGuestNav = [
    { to: "/", icon: Home, label: t("navHome") },
    { to: "/collections", icon: Layers, label: t("navCollections") },
    { to: "/search", icon: Search, label: t("navSearch") },
    { to: "/login", icon: LogIn, label: t("signIn") },
  ];

  const mobileNav = session ? mobileAuthNav : mobileGuestNav;

  const mobileMenuLinks = [
    ...publicLinks,
    { to: "/search", icon: Search, label: t("navSearch") },
    ...(session ? [
      { to: "/library", icon: Library, label: t("navLibrary"), badge: 0 },
      { to: "/watchlist", icon: Bookmark, label: t("navWatchlist"), badge: watchlistCount },
      { to: "/recommendations", icon: Sparkles, label: t("navRecommendations"), badge: 0 },
      { to: "/ai", icon: Bot, label: t("navAiChat"), badge: 0 },
      { to: "/friends", icon: Users, label: t("navFriends"), badge: 0 },
      { to: "/my-collection", icon: Library, label: t("navMyCollection"), badge: 0 },
      { to: "/ai-recommendations", icon: Sparkles, label: t("navAiRecs"), badge: 0 },
      { to: "/profile", icon: User, label: t("profileTitle"), badge: 0 },
    ] : [
      { to: "/login", icon: LogIn, label: t("signIn"), badge: 0 },
      { to: "/register", icon: UserPlus, label: t("signUp"), badge: 0 },
    ]),
  ];

  const cycleLang = () => {
    const idx = LANGS.findIndex(l => l.code === lang);
    const next = LANGS[(idx + 1) % LANGS.length];
    setLang(next.code);
  };

  // ── Desktop Sidebar Content ───────────────────────────────────────────────
  function DesktopSidebar() {
    return (
      <div className="liquid-glass-panel absolute inset-0 flex flex-col overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]"
           style={{ borderRadius: collapsed ? '3.5rem' : '2rem' }}>
        
        {/* Logo Section */}
        <Link to="/" className={`flex items-center transition-all duration-500 shrink-0 ${collapsed ? 'justify-center pt-8 pb-4 px-0 h-[100px]' : 'gap-3 pt-8 pb-4 px-6 h-24'}`}>
           <div className={`shrink-0 flex items-center justify-center text-foreground transition-all duration-500 ${collapsed ? 'w-14 h-14' : 'w-10 h-10'}`}>
             <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={`transition-all duration-500 ${collapsed ? 'w-10 h-10' : 'w-8 h-8'}`}>
               <path d="M48.512 26.0531C61.7859 25.17 73.251 35.4018 74.1174 48.9047C74.9828 62.4076 64.9233 74.0674 51.6487 74.9467C38.3775 75.8257 26.918 65.5953 26.052 52.0951C25.1859 38.595 35.241 26.9363 48.512 26.0531ZM48.967 37.6313C42.5312 37.8019 37.45 43.5424 37.6321 50.4369C37.8142 57.3312 43.1898 62.7549 49.6243 62.5356C56.0264 62.3171 61.0579 56.5919 60.8762 49.7318C60.6951 42.872 55.3698 37.4616 48.967 37.6313Z" fill="currentColor"/>
               <path d="M74.2718 26C78.7756 26.1178 83.7358 26.0168 88.2706 26.0165C90.362 29.9197 91.9493 34.1108 92.9879 38.474C95.8667 50.6454 94.2493 64.1791 88.2555 74.9998L85.8063 74.9958L74.2934 74.9998C75.5905 73.3207 76.798 71.7223 77.8584 69.8482C85.9697 55.514 84.2685 38.6043 74.2718 26Z" fill="currentColor"/>
               <path d="M12.1248 26C16.5211 26.1397 21.6689 26.0508 26.1025 26.0085C24.8877 27.5648 23.8062 28.9964 22.7864 30.7217C14.826 44.1911 15.8244 60.8842 24.8351 73.3816L26.0832 74.9941L12.1298 74.9998C10.1509 71.3523 8.62578 67.4418 7.59336 63.3684C4.40789 50.7612 6.03909 37.3096 12.1248 26Z" fill="currentColor"/>
             </svg>
           </div>
           <div className={`flex flex-col whitespace-nowrap transition-all duration-500 ${collapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'}`}>
             <span className="text-lg font-black leading-none tracking-tight">qaradakor.kz</span>
           </div>
        </Link>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar pb-4 pt-2 flex flex-col">
          
          <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 ${collapsed ? 'h-0 opacity-0 px-0' : 'h-8 opacity-100 px-7'}`}>
             <span className="text-[11px] font-bold text-muted-foreground tracking-wider capitalize">Discover</span>
          </div>
          
          {publicLinks.map(l => {
            const active = isActive(l.to);
            return (
              <Link key={l.to} to={l.to} title={collapsed ? l.label : undefined}
                className={`relative flex items-center transition-all duration-500 group outline-none overflow-hidden
                  ${collapsed ? 'mx-3 my-2 justify-center' : 'mx-4 my-1 px-3 py-2.5 rounded-[1rem]'}
                  ${active && !collapsed ? 'bg-muted' : 'hover:bg-muted/50'}
                `}
              >
                <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 bg-foreground rounded-r-full transition-all duration-300 ${active && !collapsed ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`} />
                
                <div className={`flex items-center justify-center shrink-0 transition-all duration-500 
                  ${collapsed ? 'w-12 h-12 rounded-full' : 'w-8 h-8 rounded-xl'}
                  ${active && collapsed ? 'bg-foreground text-background shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105 dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-muted-foreground group-hover:text-foreground'}
                  ${active && !collapsed ? 'text-foreground' : ''}
                `}>
                  <l.icon className={`transition-all duration-500 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                </div>

                <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-500 ${collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3 flex-1'}`}>
                  {l.label}
                </span>
              </Link>
            );
          })}

          {session && (
            <>
              <div className={`overflow-hidden whitespace-nowrap transition-all duration-500 mt-4 ${collapsed ? 'h-0 opacity-0 px-0' : 'h-8 opacity-100 px-7'}`}>
                 <span className="text-[11px] font-bold text-muted-foreground tracking-wider capitalize">My Library</span>
              </div>
              
              {authLinks.map(l => {
                const active = isActive(l.to);
                return (
                  <Link key={l.to} to={l.to} title={collapsed ? l.label : undefined}
                    className={`relative flex items-center transition-all duration-500 group outline-none overflow-hidden
                      ${collapsed ? 'mx-3 my-2 justify-center' : 'mx-4 my-1 px-3 py-2.5 rounded-[1rem]'}
                      ${active && !collapsed ? 'bg-muted' : 'hover:bg-muted/50'}
                    `}
                  >
                    <div className={`absolute left-0 top-1/4 bottom-1/4 w-1 bg-foreground rounded-r-full transition-all duration-300 ${active && !collapsed ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0'}`} />
                    
                    <div className={`flex items-center justify-center shrink-0 transition-all duration-500 
                      ${collapsed ? 'w-12 h-12 rounded-full' : 'w-8 h-8 rounded-xl'}
                      ${active && collapsed ? 'bg-foreground text-background shadow-[0_0_20px_rgba(255,255,255,0.15)] scale-105 dark:shadow-[0_0_20px_rgba(255,255,255,0.05)]' : 'text-muted-foreground group-hover:text-foreground'}
                      ${active && !collapsed ? 'text-foreground' : ''}
                    `}>
                      <l.icon className={`transition-all duration-500 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                    </div>

                    <span className={`font-semibold text-sm whitespace-nowrap transition-all duration-500 ${collapsed ? 'w-0 opacity-0 ml-0' : 'w-auto opacity-100 ml-3 flex-1'}`}>
                      {l.label}
                    </span>

                    {l.badge !== undefined && l.badge > 0 && (
                      <div className={`transition-all duration-500 flex items-center justify-center ${
                        collapsed 
                          ? 'absolute top-0 right-1 bg-primary text-primary-foreground text-[9px] font-black w-5 h-5 rounded-full border-2 border-background shadow-sm' 
                          : 'ml-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0'
                      }`}>
                        {l.badge > 99 ? "99+" : l.badge}
                      </div>
                    )}
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Bottom Section (Lang, Theme, Auth/Profile) */}
        <div className={`mt-auto border-t border-border flex flex-col transition-all duration-500 overflow-hidden shrink-0 ${collapsed ? 'p-3 gap-4 pb-6' : 'p-5 gap-3'}`}>
          
          {/* Lang Switcher */}
          <div className={`flex flex-col relative transition-all duration-500 overflow-hidden ${collapsed ? 'w-12 h-12 rounded-full border border-border mx-auto items-center justify-center bg-card cursor-pointer hover:bg-muted text-muted-foreground hover:text-foreground' : 'w-full p-2.5 rounded-[1.25rem] border border-border gap-3 bg-muted/20'}`}
               onClick={() => collapsed && cycleLang()} title={collapsed ? t("language") : undefined}>
            <div className={`flex items-center gap-2 transition-all duration-500 ${collapsed ? 'opacity-0 absolute top-1/2 -translate-y-1/2 left-2' : 'opacity-100 relative px-1'}`}>
               <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
               <span className="text-sm font-semibold text-muted-foreground capitalize whitespace-nowrap">{t("language")}</span>
            </div>
            
            <div className={`transition-all duration-500 w-full ${collapsed ? 'opacity-0 absolute scale-50' : 'opacity-100 relative scale-100'}`}>
               <div className="flex bg-background border border-border p-1 rounded-[0.8rem] w-full shadow-sm">
                  {LANGS.map(l => (
                    <button key={l.code} onClick={(e) => { e.stopPropagation(); setLang(l.code); }} className={`flex-1 py-1.5 text-[11px] font-bold rounded-md transition-all ${lang === l.code ? 'bg-foreground text-background shadow-md' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                      {l.label}
                    </button>
                  ))}
               </div>
            </div>

            {collapsed && <Globe className="w-5 h-5 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />}
          </div>

          {/* Theme Switcher */}
          <div className={`flex items-center relative transition-all duration-500 overflow-hidden ${collapsed ? 'w-12 h-12 rounded-full border border-border mx-auto justify-center bg-card text-muted-foreground hover:text-foreground hover:bg-muted' : 'w-full p-2.5 rounded-[1.25rem] border border-border justify-between bg-muted/20'}`}
               title={collapsed ? t("themeLabel") : undefined}>
            <div className={`flex items-center gap-2 transition-all duration-500 ${collapsed ? 'opacity-0 absolute left-2' : 'opacity-100 relative px-1'}`}>
               <Settings className="w-4 h-4 text-muted-foreground shrink-0" />
               <span className="text-sm font-semibold text-muted-foreground capitalize whitespace-nowrap">{t("themeLabel")}</span>
            </div>
            <div className={`transition-all duration-500 shrink-0 ${collapsed ? 'absolute' : 'relative mr-1'}`}>
               <ThemeToggle />
            </div>
          </div>

          {/* Auth / Profile */}
          <div className={`flex relative transition-all duration-500 ${collapsed ? 'flex-col gap-4 bg-transparent border-none items-center h-auto mt-2 overflow-hidden' : session ? 'items-center gap-3 border border-border p-2 rounded-[1.25rem] hover:border-primary/40 bg-card mt-1 overflow-hidden' : 'justify-center w-full mt-1'}`}>
             {session ? (
               <>
                 <Link to="/profile" title={collapsed ? t("myProfile") : undefined} className={`relative shrink-0 transition-all duration-500 flex items-center justify-center ${collapsed ? 'w-14 h-14 shadow-lg hover:scale-105 rounded-full bg-foreground text-background' : 'w-10 h-10 rounded-full bg-muted'}`}>
                    {avatarUrl ? <img src={avatarUrl} className="w-full h-full object-cover rounded-full border border-border"/> : <User className={`transition-all duration-500 ${collapsed ? 'w-6 h-6' : 'w-5 h-5 text-muted-foreground'}`}/>}
                    <div className={`absolute bg-green-500 rounded-full border-2 border-background ${collapsed ? 'w-3.5 h-3.5 bottom-0 right-0' : 'w-3 h-3 -bottom-0.5 -right-0.5'}`} />
                 </Link>

                 <div className={`flex flex-col transition-all duration-500 ${collapsed ? 'absolute opacity-0 w-0 h-0' : 'opacity-100 flex-1 min-w-0'}`}>
                    <p className="text-sm font-semibold text-foreground truncate leading-tight mb-0.5">{displayName}</p>
                    <p className="text-[10px] font-medium text-muted-foreground truncate leading-tight">{profile?.email || session.user?.email}</p>
                 </div>

                 <button onClick={handleLogout} title={collapsed ? t("logout") : undefined} className={`flex items-center justify-center shrink-0 transition-all duration-500 hover:bg-destructive hover:text-destructive-foreground ${collapsed ? 'w-12 h-12 rounded-full border border-border bg-card shadow-sm text-muted-foreground mt-2' : 'w-9 h-9 rounded-xl text-muted-foreground hover:bg-destructive/10'}`}>
                    <LogOut className={`transition-all duration-500 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`} />
                 </button>
               </>
             ) : (
               collapsed ? (
                 <Link to="/register" title={t("signUp")} className="w-14 h-14 flex items-center justify-center rounded-full bg-foreground text-background shadow-lg hover:scale-105 transition-transform shrink-0 mt-4">
                    <UserPlus className="w-6 h-6" />
                 </Link>
               ) : (
                 <div className="flex items-center p-1.5 rounded-full border border-border bg-card shadow-sm">
                    <Link to="/login" className="px-5 py-2.5 text-center rounded-full border border-border bg-transparent hover:bg-muted transition-all text-[13px] font-semibold mr-1.5">
                       {t("signIn")}
                    </Link>
                    <Link to="/register" className="px-6 py-2.5 text-center rounded-full bg-foreground text-background shadow-md hover:opacity-90 transition-all text-[13px] font-semibold">
                       {t("signUp")}
                    </Link>
                 </div>
               )
             )}
          </div>

        </div>
      </div>
    );
  }

  function MobileMenuPanel() {
    return (
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 lg:hidden"
          >
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-background/45 backdrop-blur-md"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="liquid-glass-panel absolute right-0 top-0 flex h-full w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-l-[2rem]"
            >
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <div className="liquid-glass-active relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl">
                    <Logo className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black leading-none text-foreground">qaradakor.kz</p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{t("menu")}</p>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="liquid-glass-control relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-muted-foreground transition hover:text-foreground"
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-3 py-4">
                <div className="grid gap-1">
                  {mobileMenuLinks.map((item) => {
                    const active = isActive(item.to);
                    const Icon = item.icon;
                    const badge = "badge" in item ? item.badge : 0;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`relative flex items-center gap-3 overflow-hidden rounded-2xl px-3 py-3 text-sm font-bold transition ${
                          active
                            ? "liquid-glass-active"
                            : "text-muted-foreground hover:bg-white/10 hover:text-foreground"
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="min-w-0 flex-1 truncate">{item.label}</span>
                        {badge !== undefined && badge > 0 && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${
                            active ? "bg-background text-foreground" : "bg-primary text-primary-foreground"
                          }`}>
                            {badge > 99 ? "99+" : badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>

              {session ? (
                <div className="border-t border-border p-4">
                  <button
                    onClick={handleLogout}
                    className="liquid-glass-control relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-4 py-3 text-sm font-bold text-muted-foreground transition hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    {t("logout")}
                  </button>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <>
      {/* ── Desktop Sidebar Container ── */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 112 : 280 }}
        transition={{ type: "spring", bounce: 0, duration: 0.5 }}
        className="hidden lg:flex h-screen fixed top-0 left-0 z-40"
      >
        <div className="relative w-full h-full p-4 flex">
          
          <div className="relative flex-1 h-full z-10 transition-all duration-500">
            <DesktopSidebar />
            
            {/* Collapse toggle button - floats on the right edge */}
            <button
              onClick={toggle}
              title={collapsed ? t("expandBar") : t("collapseBar")}
              className="absolute top-1/2 right-0 translate-x-[90%] -translate-y-1/2 w-7 h-14 bg-foreground text-background flex items-center justify-center rounded-r-full shadow-lg hover:w-8 hover:translate-x-full transition-all z-50 border-y border-r border-border"
            >
              {collapsed ? <ChevronRight className="w-4 h-4 text-background" /> : <ChevronLeft className="w-4 h-4 text-background" />}
            </button>
          </div>

        </div>
      </motion.aside>

      {/* ── Mobile top bar ── */}
      <header
        className="liquid-glass lg:hidden fixed top-3 left-3 right-3 z-40 h-14 flex items-center justify-between rounded-[1.75rem] px-3"
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="liquid-glass-active relative w-9 h-9 flex items-center justify-center overflow-hidden rounded-xl group-hover:scale-105 transition-transform">
            <Logo className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-foreground font-black tracking-tight text-sm leading-none">qaradakor</span>
            <span className="text-muted-foreground font-bold text-[10px] capitalize tracking-widest leading-none mt-0.5">Movie Lib</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="liquid-glass-control relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl text-foreground transition-all hover:bg-white/10"
            aria-label={t("menu")}
          >
            <Menu className="h-4 w-4" />
          </button>
          {/* Mobile lang switcher */}
          <MobileLangPicker />
          <div className="liquid-glass-control relative w-9 h-9 flex items-center justify-center overflow-hidden rounded-xl text-foreground">
             <ThemeToggle />
          </div>
          {session && (
            <Link
              to="/profile"
              className="liquid-glass-control relative w-9 h-9 rounded-xl overflow-hidden flex items-center justify-center"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs font-black">
                  {initials}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-background" />
            </Link>
          )}
        </div>
      </header>

      {/* ── Mobile Bottom Navigation Bar ── */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pointer-events-none"
      >
        <div className="liquid-glass pointer-events-auto relative flex items-center justify-around gap-1 overflow-hidden rounded-[2rem] px-1.5 pt-1.5 pb-2">
          {mobileNav.map((item) => {
            const active = isActive(item.to);
            const Icon = item.icon;
            const badge = "badge" in item ? item.badge : 0;
            return (
              <Link
                key={item.to}
                to={item.to}
                className="relative flex min-w-0 flex-1 flex-col items-center gap-1 rounded-2xl px-1 py-1.5 transition-all"
              >
                <div className={`relative w-12 h-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${
                  active ? "liquid-glass-active scale-105" : "text-muted-foreground hover:bg-white/10"
                }`}>
                  <Icon className={`w-5 h-5 transition-transform duration-300`} />
                  {badge !== undefined && badge > 0 && (
                    <span className={`absolute -top-1 -right-1 w-4.5 h-4.5 text-[9px] font-black rounded-full flex items-center justify-center border-2 border-background ${
                      active ? "bg-background text-foreground" : "liquid-glass-active"
                    }`}>
                      {badge > 99 ? "99+" : badge}
                    </span>
                  )}
                </div>
                <span className={`max-w-full truncate whitespace-nowrap text-[9px] sm:text-[10px] font-bold transition-colors duration-200 leading-none capitalize ${
                  active ? "text-foreground" : "text-muted-foreground"
                }`}>
                  {item.label}
                </span>
                
              </Link>
            );
          })}
        </div>
      </nav>

      <MobileMenuPanel />
    </>
  );
}

// ── Mobile lang picker (compact) ─────────────────────────────────────────────
function MobileLangPicker() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGS.find(l => l.code === lang);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="liquid-glass-control relative flex items-center justify-center w-9 h-9 overflow-hidden rounded-xl text-foreground hover:bg-white/10 transition-all"
      >
        <span className="text-base leading-none">{current?.flag}</span>
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.15 }}
              className="liquid-glass-panel absolute bottom-full mb-2 right-0 rounded-2xl z-50 overflow-hidden min-w-[120px] p-1.5"
            >
              {LANGS.map(l => (
                <button
                  key={l.code}
                  onClick={() => { setLang(l.code); setOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${lang === l.code ? "liquid-glass-active" : "text-muted-foreground hover:text-foreground hover:bg-white/10"}`}
                >
                  <span className="text-lg leading-none">{l.flag}</span>
                  <span>{l.label}</span>
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
