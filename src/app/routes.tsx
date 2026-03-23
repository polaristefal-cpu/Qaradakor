import { createBrowserRouter, Navigate, Outlet } from "react-router";
import { useAuth } from "./lib/auth-context";
import { Navbar } from "./components/navbar";
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
import { Loader2 } from "lucide-react";

// Available for everyone — shows Navbar for both guests and logged-in users
function OpenLayout() {
  const { loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}

// Requires auth — redirects guests to /login
function ProtectedLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (!session) return <Navigate to="/login" replace />;
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Outlet />
    </div>
  );
}

// Only for guests — redirects logged-in users to /
function PublicLayout() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }
  if (session) return <Navigate to="/" replace />;
  return <Outlet />;
}

export const router = createBrowserRouter([
  // Public auth pages (login/register)
  {
    Component: PublicLayout,
    children: [
      { path: "/login", Component: LoginPage },
      { path: "/register", Component: RegisterPage },
    ],
  },
  // Open pages — accessible without auth
  {
    Component: OpenLayout,
    children: [
      { path: "/", Component: HomePage },
      { path: "/search", Component: SearchPage },
      { path: "/movie/:id", Component: MovieDetailPage },
    ],
  },
  // Protected pages — require auth
  {
    Component: ProtectedLayout,
    children: [
      { path: "/library", Component: LibraryPage },
      { path: "/recommendations", Component: RecommendationsPage },
      { path: "/friends", Component: FriendsPage },
      { path: "/ai", Component: AiChatPage },
      { path: "/profile", Component: ProfilePage },
    ],
  },
  { path: "*", Component: () => <Navigate to="/" replace /> },
]);