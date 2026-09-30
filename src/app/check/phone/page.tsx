"use client";

import React from "react";
import PhoneChecker from "@/components/check/PhoneChecker";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export default function PhoneCheckPage() {
  const { t } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="p-2 rounded-xl bg-surface border border-surface-border text-text-secondary hover:text-text-primary hover:bg-surface-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            {t("actions.checkNumber")}
          </h1>
          <p className="text-xs text-text-secondary">
            {t("actions.checkNumberDesc")}
          </p>
        </div>
      </div>

      <div className="glass-surface p-6 sm:p-8 rounded-3xl">
        <PhoneChecker />
      </div>
    </div>
  );
}
