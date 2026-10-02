"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
    const data = await response.json();
    setMessage(data.message || data.error || "Request completed.");
  }
  return <div className="mx-auto max-w-md pt-8"><div className="glass-surface rounded-3xl p-6 space-y-5"><h1 className="text-2xl font-extrabold text-primary">Reset your password</h1><p className="text-sm text-text-secondary">Enter your account email. Reset instructions expire after 30 minutes.</p>{message && <p className="rounded-xl bg-surface-muted p-3 text-sm">{message}</p>}<form onSubmit={submit} className="space-y-4"><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" className="w-full rounded-xl border border-surface-border bg-surface p-3"/><button className="w-full rounded-xl bg-primary p-3 font-bold text-white">Send reset link</button></form><Link href="/auth/login" className="text-sm font-semibold text-trust">Back to sign in</Link></div></div>;
}
