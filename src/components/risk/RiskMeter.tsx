import React from "react";
import { RiskLevel } from "@/lib/risk-engine/types";

interface RiskMeterProps {
  score: number;
  level: RiskLevel | string;
  assessmentStatus?: string;
  evidenceConfidence?: number;
}

export default function RiskMeter({ score, level, assessmentStatus, evidenceConfidence }: RiskMeterProps) {
  const normalized = level?.toUpperCase().replace(/-/g, "_");

  let barColor = "bg-[#157A55]";
  if (normalized === "MEDIUM_RISK") {
    barColor = "bg-[#B7791F]";
  } else if (normalized === "HIGH_RISK") {
    barColor = "bg-[#C53A3A]";
  } else if (normalized === "KNOWN_MALICIOUS") {
    barColor = "bg-[#8B1E1E]";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          Risk Assessment
        </span>
        {assessmentStatus === "INSUFFICIENT_EVIDENCE" ? (
          <span className="text-sm font-bold text-risk-medium">Insufficient evidence</span>
        ) : <div className="flex items-baseline gap-1">
          <span className="text-3xl font-extrabold text-text-primary tracking-tight">
            {score}
          </span>
          <span className="text-sm font-medium text-text-secondary">/ 100</span>
        </div>}
      </div>

      {/* Calm, flat progress bar */}
      <div className="w-full h-3 bg-surface-subtle rounded-full overflow-hidden p-0.5 border border-surface-border">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
          style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
        />
      </div>

      <div className="flex justify-between text-[10px] text-text-tertiary font-medium">
        <span>Low Risk</span>
        <span>Medium</span>
        <span>High Risk</span>
      </div>
      {typeof evidenceConfidence === "number" && (
        <p className="text-[10px] text-text-tertiary">Evidence confidence: {evidenceConfidence}% - separate from risk severity.</p>
      )}
    </div>
  );
}
