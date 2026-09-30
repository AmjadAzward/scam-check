"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Code2, Database, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface Signal {
  type: string;
  score: number;
  confidence: number;
  title: string;
  description: string;
  evidence?: string | null;
  source: string;
}

interface TechnicalDetailsProps {
  signals?: Signal[];
  normalizedTarget?: string | null;
  scanType?: string;
  technicalData?: Record<string, any>;
}

export default function TechnicalDetails({
  signals = [],
  normalizedTarget,
  scanType,
  technicalData,
}: TechnicalDetailsProps) {
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="rounded-card border border-surface-border bg-surface overflow-hidden shadow-soft">
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-surface-muted transition-colors touch-target"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 text-xs font-semibold text-text-secondary uppercase tracking-wider">
          <Code2 className="w-4 h-4 text-trust" />
          <span>{t("risk.technicalDetails")}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          <span>{open ? "Hide" : "Show"}</span>
          {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {open && (
        <div className="p-4 sm:p-5 border-t border-surface-border bg-surface-muted/40 space-y-4 text-xs font-mono">
          {/* Normalized Target */}
          {normalizedTarget && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-text-tertiary uppercase">Normalized Target</div>
              <div className="p-2.5 rounded-lg bg-surface border border-surface-border text-text-primary break-all">
                {normalizedTarget}
              </div>
            </div>
          )}

          {/* All Sub-Signals */}
          {signals.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] font-semibold text-text-tertiary uppercase">Engine Signals Breakdown</div>
              <div className="space-y-2">
                {signals.map((sig, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-surface border border-surface-border space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-text-primary">{sig.title}</span>
                      <span className="text-trust">Score: {sig.score} | Conf: {sig.confidence}%</span>
                    </div>
                    <div className="text-text-secondary font-sans text-xs">{sig.description}</div>
                    <div className="text-[10px] text-text-tertiary">Channel: {sig.type} • Source: {sig.source}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Raw JSON inspection */}
          {technicalData && (
            <div className="space-y-1">
              <div className="text-[11px] font-semibold text-text-tertiary uppercase">Diagnostic Context</div>
              <pre className="p-3 rounded-lg bg-[#111827] text-emerald-400 overflow-x-auto text-[11px] leading-relaxed">
                {JSON.stringify(technicalData, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
