"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import RiskBadge from "@/components/risk/RiskBadge";

interface ThreatItem {
  id: string;
  indicatorType: string;
  displayValue: string;
  source: string;
  riskLevel: string;
  active: boolean;
  createdAt: string;
}

export default function ThreatIndicatorsAdminPage() {
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New threat form
  const [type, setType] = useState<"URL" | "DOMAIN" | "PHONE" | "EMAIL" | "KEYWORD">("DOMAIN");
  const [value, setValue] = useState("");
  const [source, setSource] = useState("CERT_LK");
  const [riskLevel] = useState("KNOWN_MALICIOUS");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadThreats = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/threats");
      const data = await res.json();
      if (data.threats) {
        setThreats(data.threats);
      }
    } catch (err) {
      console.error("Threats load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadThreats();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/threats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          indicatorType: type,
          value,
          source,
          riskLevel,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setValue("");
        loadThreats();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create threat indicator");
      }
    } catch (err) {
      console.error("Add threat error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary p-2 rounded-xl bg-surface border border-surface-border transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Overview</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Threat Indicators Management
          </h1>
          <p className="text-xs text-text-secondary">
            High-risk indicators ingested from Sri Lanka CERT|CC, moderator intelligence, and verified incident records.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-soft transition-colors shrink-0 touch-target"
        >
          <Plus className="w-4 h-4" />
          <span>Add Threat Indicator</span>
        </button>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAdd}
            className="w-full max-w-md bg-surface p-6 sm:p-8 rounded-3xl border border-surface-border shadow-elevated space-y-4"
          >
            <h2 className="text-lg font-bold text-text-primary">Add Threat Indicator</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full p-2.5 text-xs rounded-xl border border-surface-border"
              >
                <option value="DOMAIN">Domain</option>
                <option value="URL">URL</option>
                <option value="PHONE">Phone Number</option>
                <option value="EMAIL">Email</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase">Indicator Value</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="e.g. slpost-customs-clearance.top or +94770192834"
                className="w-full p-2.5 text-xs rounded-xl border border-surface-border"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase">Source Authority</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-surface-border"
              >
                <option value="CERT_LK">Sri Lanka CERT|CC</option>
                <option value="INTERNAL_INTEL">Internal Threat Intel</option>
                <option value="COMMUNITY_CONSENSUS">Community Consensus</option>
                <option value="MODERATOR">Moderator Verified</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold border rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-trust text-white rounded-xl"
              >
                {isSubmitting ? "Adding..." : "Add Indicator"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Threats List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-secondary">
            Loading threat indicators...
          </div>
        ) : (
          threats.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-surface border border-surface-border shadow-soft flex items-center justify-between gap-4"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary">
                    {t.indicatorType}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    Source: <strong className="text-text-secondary">{t.source}</strong>
                  </span>
                </div>
                <div className="font-mono text-xs sm:text-sm font-bold text-text-primary truncate">
                  {t.displayValue}
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-3">
                <RiskBadge level={t.riskLevel} size="sm" />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
