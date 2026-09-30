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
      iconStyle: "bg-blue-600 text-white ring-blue-700/20 shadow-soft",
    },
    {
      title: t("actions.pasteMessage"),
      desc: t("actions.pasteMessageDesc"),
      icon: MessageSquare,
      href: "/check/message",
      badge: "Fastest",
      iconStyle: "bg-teal-700 text-white ring-teal-800/20 shadow-soft",
    },
    {
      title: t("actions.checkLink"),
      desc: t("actions.checkLinkDesc"),
      icon: Link2,
      href: "/check/link",
      iconStyle: "bg-violet-600 text-white ring-violet-700/20 shadow-soft",
    },
    {
      title: t("actions.checkNumber"),
      desc: t("actions.checkNumberDesc"),
      icon: Phone,
      href: "/check/phone",
      iconStyle: "bg-amber-600 text-white ring-amber-700/20 shadow-soft",
    },
  ];

  return (
    <div className="space-y-10 max-w-4xl mx-auto">
      {/* Hero Section */}
      <section className="glass-surface relative overflow-hidden text-center space-y-5 px-5 py-10 sm:px-10 sm:py-14 rounded-[2rem]">
        <div className="absolute -top-20 -left-16 w-56 h-56 rounded-full bg-trust-subtle/80 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-12 w-64 h-64 rounded-full bg-accent-subtle/80 blur-3xl pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary text-white text-xs font-semibold tracking-wide border border-primary shadow-soft">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t("app.tagline")}</span>
        </div>

        <h1 className="relative text-4xl sm:text-6xl font-extrabold text-primary tracking-[-0.035em] leading-[1.05]">
          {t("app.isThisSafe")}
        </h1>

        <p className="relative text-base sm:text-lg text-text-secondary max-w-xl mx-auto leading-relaxed">
          {t("app.subtitle")}
        </p>
        <div className="relative flex flex-wrap items-center justify-center gap-x-5 gap-y-2 pt-1 text-[11px] font-semibold text-text-secondary">
          <span className="inline-flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-accent" /> Private by design</span>
          <span className="inline-flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-trust" /> Clear explanations</span>
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-risk-low" /> No links opened</span>
        </div>
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
                className="glass-surface group relative p-6 rounded-2xl hover:border-trust/60 hover:-translate-y-1 hover:shadow-elevated transition-all duration-200 flex flex-col justify-between touch-target active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ring-1 group-hover:scale-105 transition-transform ${action.iconStyle}`}>
                    <Icon className="w-6 h-6 stroke-[2]" />
                  </div>
                  {action.badge && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary text-white border border-primary">
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
          className="group p-4 sm:p-5 rounded-2xl bg-primary text-white border border-primary-light hover:-translate-y-0.5 hover:shadow-elevated transition-all duration-200 flex items-center justify-between touch-target active:scale-[0.99]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 text-cyan-200 flex items-center justify-center group-hover:scale-105 transition-transform ring-1 ring-white/10">
              <QrCode className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <div className="text-sm font-bold text-white transition-colors">
                {t("actions.scanQr")}
              </div>
              <p className="text-xs text-blue-100/75">
                {t("actions.scanQrDesc")}
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-100 group-hover:translate-x-1 transition-all" />
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
                className="glass-surface p-4 rounded-xl hover:border-trust/40 hover:shadow-card transition-all flex items-center justify-between gap-4 group"
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
      <section className="glass-surface p-6 sm:p-8 rounded-3xl space-y-6">
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
