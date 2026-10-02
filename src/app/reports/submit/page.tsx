"use client";

import React, { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ShieldCheck,
  UploadCloud,
  CheckCircle,
  AlertCircle,
  Lock,
} from "lucide-react";
import TurnstileWidget, { getTurnstileToken } from "@/components/common/TurnstileWidget";

function SubmitReportContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [identifierType, setIdentifierType] = useState<string>("PHONE");
  const [rawIdentifier, setRawIdentifier] = useState<string>("");
  const [category, setCategory] = useState<string>("Courier Scam");
  const [platform, setPlatform] = useState<string>("SMS");
  const [description, setDescription] = useState<string>("");
  const [amountLost, setAmountLost] = useState<string>("");
  const [dateEncountered, setDateEncountered] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [file, setFile] = useState<File | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const prefill = searchParams.get("prefill");
    if (prefill) setRawIdentifier(prefill);

    const catParam = searchParams.get("category");
    if (catParam) setCategory(catParam);
  }, [searchParams]);

  const categories = [
    "Courier Scam",
    "Banking Scam",
    "Investment Scam",
    "Job Scam",
    "Marketplace Scam",
    "Government Impersonation",
    "Phishing",
    "OTP Scam",
    "Romance Scam",
    "Tech Support Scam",
    "Loan Scam",
    "Lottery Scam",
    "Social Media Scam",
    "Other",
  ];

  const platforms = [
    "SMS",
    "WhatsApp",
    "Facebook Marketplace",
    "Telegram",
    "Call",
    "Email",
    "Instagram",
    "TikTok",
    "Viber",
    "Direct / In-Person",
    "Other",
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const turnstileToken = getTurnstileToken(e.currentTarget as HTMLFormElement);
    setError(null);

    if (!rawIdentifier.trim()) {
      setError("Please provide the suspicious phone number, website link, or identifier.");
      return;
    }

    if (description.trim().length < 10) {
      setError("Please provide a short description (at least 10 characters) of what occurred.");
      return;
    }

    setIsSubmitting(true);

    try {
      let evidenceStorageKey: string | undefined = undefined;

      // Upload evidence screenshot if provided
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok && uploadData.storageKey) {
          evidenceStorageKey = uploadData.storageKey;
        }
      }

      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifierType,
          rawIdentifier: rawIdentifier.trim(),
          category,
          platform,
          description: description.trim(),
          amountLost: amountLost ? parseFloat(amountLost) : null,
          currency: "LKR",
          evidenceStorageKey,
          dateEncountered,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Submission failed");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/reports");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while submitting your report.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Link
        href="/reports"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary p-2 rounded-xl bg-surface border border-surface-border transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Reports</span>
      </Link>

      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-primary tracking-tight">
          Submit a Community Report
        </h1>
        <p className="text-xs sm:text-sm text-text-secondary">
          Help protect fellow citizens in Sri Lanka and globally by reporting fraudulent messages, numbers, or websites.
        </p>
      </div>

      <div className="p-3.5 rounded-2xl bg-surface-muted border border-surface-border flex items-center gap-3 text-xs text-text-secondary">
        <Lock className="w-4 h-4 text-risk-low shrink-0" />
        <span>
          <strong>Privacy Protected:</strong> Your identity will never be publicly displayed. All identifiers are masked for public security views.
        </span>
      </div>

      {success ? (
        <div className="p-8 rounded-3xl bg-surface border border-surface-border text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-risk-low-bg text-risk-low mx-auto flex items-center justify-center">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-text-primary">Thank You for Your Report</h2>
          <p className="text-xs text-text-secondary">
            Your contribution helps ScamCheck detect evolving threat patterns and safeguard others. Redirecting to community intelligence...
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-3xl bg-surface border border-surface-border shadow-card space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Identifier Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Target Identifier Type
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
              {[
                { type: "PHONE", label: "Phone" },
                { type: "URL", label: "Link/URL" },
                { type: "EMAIL", label: "Email" },
                { type: "MESSAGE", label: "Message" },
                { type: "QR_DESTINATION", label: "QR Code" },
                { type: "SOCIAL_MEDIA", label: "Social" },
              ].map((t) => (
                <button
                  key={t.type}
                  type="button"
                  onClick={() => setIdentifierType(t.type)}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-colors ${
                    identifierType === t.type
                      ? "bg-primary text-white border-primary"
                      : "bg-surface text-text-secondary border-surface-border hover:bg-surface-muted"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Identifier Value */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Target Value (Phone number, URL, or Account)
            </label>
            <input
              type="text"
              value={rawIdentifier}
              onChange={(e) => setRawIdentifier(e.target.value)}
              placeholder={
                identifierType === "PHONE"
                  ? "e.g. 077 123 4567 or +94 77 123 4567"
                  : identifierType === "URL"
                  ? "e.g. slpost-customs-clearance.top"
                  : "e.g. sender email or handle"
              }
              className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              required
            />
          </div>

          {/* Category & Platform Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Scam Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Encounter Platform
              </label>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              >
                {platforms.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Incident Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what the message said, what they claimed, and how they attempted to defraud you..."
              rows={4}
              className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust leading-relaxed"
              required
            />
          </div>

          {/* Optional Amount Lost & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Amount Lost in LKR (Optional)
              </label>
              <input
                type="number"
                value={amountLost}
                onChange={(e) => setAmountLost(e.target.value)}
                placeholder="e.g. 450 or 5000 (leave empty if none)"
                className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Date Encountered
              </label>
              <input
                type="date"
                value={dateEncountered}
                onChange={(e) => setDateEncountered(e.target.value)}
                className="w-full p-3.5 text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
              />
            </div>
          </div>

          {/* Optional Screenshot */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-text-secondary uppercase">
              Evidence Screenshot (Optional)
            </label>
            <div className="p-4 rounded-xl border border-dashed border-surface-border bg-surface-muted/40 text-center">
              <input
                type="file"
                id="evidence-file"
                onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />
              <label
                htmlFor="evidence-file"
                className="cursor-pointer flex flex-col items-center justify-center gap-1.5 text-xs text-text-secondary hover:text-trust"
              >
                <UploadCloud className="w-5 h-5 text-trust" />
                <span>
                  {file ? file.name : "Attach screenshot (JPG, PNG, WEBP up to 10MB)"}
                </span>
              </label>
            </div>
          </div>

          {/* Submit Action */}
          <TurnstileWidget />
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-40 transition-colors shadow-card flex items-center justify-center gap-2 touch-target"
          >
            <ShieldCheck className="w-5 h-5 text-trust-subtle" />
            <span>{isSubmitting ? "Submitting securely..." : "Submit Report"}</span>
          </button>
        </form>
      )}
    </div>
  );
}

export default function SubmitReportPage() {
  return (
    <Suspense fallback={<div className="max-w-2xl mx-auto h-96 rounded-3xl bg-surface border border-surface-border animate-pulse" />}>
      <SubmitReportContent />
    </Suspense>
  );
}
