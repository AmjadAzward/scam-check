"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Filter,
  PlusCircle,
  ShieldCheck,
  Lock,
  Calendar,
  AlertCircle,
  Tag,
  ArrowRight,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { useSession } from "next-auth/react";

interface ReportItem {
  id: string;
  identifierType: string;
  displayValueMasked: string;
  category: string;
  description: string;
  platform?: string;
  amountLost?: number | null;
  currency?: string;
  status: string;
  dateEncountered: string;
  createdAt: string;
}

export default function ReportsPage() {
  const { t } = useLanguage();
  const { data: session } = useSession();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    "all",
    "Courier Scam",
    "Banking Scam",
    "Investment Scam",
    "Job Scam",
    "Marketplace Scam",
    "Government Impersonation",
    "Phishing",
    "OTP Scam",
    "Romance Scam",
    "Tech Support Scam",
    "Loan Scam",
    "Lottery Scam",
    "Social Media Scam",
    "Other",
  ];

  useEffect(() => {
    async function fetchReports() {
      setIsLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (selectedCategory && selectedCategory !== "all") {
          queryParams.set("category", selectedCategory);
        }
        if (searchTerm.trim()) {
          queryParams.set("search", searchTerm.trim());
        }

        const res = await fetch(`/api/reports?${queryParams.toString()}`);
        const data = await res.json();
        if (data.reports) {
          setReports(data.reports);
        }
      } catch (err) {
        console.error("Failed to load reports:", err);
      } finally {
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      fetchReports();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Header & Submit CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-trust-subtle text-trust text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Community Intelligence</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            {t("reports.title")}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-0.5">
            {t("reports.subtitle")}
          </p>
        </div>

        <Link
          href={session?.user ? "/reports/submit" : "/auth/login?callbackUrl=/reports/submit"}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-soft transition-colors shrink-0 touch-target"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{session?.user ? t("reports.submitNew") : "Sign in to report"}</span>
        </Link>
      </div>

      {/* Privacy Notice Banner */}
      <div className="p-3.5 rounded-2xl bg-surface-muted border border-surface-border flex items-center gap-3 text-xs text-text-secondary">
        <Lock className="w-4 h-4 text-risk-low shrink-0" />
        <span>{t("reports.maskedNotice")}</span>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("reports.searchPlaceholder")}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-surface-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
          />
        </div>

        <div className="sm:w-56 shrink-0">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full py-2.5 px-3 text-xs sm:text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? t("reports.allCategories") : c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Feed */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-text-secondary">
            Loading community intelligence reports...
          </div>
        ) : reports.length > 0 ? (
          reports.map((report) => (
            <div
              key={report.id}
              className="glass-surface p-5 rounded-2xl space-y-3 hover:border-trust/40 hover:-translate-y-0.5 transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-surface-border/60">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-surface-border">
                    {report.identifierType}
                  </span>
                  <span className="font-mono font-bold text-sm text-text-primary">
                    {report.displayValueMasked}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-trust-subtle text-trust">
                    {report.category}
                  </span>
                  {report.status === "CONFIRMED_BY_MODERATOR" && (
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-risk-low-bg text-risk-low border border-risk-low-border">
                      Verified
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                {report.description}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] text-text-tertiary pt-1">
                <div className="flex items-center gap-3">
                  {report.platform && (
                    <span>
                      Platform: <strong className="text-text-secondary">{report.platform}</strong>
                    </span>
                  )}
                  {report.amountLost && (
                    <span className="text-risk-high font-semibold">
                      Lost: {report.currency || "LKR"} {report.amountLost.toLocaleString()}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" />
                  <span>
                    Reported {new Date(report.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center rounded-2xl bg-surface border border-surface-border space-y-3">
            <AlertCircle className="w-8 h-8 text-text-tertiary mx-auto" />
            <div className="text-sm font-semibold text-text-primary">No reports found</div>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No matching community reports were found for this query. Be the first to report suspicious activity.
            </p>
            <Link
              href={session?.user ? "/reports/submit" : "/auth/login?callbackUrl=/reports/submit"}
              className="inline-block mt-2 px-4 py-2 rounded-xl bg-trust text-white text-xs font-semibold shadow-soft"
            >
              Submit a Report
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
