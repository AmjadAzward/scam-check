"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, AlertCircle, ShieldCheck, Building2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import ProcessingScreen from "@/components/common/ProcessingScreen";

export default function LinkChecker() {
  const router = useRouter();
  const { t } = useLanguage();

  const [url, setUrl] = useState("");
  const [claimedBrand, setClaimedBrand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    async function loadBrands() {
      try {
        const response = await fetch("/api/brands");
        const data = await response.json();
        if (response.ok && Array.isArray(data.brands)) {
          setBrands(data.brands.map((brand: { id: string; name: string }) => ({
            id: brand.id,
            name: brand.name,
          })));
        }
      } catch {
        setError("The official brand registry is temporarily unavailable.");
      }
    }
    loadBrands();
  }, []);

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
          {brands.map((brand) => (
            <option key={brand.id} value={brand.name}>
              {brand.name}
            </option>
          ))}
        </select>
        <p className="text-xs text-text-tertiary px-1">
          If the message claims to be from a specific company, select it here to test for lookalike domain impersonation.
        </p>
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
