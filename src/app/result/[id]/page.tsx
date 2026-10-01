"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  Bookmark,
  BookmarkCheck,
  RefreshCw,
  Share2,
  AlertTriangle,
  Flag,
  ArrowLeft,
} from "lucide-react";
import RiskBadge from "@/components/risk/RiskBadge";
import RiskMeter from "@/components/risk/RiskMeter";
import RiskReasonsList from "@/components/risk/RiskReasonsList";
import RecommendedActions from "@/components/risk/RecommendedActions";
import TechnicalDetails from "@/components/risk/TechnicalDetails";
import { useLanguage } from "@/lib/i18n/context";
import { useSession } from "next-auth/react";

export default function RiskResultPage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const { data: session } = useSession();
  const scanId = params.id as string;

  const [scan, setScan] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadScan() {
      try {
        const res = await fetch(`/api/scan/${scanId}`);
        const data = await res.json();
        if (data.scan) {
          setScan(data.scan);
          setIsSaved(data.scan.isSaved || false);
        }
      } catch (err) {
        console.error("Failed to load scan:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadScan();
  }, [scanId]);

  const handleToggleSave = async () => {
    if (!session?.user) {
      router.push(`/auth/login?callbackUrl=${encodeURIComponent(`/result/${scanId}`)}`);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/scan/${scanId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isSaved: !isSaved }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSaved(data.isSaved);
      }
    } catch (err) {
      console.error("Failed to update save status:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: `ScamCheck Result: ${scan?.summary}`,
          text: `ScamCheck evaluated this as ${scan?.riskLevel?.replace(/_/g, " ")} (${scan?.riskScore}/100). Check before you click, pay or reply.`,
          url: window.location.href,
        })
        .catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center space-y-3 max-w-md mx-auto">
        <div className="w-10 h-10 border-4 border-trust border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium text-text-secondary">
          Retrieving security risk assessment...
        </p>
      </div>
    );
  }

  if (!scan) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-risk-medium mx-auto" />
        <h2 className="text-xl font-bold text-text-primary">Scan Not Found</h2>
        <p className="text-xs text-text-secondary">
          This check record may have been erased to protect privacy or the link is invalid.
        </p>
        <Link
          href="/check"
          className="inline-block px-5 py-2.5 rounded-xl bg-trust text-white text-xs font-semibold"
        >
          Check Something Else
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="p-2 rounded-xl bg-surface border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="p-2 rounded-xl bg-surface border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors text-xs font-semibold flex items-center gap-1.5 touch-target"
            title="Share assessment"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline">{copied ? "Copied Link!" : "Share"}</span>
          </button>

          <button
            onClick={handleToggleSave}
            disabled={isSaving}
            className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors touch-target ${
              isSaved
                ? "bg-trust-subtle text-trust border-trust/30"
                : "bg-surface border-surface-border text-text-secondary hover:text-text-primary"
            }`}
          >
            {isSaved ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-trust" />
                <span className="hidden sm:inline">{t("actions.saved")}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">{t("actions.saveCheck")}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Risk Result Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card space-y-6">
        {/* Header: Title & Risk Level */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-surface-border">
              {scan.scanType} ASSESSMENT
            </span>
            <RiskBadge level={scan.riskLevel} size="md" />
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight leading-snug">
            {scan.summary}
          </h1>
        </div>

        {/* Risk Score Meter */}
        <div className="p-4 sm:p-5 rounded-2xl bg-surface-muted/60 border border-surface-border">
          <RiskMeter score={scan.riskScore} level={scan.riskLevel} />
        </div>

        {/* Why this looks suspicious */}
        <RiskReasonsList reasons={scan.signals || []} />

        {/* What you should do */}
        <RecommendedActions recommendations={scan.recommendations || []} />

        {/* Prompt specified Action Buttons */}
        <div className="pt-2 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Link
              href={`/reports/submit?prefill=${encodeURIComponent(scan.normalizedTarget || scan.summary)}&category=${encodeURIComponent(scan.claimedOrg ? "Courier Scam" : "Phishing")}`}
              className="py-3 px-4 rounded-xl font-bold text-xs text-text-primary bg-surface border border-surface-border hover:bg-surface-muted hover:border-trust transition-colors shadow-soft flex items-center justify-center gap-2 touch-target"
            >
              <Flag className="w-4 h-4 text-risk-medium" />
              <span>{t("actions.reportThis")}</span>
            </Link>

            <Link
              href="/check"
              className="py-3 px-4 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover transition-colors shadow-soft flex items-center justify-center gap-2 touch-target"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{t("actions.checkAnother")}</span>
            </Link>
          </div>

          {/* I Already Clicked Flow Link */}
          <Link
            href="/help/already-clicked"
            className="w-full py-3.5 px-4 rounded-xl font-bold text-xs text-risk-critical bg-risk-critical-bg border border-risk-critical-border hover:bg-risk-critical/10 transition-colors flex items-center justify-center gap-2 touch-target"
          >
            <ShieldAlert className="w-4 h-4" />
            <span>{t("actions.iAlreadyClicked")} - Get Incident Guidance</span>
          </Link>
        </div>

        {/* Expandable Technical Details */}
        <TechnicalDetails
          signals={scan.signals}
          normalizedTarget={scan.normalizedTarget}
          scanType={scan.scanType}
          technicalData={{
            scanId: scan.id,
            riskScore: scan.riskScore,
            riskLevel: scan.riskLevel,
            claimedOrganization: scan.claimedOrg,
            language: scan.language,
            createdAt: scan.createdAt,
          }}
        />
      </div>
    </div>
  );
}
