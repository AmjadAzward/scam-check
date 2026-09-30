"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, Plus, Globe, CheckCircle2, Search } from "lucide-react";

interface BrandItem {
  id: string;
  name: string;
  aliases: string;
  country: string;
  verificationStatus: string;
  domains: { id: string; domain: string; official: boolean }[];
}

export default function BrandsAdminPage() {
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New brand state
  const [newName, setNewName] = useState("");
  const [newAliases, setNewAliases] = useState("");
  const [newCountry, setNewCountry] = useState("LK");
  const [newDomains, setNewDomains] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/brands?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.brands) {
        setBrands(data.brands);
      }
    } catch (err) {
      console.error("Brands load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [search]);

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const domainsList = newDomains
        .split(",")
        .map((d) => d.trim().toLowerCase())
        .filter((d) => d.length > 2);

      const res = await fetch("/api/brands", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          aliases: newAliases.trim(),
          country: newCountry,
          domains: domainsList,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewName("");
        setNewAliases("");
        setNewDomains("");
        loadBrands();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to create brand");
      }
    } catch (err) {
      console.error("Add brand error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <Link
        href="/admin"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-text-secondary hover:text-text-primary p-2 rounded-xl bg-surface border border-surface-border transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Admin Overview</span>
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-primary tracking-tight">
            Verified Brand Registry
          </h1>
          <p className="text-xs text-text-secondary">
            Official domains used by the Risk Engine to detect lookalike phishing and courier impersonation.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-primary hover:bg-primary-hover shadow-soft transition-colors shrink-0 touch-target"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Brand</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-text-tertiary">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search brands (e.g. Daraz, ComBank, SL Post, Dialog)..."
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-surface-border bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-trust/20 focus:border-trust"
        />
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleAddBrand}
            className="w-full max-w-md bg-surface p-6 sm:p-8 rounded-3xl border border-surface-border shadow-elevated space-y-4"
          >
            <h2 className="text-lg font-bold text-text-primary">Add Brand to Official Registry</h2>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase">Brand Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. HNB Bank"
                className="w-full p-2.5 text-xs rounded-xl border border-surface-border"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase">Aliases (comma-separated)</label>
              <input
                type="text"
                value={newAliases}
                onChange={(e) => setNewAliases(e.target.value)}
                placeholder="e.g. hnb, hatton national, hnb digital"
                className="w-full p-2.5 text-xs rounded-xl border border-surface-border"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-text-secondary uppercase">Official Domains (comma-separated)</label>
              <input
                type="text"
                value={newDomains}
                onChange={(e) => setNewDomains(e.target.value)}
                placeholder="e.g. hnb.net, hnb.lk"
                className="w-full p-2.5 text-xs rounded-xl border border-surface-border"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-xs font-semibold border rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold bg-trust text-white rounded-xl"
              >
                {isSubmitting ? "Saving..." : "Save Brand"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brands List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-2 p-12 text-center text-xs text-text-secondary">
            Loading official brand registry...
          </div>
        ) : (
          brands.map((b) => (
            <div
              key={b.id}
              className="p-5 rounded-2xl bg-surface border border-surface-border shadow-soft space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-trust-subtle text-trust flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-text-primary">{b.name}</h3>
                    <span className="text-[10px] text-text-tertiary">Country: {b.country}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-risk-low-bg text-risk-low border border-risk-low-border flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              <div className="space-y-1">
                <div className="text-[10px] font-bold uppercase text-text-tertiary">Official Domains</div>
                <div className="flex flex-wrap gap-1.5">
                  {b.domains.map((d) => (
                    <span
                      key={d.id}
                      className="px-2 py-1 rounded-md bg-surface-muted font-mono text-[11px] text-trust border border-surface-border/60"
                    >
                      {d.domain}
                    </span>
                  ))}
                </div>
              </div>

              <div className="text-[11px] text-text-tertiary truncate">
                Aliases: {b.aliases}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
