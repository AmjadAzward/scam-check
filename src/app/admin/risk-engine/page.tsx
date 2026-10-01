"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, RotateCcw } from "lucide-react";
import { DEFAULT_WEIGHTS } from "@/lib/risk-engine/config";
import type { RiskEngineWeights } from "@/lib/risk-engine/types";

export default function RiskEngineSettingsPage() {
  const [weights, setWeights] = useState<RiskEngineWeights>(DEFAULT_WEIGHTS);
  const [, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadWeights() {
      try {
        const res = await fetch("/api/admin/settings");
        const data = await res.json();
        if (data.weights) {
          setWeights(data.weights);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWeights();
  }, []);

  const handleWeightChange = (key: keyof RiskEngineWeights, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weights }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2500);
      }
    } catch (err) {
      console.error("Save weights error:", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setWeights(DEFAULT_WEIGHTS);
  };

  const weightSliders: { key: keyof RiskEngineWeights; title: string; desc: string }[] = [
    {
      key: "threatIntelWeight",
      title: "Authoritative Threat Intelligence Weight",
      desc: "Influence of CERT|CC and verified malicious database records",
    },
    {
      key: "urlIntelWeight",
      title: "URL Intelligence & Structural Risk Weight",
      desc: "Weight applied to suspicious TLDs, punycode, redirects and raw IP addresses",
    },
    {
      key: "impersonationWeight",
      title: "Brand Impersonation & Registry Mismatch Weight",
      desc: "Weight applied when message claims a known brand but uses a foreign domain",
    },
    {
      key: "sensitiveInfoWeight",
      title: "Sensitive Credential & OTP Solicitation Weight",
      desc: "Weight triggered by attempts to harvest one-time passcodes, PINs or CVVs",
    },
    {
      key: "aiMessageWeight",
      title: "AI Message Urgency & Social Engineering Weight",
      desc: "Weight given to coercive language, threats, and fake prize patterns",
    },
    {
      key: "communityWeight",
      title: "Community Intelligence Consensus Weight",
      desc: "Weight assigned to citizen-submitted reports and scam volume",
    },
    {
      key: "senderVerificationWeight",
      title: "Sender Identity Verification Weight",
      desc: "Weight applied when SMS header or sender cannot be authenticated",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
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
            Risk Engine Scoring Weights
          </h1>
          <p className="text-xs text-text-secondary">
            Configure dynamic weighting ratios across backend verification channels without changing frontend code.
          </p>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-surface-border text-xs font-semibold text-text-secondary hover:bg-surface-muted transition-colors shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Defaults</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="p-3.5 rounded-xl bg-risk-low-bg border border-risk-low-border text-risk-low text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>Scoring weights successfully updated and deployed to Risk Engine.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card space-y-6">
        <div className="space-y-5">
          {weightSliders.map((slider) => {
            const currentVal = weights[slider.key] || 0.2;
            const pct = Math.round(currentVal * 100);

            return (
              <div key={slider.key} className="space-y-1.5 p-3.5 rounded-2xl bg-surface-muted/60 border border-surface-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text-primary">{slider.title}</span>
                  <span className="font-mono text-xs font-bold text-trust">{pct}% (weight: {currentVal.toFixed(2)})</span>
                </div>
                <p className="text-[11px] text-text-secondary">{slider.desc}</p>
                <input
                  type="range"
                  min="0.05"
                  max="0.50"
                  step="0.01"
                  value={currentVal}
                  onChange={(e) => handleWeightChange(slider.key, parseFloat(e.target.value))}
                  className="w-full h-2 bg-surface-border rounded-lg appearance-none cursor-pointer accent-trust mt-2"
                />
              </div>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-soft"
        >
          {isSaving ? "Saving..." : "Apply New Risk Engine Weights"}
        </button>
      </form>
    </div>
  );
}
