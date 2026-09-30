"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, PhoneCall, Lock, HeartHandshake } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-surface border-t border-surface-border mt-16 pb-20 md:pb-10 pt-12 text-sm text-text-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand & mission */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5 text-trust-subtle" />
              </div>
              <span className="text-lg font-bold text-primary">
                Scam<span className="text-trust">Check</span>
              </span>
            </div>
            <p className="text-sm text-text-secondary max-w-md leading-relaxed">
              Consumer digital safety for Sri Lanka and beyond. Helping everyday people evaluate suspicious messages, links, phone numbers, and payment requests before taking risk.
            </p>
            <div className="flex items-center gap-2 text-xs text-text-tertiary pt-1">
              <Lock className="w-3.5 h-3.5 text-risk-low" />
              <span>Screenshots analyzed in private storage & automatically erased.</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Safety Hub
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/check" className="hover:text-trust transition-colors">
                  {t("actions.checkSomething")}
                </Link>
              </li>
              <li>
                <Link href="/reports" className="hover:text-trust transition-colors">
                  {t("nav.reports")}
                </Link>
              </li>
              <li>
                <Link href="/help/already-clicked" className="hover:text-risk-high transition-colors">
                  {t("actions.iAlreadyClicked")}
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-trust transition-colors">
                  {t("settings.title")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Emergency Assistance in Sri Lanka */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-text-primary">
              Official Incident Support (LK)
            </h4>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-lg bg-surface-muted border border-surface-border">
                <div className="font-semibold text-text-primary">Police Cyber Crime Division</div>
                <div className="text-trust font-medium mt-0.5">Hotline: 1938</div>
              </div>
              <div className="p-2.5 rounded-lg bg-surface-muted border border-surface-border">
                <div className="font-semibold text-text-primary">Sri Lanka CERT|CC</div>
                <div className="text-text-secondary mt-0.5">Tel: 011 269 1692 / 101</div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-text-tertiary">
          <p>© {new Date().getFullYear()} ScamCheck. Check before you click, pay or reply.</p>
          <div className="flex items-center gap-4">
            <Link href="/settings" className="hover:text-text-secondary transition-colors">
              Privacy & Data Rights
            </Link>
            <span>•</span>
            <Link href="/reports/submit" className="hover:text-text-secondary transition-colors">
              Report Fraud
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
