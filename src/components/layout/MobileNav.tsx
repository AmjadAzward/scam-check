"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Shield, Search, FileText, User } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import { useSession } from "next-auth/react";

export default function MobileNav() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const { data: session } = useSession();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-surface-border/80 shadow-[0_-8px_30px_rgba(16,42,67,0.08)] safe-area-bottom">
      <div className="flex items-center justify-around h-16 px-2 max-w-lg mx-auto">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center flex-1 py-1 touch-target transition-colors ${
            pathname === "/" ? "text-trust font-semibold" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] mt-1">{t("nav.home")}</span>
        </Link>

        {/* Checks */}
        <Link
          href={session?.user ? "/history" : "/auth/login?callbackUrl=/history"}
          className={`flex flex-col items-center justify-center flex-1 py-1 touch-target transition-colors ${
            pathname.startsWith("/history") ? "text-trust font-semibold" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <Shield className="w-5 h-5" />
          <span className="text-[11px] mt-1">{t("nav.checks")}</span>
        </Link>

        {/* Prominent Center Check Action */}
        <div className="flex-1 flex justify-center -mt-5">
          <Link
            href="/check"
            aria-label={t("nav.check")}
            className="w-14 h-14 rounded-2xl rotate-45 bg-trust hover:bg-trust-hover text-white shadow-elevated flex items-center justify-center transition-transform active:scale-95 border-4 border-surface"
          >
            <Search className="w-6 h-6 stroke-[2.5] -rotate-45" />
          </Link>
        </div>

        {/* Reports */}
        <Link
          href="/reports"
          className={`flex flex-col items-center justify-center flex-1 py-1 touch-target transition-colors ${
            pathname.startsWith("/reports") ? "text-trust font-semibold" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <FileText className="w-5 h-5" />
          <span className="text-[11px] mt-1">{t("nav.reports")}</span>
        </Link>

        {/* Profile / Settings */}
        <Link
          href={session?.user ? "/settings" : "/auth/login?callbackUrl=/settings"}
          className={`flex flex-col items-center justify-center flex-1 py-1 touch-target transition-colors ${
            pathname.startsWith("/settings") ? "text-trust font-semibold" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] mt-1">{session?.user ? t("nav.profile") : t("nav.login")}</span>
        </Link>
      </div>
    </nav>
  );
}
