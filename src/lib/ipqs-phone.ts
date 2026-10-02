import crypto from "crypto";
import prisma from "@/lib/db";
import type { Prisma } from "@prisma/client";

const IPQS_TIMEOUT_MS = 6_000;
const CACHE_TTL_MS = 60 * 60 * 1_000;

export interface IpqsPhoneIntelligence {
  available: boolean;
  message?: string;
  valid: boolean | null;
  active: boolean | null;
  fraudScore: number | null;
  risky: boolean | null;
  recentAbuse: boolean | null;
  spammer: boolean | null;
  leaked: boolean | null;
  voip: boolean | null;
  prepaid: boolean | null;
  carrier: string | null;
  lineType: string | null;
  country: string | null;
  region: string | null;
}

interface CacheEntry {
  expiresAt: number;
  value: IpqsPhoneIntelligence;
}

const cache = new Map<string, CacheEntry>();

function booleanOrNull(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value !== "N/A" && value.trim() ? value : null;
}

export async function lookupIpqsPhone(phone: string): Promise<IpqsPhoneIntelligence> {
  const apiKey = process.env.IPQS_API_KEY?.trim();
  const unavailable: IpqsPhoneIntelligence = {
    available: false,
    message: apiKey ? "External phone intelligence is temporarily unavailable." : "External phone intelligence is not configured.",
    valid: null,
    active: null,
    fraudScore: null,
    risky: null,
    recentAbuse: null,
    spammer: null,
    leaked: null,
    voip: null,
    prepaid: null,
    carrier: null,
    lineType: null,
    country: null,
    region: null,
  };

  if (!apiKey) return unavailable;

  const cached = cache.get(phone);
  if (cached && cached.expiresAt > Date.now()) return cached.value;

  const lookupHash = crypto.createHash("sha256").update(phone).digest("hex");
  try {
    const persisted = await prisma.externalLookupCache.findUnique({
      where: { provider_lookupHash: { provider: "IPQS_PHONE", lookupHash } },
    });
    if (persisted && persisted.expiresAt.getTime() > Date.now()) {
      const value = persisted.response as unknown as IpqsPhoneIntelligence;
      cache.set(phone, { value, expiresAt: persisted.expiresAt.getTime() });
      return value;
    }
  } catch (error) {
    console.warn("Persistent IPQS cache unavailable:", error instanceof Error ? error.message : "Unknown error");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), IPQS_TIMEOUT_MS);

  try {
    const endpoint = `https://www.ipqualityscore.com/api/json/phone/${encodeURIComponent(apiKey)}/${encodeURIComponent(phone)}?strictness=1&country[]=LK`;
    const response = await fetch(endpoint, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok || data.success !== true) {
      console.warn("IPQS phone lookup unavailable:", typeof data.message === "string" ? data.message : response.status);
      return unavailable;
    }

    const result: IpqsPhoneIntelligence = {
      available: true,
      message: typeof data.message === "string" ? data.message : undefined,
      valid: booleanOrNull(data.valid),
      active: booleanOrNull(data.active),
      fraudScore: typeof data.fraud_score === "number" ? Math.max(0, Math.min(100, data.fraud_score)) : null,
      risky: booleanOrNull(data.risky),
      recentAbuse: booleanOrNull(data.recent_abuse),
      spammer: booleanOrNull(data.spammer),
      leaked: booleanOrNull(data.leaked),
      voip: booleanOrNull(data.VOIP),
      prepaid: booleanOrNull(data.prepaid),
      carrier: stringOrNull(data.carrier),
      lineType: stringOrNull(data.line_type),
      country: stringOrNull(data.country),
      region: stringOrNull(data.region),
    };

    cache.set(phone, { value: result, expiresAt: Date.now() + CACHE_TTL_MS });
    try {
      const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
      const response = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
      await prisma.externalLookupCache.upsert({
        where: { provider_lookupHash: { provider: "IPQS_PHONE", lookupHash } },
        update: { response, expiresAt },
        create: { provider: "IPQS_PHONE", lookupHash, response, expiresAt },
      });
    } catch (error) {
      console.warn("Could not persist IPQS cache:", error instanceof Error ? error.message : "Unknown error");
    }
    return result;
  } catch (error) {
    console.warn("IPQS phone lookup failed:", error instanceof Error ? error.message : "Unknown error");
    return unavailable;
  } finally {
    clearTimeout(timeout);
  }
}

export function calculateIpqsPhoneRisk(result: IpqsPhoneIntelligence): number {
  if (!result.available) return 0;

  let score = result.fraudScore ?? 0;
  if (result.valid === false) score = Math.max(score, 75);
  if (result.active === false) score = Math.max(score, 80);
  if (result.risky === true) score = Math.max(score, 70);
  if (result.recentAbuse === true || result.spammer === true) score = Math.max(score, 85);
  if (result.voip === true || result.prepaid === true) score = Math.max(score, 35);
  return Math.min(100, score);
}
