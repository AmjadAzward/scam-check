"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Link2, AlertCircle, ShieldCheck, Sparkles, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import ProcessingScreen from "@/components/common/ProcessingScreen";

export default function LinkChecker() {
  const router = useRouter();
  const { t } = useLanguage();

  const [url, setUrl] = useState("");
  const [claimedBrand, setClaimedBrand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const popularBrands = [
    "Daraz",
    "Sri Lanka Post",
    "Commercial Bank of Ceylon",
    "Bank of Ceylon (BOC)",
    "Sampath Bank",
    "Dialog Axiata",
    "SLT-MOBITEL",
    "PickMe",
    "Uber",
    "DHL Express",
  ];

  const sampleLinks = [
    {
      title: "Sri Lanka Post Lookalike Phishing",
      url: "http://slpost-customs-clearance.top/pay",
      brand: "Sri Lanka Post",
    },
    {
      title: "Daraz Impersonation Phishing",
      url: "http://daraz-delivery-tracking.xyz/claim-order",
      brand: "Daraz",
    },
    {
      title: "Dialog Official Portal (Safe verification)",
      url: "https://dialog.lk/myaccount",
      brand: "Dialog Axiata",
    },
    {
      title: "Raw IP Phishing Kit",
      url: "http://192.241.144.20/bank/login.php",
      brand: "Commercial Bank of Ceylon",
    },
  ];

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError("Please paste or type the link you want to check.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType: "URL",
          url: url.trim(),
          text: claimedBrand ? `Claimed brand: ${claimedBrand}. Target URL: ${url.trim()}` : url.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      router.push(`/result/${data.scanId}`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze link");
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingScreen scanType="URL" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Link Input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Website Address / Link
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-text-tertiary">
            <Link2 className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. slpost-customs-clearance.top or https://..."
            className="w-full pl-11 pr-4 py-4 text-base rounded-2xl border border-surface-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust shadow-soft transition-all"
          />
        </div>
        <p className="text-xs text-text-tertiary px-1">
          ScamCheck inspects the destination safely without opening the link in your browser.
        </p>
      </div>

      {/* Optional Brand Comparison */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-trust" />
          Claimed Organization (Optional)
        </label>
        <select
          value={claimedBrand}
          onChange={(e) => setClaimedBrand(e.target.value)}
          className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
        >
          <option value="">-- Compare with official Brand Registry (e.g. Daraz, SL Post) --</option>
          {popularBrands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-tertiary px-1">
          If the message claims to be from a specific company, select it here to test for lookalike domain impersonation.
        </p>
      </div>

      {/* Sample presets */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-trust" />
          Try sample URLs:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleLinks.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setUrl(s.url);
                setClaimedBrand(s.brand);
              }}
              className="text-left p-2.5 rounded-xl bg-surface border border-surface-border hover:border-trust/60 hover:bg-trust-subtle/30 transition-all text-xs"
            >
              <div className="font-semibold text-text-primary">{s.title}</div>
              <div className="text-text-secondary font-mono text-[11px] truncate mt-0.5">{s.url}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={!url.trim()}
        className="w-full py-4 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none transition-all shadow-card flex items-center justify-center gap-2 touch-target"
      >
        <ShieldCheck className="w-5 h-5 text-trust-subtle" />
        <span>Check Link</span>
      </button>
    </div>
  );
}
