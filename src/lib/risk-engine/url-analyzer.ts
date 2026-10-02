import { matchBrandDomain } from "./brand-matcher";
import crypto from "crypto";
import prisma from "@/lib/db";
import { lookupIpqsUrl } from "@/lib/ipqs-url";

export interface UrlAnalysisSignal {
  type: string;
  score: number;
  confidence: number;
  title: string;
  description: string;
  evidence: string;
  source: string;
}

export interface UrlAnalysisResult {
  url: string;
  normalizedUrl: string;
  protocol: string;
  hostname: string;
  isHttps: boolean;
  isIpAddress: boolean;
  isShortened: boolean;
  isPunycode: boolean;
  hasSuspiciousTld: boolean;
  hasSuspiciousPath: boolean;
  claimedBrand: string | null;
  officialMatch: boolean;
  brandMismatchReason: string | null;
  threatIntelMatch: boolean;
  signals: UrlAnalysisSignal[];
  aggregateScore: number;
}

const SHORTENED_HOSTS = new Set([
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "goo.gl",
  "is.gd",
  "cutt.ly",
  "ow.ly",
  "buff.ly",
  "rb.gy",
  "shorturl.at",
  "rebrand.ly",
]);

const SUSPICIOUS_TLDS = new Set([
  "xyz",
  "top",
  "click",
  "club",
  "work",
  "loan",
  "cc",
  "cfd",
  "buzz",
  "rest",
  "surf",
  "gq",
  "ml",
  "cf",
  "tk",
  "ga",
]);

const SUSPICIOUS_PATH_KEYWORDS = [
  "login",
  "signin",
  "verify",
  "banking",
  "secure",
  "update",
  "payment",
  "pay",
  "checkout",
  "account-alert",
  "auth",
  "wallet",
  "claim",
  "parcel",
  "customs",
];

