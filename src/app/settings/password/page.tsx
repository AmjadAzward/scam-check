"use client";
import { useState } from "react";
import Link from "next/link";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent) { event.preventDefault(); const response = await fetch("/api/user/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }); const data = await response.json(); setMessage(response.ok ? "Password changed successfully." : data.error); if (response.ok) { setCurrentPassword(""); setNewPassword(""); } }
  return <div className="mx-auto max-w-md space-y-5"><Link href="/settings" className="text-sm font-semibold text-trust">Back to settings</Link><div className="glass-surface rounded-3xl p-6 space-y-5"><h1 className="text-2xl font-extrabold text-primary">Change password</h1>{message && <p className="rounded-xl bg-surface-muted p-3 text-sm">{message}</p>}<form onSubmit={submit} className="space-y-4"><input type="password" required value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Current password" className="w-full rounded-xl border border-surface-border bg-surface p-3"/><input type="password" minLength={10} required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (10+ characters)" className="w-full rounded-xl border border-surface-border bg-surface p-3"/><button className="w-full rounded-xl bg-primary p-3 font-bold text-white">Change password</button></form></div></div>;
}
