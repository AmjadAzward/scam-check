"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  ShieldAlert,
  Filter,
} from "lucide-react";

interface ModerationReport {
  id: string;
  identifierType: string;
  displayValueMasked: string;
  category: string;
  description: string;
  platform?: string;
  amountLost?: number | null;
  currency?: string;
  status: string;
  evidenceStorageKey?: string;
  dateEncountered: string;
  createdAt: string;
}

export default function ModerationQueuePage() {
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [filter, setFilter] = useState("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadQueue = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/moderation?status=${filter}`);
      const data = await res.json();
      if (data.reports) {
        setReports(data.reports);
      }
    } catch (err) {
      console.error("Queue load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, [filter]);

  const handleAction = async (reportId: string, action: string, notes?: string) => {
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportId,
          action,
          moderatorNotes: notes || `Moderator performed ${action}`,
          threatIndicatorDetails:
            action === "ADD_THREAT_INDICATOR"
              ? {
                  indicatorType: "URL",
                  displayValue: "Reported Target",
                  riskLevel: "KNOWN_MALICIOUS",
                }
              : undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionSuccess(`Report ${action} processed successfully.`);
        setTimeout(() => setActionSuccess(null), 3000);
        loadQueue();
      } else {
        alert(data.error || "Action failed");
      }
    } catch (err) {
      console.error("Moderation action error:", err);
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
            Moderation Queue
          </h1>
          <p className="text-xs text-text-secondary">
            Review community evidence, verify reports, reject noise, and escalate to Threat Indicators.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="text-xs p-2 rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none"
          >
            <option value="ALL">All Reports</option>
            <option value="PENDING">Pending Only</option>
            <option value="VISIBLE">Visible / Approved</option>
            <option value="CONFIRMED_BY_MODERATOR">Confirmed by Moderator</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low text-xs font-semibold">
          {actionSuccess}
        </div>
      )}

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-secondary">
            Loading moderation queue...
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-border">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-surface-muted text-text-secondary">
                    {report.identifierType}
                  </span>
                  <span className="font-mono font-bold text-sm text-text-primary">
                    {report.displayValueMasked}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-trust-subtle text-trust">
                    {report.category}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      report.status === "CONFIRMED_BY_MODERATOR"
                        ? "bg-risk-low-bg text-risk-low"
                        : report.status === "REJECTED"
                        ? "bg-risk-high-bg text-risk-high"
                        : "bg-surface-muted text-text-secondary"
                    }`}
                  >
                    {report.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1 text-xs sm:text-sm">
                <div className="text-xs font-semibold text-text-tertiary uppercase">Description</div>
                <p className="text-text-primary leading-relaxed">{report.description}</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-text-tertiary pt-1">
                <div>
                  Platform: <strong className="text-text-secondary">{report.platform || "Direct"}</strong>
                  {report.amountLost && (
                    <span className="ml-3 text-risk-high font-semibold">
                      Lost: {report.currency} {report.amountLost.toLocaleString()}
                    </span>
                  )}
                </div>
                <div>Submitted: {new Date(report.createdAt).toLocaleString()}</div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-surface-border">
                <button
                  onClick={() => handleAction(report.id, "CONFIRM", "Verified scam incident")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-risk-low-bg text-risk-low hover:bg-risk-low/20 transition-colors flex items-center gap-1.5 touch-target"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Confirm Verified</span>
                </button>

                <button
                  onClick={() => handleAction(report.id, "ADD_THREAT_INDICATOR", "Promoted to global threat indicator")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-trust-subtle text-trust hover:bg-trust/20 transition-colors flex items-center gap-1.5 touch-target"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Promote to Threat Feed</span>
                </button>

                <button
                  onClick={() => handleAction(report.id, "REJECT", "Noise / unverified")}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-risk-high-bg text-risk-high hover:bg-risk-high/20 transition-colors flex items-center gap-1.5 touch-target"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface border border-surface-border text-xs text-text-secondary">
            No reports in the moderation queue matching this filter.
          </div>
        )}
      </div>
    </div>
  );
}
