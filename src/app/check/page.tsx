"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { Image, MessageSquare, Link2, Phone, QrCode, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

const checkerFallback = () => <div className="h-64 animate-pulse rounded-2xl bg-surface-muted" />;
const MessageChecker = dynamic(() => import("@/components/check/MessageChecker"), { loading: checkerFallback });
const ScreenshotChecker = dynamic(() => import("@/components/check/ScreenshotChecker"), { loading: checkerFallback });
const LinkChecker = dynamic(() => import("@/components/check/LinkChecker"), { loading: checkerFallback });
const PhoneChecker = dynamic(() => import("@/components/check/PhoneChecker"), { loading: checkerFallback });
const QrChecker = dynamic(() => import("@/components/check/QrChecker"), { loading: checkerFallback, ssr: false });

type TabType = "screenshot" | "message" | "link" | "phone" | "qr";

function CheckHubContent() {
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "message";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabType;
    if (tabParam && ["screenshot", "message", "link", "phone", "qr"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    { id: "message" as TabType, label: t("actions.pasteMessage"), icon: MessageSquare },
    { id: "screenshot" as TabType, label: t("actions.uploadScreenshot"), icon: Image },
    { id: "link" as TabType, label: t("actions.checkLink"), icon: Link2 },
    { id: "phone" as TabType, label: t("actions.checkNumber"), icon: Phone },
    { id: "qr" as TabType, label: t("actions.scanQr"), icon: QrCode },
  ];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          {t("actions.checkSomething")}
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Choose an inspection method to evaluate suspicious content before taking risk.
        </p>
      </div>

      {/* Tabs Bar */}
      <div className="glass-surface flex overflow-x-auto no-scrollbar gap-1.5 p-1 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 min-w-[100px] py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all touch-target ${
                isActive
                  ? "bg-primary text-white shadow-soft"
                  : "text-text-secondary hover:text-text-primary hover:bg-surface-muted"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="truncate">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="glass-surface p-6 sm:p-8 rounded-3xl">
        {activeTab === "message" && <MessageChecker />}
        {activeTab === "screenshot" && <ScreenshotChecker />}
        {activeTab === "link" && <LinkChecker />}
        {activeTab === "phone" && <PhoneChecker />}
        {activeTab === "qr" && <QrChecker />}
      </div>
    </div>
  );
}

export default function CheckHubPage() {
  return (
    <Suspense fallback={<div className="max-w-3xl mx-auto h-96 rounded-3xl bg-surface border border-surface-border animate-pulse" />}>
      <CheckHubContent />
    </Suspense>
  );
}
