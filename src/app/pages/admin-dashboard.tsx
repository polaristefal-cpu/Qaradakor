import { useEffect, useState } from "react";
import { useLang } from "../lib/lang-context";
import { StatCard } from "../components/stat-card";
import { Users, Star, FolderHeart, Eye, TrendingUp } from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { api } from "../lib/api";

interface DashboardStats {
  totalUsers: number;
  newUsers7d: number;
  totalRatings: number;
  totalReviews: number;
  totalCollections: number;
  newCollections7d: number;
  totalViews: number;
  topMovies: Array<{ title: string; ratings: number }>;
  topUsers: Array<{ username: string; count: number }>;
  registrationChart: Array<{ date: string; count: number }>;
}

export function AdminDashboardPage() {
  const { t } = useLang();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      setLoading(true);
      const data = await api.get<DashboardStats>("/admin/dashboard-stats");
      setStats(data);
    } catch (err) {
      console.error("Failed to load dashboard stats:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-foreground/10 rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-foreground/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <p className="text-foreground/60">{t("errorLoadingData")}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">{t("adminDashboard")}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t("totalUsers")}
          value={stats.totalUsers.toLocaleString()}
          change={{
            value: `${stats.newUsers7d} ${t("thisWeek")}`,
            positive: stats.newUsers7d > 0,
          }}
          icon={<Users className="w-8 h-8" />}
        />
        <StatCard
          title={t("totalRatings")}
          value={stats.totalRatings.toLocaleString()}
          icon={<Star className="w-8 h-8" />}
        />
        <StatCard
          title={t("totalCollections")}
          value={stats.totalCollections.toLocaleString()}
          change={{
            value: `${stats.newCollections7d} ${t("thisWeek")}`,
            positive: stats.newCollections7d > 0,
          }}
          icon={<FolderHeart className="w-8 h-8" />}
        />
        <StatCard
          title={t("totalViews")}
          value={stats.totalViews.toLocaleString()}
          icon={<Eye className="w-8 h-8" />}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Registration Chart */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t("registrationChart")}
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={stats.registrationChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="date" stroke="currentColor" opacity={0.6} />
              <YAxis stroke="currentColor" opacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Line type="monotone" dataKey="count" stroke="currentColor" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Movies */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">{t("topMovies")}</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.topMovies} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis type="number" stroke="currentColor" opacity={0.6} />
              <YAxis dataKey="title" type="category" stroke="currentColor" opacity={0.6} width={100} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="ratings" fill="currentColor" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">{t("topActiveUsers")}</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">{t("rank")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("username")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("moviesWatched")}</th>
              </tr>
            </thead>
            <tbody>
              {stats.topUsers.map((user, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-foreground/5">
                  <td className="py-3 px-4">#{idx + 1}</td>
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4">{user.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}