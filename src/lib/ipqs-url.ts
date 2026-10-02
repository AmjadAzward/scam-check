import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

const CACHE_TTL_MS = 6 * 60 * 60 * 1_000;

export interface IpqsUrlIntelligence {
  available: boolean;
  riskScore: number | null;
  unsafe: boolean | null;
  suspicious: boolean | null;
  phishing: boolean | null;
  malware: boolean | null;
  spamming: boolean | null;
  redirected: boolean | null;
  shortLinkRedirect: boolean | null;
  riskyTld: boolean | null;
  domainTrust: string | null;
  category: string | null;
  domainAge: string | null;
  finalDomain: string | null;
  message?: string;
}

function empty(message: string): IpqsUrlIntelligence {
  return {
    available: false, riskScore: null, unsafe: null, suspicious: null, phishing: null,
    malware: null, spamming: null, redirected: null, shortLinkRedirect: null, riskyTld: null,
    domainTrust: null, category: null, domainAge: null, finalDomain: null, message,
  };
}

const bool = (value: unknown) => typeof value === "boolean" ? value : null;
const text = (value: unknown) => typeof value === "string" && value !== "N/A" && !value.toLowerCase().includes("upgraded plan required") ? value : null;

export async function lookupIpqsUrl(url: string): Promise<IpqsUrlIntelligence> {
  const apiKey = process.env.IPQS_API_KEY?.trim();
  if (!apiKey) return empty("External URL reputation is not configured.");

  const lookupHash = crypto.createHash("sha256").update(url.toLowerCase()).digest("hex");
  try {
    const cached = await prisma.externalLookupCache.findUnique({
      where: { provider_lookupHash: { provider: "IPQS_URL", lookupHash } },
    });
    if (cached && cached.expiresAt.getTime() > Date.now()) {
      return cached.response as unknown as IpqsUrlIntelligence;
    }
  } catch {}

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const body = new URLSearchParams({ url, strictness: "0", fast: "true" });
    const response = await fetch("https://ipqualityscore.com/api/json/url", {
      method: "POST",
      signal: controller.signal,
      cache: "no-store",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "IPQS-KEY": apiKey,
      },
      body,
    });
    const data = (await response.json()) as Record<string, any>;
    if (!response.ok || data.success !== true) return empty("External URL reputation is temporarily unavailable.");

    const result: IpqsUrlIntelligence = {
      available: true,
      riskScore: typeof data.risk_score === "number" ? Math.min(100, Math.max(0, data.risk_score)) : null,
      unsafe: bool(data.unsafe), suspicious: bool(data.suspicious), phishing: bool(data.phishing),
      malware: bool(data.malware), spamming: bool(data.spamming), redirected: bool(data.redirected),
      shortLinkRedirect: bool(data.short_link_redirect), riskyTld: bool(data.risky_tld),
      domainTrust: text(data.domain_trust), category: text(data.category),
      domainAge: text(data.domain_age?.human), finalDomain: text(data.domain),
      message: text(data.message) || undefined,
    };
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    const stored = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
    await prisma.externalLookupCache.upsert({
      where: { provider_lookupHash: { provider: "IPQS_URL", lookupHash } },
      update: { response: stored, expiresAt },
      create: { provider: "IPQS_URL", lookupHash, response: stored, expiresAt },
    }).catch(() => undefined);
    return result;
  } catch {
    return empty("External URL reputation is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}
