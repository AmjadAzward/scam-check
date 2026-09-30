"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, User, AlertCircle, ArrowRight } from "lucide-react";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("LK");
  const [language, setLanguage] = useState("en");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          country,
          language,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      // Auto sign in
      const signRes = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (signRes?.ok) {
        router.push("/");
        router.refresh();
      } else {
        router.push("/auth/login");
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-6 animate-in fade-in duration-300">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-primary text-white mx-auto flex items-center justify-center shadow-soft">
          <ShieldCheck className="w-7 h-7 text-trust-subtle" />
        </div>
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">
          Create Your ScamCheck Account
        </h1>
        <p className="text-xs text-text-secondary">
          Free digital safety protection for consumers and small businesses.
        </p>
      </div>

      <div className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card space-y-5">
        {error && (
          <div className="p-3.5 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kasun Perera"
                className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Password (min. 8 characters)
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-3 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
                minLength={8}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              >
                <option value="LK">Sri Lanka (LK)</option>
                <option value="IN">India (IN)</option>
                <option value="GB">United Kingdom (GB)</option>
                <option value="US">United States (US)</option>
                <option value="GL">Global (Other)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full p-3 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              >
                <option value="en">English</option>
                <option value="si">සිංහල (Sinhala)</option>
                <option value="ta">தமிழ் (Tamil)</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-50 transition-colors shadow-soft flex items-center justify-center gap-2 touch-target"
          >
            <span>{isLoading ? "Creating account..." : "Sign Up"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center text-xs text-text-secondary pt-1">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-semibold text-trust hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
