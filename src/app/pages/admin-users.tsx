import { useEffect, useState } from "react";
import { useLang } from "../lib/lang-context";
import { api } from "../lib/api";
import { Search, Ban, Unlock, Trash2, Eye, Download, Shield, ShieldOff } from "lucide-react";

interface User {
  id: string;
  username: string;
  email: string;
  phone_number?: string;
  created_at: string;
  is_blocked: boolean;
  is_admin: boolean;
  total_ratings: number;
  total_reviews: number;
  total_friends: number;
}

export function AdminUsersPage() {
  const { t } = useLang();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "blocked" | "admins" | "regular">("all");

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, filterStatus, users]);

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await api.get<User[]>("/admin/users");
      setUsers(data);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let result = users;

    // Filter by status
    if (filterStatus === "active") {
      result = result.filter((u) => !u.is_blocked);
    } else if (filterStatus === "blocked") {
      result = result.filter((u) => u.is_blocked);
    } else if (filterStatus === "admins") {
      result = result.filter((u) => u.is_admin);
    } else if (filterStatus === "regular") {
      result = result.filter((u) => !u.is_admin);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.username.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.phone_number && u.phone_number.includes(query))
      );
    }

    setFilteredUsers(result);
  }

  async function toggleBlockUser(userId: string, currentlyBlocked: boolean) {
    if (!confirm(currentlyBlocked ? t("confirmUnblockUser") : t("confirmBlockUser"))) return;

    try {
      await api.post(`/admin/users/${userId}/toggle-block`, {});
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_blocked: !currentlyBlocked } : u))
      );
    } catch (err) {
      alert(t("errorUpdatingUser"));
      console.error(err);
    }
  }

  async function deleteUser(userId: string) {
    if (!confirm(t("confirmDeleteUser"))) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(t("errorDeletingUser"));
      console.error(err);
    }
  }

  async function toggleAdminStatus(userId: string, currentlyAdmin: boolean) {
    if (!confirm(currentlyAdmin ? t("confirmRemoveAdmin") : t("confirmMakeAdmin"))) return;

    try {
      await api.post(`/admin/users/${userId}/toggle-admin`, {});
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, is_admin: !currentlyAdmin } : u))
      );
    } catch (err) {
      alert(t("errorUpdatingUser"));
      console.error(err);
    }
  }

  async function exportUsers() {
    try {
      const csv = await api.get<string>("/admin/users/export");
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(t("errorExporting"));
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-foreground/10 rounded w-64"></div>
          <div className="h-12 bg-foreground/10 rounded"></div>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-foreground/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">{t("adminUsers")}</h1>
        <button
          onClick={exportUsers}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          {t("exportCSV")}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-background border border-border rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              placeholder={t("searchUsers")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
          >
            <option value="all">{t("allUsers")}</option>
            <option value="active">{t("activeUsers")}</option>
            <option value="blocked">{t("blockedUsers")}</option>
            <option value="admins">{t("adminUsers2")}</option>
            <option value="regular">{t("regularUsers")}</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-background border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-foreground/5 border-b border-border">
                <th className="text-left py-3 px-4 font-semibold">{t("username")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("email")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("phoneNumber")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("role")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("registered")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("ratings")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("reviews")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("friends")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("status")}</th>
                <th className="text-left py-3 px-4 font-semibold">{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-foreground/5">
                  <td className="py-3 px-4 font-medium">{user.username}</td>
                  <td className="py-3 px-4 text-foreground/70">{user.email}</td>
                  <td className="py-3 px-4 text-foreground/70">
                    {user.phone_number || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_admin
                          ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {user.is_admin ? t("admin") : t("user")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-foreground/70">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">{user.total_ratings}</td>
                  <td className="py-3 px-4">{user.total_reviews}</td>
                  <td className="py-3 px-4">{user.total_friends}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.is_blocked
                          ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      }`}
                    >
                      {user.is_blocked ? t("blocked") : t("active")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/friends/${user.id}`, "_blank")}
                        className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                        title={t("viewProfile")}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => toggleAdminStatus(user.id, user.is_admin)}
                        className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                        title={user.is_admin ? t("removeAdmin") : t("makeAdmin")}
                      >
                        {user.is_admin ? (
                          <ShieldOff className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        ) : (
                          <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </button>
                      <button
                        onClick={() => toggleBlockUser(user.id, user.is_blocked)}
                        className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                        title={user.is_blocked ? t("unblockUser") : t("blockUser")}
                      >
                        {user.is_blocked ? (
                          <Unlock className="w-4 h-4 text-green-600 dark:text-green-400" />
                        ) : (
                          <Ban className="w-4 h-4 text-red-600 dark:text-red-400" />
                        )}
                      </button>
                      <button
                        onClick={() => deleteUser(user.id)}
                        className="p-2 hover:bg-foreground/10 rounded-lg transition-colors"
                        title={t("deleteUser")}
                      >
                        <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-foreground/60">{t("noUsersFound")}</div>
        )}
      </div>
    </div>
  );
}