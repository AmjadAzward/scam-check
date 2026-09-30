"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Clock,
  Bookmark,
  Trash2,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import RiskBadge from "@/components/risk/RiskBadge";
import { useLanguage } from "@/lib/i18n/context";

interface ScanRecord {
  id: string;
  scanType: string;
  summary: string;
  riskLevel: string;
  riskScore: number;
  isSaved: boolean;
  createdAt: string;
}

export default function HistoryPage() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<"all" | "saved">("all");
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchScans = async (filterType: "all" | "saved") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/scan/recent?filter=${filterType}&limit=30`);
      const data = await res.json();
      if (data.scans) {
        setScans(data.scans);
      }
    } catch (err) {
      console.error("Failed to load scans:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchScans(tab);
  }, [tab]);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!confirm("Are you sure you want to permanently delete this scan record?")) {
      return;
    }

    try {
      const res = await fetch(`/api/scan/${id}`, { method: "DELETE" });
      if (res.ok) {
        setScans((prev) => prev.filter((s) => s.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete scan:", err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          Checks History
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Review recent assessments and your bookmarked verification records.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex rounded-xl bg-surface border border-surface-border p-1 shadow-soft">
        <button
          onClick={() => setTab("all")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors touch-target ${
            tab === "all" ? "bg-primary text-white shadow-soft" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Recent Checks</span>
        </button>
        <button
          onClick={() => setTab("saved")}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors touch-target ${
            tab === "saved" ? "bg-primary text-white shadow-soft" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Checks</span>
        </button>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-secondary">
            Loading assessment records...
          </div>
        ) : scans.length > 0 ? (
          scans.map((scan) => (
            <Link
              key={scan.id}
              href={`/result/${scan.id}`}
              className="p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border hover:border-surface-border/80 hover:shadow-soft transition-all flex items-center justify-between gap-4 group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary">
                    {scan.scanType}
                  </span>
                  <span className="text-xs text-text-tertiary">
                    {new Date(scan.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-sm font-semibold text-text-primary group-hover:text-trust transition-colors truncate">
                  {scan.summary}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <RiskBadge level={scan.riskLevel} size="sm" />
                <button
                  onClick={(e) => handleDelete(scan.id, e)}
                  className="p-1.5 text-text-tertiary hover:text-risk-high hover:bg-risk-high-bg rounded-lg transition-colors"
                  title="Delete scan"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </Link>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface border border-surface-border space-y-3">
            <AlertCircle className="w-8 h-8 text-text-tertiary mx-auto" />
            <div className="text-sm font-semibold text-text-primary">
              {tab === "saved" ? "No saved checks yet" : "No recent checks recorded"}
            </div>
            <p className="text-xs text-text-secondary max-w-xs mx-auto">
              {tab === "saved"
                ? "You can bookmark important checks to review later by clicking 'Save Check' on any result screen."
                : "Check your first suspicious message, screenshot or link."}
            </p>
            <Link
              href="/check"
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-trust text-white text-xs font-semibold shadow-soft"
            >
              Check Something Now
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
