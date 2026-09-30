"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Image as ImageIcon,
  MessageSquare,
  Link2,
  Phone,
  QrCode,
  ShieldCheck,
  ArrowRight,
  ShieldAlert,
  Clock,
  Sparkles,
  Lock,
} from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import RiskBadge from "@/components/risk/RiskBadge";
import { useSession } from "next-auth/react";

interface RecentCheck {
  id: string;
  scanType: string;
  summary: string;
  riskLevel: string;
  riskScore: number;
  normalizedTarget?: string;
  createdAt: string;
}

export default function HomePage() {
  const { t } = useLanguage();
  const { data: session, status: sessionStatus } = useSession();
  const [recentChecks, setRecentChecks] = useState<RecentCheck[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user) {
      setRecentChecks([]);
      setIsLoading(false);
      return;
    }

    async function loadRecent() {
      try {
        const res = await fetch("/api/scan/recent?limit=4");
        const data = await res.json();
        if (data.scans) {
          setRecentChecks(data.scans);
        }
      } catch (err) {
        console.error("Failed to load recent checks:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadRecent();
  }, [session, sessionStatus]);

  const primaryActions = [
    {
      title: t("actions.uploadScreenshot"),
      desc: t("actions.uploadScreenshotDesc"),
      icon: ImageIcon,
      href: "/check/screenshot",
      badge: "Popular",
    },
    {
      title: t("actions.pasteMessage"),
      desc: t("actions.pasteMessageDesc"),
      icon: MessageSquare,
      href: "/check/message",
      badge: "Fastest",
    },
    {
      title: t("actions.checkLink"),
      desc: t("actions.checkLinkDesc"),
      icon: Link2,
      href: "/check/link",
    },
    {
      title: t("actions.checkNumber"),
      desc: t("actions.checkNumberDesc"),
      icon: Phone,
      href: "/check/phone",
    },
  ];

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="text-center space-y-4 pt-4 sm:pt-8">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-trust-subtle text-trust text-xs font-semibold tracking-wide border border-trust/10">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t("app.tagline")}</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-extrabold text-primary tracking-tight">
          {t("app.isThisSafe")}
        </h1>

        <p className="text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
          {t("app.subtitle")}
        </p>
      </section>

      {/* 4 Large Primary Actions + 5th QR Option */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {primaryActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <Link
                key={idx}
                href={action.href}
                className="group relative p-6 rounded-2xl bg-surface border border-surface-border hover:border-trust hover:shadow-card transition-all duration-200 flex flex-col justify-between touch-target active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-trust-subtle text-trust flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  {action.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-surface-muted text-text-secondary border border-surface-border">
                      {action.badge}
                    </span>
                  )}
                </div>

                <div className="mt-6 space-y-1">
                  <div className="text-base sm:text-lg font-bold text-text-primary group-hover:text-trust transition-colors flex items-center justify-between">
                    <span>{action.title}</span>
                    <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-trust group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-xs sm:text-sm text-text-secondary leading-normal">
                    {action.desc}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 5th Action: Scan QR Code */}
        <Link
          href="/check/qr"
          className="group p-4 sm:p-5 rounded-2xl bg-surface border border-surface-border hover:border-trust hover:shadow-soft transition-all duration-200 flex items-center justify-between touch-target active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-surface-muted text-trust flex items-center justify-center group-hover:scale-105 transition-transform">
              <QrCode className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-text-primary group-hover:text-trust transition-colors">
                {t("actions.scanQr")}
              </div>
              <p className="text-xs text-text-secondary">
                {t("actions.scanQrDesc")}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-trust group-hover:translate-x-1 transition-all" />
        </Link>
      </section>

      {/* Emergency banner for people who clicked */}
      <section>
        <Link
          href="/help/already-clicked"
          className="p-4 sm:p-5 rounded-2xl bg-risk-high-bg border border-risk-high-border/60 hover:border-risk-high transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-risk-high text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-bold text-risk-critical group-hover:underline">
                Already clicked a link or entered banking details?
              </div>
              <p className="text-xs text-text-secondary">
                Don&apos;t panic. Open our immediate defensive guide for card locks, OTP defense and official reporting.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-risk-critical bg-white/80 px-3 py-1.5 rounded-lg shrink-0 self-start sm:self-auto border border-risk-high-border">
            Get Emergency Help
          </span>
        </Link>
      </section>

      {/* Recent Checks Section */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-trust" />
            <h2 className="text-base font-bold text-text-primary">
              {t("home.recentChecks")}
            </h2>
          </div>
          <Link
            href="/history"
            className="text-xs font-semibold text-trust hover:underline"
          >
            {t("home.viewAll")}
          </Link>
        </div>

        <div className="space-y-2.5">
          {recentChecks.length > 0 ? (
            recentChecks.map((check) => (
              <Link
                key={check.id}
                href={`/result/${check.id}`}
                className="p-4 rounded-xl bg-surface border border-surface-border hover:border-surface-border/90 hover:shadow-soft transition-all flex items-center justify-between gap-4 group"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-sm font-semibold text-text-primary group-hover:text-trust transition-colors truncate">
                    {check.summary}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-tertiary">
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-muted text-text-secondary">
                      {check.scanType}
                    </span>
                    <span>•</span>
                    <span>{new Date(check.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <RiskBadge level={check.riskLevel} size="sm" />
                </div>
              </Link>
            ))
          ) : isLoading ? (
            <div className="p-8 text-center bg-surface rounded-2xl border border-surface-border text-xs text-text-secondary">
              Loading your recent checks...
            </div>
          ) : !session?.user ? (
            <div className="p-8 text-center bg-surface rounded-2xl border border-surface-border space-y-3">
              <p className="text-xs text-text-secondary">Sign in to save checks and view your private history.</p>
              <Link href="/auth/login?callbackUrl=/" className="inline-flex px-4 py-2 rounded-xl bg-trust text-white text-xs font-semibold">
                Sign In
              </Link>
            </div>
          ) : (
            <div className="p-8 text-center bg-surface rounded-2xl border border-surface-border text-xs text-text-secondary">
              You have no checks yet.
            </div>
          )}
        </div>
      </section>

      {/* How It Works Educational Cards */}
      <section className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-soft space-y-6">
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-text-primary">
            {t("home.howItWorks")}
          </h3>
          <p className="text-xs text-text-secondary">
            Multi-signal backend verification protecting consumers across Sri Lanka and globally.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs font-bold text-trust">{t("home.step1Title")}</div>
            <p className="text-xs text-text-secondary leading-relaxed">{t("home.step1Desc")}</p>
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs font-bold text-trust">{t("home.step2Title")}</div>
            <p className="text-xs text-text-secondary leading-relaxed">{t("home.step2Desc")}</p>
          </div>
          <div className="space-y-2 text-center sm:text-left">
            <div className="text-xs font-bold text-trust">{t("home.step3Title")}</div>
            <p className="text-xs text-text-secondary leading-relaxed">{t("home.step3Desc")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
