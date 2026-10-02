"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Phone, ShieldCheck, AlertCircle, Globe2, Smartphone, Radio, BadgeCheck, Info, Database, ListChecks } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import ProcessingScreen from "@/components/common/ProcessingScreen";
import RiskBadge from "@/components/risk/RiskBadge";

export default function PhoneChecker() {
  const router = useRouter();
  const { t } = useLanguage();

  const [phone, setPhone] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [quickResult, setQuickResult] = useState<any>(null);
  const [isQuickLoading, setIsQuickLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickLookup = async (numberToLookup: string) => {
    if (!numberToLookup || numberToLookup.trim().length < 3) return;

    setIsQuickLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/phone/lookup?number=${encodeURIComponent(numberToLookup.trim())}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Lookup failed");
      setQuickResult(json.data);
    } catch (err: any) {
      setError(err.message || "Failed to lookup number");
    } finally {
      setIsQuickLoading(false);
    }
  };

  const handleFullScan = async () => {
    if (!phone.trim()) {
      setError("Please enter a phone number to check.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType: "PHONE",
          phone: phone.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Scan failed");

      router.push(`/result/${data.scanId}`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze phone number");
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingScreen scanType="PHONE" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Phone Number (+94 or Local)
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary">
              <Phone className="w-5 h-5" />
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setQuickResult(null);
                if (error) setError(null);
              }}
              placeholder="e.g. 077 123 4567 or +94 77 123 4567"
              className="w-full pl-11 pr-4 py-4 text-base rounded-2xl border border-surface-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust shadow-soft transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => handleQuickLookup(phone)}
            disabled={!phone.trim() || isQuickLoading}
            className="px-5 py-4 rounded-2xl bg-trust hover:bg-trust-hover disabled:opacity-40 text-white font-semibold text-sm transition-all shadow-soft shrink-0 touch-target"
          >
            {isQuickLoading ? "Checking..." : "Look Up"}
          </button>
        </div>
        <p className="text-xs text-text-tertiary px-1">
          Supports local Sri Lankan numbers (07x, 011) and international formats (+94, +1, etc.).
        </p>
      </div>

      {/* Quick Lookup Intelligence Card */}
      {quickResult && (
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-card space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-surface-border">
            <div>
              <div className="text-xs font-semibold text-text-tertiary uppercase">Target Phone</div>
              <div className="text-lg font-bold text-text-primary tracking-wide">
                {quickResult.masked}
              </div>
              {quickResult.networkOperator && (
                <div className="text-xs text-text-secondary">
                  Operator: <span className="font-semibold text-text-primary">{quickResult.networkOperator}</span>
                </div>
              )}
            </div>
            <RiskBadge level={quickResult.riskLevel} />
          </div>

          {/* Statement */}
          <div className="p-3 rounded-xl bg-surface-muted text-sm font-medium text-text-primary">
            {quickResult.statement}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-text-secondary uppercase">
              Number intelligence
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { icon: Globe2, label: "Country", value: quickResult.countryName },
                { icon: Smartphone, label: "Number type", value: quickResult.numberType },
                { icon: Radio, label: "Original carrier", value: quickResult.networkOperator || "Not identified" },
                { icon: BadgeCheck, label: "Format check", value: quickResult.isValid ? "Valid number structure" : "Unrecognized structure" },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-muted/50 p-3">
                  <Icon className="h-4 w-4 shrink-0 text-trust" />
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">{label}</div>
                    <div className="truncate text-sm font-semibold text-text-primary">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-3 text-xs text-text-secondary space-y-1.5">
            <div className="flex justify-between gap-4">
              <span>International format</span>
              <span className="font-mono font-semibold text-text-primary">{quickResult.displayFormatted}</span>
            </div>
            {quickResult.localFormat && (
              <div className="flex justify-between gap-4">
                <span>Local format</span>
                <span className="font-mono font-semibold text-text-primary">{quickResult.localFormat}</span>
              </div>
            )}
            {quickResult.dialingPrefix && (
              <div className="flex justify-between gap-4">
                <span>Number prefix</span>
                <span className="font-mono font-semibold text-text-primary">0{quickResult.dialingPrefix}</span>
              </div>
            )}
          </div>

          {quickResult.carrierDisclaimer && (
            <div className="flex items-start gap-2 text-xs text-text-tertiary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{quickResult.carrierDisclaimer}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Community reports</div>
              <div className="mt-1 text-xl font-bold text-text-primary">{quickResult.totalCommunityReports}</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Moderator confirmed</div>
              <div className="mt-1 text-xl font-bold text-text-primary">{quickResult.confirmedReports}</div>
            </div>
            <div className="rounded-xl border border-surface-border bg-surface-muted/50 p-3">
              <div className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">Threat-list match</div>
              <div className={`mt-1 text-sm font-bold ${quickResult.threatIntelRecord ? "text-risk-high" : "text-trust"}`}>
                {quickResult.threatIntelRecord ? "Match found" : "No match"}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary">
              <Database className="h-4 w-4 text-trust" /> Intelligence coverage
            </div>
            <div className="mt-2 text-sm font-semibold text-text-primary">{quickResult.assessmentConfidence}</div>
            <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
              {quickResult.intelligenceSources?.map((source: any) => (
                <div key={source.name} className="flex items-center justify-between gap-2 text-xs text-text-secondary">
                  <span>{source.name}</span>
                  <span className={source.checked ? "font-semibold text-trust" : "text-text-tertiary"}>
                    {source.checked ? `${source.matches} match${source.matches === 1 ? "" : "es"}` : "Not applicable"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {quickResult.externalIntelligence?.available ? (
            <div className="rounded-xl border border-surface-border bg-surface p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary">
                  <ShieldCheck className="h-4 w-4 text-trust" /> External phone reputation
                </div>
                <span className={`text-sm font-bold ${quickResult.externalIntelligence.fraudScore >= 70 ? "text-risk-high" : quickResult.externalIntelligence.fraudScore >= 40 ? "text-risk-medium" : "text-trust"}`}>
                  {quickResult.externalIntelligence.fraudScore ?? "-"}/100
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                {[
                  ["Active line", quickResult.externalIntelligence.active],
                  ["Risky reputation", quickResult.externalIntelligence.risky],
                  ["Recent abuse", quickResult.externalIntelligence.recentAbuse],
                  ["Known spammer", quickResult.externalIntelligence.spammer],
                  ["VoIP number", quickResult.externalIntelligence.voip],
                  ["Prepaid number", quickResult.externalIntelligence.prepaid],
                ].map(([label, value]) => (
                  <div key={String(label)} className="flex items-center justify-between gap-2 border-b border-surface-border/60 pb-1.5">
                    <span className="text-text-secondary">{String(label)}</span>
                    <span className={`font-semibold ${value === true && label !== "Active line" ? "text-risk-high" : "text-text-primary"}`}>
                      {value === null ? "Unknown" : value ? "Yes" : "No"}
                    </span>
                  </div>
                ))}
              </div>
              {(quickResult.externalIntelligence.carrier || quickResult.externalIntelligence.lineType) && (
                <p className="text-xs text-text-tertiary">
                  Live metadata: {[quickResult.externalIntelligence.carrier, quickResult.externalIntelligence.lineType, quickResult.externalIntelligence.region].filter(Boolean).join(" - ")}
                </p>
              )}
              <p className="text-[11px] text-text-tertiary">Source: IPQualityScore Phone Reputation</p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-xl border border-surface-border bg-surface-muted/50 p-3 text-xs text-text-tertiary">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{quickResult.externalIntelligence?.message || "External phone reputation was unavailable. ScamCheck used its local intelligence sources."}</span>
            </div>
          )}

          {/* Categories Breakdown */}
          {quickResult.categories && quickResult.categories.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-text-secondary uppercase">
                Reported Categories Breakdown
              </div>
              <div className="space-y-1.5">
                {quickResult.categories.map((c: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between text-xs p-2 rounded-lg bg-surface-muted/60"
                  >
                    <span className="font-medium text-text-primary">{c.category}</span>
                    <span className="font-bold text-trust">{c.count} reports</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-text-secondary">
              No reports have been filed by the community for this number yet.
            </p>
          )}

          {quickResult.platforms?.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-text-secondary uppercase">Reported contact channels</div>
              <div className="flex flex-wrap gap-2">
                {quickResult.platforms.map((item: any) => (
                  <span key={item.platform} className="rounded-full border border-surface-border bg-surface-muted px-3 py-1 text-xs font-medium text-text-primary">
                    {item.platform}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(quickResult.firstReported || quickResult.mostRecentlyReported) && (
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-text-tertiary pt-2 border-t border-surface-border">
              {quickResult.firstReported && (
                <span>First reported: {new Date(quickResult.firstReported).toLocaleDateString()}</span>
              )}
              {quickResult.mostRecentlyReported && (
                <span>Latest report: {new Date(quickResult.mostRecentlyReported).toLocaleDateString()}</span>
              )}
            </div>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-risk-medium-bg/60 p-3 text-xs text-text-secondary">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-risk-medium" />
            <span>{quickResult.verificationNote}</span>
          </div>

          <div className="rounded-xl border border-surface-border bg-surface p-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase text-text-secondary">
              <ListChecks className="h-4 w-4 text-trust" /> Recommended next steps
            </div>
            <ul className="mt-2 space-y-1.5 text-xs text-text-secondary">
              {quickResult.recommendedActions?.map((action: string) => (
                <li key={action} className="flex gap-2">
                  <span className="font-bold text-trust">✓</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Full Assessment button */}
          <button
            onClick={handleFullScan}
            className="w-full mt-2 py-3 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover transition-colors shadow-soft"
          >
            Generate Full Risk Certificate
          </button>
        </div>
      )}

      {/* Primary Action Button (if quick lookup not shown) */}
      {!quickResult && (
        <button
          onClick={handleFullScan}
          disabled={!phone.trim()}
          className="w-full py-4 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none transition-all shadow-card flex items-center justify-center gap-2 touch-target"
        >
          <ShieldCheck className="w-5 h-5 text-trust-subtle" />
          <span>Check Phone Number</span>
        </button>
      )}
    </div>
  );
}