export async function analyzeUrl(
  rawUrl: string,
  claimedBrandName: string | null = null
): Promise<UrlAnalysisResult> {
  let cleaned = rawUrl.trim();
  if (!/^https?:\/\//i.test(cleaned)) {
    cleaned = "http://" + cleaned;
  }

  let parsed: URL;
  try {
    parsed = new URL(cleaned);
  } catch {
    return {
      url: rawUrl,
      normalizedUrl: cleaned,
      protocol: "unknown",
      hostname: "invalid",
      isHttps: false,
      isIpAddress: false,
      isShortened: false,
      isPunycode: false,
      hasSuspiciousTld: false,
      hasSuspiciousPath: false,
      claimedBrand: null,
      officialMatch: false,
      brandMismatchReason: "Malformed URL syntax",
      threatIntelMatch: false,
      signals: [
        {
          type: "url_intelligence",
          score: 80,
          confidence: 90,
          title: "Invalid URL syntax",
          description: "The destination address does not follow standard RFC URL specifications.",
          evidence: rawUrl,
          source: "URL Intelligence",
        },
      ],
      aggregateScore: 80,
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const isHttps = parsed.protocol === "https:";
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith("[");
  const isShortened = SHORTENED_HOSTS.has(hostname);
  const isPunycode = hostname.startsWith("xn--") || hostname.includes(".xn--");

  // TLD extraction
  const parts = hostname.split(".");
  const tld = parts.length > 1 ? parts[parts.length - 1] : "";
  const hasSuspiciousTld = SUSPICIOUS_TLDS.has(tld);

  // Path analysis
  const fullPath = (parsed.pathname + parsed.search).toLowerCase();
  const matchedPathKeywords = SUSPICIOUS_PATH_KEYWORDS.filter((kw) => fullPath.includes(kw));
  const hasSuspiciousPath = matchedPathKeywords.length > 0;

  const signals: UrlAnalysisSignal[] = [];

  // 1. IP-based URL signal
  if (isIpAddress) {
    signals.push({
      type: "url_intelligence",
      score: 85,
      confidence: 95,
      title: "Direct IP address destination",
      description: "Legitimate institutions virtually never direct consumers to raw IP addresses instead of trusted domain names.",
      evidence: `Host: ${hostname}`,
      source: "URL Intelligence",
    });
  }

  // 2. Punycode / Homograph signal
  if (isPunycode) {
    signals.push({
      type: "url_intelligence",
      score: 90,
      confidence: 90,
      title: "Punycode / Homograph domain detected",
      description: "This link uses internationalized characters that look identical to Latin letters to deceive users.",
      evidence: `Encoded host: ${hostname}`,
      source: "URL Intelligence",
    });
  }

  // 3. Shortened URL signal
  if (isShortened) {
    signals.push({
      type: "url_intelligence",
      score: 65,
      confidence: 85,
      title: "Shortened URL hiding destination",
      description: "URL shorteners obscure the real final destination domain and are frequently used in SMS phishing.",
      evidence: `Shortener host: ${hostname}`,
      source: "URL Intelligence",
    });
  }

  // 4. Insecure HTTP signal
  if (!isHttps && !isIpAddress) {
    signals.push({
      type: "url_intelligence",
      score: 55,
      confidence: 80,
      title: "Insecure connection (HTTP)",
      description: "The connection is unencrypted. Legitimate payment, banking, and shopping portals always use HTTPS.",
      evidence: `Protocol: ${parsed.protocol}`,
      source: "URL Intelligence",
    });
  }

  // 5. High-risk TLD signal
  if (hasSuspiciousTld) {
    signals.push({
      type: "url_intelligence",
      score: 70,
      confidence: 85,
      title: "High-risk top-level domain",
      description: `The .${tld} domain extension is disproportionately used by disposable phishing sites and scam campaigns.`,
      evidence: `TLD: .${tld}`,
      source: "URL Intelligence",
    });
  }

  // 6. Suspicious credential/payment path on unknown domain
  if (hasSuspiciousPath && !isShortened) {
    signals.push({
      type: "url_intelligence",
      score: 60,
      confidence: 75,
      title: "Sensitive credential or payment path",
      description: `The URL path mentions sensitive actions (${matchedPathKeywords.slice(0, 3).join(", ")}) on an unfamiliar domain.`,
      evidence: `Path: ${parsed.pathname}`,
      source: "URL Intelligence",
    });
  }

  // 7. Brand Matching & Official Domain Verification
  const brandCheck = await matchBrandDomain(claimedBrandName, hostname);
  let claimedBrand = brandCheck.claimedBrand;
  let officialMatch = brandCheck.isMatch;
  let brandMismatchReason = brandCheck.mismatchReason;

  if (brandCheck.claimedBrand) {
    if (brandCheck.isMatch) {
      signals.push({
        type: "brand_impersonation",
        score: 10,
        confidence: 98,
        title: "Verified official brand domain",
        description: `This web address matches the officially verified domain for ${brandCheck.claimedBrand}.`,
        evidence: `Hostname: ${hostname} matches official: ${brandCheck.officialDomains.join(", ")}`,
        source: "Official Brand Registry",
      });
    } else {
      signals.push({
        type: "brand_impersonation",
        score: 95,
        confidence: 95,
        title: "Brand impersonation detected",
        description: brandCheck.mismatchReason || `The website does not match the official domain stored for ${brandCheck.claimedBrand}.`,
        evidence: `Domain '${hostname}' does not match official domain(s): ${brandCheck.officialDomains.join(", ")}`,
        source: "Official Brand Registry",
      });
    }
  }

  // 8. Known Malicious Threat Intelligence Database
  const hostHash = crypto.createHash("sha256").update(hostname).digest("hex");
  const urlHash = crypto.createHash("sha256").update(parsed.origin + parsed.pathname).digest("hex");

  const threatMatch = await prisma.threatIndicator.findFirst({
    where: {
      active: true,
      OR: [
        { indicatorValueHash: hostHash },
        { indicatorValueHash: urlHash },
      ],
    },
  });

  let threatIntelMatch = false;
  if (threatMatch) {
    threatIntelMatch = true;
    signals.push({
      type: "threat_intel",
      score: 98,
      confidence: 99,
      title: "Confirmed threat intelligence record",
      description: `This destination matches verified active malicious campaign records from ${threatMatch.source}.`,
      evidence: `Indicator: ${threatMatch.displayValue}`,
      source: `Threat Intelligence (${threatMatch.source})`,
    });
  }

  // 9. Live external URL reputation. IPQS performs the remote scan; ScamCheck never opens the URL.
  const external = await lookupIpqsUrl(parsed.toString());
  if (external.available) {
    const externalScore = external.riskScore ?? 0;
    const confirmedExternalThreat = external.phishing === true || external.malware === true;
    if (confirmedExternalThreat) threatIntelMatch = true;
    signals.push({
      type: "threat_intel",
      score: Math.max(5, externalScore),
      confidence: confirmedExternalThreat ? 99 : external.suspicious || external.unsafe ? 90 : 80,
      title: confirmedExternalThreat
        ? "Live reputation confirms a malicious destination"
        : external.suspicious || external.unsafe
        ? "Live URL reputation warning"
        : "Live URL reputation check completed",
      description: confirmedExternalThreat
        ? `IPQS identified ${external.phishing ? "phishing" : "malware"} activity for this destination.`
        : external.suspicious || external.unsafe
        ? "IPQS found suspicious or unsafe reputation signals for this destination."
        : "IPQS did not return active phishing, malware, or unsafe reputation flags.",
      evidence: `Risk ${externalScore}/100 | Trust: ${external.domainTrust || "not rated"} | Age: ${external.domainAge || "unknown"}`,
      source: "IPQualityScore URL Reputation",
    });
  }

  // Calculate weighted aggregate URL score
  let maxScore = 0;
  if (signals.length > 0) {
    // If official brand match without threats, lower the score
    if (officialMatch && !threatIntelMatch) {
      maxScore = 15;
    } else {
      maxScore = Math.max(...signals.map((s) => s.score));
    }
  } else {
    maxScore = 20; // Default baseline calm score when no specific threats detected
  }

  return {
    url: rawUrl,
    normalizedUrl: parsed.toString(),
    protocol: parsed.protocol,
    hostname,
    isHttps,
    isIpAddress,
    isShortened,
    isPunycode,
    hasSuspiciousTld,
    hasSuspiciousPath,
    claimedBrand,
    officialMatch,
    brandMismatchReason,
    threatIntelMatch,
    signals,
    aggregateScore: maxScore,
  };
}
