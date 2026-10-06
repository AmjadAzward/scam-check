import crypto from "crypto";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/db";

const CACHE_TTL_MS = 12 * 60 * 60 * 1_000;

export interface VirusTotalUrlIntelligence {
  available: boolean;
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  reputation: number | null;
  lastAnalysisAt: string | null;
  message?: string;
}

function empty(message: string): VirusTotalUrlIntelligence {
  return { available: false, malicious: 0, suspicious: 0, harmless: 0, undetected: 0, reputation: null, lastAnalysisAt: null, message };
}

export async function lookupVirusTotalUrl(url: string): Promise<VirusTotalUrlIntelligence> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY?.trim();
  if (!apiKey) return empty("VirusTotal is not configured.");

  const lookupHash = crypto.createHash("sha256").update(url.toLowerCase()).digest("hex");
  try {
    const cached = await prisma.externalLookupCache.findUnique({ where: { provider_lookupHash: { provider: "VIRUSTOTAL_URL", lookupHash } } });
    if (cached && cached.expiresAt.getTime() > Date.now()) return cached.response as unknown as VirusTotalUrlIntelligence;
  } catch {}

  const urlId = Buffer.from(url, "utf8").toString("base64url");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json", "x-apikey": apiKey },
    });
    if (response.status === 404) return empty("VirusTotal has no existing report for this URL.");
    if (!response.ok) return empty(`VirusTotal lookup unavailable (${response.status}).`);

    const payload = await response.json() as { data?: { attributes?: Record<string, any> } };
    const attributes = payload.data?.attributes || {};
    const stats = attributes.last_analysis_stats || {};
    const result: VirusTotalUrlIntelligence = {
      available: true,
      malicious: Number(stats.malicious || 0),
      suspicious: Number(stats.suspicious || 0),
      harmless: Number(stats.harmless || 0),
      undetected: Number(stats.undetected || 0),
      reputation: typeof attributes.reputation === "number" ? attributes.reputation : null,
      lastAnalysisAt: typeof attributes.last_analysis_date === "number" ? new Date(attributes.last_analysis_date * 1000).toISOString() : null,
    };
    const expiresAt = new Date(Date.now() + CACHE_TTL_MS);
    const stored = JSON.parse(JSON.stringify(result)) as Prisma.InputJsonValue;
    await prisma.externalLookupCache.upsert({
      where: { provider_lookupHash: { provider: "VIRUSTOTAL_URL", lookupHash } },
      update: { response: stored, expiresAt },
      create: { provider: "VIRUSTOTAL_URL", lookupHash, response: stored, expiresAt },
    }).catch(() => undefined);
    return result;
  } catch {
    return empty("VirusTotal lookup is temporarily unavailable.");
  } finally {
    clearTimeout(timeout);
  }
}
