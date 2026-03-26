import { useEffect, useState } from "react";
import { useLang } from "../lib/lang-context";
import { api } from "../lib/api";
import { TrendingUp, Users, Film, Calendar } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  genreDistribution: Array<{ name: string; value: number }>;
  monthlyActivity: Array<{ month: string; ratings: number; reviews: number; registrations: number }>;
  topRatedMovies: Array<{ title: string; avgRating: number; totalRatings: number }>;
  conversionFunnel: Array<{ stage: string; count: number }>;
}

const COLORS = ["#000000", "#333333", "#666666", "#999999", "#cccccc"];

export function AdminAnalyticsPage() {
  const { t } = useLang();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  async function loadAnalytics() {
    try {
      setLoading(true);
      const data = await api.get<AnalyticsData>(`/admin/analytics?range=${timeRange}`);
      setAnalytics(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-foreground/10 rounded w-64"></div>
          <div className="h-12 bg-foreground/10 rounded"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 bg-foreground/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <p className="text-foreground/60">{t("errorLoadingData")}</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("adminAnalytics")}</h1>

        {/* Time Range Selector */}
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          <option value="7d">{t("last7Days")}</option>
          <option value="30d">{t("last30Days")}</option>
          <option value="90d">{t("last90Days")}</option>
          <option value="1y">{t("lastYear")}</option>
        </select>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Genre Distribution */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Film className="w-5 h-5" />
            {t("genreDistribution")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.genreDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="currentColor"
                dataKey="value"
              >
                {analytics.genreDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Activity */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {t("monthlyActivity")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analytics.monthlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="month" stroke="currentColor" opacity={0.6} />
              <YAxis stroke="currentColor" opacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ratings"
                stroke="#000000"
                strokeWidth={2}
                name={t("ratings")}
              />
              <Line
                type="monotone"
                dataKey="reviews"
                stroke="#666666"
                strokeWidth={2}
                name={t("reviews")}
              />
              <Line
                type="monotone"
                dataKey="registrations"
                stroke="#999999"
                strokeWidth={2}
                name={t("registrations")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Rated Movies */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">{t("topRatedMovies")}</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.topRatedMovies}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis dataKey="title" stroke="currentColor" opacity={0.6} angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="currentColor" opacity={0.6} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="avgRating" fill="currentColor" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            {t("conversionFunnel")}
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.conversionFunnel} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.1} />
              <XAxis type="number" stroke="currentColor" opacity={0.6} />
              <YAxis dataKey="stage" type="category" stroke="currentColor" opacity={0.6} width={150} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--background)",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                }}
              />
              <Bar dataKey="count" fill="currentColor" opacity={0.8} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}