import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { useAuth } from "./lib/auth-context";
import { useSidebar } from "./lib/sidebar-context";
import { Sidebar } from "./components/sidebar";
import { Footer } from "./components/footer";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { MovieDetailPage } from "./pages/movie-detail";
import { LibraryPage } from "./pages/library";
import { RecommendationsPage } from "./pages/recommendations";
import { FriendsPage } from "./pages/friends";
import { AiChatPage } from "./pages/ai-chat";
import { ProfilePage } from "./pages/profile";
import { WatchlistPage } from "./pages/watchlist";
import { PersonPage } from "./pages/person";
import { FriendProfilePage } from "./pages/friend-profile";
import { DiplomaDownloadPage } from "./pages/diploma-download";
import { RecommendationsDocPage } from "./pages/recommendations-doc";
import { CollectionsPage } from "./pages/collections";
import { CollectionDetailPage } from "./pages/collection-detail";
import { Loader2 } from "lucide-react";

// ── Shared shell with sidebar ─────────────────────────────────────────────────
function AppShell() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out pt-13 md:pt-0 pb-20 md:pb-0 flex flex-col ${
          collapsed ? "md:ml-14" : "md:ml-60"
        }`}
      >
        <div className="flex-1">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  );
}

// ── Open layout (guests + auth) ───────────────────────────────────────────────
function OpenLayout() {
  const { loading } = useAuth();
  if (loading) return <Loader />;
  return <AppShell />;
}

// ── Protected layout ──────────────────────────────────────────────────────────
function ProtectedLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  return <AppShell />;
}

// ── Public layout (guests only) ───────────────────────────────────────────────
function PublicLayout() {
  const { session, loading } = useAuth();
  if (loading) return <Loader />;
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}

// ── Neutral (no redirect) — for login/2FA flow ────────────────────────────────
function NeutralLayout() {
  const { loading } = useAuth();
  if (loading) return <Loader />;
  return <Outlet />;
}

function Loader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export const router = createBrowserRouter([
  // Login — NeutralLayout so 2FA isn't interrupted
  {
    Component: NeutralLayout,
    children: [{ path: "/login", Component: LoginPage }],
  },
  // Register — guests only
  {
    Component: PublicLayout,
    children: [{ path: "/register", Component: RegisterPage }],
  },
  // Open pages
  {
    Component: OpenLayout,
    children: [
      { path: "/", Component: HomePage },
      { path: "/search", Component: SearchPage },
      { path: "/movie/:id", Component: MovieDetailPage },
      { path: "/person/:id", Component: PersonPage },
      { path: "/diploma", Component: DiplomaDownloadPage },
      { path: "/collections", Component: CollectionsPage },
      { path: "/collections/:id", Component: CollectionDetailPage },
    ],
  },
  // Protected pages
  {
    Component: ProtectedLayout,
    children: [
      { path: "/library", Component: LibraryPage },
      { path: "/watchlist", Component: WatchlistPage },
      { path: "/recommendations", Component: RecommendationsPage },
      { path: "/friends", Component: FriendsPage },
      { path: "/friends/:id", Component: FriendProfilePage },
      { path: "/ai", Component: AiChatPage },
      { path: "/profile", Component: ProfilePage },
      { path: "/recommendations-doc", Component: RecommendationsDocPage },
    ],
  },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);