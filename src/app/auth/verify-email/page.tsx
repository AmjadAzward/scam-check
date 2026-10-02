"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyEmailContent() {
  const token = useSearchParams().get("token") || "";
  const [message, setMessage] = useState("Verifying your email...");
  useEffect(() => { if (!token) { setMessage("The verification link is incomplete."); return; } fetch("/api/auth/verify-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token }) }).then(async (response) => { const data = await response.json(); setMessage(response.ok ? "Email verified successfully." : data.error); }); }, [token]);
  return <div className="mx-auto max-w-md pt-8"><div className="glass-surface rounded-3xl p-6 space-y-5 text-center"><h1 className="text-2xl font-extrabold text-primary">Email verification</h1><p className="text-sm text-text-secondary">{message}</p><Link href="/auth/login" className="font-semibold text-trust">Continue to sign in</Link></div></div>;
}

export default function VerifyEmailPage() { return <Suspense fallback={<div className="py-12 text-center">Verifying...</div>}><VerifyEmailContent /></Suspense>; }
