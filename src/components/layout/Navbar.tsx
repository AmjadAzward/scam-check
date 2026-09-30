"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLanguage, Language } from "@/lib/i18n/context";
import {
  ShieldCheck,
  Globe,
  LifeBuoy,
  Clock,
  FileText,
  Settings as SettingsIcon,
  User,
  LogOut,
  LogIn,
  ShieldAlert,
  Menu,
  X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { language, setLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const userRole = (session?.user as any)?.role;
  const isStaff = userRole === "ADMIN" || userRole === "MODERATOR";

  const languages: { code: Language; label: string; native: string }[] = [
    { code: "en", label: "English", native: "English" },
    { code: "si", label: "Sinhala", native: "සිංහල" },
    { code: "ta", label: "Tamil", native: "தமிழ்" },
  ];

  return (
    <header className="glass-nav sticky top-0 z-40 border-b shadow-[0_3px_20px_rgba(16,42,67,0.10)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-[0_7px_18px_rgba(16,42,67,0.22)] transition-transform group-hover:scale-105">
            <ShieldCheck className="w-6 h-6 text-[#7DD3FC]" />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-bold tracking-tight text-primary leading-none">
              Scam<span className="text-accent">Check</span>
            </span>
            <span className="text-[10px] font-medium text-text-secondary mt-0.5 tracking-wide">
              DIGITAL SAFETY
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-text-secondary">
          <Link
            href="/"
            className={`px-3 py-2 rounded-lg transition-colors hover:text-text-primary hover:bg-surface-muted ${
              pathname === "/" ? "text-trust font-semibold bg-trust-subtle/50" : ""
            }`}
          >
            {t("nav.home")}
          </Link>
          {session?.user && (
            <Link
              href="/history"
              className={`px-3 py-2 rounded-lg transition-colors hover:text-text-primary hover:bg-surface-muted ${
                pathname.startsWith("/history") ? "text-trust font-semibold bg-trust-subtle/50" : ""
              }`}
            >
              {t("nav.checks")}
            </Link>
          )}
          <Link
            href="/reports"
            className={`px-3 py-2 rounded-lg transition-colors hover:text-text-primary hover:bg-surface-muted ${
              pathname.startsWith("/reports") ? "text-trust font-semibold bg-trust-subtle/50" : ""
            }`}
          >
            {t("nav.reports")}
          </Link>
          <Link
            href="/help/already-clicked"
            className={`px-3 py-2 rounded-lg text-risk-high hover:bg-risk-high-bg transition-colors flex items-center gap-1.5 ${
              pathname.startsWith("/help/already-clicked") ? "font-semibold bg-risk-high-bg" : ""
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            {t("actions.iAlreadyClicked")}
          </Link>

          {isStaff && (
            <Link
              href="/admin"
              className={`px-3 py-2 rounded-lg transition-colors hover:text-text-primary hover:bg-surface-muted flex items-center gap-1.5 ${
                pathname.startsWith("/admin") ? "text-trust font-semibold bg-trust-subtle/50" : ""
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-trust animate-pulse"></span>
              {t("nav.admin")}
            </Link>
          )}
        </nav>

        {/* Right Actions: Language Switcher + User Profile */}
        <div className="flex items-center gap-2">
          {/* Language Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className={`group relative w-11 h-11 flex items-center justify-center transition-all touch-target ${
                langDropdownOpen
                  ? "text-primary"
                  : "text-blue-700 hover:text-primary"
              }`}
              aria-label={`Language: ${languages.find((l) => l.code === language)?.label}. Change language`}
              aria-expanded={langDropdownOpen}
              title="Change language"
            >
              <Globe className="w-5 h-5" />
              <span className="pointer-events-none absolute top-full right-0 mt-2 hidden sm:group-hover:block whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-elevated">
                Change language
              </span>
            </button>

            {langDropdownOpen && (
              <div
                className="absolute right-0 mt-2 w-36 bg-surface rounded-xl shadow-elevated border border-surface-border py-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setLangDropdownOpen(false)}
              >
                {languages.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => setLanguage(l.code)}
                    className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-surface-muted transition-colors ${
                      language === l.code ? "font-bold text-trust bg-trust-subtle/40" : "text-text-primary"
                    }`}
                  >
                    <span>{l.native}</span>
                    <span className="text-[10px] text-text-tertiary uppercase">{l.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Status / Account */}
          {session?.user ? (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/settings"
                className="group relative w-11 h-11 flex items-center justify-center text-teal-800 hover:text-primary transition-all"
                title={t("settings.title")}
                aria-label={t("settings.title")}
              >
                <SettingsIcon className="w-5 h-5" />
                <span className="pointer-events-none absolute top-full right-0 mt-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-elevated">
                  {t("settings.title")}
                </span>
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="group relative w-11 h-11 flex items-center justify-center text-red-700 hover:text-risk-critical transition-all"
                title={t("nav.logout")}
                aria-label={t("nav.logout")}
              >
                <LogOut className="w-5 h-5" />
                <span className="pointer-events-none absolute top-full right-0 mt-2 hidden group-hover:block whitespace-nowrap rounded-lg bg-primary px-2.5 py-1.5 text-[10px] font-semibold text-white shadow-elevated">
                  {t("nav.logout")}
                </span>
              </button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link
                href="/auth/login"
                className="px-3 py-1.5 text-xs font-semibold text-text-primary hover:bg-surface-muted rounded-lg transition-colors border border-surface-border"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                className="px-3 py-1.5 text-xs font-semibold text-white bg-trust hover:bg-trust-hover rounded-lg transition-colors shadow-soft"
              >
                {t("nav.register")}
              </Link>
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-text-secondary hover:text-text-primary rounded-lg touch-target"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface px-4 pt-3 pb-5 space-y-2 animate-in slide-in-from-top-2">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            {t("nav.home")}
          </Link>
          <Link
            href="/check"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-trust bg-trust-subtle/50"
          >
            {t("actions.checkSomething")}
          </Link>
          {session?.user && (
            <Link
              href="/history"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-muted"
            >
              {t("nav.checks")}
            </Link>
          )}
          <Link
            href="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-muted"
          >
            {t("nav.reports")}
          </Link>
          <Link
            href="/help/already-clicked"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-risk-high bg-risk-high-bg"
          >
            {t("actions.iAlreadyClicked")}
          </Link>
          {session?.user && (
            <Link
              href="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-text-primary hover:bg-surface-muted"
            >
              {t("settings.title")}
            </Link>
          )}
          {isStaff && (
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-trust hover:bg-surface-muted"
            >
              {t("nav.admin")}
            </Link>
          )}

          <div className="pt-2 border-t border-surface-border">
            {session?.user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-risk-high rounded-lg hover:bg-risk-high-bg flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>{t("nav.logout")}</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  href="/auth/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold border border-surface-border rounded-lg"
                >
                  {t("nav.login")}
                </Link>
                <Link
                  href="/auth/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2 text-sm font-semibold bg-trust text-white rounded-lg"
                >
                  {t("nav.register")}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
