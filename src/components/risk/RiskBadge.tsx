import React from "react";
import { RiskLevel } from "@/lib/risk-engine/types";
import { ShieldCheck, AlertTriangle, AlertOctagon, Skull } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: "sm" | "md" | "lg";
}

export default function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const { t } = useLanguage();

  const normalized = level?.toUpperCase().replace(/-/g, "_");

  let config = {
    label: t("risk.lowRisk"),
    textColor: "text-[#157A55]",
    bgColor: "bg-[#EBF8F2]",
    borderColor: "border-[#A7E4CB]",
    icon: ShieldCheck,
  };

  if (normalized === "MEDIUM_RISK" || normalized === "MEDIUM") {
    config = {
      label: t("risk.mediumRisk"),
      textColor: "text-[#B7791F]",
      bgColor: "bg-[#FEF7E6]",
      borderColor: "border-[#FBD38D]",
      icon: AlertTriangle,
    };
  } else if (normalized === "HIGH_RISK" || normalized === "HIGH") {
    config = {
      label: t("risk.highRisk"),
      textColor: "text-[#C53A3A]",
      bgColor: "bg-[#FDF2F2]",
      borderColor: "border-[#F8B4B4]",
      icon: AlertOctagon,
    };
  } else if (normalized === "KNOWN_MALICIOUS" || normalized === "MALICIOUS") {
    config = {
      label: t("risk.knownMalicious"),
      textColor: "text-[#8B1E1E]",
      bgColor: "bg-[#FDF0F0]",
      borderColor: "border-[#EAA8A8]",
      icon: AlertOctagon,
    };
  }

  const Icon = config.icon;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs gap-1",
    md: "px-2.5 py-1 text-xs sm:text-sm gap-1.5 font-semibold",
    lg: "px-4 py-1.5 text-sm sm:text-base gap-2 font-bold",
  }[size];

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-lg border tracking-wide uppercase ${config.bgColor} ${config.textColor} ${config.borderColor} ${sizeClasses}`}
    >
      <Icon className={`${iconSizes} shrink-0`} />
      <span>{config.label}</span>
    </span>
  );
}
