"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, Sparkles, AlertCircle, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/lib/i18n/context";
import ProcessingScreen from "@/components/common/ProcessingScreen";

export default function MessageChecker() {
  const router = useRouter();
  const { t } = useLanguage();

  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sampleMessages = [
    {
      title: "Customs Parcel Detention (Courier Phishing)",
      text: "Your parcel has been detained. Pay Rs. 450 immediately using this link: http://slpost-customs-clearance.top/pay",
    },
    {
      title: "Bank Account Suspension (Sinhala / සිංහල)",
      text: "ඔබගේ Commercial Bank ගිණුම අත්හිටුවා ඇත. වහාම සත්‍යාපනය සඳහා ඔබගේ OTP අංකය සහ මුරපදය මෙහි ඇතුළත් කරන්න.",
    },
    {
      title: "Marketplace Deposit Request",
      text: "Hi, item still available. I have 3 other buyers. Please transfer Rs. 3,500 advance to my personal account now to hold it.",
    },
    {
      title: "Work From Home Easy Task (Tamil / தமிழ்)",
      text: "தினசரி Rs. 8000 வருமானம். YouTube வீடியோக்களை லைக் செய்து பணம் பெறுங்கள். பதிவு கட்டணம் Rs. 2000 செலுத்தவும்.",
    },
  ];

  const handleAnalyze = async () => {
    if (!message.trim()) {
      setError("Please paste or type the message you wish to verify.");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scanType: "MESSAGE",
          text: message.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      router.push(`/result/${data.scanId}`);
    } catch (err: any) {
      setError(err.message || "Failed to analyze message");
      setIsProcessing(false);
    }
  };

  if (isProcessing) {
    return <ProcessingScreen scanType="MESSAGE" />;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-risk-high-bg border border-risk-high-border text-risk-high flex items-center gap-3 text-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Textarea */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider block">
          Suspicious Message Content
        </label>
        <textarea
          value={message}
          onChange={(e) => {
            setMessage(e.target.value);
            if (error) setError(null);
          }}
          placeholder="Paste the suspicious message here... (supports English, සිංහල, and தமிழ்)"
          rows={6}
          className="w-full p-4 text-base rounded-2xl border border-surface-border bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust shadow-soft transition-all leading-relaxed"
        />
        <div className="flex justify-between items-center text-xs text-text-tertiary px-1">
          <span>Supports SMS, WhatsApp, Telegram, and social media text</span>
          <span>{message.length} characters</span>
        </div>
      </div>

      {/* Sample presets for instant testing */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-text-secondary flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-trust" />
          Try common Sri Lanka scam patterns:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleMessages.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setMessage(sample.text)}
              className="text-left p-2.5 rounded-xl bg-surface border border-surface-border hover:border-trust/60 hover:bg-trust-subtle/30 transition-all text-xs"
            >
              <div className="font-semibold text-text-primary truncate">{sample.title}</div>
              <div className="text-text-secondary line-clamp-1 mt-0.5">{sample.text}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleAnalyze}
        disabled={!message.trim()}
        className="w-full py-4 rounded-xl font-bold text-sm text-white bg-primary hover:bg-primary-hover disabled:opacity-40 disabled:pointer-events-none transition-all shadow-card flex items-center justify-center gap-2 touch-target"
      >
        <ShieldCheck className="w-5 h-5 text-trust-subtle" />
        <span>Analyze Message</span>
      </button>
    </div>
  );
}
