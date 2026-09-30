import React from "react";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface RecommendedActionsProps {
  recommendations: string[];
}

export default function RecommendedActions({ recommendations }: RecommendedActionsProps) {
  const { t } = useLanguage();

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider">
        {t("risk.whatToDo")}
      </h3>

      <div className="p-4 sm:p-5 rounded-card bg-surface border border-surface-border shadow-soft space-y-3">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-trust-subtle text-trust flex items-center justify-center shrink-0 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
            </div>
            <p className="text-sm font-medium text-text-primary leading-normal">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
