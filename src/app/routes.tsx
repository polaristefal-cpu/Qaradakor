import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { useAuth } from "./lib/auth-context";
import { useSidebar } from "./lib/sidebar-context";
import { Sidebar } from "./components/sidebar";
import { AdminSidebar } from "./components/admin-sidebar";
import { Footer } from "./components/footer";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { HomePage } from "./pages/home";
import { SearchPage } from "./pages/search";
import { MovieDetailPage } from "./pages/movie-detail";
import { TVDetailPage } from "./pages/tv-detail";
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
import { MyCollectionPage } from "./pages/my-collection";
import { AiRecommendationsPage } from "./pages/ai-recommendations";
import { AdminDashboardPage } from "./pages/admin-dashboard";
import { AdminUsersPage } from "./pages/admin-users";
import { AdminUserSearchPage } from "./pages/admin-user-search";
import { AdminCollectionsPage } from "./pages/admin-collections";
import { AdminContentPage } from "./pages/admin-content";
import { AdminAnalyticsPage } from "./pages/admin-analytics";
import { AdminSettingsPage } from "./pages/admin-settings";
import { AdminBootstrapPage } from "./pages/admin-bootstrap";
import { AdminCheckPage } from "./pages/admin-check";
import { Loader2 } from "lucide-react";
import { checkAdminStatus } from "./lib/api";
import { useEffect, useState } from "react";
import { UmlDiagramPage } from "./pages/uml-diagram";

// ── Shared shell with sidebar ─────────────────────────────────────────────────
function AppShell() {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ease-in-out pt-20 lg:pt-0 pb-28 lg:pb-0 flex flex-col overflow-x-clip ${
          collapsed ? "lg:ml-28" : "lg:ml-[280px]"
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

// ── Admin layout (admins only) ────────────────────────────────────────────────
function AdminLayout() {
  const { session, loading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAdmin() {
      if (!session) {
        setChecking(false);
        return;
      }
      try {
        const result = await checkAdminStatus();
        setIsAdmin(result.isAdmin);
      } catch (err) {
        console.error("Failed to check admin status:", err);
      } finally {
        setChecking(false);
      }
    }
    checkAdmin();
  }, [session]);

  if (loading || checking) return <Loader />;
  if (!session) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar />
      <main className="flex-1 ml-60">
        <Outlet />
      </main>
    </div>
  );
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
      { path: "/tv/:id", Component: TVDetailPage },
      { path: "/person/:id", Component: PersonPage },
      { path: "/diploma", Component: DiplomaDownloadPage },
      { path: "/collections", Component: CollectionsPage },
      { path: "/collections/:id", Component: CollectionDetailPage },
      { path: "/uml", Component: UmlDiagramPage },
    ],
  },
  // Admin bootstrap — accessible to any authenticated user
  {
    Component: ProtectedLayout,
    children: [
      { path: "/admin/bootstrap", Component: AdminBootstrapPage },
      { path: "/admin/check", Component: AdminCheckPage },
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
      { path: "/my-collection", Component: MyCollectionPage },
      { path: "/ai-recommendations", Component: AiRecommendationsPage },
    ],
  },
  // Admin pages
  {
    Component: AdminLayout,
    children: [
      { path: "/admin", element: <Navigate to="/admin/dashboard" replace /> },
      { path: "/admin/dashboard", Component: AdminDashboardPage },
      { path: "/admin/users", Component: AdminUsersPage },
      { path: "/admin/user-search", Component: AdminUserSearchPage },
      { path: "/admin/collections", Component: AdminCollectionsPage },
      { path: "/admin/content", Component: AdminContentPage },
      { path: "/admin/analytics", Component: AdminAnalyticsPage },
      { path: "/admin/settings", Component: AdminSettingsPage },
    ],
  },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);
