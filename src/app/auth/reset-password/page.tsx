"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function ResetPasswordContent() {
  const token = useSearchParams().get("token") || "";
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
    const data = await response.json();
    if (response.ok) { setMessage("Password updated. Redirecting to sign in..."); setTimeout(() => router.push("/auth/login"), 1200); }
    else setMessage(data.error || "Reset failed.");
  }
  return <div className="mx-auto max-w-md pt-8"><div className="glass-surface rounded-3xl p-6 space-y-5"><h1 className="text-2xl font-extrabold text-primary">Choose a new password</h1>{message && <p className="rounded-xl bg-surface-muted p-3 text-sm">{message}</p>}<form onSubmit={submit} className="space-y-4"><input type="password" minLength={10} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 10 characters" className="w-full rounded-xl border border-surface-border bg-surface p-3"/><button className="w-full rounded-xl bg-primary p-3 font-bold text-white">Update password</button></form></div></div>;
}

export default function ResetPasswordPage() { return <Suspense fallback={<div className="py-12 text-center">Loading...</div>}><ResetPasswordContent /></Suspense>; }
