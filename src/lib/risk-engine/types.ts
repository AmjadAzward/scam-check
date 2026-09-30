export type RiskLevel = "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "KNOWN_MALICIOUS";

export type ScanType = "SCREENSHOT" | "MESSAGE" | "URL" | "PHONE" | "QR";

export interface SignalItem {
  id?: string;
  type: string;
  score: number;
  confidence: number;
  title: string;
  description: string;
  evidence?: string | null;
  source: string;
}

export interface RiskEngineWeights {
  aiMessageWeight: number; // default 0.20
  urlIntelWeight: number; // default 0.25
  threatIntelWeight: number; // default 0.30
  impersonationWeight: number; // default 0.20
  communityWeight: number; // default 0.15
  sensitiveInfoWeight: number; // default 0.20
  senderVerificationWeight: number; // default 0.15
}

export interface RiskEngineResult {
  scanType: ScanType;
  riskLevel: RiskLevel;
  riskScore: number; // 0 - 100
  summary: string;
  language: string;
  claimedOrg: string | null;
  normalizedTarget: string | null;
  signalBreakdown: {
    messageRisk: number;
    urlRisk: number;
    communityRisk: number;
    impersonationRisk: number;
    threatIntelRisk: number;
    sensitiveInfoRisk: number;
    senderVerificationRisk: number;
  };
  reasons: {
    title: string;
    description: string;
    evidence?: string | null;
    source: string;
  }[];
  recommendations: string[];
  signals: SignalItem[];
  technicalDetails: Record<string, any>;
}
