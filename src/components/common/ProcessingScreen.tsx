"use client";

import React, { useState, useEffect } from "react";
import { Shield, Check } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

interface ProcessingScreenProps {
  scanType?: string;
}

export default function ProcessingScreen({ scanType }: ProcessingScreenProps) {
  const { t } = useLanguage();

  const steps = [
    t("processing.readingMessage"),
    t("processing.checkingLinks"),
    t("processing.lookingForImpersonation"),
    t("processing.checkingCommunityReports"),
    t("processing.preparingResult"),
  ];

  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 900);

    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="py-12 px-4 max-w-md mx-auto text-center space-y-8 animate-in fade-in duration-300">
      {/* Calm pulsing shield */}
      <div className="relative inline-flex items-center justify-center">
        <div className="w-20 h-20 rounded-2xl bg-trust-subtle flex items-center justify-center text-trust animate-pulse">
          <Shield className="w-10 h-10 stroke-[1.75]" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-trust/20 animate-ping opacity-75" />
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-bold text-text-primary tracking-tight">
          {steps[activeStep]}
        </h2>
        <p className="text-xs text-text-secondary max-w-xs mx-auto">
          {t("processing.calmNotice")}
        </p>
      </div>

      {/* Gentle sequence checklist */}
      <div className="space-y-2.5 max-w-xs mx-auto text-left bg-surface p-4 rounded-card border border-surface-border shadow-soft">
        {steps.map((stepText, idx) => {
          const isDone = idx < activeStep;
          const isCurrent = idx === activeStep;

          return (
            <div
              key={idx}
              className={`flex items-center gap-2.5 text-xs transition-opacity duration-300 ${
                isDone
                  ? "text-risk-low font-medium opacity-100"
                  : isCurrent
                  ? "text-trust font-semibold opacity-100"
                  : "text-text-tertiary opacity-40"
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${
                  isDone
                    ? "bg-risk-low-bg text-risk-low"
                    : isCurrent
                    ? "bg-trust-subtle text-trust animate-pulse"
                    : "bg-surface-subtle text-text-tertiary"
                }`}
              >
                {isDone ? <Check className="w-3 h-3 stroke-[3]" /> : idx + 1}
              </div>
              <span>{stepText}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
