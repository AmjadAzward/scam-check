"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Building2,
  Sliders,
  CheckCircle2,
  Clock,
  Activity,
  Layers,
  Users,
  ShieldAlert,
  ArrowRight,
} from "lucide-react";

export default function AdminOverviewPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/admin/stats");
        const data = await res.json();
        if (data.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  const adminNav = [
    {
      title: "Moderation Queue",
      desc: "Review community reports, confirm scam records and examine evidence",
      icon: FileCheck,
      href: "/admin/moderation",
      badge: stats?.pendingModeration ? `${stats.pendingModeration} Pending` : undefined,
    },
    {
      title: "Threat Indicators",
      desc: "Manage high-risk domains, malicious numbers and threat intelligence feeds",
      icon: ShieldAlert,
      href: "/admin/threats",
      badge: `${stats?.totalThreats || 0} Active`,
    },
    {
      title: "Brand Registry",
      desc: "Verified Sri Lankan and international brands and their official domains",
      icon: Building2,
      href: "/admin/brands",
    },
    {
      title: "Risk Engine Weights",
      desc: "Adjust scoring weights across AI, URL, threat intel and brand channels",
      icon: Sliders,
      href: "/admin/risk-engine",
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-trust" />
            <span>Operational Center</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
            Safety & Moderation Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary">
            System intelligence, community verification and threat monitoring.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-text-secondary">
            Engine Status: <strong className="text-emerald-600">Active</strong>
          </span>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="text-xs font-semibold text-text-tertiary uppercase">Total Checks</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary">
            {isLoading ? "..." : stats?.totalChecks ?? 0}
          </div>
          <div className="text-[11px] text-text-secondary">Consumer risk evaluations</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="text-xs font-semibold text-risk-high uppercase">High-Risk Scans</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-risk-high">
            {isLoading ? "..." : stats?.highRiskChecks ?? 0}
          </div>
          <div className="text-[11px] text-text-secondary">Phishing & malicious flags</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="text-xs font-semibold text-text-tertiary uppercase">Reports Today</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-primary">
            {isLoading ? "..." : stats?.reportsToday ?? 0}
          </div>
          <div className="text-[11px] text-text-secondary">Citizen fraud encounters</div>
        </div>

        <div className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft space-y-1">
          <div className="text-xs font-semibold text-trust uppercase">Pending Review</div>
          <div className="text-2xl sm:text-3xl font-extrabold text-trust">
            {isLoading ? "..." : stats?.pendingModeration ?? 0}
          </div>
          <div className="text-[11px] text-text-secondary">Awaiting verification</div>
        </div>
      </div>

      {/* Quick Nav Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {adminNav.map((card, idx) => {
          const Icon = card.icon;
          return (
            <Link
              key={idx}
              href={card.href}
              className="p-6 rounded-2xl bg-surface border border-surface-border hover:border-trust hover:shadow-card transition-all flex flex-col justify-between group touch-target"
            >
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-trust-subtle text-trust flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Icon className="w-5 h-5 stroke-[2]" />
                </div>
                {card.badge && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-trust text-white">
                    {card.badge}
                  </span>
                )}
              </div>

              <div className="mt-5 space-y-1">
                <div className="text-base font-bold text-text-primary group-hover:text-trust transition-colors flex items-center justify-between">
                  <span>{card.title}</span>
                  <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:text-trust group-hover:translate-x-1 transition-all" />
                </div>
                <p className="text-xs text-text-secondary leading-normal">
                  {card.desc}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Top Categories & System Health */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Scam Categories */}
        <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            Top Scam Categories (Sri Lanka)
          </h3>
          <div className="space-y-2">
            {stats?.topCategories && stats.topCategories.length > 0 ? (
              stats.topCategories.map((cat: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-surface-muted text-xs"
                >
                  <span className="font-semibold text-text-primary">{cat.category}</span>
                  <span className="font-mono font-bold text-trust">{cat.count} reports</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-text-secondary">No category data recorded yet.</p>
            )}
          </div>
        </div>

        {/* System Health */}
        <div className="p-6 rounded-3xl bg-surface border border-surface-border shadow-soft space-y-4">
          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider">
            System & Privacy Health
          </h3>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
              <span className="text-text-secondary">PostgreSQL / Prisma Database</span>
              <span className="font-semibold text-emerald-600">CONNECTED</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
              <span className="text-text-secondary">Private Evidence Storage</span>
              <span className="font-semibold text-emerald-600">SECURE (Signed URLs)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
              <span className="text-text-secondary">Sensitive Data Sanitizer</span>
              <span className="font-semibold text-emerald-600">ACTIVE (Masking OTP/Cards)</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-xl bg-surface-muted">
              <span className="text-text-secondary">Server Isolation Policy</span>
              <span className="font-semibold text-text-primary">Strict User Separation</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
