import React from "react";
import { AlertCircle, AlertTriangle, ShieldX, Link2, Users, CreditCard } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface Reason {
  title: string;
  description: string;
  evidence?: string | null;
  source?: string;
}

interface RiskReasonsListProps {
  reasons: Reason[];
}

export default function RiskReasonsList({ reasons }: RiskReasonsListProps) {
  const { t } = useLanguage();

  if (!reasons || reasons.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
        {t("risk.whySuspicious")}
      </h3>

      <div className="space-y-2.5">
        {reasons.map((r, idx) => (
          <div
            key={idx}
            className="p-4 rounded-card bg-surface border border-surface-border shadow-soft flex items-start gap-3.5 transition-all hover:border-surface-border/80"
          >
            <div className="w-8 h-8 rounded-lg bg-risk-high-bg text-risk-high flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>

            <div className="flex-1 space-y-1">
              <div className="font-semibold text-sm text-text-primary">{r.title}</div>
              <p className="text-sm text-text-secondary leading-relaxed">{r.description}</p>

              {r.evidence && (
                <div className="mt-2 text-xs font-mono text-text-secondary bg-surface-muted px-2.5 py-1.5 rounded-md border border-surface-border/60 break-all">
                  <span className="font-semibold text-text-tertiary mr-1.5">Evidence:</span>
                  {r.evidence}
                </div>
              )}

              {r.source && (
                <div className="text-[11px] text-text-tertiary mt-1">
                  Source: {r.source}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
