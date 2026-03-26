import { useEffect, useState } from "react";
import { useLang } from "../lib/lang-context";
import { api } from "../lib/api";
import { Save, Bell, Shield, Database } from "lucide-react";

interface SystemSettings {
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  maxFileSize: number;
  sessionTimeout: number;
}

export function AdminSettingsPage() {
  const { t } = useLang();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      setLoading(true);
      const data = await api.get<SystemSettings>("/admin/settings");
      setSettings(data);
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings() {
    if (!settings) return;

    try {
      setSaving(true);
      await api.post("/admin/settings", settings);
      alert(t("settingsSaved"));
    } catch (err) {
      alert(t("errorSavingSettings"));
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function sendNotification() {
    if (!notification.trim()) {
      alert(t("enterNotificationText"));
      return;
    }

    if (!confirm(t("confirmSendNotification"))) return;

    try {
      await api.post("/admin/send-notification", { message: notification });
      alert(t("notificationSent"));
      setNotification("");
    } catch (err) {
      alert(t("errorSendingNotification"));
      console.error(err);
    }
  }

  async function cleanupDatabase() {
    if (!confirm(t("confirmDatabaseCleanup"))) return;

    try {
      await api.post("/admin/cleanup-database", {});
      alert(t("databaseCleanupComplete"));
    } catch (err) {
      alert(t("errorCleaningDatabase"));
      console.error(err);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-foreground/10 rounded w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-foreground/10 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="p-8">
        <p className="text-foreground/60">{t("errorLoadingData")}</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t("adminSettings")}</h1>

      {/* System Settings */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5" />
          {t("systemSettings")}
        </h2>

        <div className="space-y-4">
          {/* Maintenance Mode */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <h3 className="font-semibold">{t("maintenanceMode")}</h3>
              <p className="text-sm text-foreground/60">{t("maintenanceModeDesc")}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings({ ...settings, maintenanceMode: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-foreground/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-foreground/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
            </label>
          </div>

          {/* Registration Enabled */}
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <h3 className="font-semibold">{t("registrationEnabled")}</h3>
              <p className="text-sm text-foreground/60">{t("registrationEnabledDesc")}</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) =>
                  setSettings({ ...settings, registrationEnabled: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-foreground/20 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-foreground/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-foreground"></div>
            </label>
          </div>

          {/* Max File Size */}
          <div className="py-3 border-b border-border">
            <h3 className="font-semibold mb-2">{t("maxFileSize")}</h3>
            <p className="text-sm text-foreground/60 mb-2">{t("maxFileSizeDesc")}</p>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) =>
                setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>

          {/* Session Timeout */}
          <div className="py-3">
            <h3 className="font-semibold mb-2">{t("sessionTimeout")}</h3>
            <p className="text-sm text-foreground/60 mb-2">{t("sessionTimeoutDesc")}</p>
            <input
              type="number"
              value={settings.sessionTimeout}
              onChange={(e) =>
                setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })
              }
              className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
        </div>

        <button
          onClick={saveSettings}
          disabled={saving}
          className="mt-4 flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? t("saving") : t("saveSettings")}
        </button>
      </div>

      {/* System Notifications */}
      <div className="bg-background border border-border rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t("systemNotifications")}
        </h2>
        <p className="text-sm text-foreground/60 mb-4">{t("systemNotificationsDesc")}</p>

        <textarea
          value={notification}
          onChange={(e) => setNotification(e.target.value)}
          placeholder={t("notificationPlaceholder")}
          rows={4}
          className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-foreground/20 mb-4"
        />

        <button
          onClick={sendNotification}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
        >
          <Bell className="w-4 h-4" />
          {t("sendNotification")}
        </button>
      </div>

      {/* Database Maintenance */}
      <div className="bg-background border border-border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          {t("databaseMaintenance")}
        </h2>
        <p className="text-sm text-foreground/60 mb-4">{t("databaseMaintenanceDesc")}</p>

        <button
          onClick={cleanupDatabase}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <Database className="w-4 h-4" />
          {t("cleanupDatabase")}
        </button>
      </div>
    </div>
  );
}