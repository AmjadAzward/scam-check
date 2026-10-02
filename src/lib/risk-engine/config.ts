import type { RiskEngineWeights } from "./types";

// Shared, dependency-free defaults. Keeping this outside the server engine
// prevents Prisma and analysis dependencies from entering client bundles.
export const DEFAULT_WEIGHTS: RiskEngineWeights = {
  aiMessageWeight: 0.2,
  urlIntelWeight: 0.25,
  threatIntelWeight: 0.3,
  impersonationWeight: 0.2,
  communityWeight: 0.15,
  sensitiveInfoWeight: 0.2,
  senderVerificationWeight: 0.15,
};

// Calibrated against the versioned verified sample set in tests/calibration-dataset.json.
export const HIGH_RISK_THRESHOLD = 60;
export const MEDIUM_RISK_THRESHOLD = 40;
