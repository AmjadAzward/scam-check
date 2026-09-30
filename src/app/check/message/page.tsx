"use client";

import React from "react";
import MessageChecker from "@/components/check/MessageChecker";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export default function MessagePage() {
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
            {t("actions.pasteMessage")}
          </h1>
          <p className="text-xs text-text-secondary">
            {t("actions.pasteMessageDesc")}
          </p>
        </div>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card">
        <MessageChecker />
      </div>
    </div>
  );
}
