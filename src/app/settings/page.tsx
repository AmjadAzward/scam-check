"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Shield,
  Lock,
  Globe,
  Download,
  Trash2,
  Bell,
  AlertTriangle,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useLanguage, Language } from "@/lib/i18n/context";

export default function SettingsPage() {
  const { data: session } = useSession();
  const { language, setLanguage, t } = useLanguage();

  const [deleteScreenshots, setDeleteScreenshots] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const res = await fetch("/api/user/preferences");
        const data = await res.json();
        if (data.preferences) {
          setDeleteScreenshots(data.preferences.deleteScreenshotsAfterScan ?? true);
          setNotifications(data.preferences.notificationsEnabled ?? true);
        }
      } catch (err) {
        console.error("Failed to load user preferences:", err);
      }
    }
    loadPreferences();
  }, []);

  const handleSaveToggle = async (newDeleteVal: boolean) => {
    setDeleteScreenshots(newDeleteVal);
    setIsSaving(true);
    try {
      await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deleteScreenshotsAfterScan: newDeleteVal,
        }),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err) {
      console.error("Failed to save preference:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    window.location.href = "/api/user/export";
  };

  const handleDeleteAllHistory = async () => {
    if (!confirm("Are you sure you want to permanently delete all your scan history? This action cannot be reversed.")) {
      return;
    }

    try {
      const res = await fetch("/api/user/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_SCANS" }),
      });
      const data = await res.json();
      if (res.ok) {
        setActionMessage("All scan history has been permanently wiped from the database.");
      } else {
        alert(data.error || "Failed to delete history");
      }
    } catch (err) {
      console.error("Deletion error:", err);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmation = prompt(
      "Type 'DELETE' to confirm permanent deletion of your account and all associated data:"
    );
    if (confirmation !== "DELETE") return;

    try {
      const res = await fetch("/api/user/delete-all", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "DELETE_ACCOUNT" }),
      });
      if (res.ok) {
        signOut({ callbackUrl: "/" });
      }
    } catch (err) {
      console.error("Failed to delete account:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          {t("settings.title")}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Manage your personal safety preferences, language, and data privacy rights.
        </p>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low flex items-center gap-3 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Language Selection */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-2.5">
          <Globe className="w-5 h-5 text-trust" />
          <h2 className="text-base font-bold text-text-primary">
            {t("settings.language")}
          </h2>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {[
            { code: "en" as Language, label: "English", sub: "English" },
            { code: "si" as Language, label: "සිංහල", sub: "Sinhala" },
            { code: "ta" as Language, label: "தமிழ்", sub: "Tamil" },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`p-3.5 rounded-2xl border text-center transition-all ${
                language === l.code
                  ? "bg-trust-subtle text-trust border-trust font-bold shadow-soft"
                  : "bg-surface border-surface-border text-text-secondary hover:bg-surface-muted"
              }`}
            >
              <div className="text-sm">{l.label}</div>
              <div className="text-[10px] text-text-tertiary mt-0.5">{l.sub}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Privacy Controls (Delete screenshots after scan) */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-soft space-y-5">
        <div className="flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-trust" />
          <h2 className="text-base font-bold text-text-primary">
            {t("settings.privacySection")}
          </h2>
        </div>

        {/* Delete Screenshots Toggle */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-surface-muted/60 border border-surface-border">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-text-primary">
              {t("settings.deleteScreenshots")}
            </div>
            <p className="text-xs text-text-secondary leading-relaxed max-w-md">
              {t("settings.deleteScreenshotsDesc")} (Default: Active)
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={deleteScreenshots}
            onClick={() => handleSaveToggle(!deleteScreenshots)}
            className={`w-12 h-6 rounded-full transition-colors relative shrink-0 mt-1 ${
              deleteScreenshots ? "bg-trust" : "bg-surface-border"
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                deleteScreenshots ? "translate-x-6" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {savedSuccess && (
          <p className="text-xs text-risk-low font-medium">
            Privacy preferences updated.
          </p>
        )}
      </div>

      {/* Data Rights & Permanent Deletion */}
      <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-trust" />
          <h2 className="text-base font-bold text-text-primary">
            {t("settings.dataRights")}
          </h2>
        </div>
        <p className="text-xs text-text-secondary">
          In accordance with privacy best practices, you retain complete sovereignty over your data.
        </p>

        <div className="space-y-2 pt-1">
          <button
            onClick={handleExportData}
            className="w-full p-3.5 rounded-xl border border-surface-border hover:bg-surface-muted transition-colors flex items-center justify-between text-xs font-semibold text-text-primary touch-target"
          >
            <div className="flex items-center gap-2.5">
              <Download className="w-4 h-4 text-trust" />
              <span>{t("settings.exportData")} (JSON)</span>
            </div>
            <span className="text-text-tertiary">Download</span>
          </button>

          <button
            onClick={handleDeleteAllHistory}
            className="w-full p-3.5 rounded-xl border border-surface-border hover:bg-risk-high-bg hover:border-risk-high-border transition-colors flex items-center justify-between text-xs font-semibold text-risk-high touch-target"
          >
            <div className="flex items-center gap-2.5">
              <Trash2 className="w-4 h-4" />
              <span>{t("settings.deleteAllData")}</span>
            </div>
            <span className="text-text-tertiary">Clear</span>
          </button>

          {session?.user && (
            <button
              onClick={handleDeleteAccount}
              className="w-full p-3.5 rounded-xl border border-risk-high-border bg-risk-high-bg/50 hover:bg-risk-high-bg transition-colors flex items-center justify-between text-xs font-bold text-risk-critical touch-target mt-3"
            >
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-4 h-4" />
                <span>{t("settings.deleteAccount")}</span>
              </div>
              <span>Permanent</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
