import { Link, useLocation } from "react-router";
import { 
  LayoutDashboard, 
  Users, 
  FolderHeart, 
  MessageSquare, 
  BarChart3, 
  Settings,
  ArrowLeft,
  Search
} from "lucide-react";
import { useLang } from "../lib/lang-context";

export function AdminSidebar() {
  const location = useLocation();
  const { t } = useLang();

  const links = [
    { to: "/admin/dashboard", icon: LayoutDashboard, label: t("adminDashboard") },
    { to: "/admin/users", icon: Users, label: t("adminUsers") },
    { to: "/admin/user-search", icon: Search, label: t("searchUsers") },
    { to: "/admin/collections", icon: FolderHeart, label: t("adminCollections") },
    { to: "/admin/content", icon: MessageSquare, label: t("adminContent") },
    { to: "/admin/analytics", icon: BarChart3, label: t("adminAnalytics") },
    { to: "/admin/settings", icon: Settings, label: t("adminSettings") },
  ];

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 bg-background border-r border-border flex flex-col z-50">
      {/* Header */}
      <div className="h-13 border-b border-border flex items-center justify-between px-4">
        <h1 className="font-bold text-lg">{t("adminPanel")}</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon;

          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                isActive
                  ? "bg-foreground/10 text-foreground border-r-2 border-foreground"
                  : "text-foreground/70 hover:bg-foreground/5 hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="font-medium">{link.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to Site */}
      <div className="border-t border-border p-4">
        <Link
          to="/"
          className="flex items-center gap-3 text-foreground/70 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>{t("backToSite")}</span>
        </Link>
      </div>
    </aside>
  );
}