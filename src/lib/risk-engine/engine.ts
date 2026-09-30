import {
  RiskLevel,
  ScanType,
  SignalItem,
  RiskEngineWeights,
  RiskEngineResult,
} from "./types";
import { analyzeMessage, MessageAnalysisResult } from "./message-analyzer";
import { analyzeUrl, UrlAnalysisResult } from "./url-analyzer";
import { normalizePhoneNumber } from "./phone-normalizer";
import { lookupCommunityIntelligence } from "./community-intelligence";
import { analyzeWithAI, AIAnalysisResponse } from "./ai-analyzer";
import prisma from "@/lib/db";
import crypto from "crypto";
import { DEFAULT_WEIGHTS } from "./config";

export { DEFAULT_WEIGHTS } from "./config";

export interface RiskEngineInput {
  scanType: ScanType;
  text?: string;
  url?: string;
  phone?: string;
  qrDestination?: string;
  imageUrl?: string;
  customWeights?: Partial<RiskEngineWeights>;
}

export async function runRiskEngine(input: RiskEngineInput): Promise<RiskEngineResult> {
  const weights: RiskEngineWeights = {
    ...DEFAULT_WEIGHTS,
    ...input.customWeights,
  };

  const signals: SignalItem[] = [];
  let summary = "";
  let claimedOrg: string | null = null;
  let normalizedTarget: string | null = null;
  let language = "en";

  // Individual risk sub-scores
  let messageRisk = 0;
  let urlRisk = 0;
  let communityRisk = 0;
  let impersonationRisk = 0;
  let threatIntelRisk = 0;
  let sensitiveInfoRisk = 0;
  let senderVerificationRisk = 0;

  let isAuthoritativeMalicious = false;

  // 1. Process Based on Scan Type
  if (input.scanType === "PHONE" && input.phone) {
    const norm = normalizePhoneNumber(input.phone);
    normalizedTarget = norm.normalized;

    // Check Threat Indicators DB
    const phoneHash = crypto.createHash("sha256").update(norm.normalized.toLowerCase()).digest("hex");
    const threatRecord = await prisma.threatIndicator.findFirst({
      where: { indicatorValueHash: phoneHash, active: true },
    });

    if (threatRecord) {
      threatIntelRisk = 95;
      isAuthoritativeMalicious = threatRecord.riskLevel === "KNOWN_MALICIOUS";
      signals.push({
        type: "threat_intel",
        score: threatRecord.riskLevel === "KNOWN_MALICIOUS" ? 98 : 85,
        confidence: 99,
        title: "Threat intelligence record",
        description: `This phone number is flagged in authoritative threat databases by ${threatRecord.source}.`,
        evidence: `Number: ${norm.masked}`,
        source: threatRecord.source,
      });
    }

    // Community Reports Intelligence
    const commIntel = await lookupCommunityIntelligence(norm.normalized, norm.masked);
    communityRisk = commIntel.riskScore;

    if (commIntel.totalReports > 0) {
      signals.push({
        type: "community_reports",
        score: commIntel.riskScore,
        confidence: 85,
        title: "Community reports on file",
        description: commIntel.signalText,
        evidence: `${commIntel.totalReports} community reports submitted`,
        source: "Community Reports",
      });
    } else {
      signals.push({
        type: "community_reports",
        score: 10,
        confidence: 80,
        title: "No community reports on record",
        description: "This phone number has not received verified reports from ScamCheck users.",
        evidence: "0 community reports",
        source: "Community Reports",
      });
    }

    if (norm.networkOperator) {
      signals.push({
        type: "sender_verification",
        score: 15,
        confidence: 90,
        title: `Operator: ${norm.networkOperator}`,
        description: `Recognized Sri Lankan network operator (${norm.networkOperator}).`,
        evidence: norm.displayFormatted,
        source: "Carrier Prefix Verification",
      });
    }

    summary = commIntel.totalReports > 0
      ? `Phone number ${norm.masked} has received ${commIntel.totalReports} community reports.`
      : `Phone number ${norm.masked} with no prior community scam reports.`;

  } else if (input.scanType === "URL" || input.scanType === "QR") {
    const rawTarget = input.url || input.qrDestination || "";
    normalizedTarget = rawTarget;

    const urlAnalysis = await analyzeUrl(rawTarget);
    urlRisk = urlAnalysis.aggregateScore;
    claimedOrg = urlAnalysis.claimedBrand;

    // Check community reports on URL
    const urlHash = crypto.createHash("sha256").update(urlAnalysis.hostname.toLowerCase()).digest("hex");
    const commIntel = await lookupCommunityIntelligence(urlAnalysis.hostname, urlAnalysis.hostname);
    if (commIntel.totalReports > 0) {
      communityRisk = commIntel.riskScore;
      signals.push({
        type: "community_reports",
        score: commIntel.riskScore,
        confidence: 85,
        title: "Community reports on this domain",
        description: commIntel.signalText,
        evidence: `${commIntel.totalReports} community reports recorded`,
        source: "Community Reports",
      });
    }

    // Transfer signals from URL analysis
    urlAnalysis.signals.forEach((s) => {
      signals.push(s);
      if (s.type === "threat_intel") threatIntelRisk = Math.max(threatIntelRisk, s.score);
      if (s.type === "brand_impersonation") impersonationRisk = Math.max(impersonationRisk, s.score);
    });

    if (urlAnalysis.threatIntelMatch) {
      isAuthoritativeMalicious = true;
    }

    summary = urlAnalysis.brandMismatchReason
      ? urlAnalysis.brandMismatchReason
      : urlAnalysis.signals.length > 0
      ? `Web address ${urlAnalysis.hostname} exhibits ${urlAnalysis.signals.length} risk characteristics.`
      : `Web address ${urlAnalysis.hostname} verified with standard security indicators.`;

  } else {
    // ScanType === "MESSAGE" or "SCREENSHOT"
    const textToAnalyze = input.text || "";
    normalizedTarget = textToAnalyze.slice(0, 100);

    const localMessage = analyzeMessage(textToAnalyze);
    language = localMessage.detectedLanguage;
    messageRisk = localMessage.score;

    if (localMessage.facts.claimedOrganizations.length > 0) {
      claimedOrg = localMessage.facts.claimedOrganizations[0];
    }

    // Sensitive info signals
    if (localMessage.indicators.otpRequested || localMessage.indicators.credentialRequested || localMessage.indicators.bankingInfoRequested) {
      sensitiveInfoRisk = 92;
    } else if (localMessage.indicators.paymentRequested) {
      sensitiveInfoRisk = 80;
    }

    // Unverified sender signal
    senderVerificationRisk = 75;
    signals.push({
      type: "sender_verification",
      score: 75,
      confidence: 80,
      title: "Sender identity unverified",
      description: "The sender could not be verified against authorized organizational communication channels.",
      evidence: "Unverified SMS or social messaging sender",
      source: "Sender Verification Engine",
    });

    // Check URLs in the message
    for (const extractedUrl of localMessage.facts.urls) {
      const urlAnalysis = await analyzeUrl(extractedUrl, claimedOrg);
      urlRisk = Math.max(urlRisk, urlAnalysis.aggregateScore);
      urlAnalysis.signals.forEach((s) => {
        signals.push(s);
        if (s.type === "threat_intel") threatIntelRisk = Math.max(threatIntelRisk, s.score);
        if (s.type === "brand_impersonation") impersonationRisk = Math.max(impersonationRisk, s.score);
      });
      if (urlAnalysis.threatIntelMatch) isAuthoritativeMalicious = true;
    }

    // Check Phone numbers in message
    for (const extractedPhone of localMessage.facts.phoneNumbers) {
      const commIntel = await lookupCommunityIntelligence(extractedPhone, extractedPhone);
      if (commIntel.totalReports > 0) {
        communityRisk = Math.max(communityRisk, commIntel.riskScore);
        signals.push({
          type: "community_reports",
          score: commIntel.riskScore,
          confidence: 85,
          title: `Reported contact number (${extractedPhone})`,
          description: commIntel.signalText,
          evidence: `${commIntel.totalReports} community reports on file`,
          source: "Community Reports",
        });
      }
    }

    // Add local message signals
    localMessage.signals.forEach((s) => signals.push(s));

    // Call AI analyzer (with structured output & offline fallback)
    const aiResult = await analyzeWithAI(textToAnalyze, localMessage);
    if (aiResult.summary) summary = aiResult.summary;
    if (aiResult.claimedOrganization && !claimedOrg) claimedOrg = aiResult.claimedOrganization;
  }

  // 2. Modular Weight-Based Risk Score Calculation
  // We compute total risk score based on active signal channels
  let activeWeightSum = 0;
  let weightedScoreSum = 0;

  const channels = [
    { risk: messageRisk, weight: weights.aiMessageWeight },
    { risk: urlRisk, weight: weights.urlIntelWeight },
    { risk: threatIntelRisk, weight: weights.threatIntelWeight },
    { risk: impersonationRisk, weight: weights.impersonationWeight },
    { risk: communityRisk, weight: weights.communityWeight },
    { risk: sensitiveInfoRisk, weight: weights.sensitiveInfoWeight },
    { risk: senderVerificationRisk, weight: weights.senderVerificationWeight },
  ];

  channels.forEach((c) => {
    if (c.risk > 0) {
      activeWeightSum += c.weight;
      weightedScoreSum += c.risk * c.weight;
    }
  });

  let calculatedScore = activeWeightSum > 0 ? Math.round(weightedScoreSum / activeWeightSum) : 15;

  // Max cap overrides: If any verified threat or OTP request occurs, score must reflect high severity
  if (threatIntelRisk >= 95 || isAuthoritativeMalicious) {
    calculatedScore = Math.max(calculatedScore, 95);
  } else if (impersonationRisk >= 90 && sensitiveInfoRisk >= 80) {
    calculatedScore = Math.max(calculatedScore, 88);
  } else if (sensitiveInfoRisk >= 90) {
    calculatedScore = Math.max(calculatedScore, 82);
  }

  // Ensure bounds
  calculatedScore = Math.min(100, Math.max(5, calculatedScore));

  // 3. Assign Risk Level
  let riskLevel: RiskLevel = "LOW_RISK";
  if (isAuthoritativeMalicious || (threatIntelRisk >= 95 && calculatedScore >= 90)) {
    riskLevel = "KNOWN_MALICIOUS";
  } else if (calculatedScore >= 70) {
    riskLevel = "HIGH_RISK";
  } else if (calculatedScore >= 40) {
    riskLevel = "MEDIUM_RISK";
  } else {
    riskLevel = "LOW_RISK";
  }

  // 4. Generate Clear, Calm Reasons ("WHY THIS LOOKS SUSPICIOUS")
  const reasons: { title: string; description: string; evidence?: string | null; source: string }[] = [];

  // Deduplicate signals into user-friendly explanation list
  const seenTitles = new Set<string>();
  // Sort signals by score descending
  const sortedSignals = [...signals].sort((a, b) => b.score - a.score);

  sortedSignals.forEach((sig) => {
    if (!seenTitles.has(sig.title) && reasons.length < 5) {
      seenTitles.add(sig.title);
      reasons.push({
        title: sig.title,
        description: sig.description,
        evidence: sig.evidence,
        source: sig.source,
      });
    }
  });

  if (reasons.length === 0) {
    reasons.push({
      title: "No strong risk indicators identified",
      description: "The provided content does not match active malicious patterns or suspicious domain registries.",
      source: "ScamCheck Baseline Analysis",
    });
  }

  // 5. Generate Clear, Defensive Action Recommendations ("WHAT YOU SHOULD DO")
  const recommendations: string[] = [];

  if (riskLevel === "HIGH_RISK" || riskLevel === "KNOWN_MALICIOUS") {
    recommendations.push("Do not click the link or open the web address.");
    recommendations.push("Do not enter credit card, debit card, or banking details.");
    recommendations.push("Do not share passwords, PINs, or One-Time Passwords (OTPs) under any circumstances.");
    if (claimedOrg) {
      recommendations.push(`Verify directly through ${claimedOrg}'s official website, app, or known official phone line.`);
    } else {
      recommendations.push("Verify directly with the alleged organization using an independently verified contact channel.");
    }
    recommendations.push("Report this scam to help protect other community members.");
  } else if (riskLevel === "MEDIUM_RISK") {
    recommendations.push("Exercise caution before proceeding or replying.");
    recommendations.push("Do not send advance payments, deposits, or gift cards to unverified private accounts.");
    recommendations.push("Cross-check the identity of the person or business through external references.");
    recommendations.push("If in doubt, contact the official organization via published customer service channels.");
  } else {
    recommendations.push("We did not detect strong risk indicators, but independent verification is still recommended.");
    recommendations.push("Always verify that the browser address bar shows the expected official domain name.");
    recommendations.push("Never disclose your banking passwords or OTPs to anyone.");
  }

  if (!summary) {
    if (riskLevel === "HIGH_RISK" || riskLevel === "KNOWN_MALICIOUS") {
      summary = "High-risk indicators detected with significant signs of fraud or impersonation.";
    } else if (riskLevel === "MEDIUM_RISK") {
      summary = "Moderate risk signals detected. Caution and independent verification advised.";
    } else {
      summary = "No high-risk indicators detected. Standard caution recommended.";
    }
  }

  return {
    scanType: input.scanType,
    riskLevel,
    riskScore: calculatedScore,
    summary,
    language,
    claimedOrg,
    normalizedTarget,
    signalBreakdown: {
      messageRisk,
      urlRisk,
      communityRisk,
      impersonationRisk,
      threatIntelRisk,
      sensitiveInfoRisk,
      senderVerificationRisk,
    },
    reasons,
    recommendations,
    signals,
    technicalDetails: {
      calculatedScore,
      activeChannelsCount: channels.filter((c) => c.risk > 0).length,
      weightsUsed: weights,
      threatIntelMatched: isAuthoritativeMalicious,
      timestamp: new Date().toISOString(),
    },
  };
}
