"use client";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

type SessionItem = { id: string; label: string | null; createdAt: string; lastSeenAt: string; current: boolean };
export default function SessionsPage() {
  const [items, setItems] = useState<SessionItem[]>([]);
  async function load() { const data = await fetch("/api/user/sessions", { cache: "no-store" }).then((r) => r.json()); setItems(data.sessions || []); }
  useEffect(() => { load(); }, []);
  async function revoke(id: string) { const r = await fetch("/api/user/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }); const d = await r.json(); if (d.currentRevoked) signOut({ callbackUrl: "/auth/login" }); else load(); }
  async function revokeAll() { await fetch("/api/user/sessions", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); signOut({ callbackUrl: "/auth/login" }); }
  return <div className="mx-auto max-w-xl space-y-5"><Link href="/settings" className="text-sm font-semibold text-trust">Back to settings</Link><div className="glass-surface rounded-3xl p-6 space-y-4"><h1 className="text-2xl font-extrabold text-primary">Active sessions</h1>{items.map((item) => <div key={item.id} className="flex items-center justify-between rounded-xl border border-surface-border p-4"><div><p className="font-semibold">{item.label || "Browser session"}{item.current ? " - This device" : ""}</p><p className="text-xs text-text-tertiary">Last active {new Date(item.lastSeenAt).toLocaleString()}</p></div><button onClick={() => revoke(item.id)} className="text-sm font-bold text-risk-high">Sign out</button></div>)}<button onClick={revokeAll} className="w-full rounded-xl bg-risk-high p-3 font-bold text-white">Sign out everywhere</button></div></div>;
}
