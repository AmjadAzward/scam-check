import dataset from "../tests/calibration-dataset.json";
import { runRiskEngine } from "../src/lib/risk-engine/engine";
import prisma from "../src/lib/db";
import { HIGH_RISK_THRESHOLD } from "../src/lib/risk-engine/config";

async function main() {
  let tp = 0, tn = 0, fp = 0, fn = 0;
  const results = [];
  for (const sample of dataset) {
    const result = await runRiskEngine({ scanType: sample.scanType as "MESSAGE", text: sample.text });
    const predictedScam = result.riskScore >= HIGH_RISK_THRESHOLD;
    const actualScam = sample.label === "SCAM";
    if (predictedScam && actualScam) tp++; else if (!predictedScam && !actualScam) tn++; else if (predictedScam) fp++; else fn++;
    results.push({ id: sample.id, expected: sample.label, score: result.riskScore, predicted: predictedScam ? "SCAM" : "NOT_HIGH_RISK" });
  }
  const total = dataset.length;
  console.table(results);
  console.log({ modelVersion: results[0] ? "scamcheck-risk-v2.1.0" : "unknown", highRiskThreshold: HIGH_RISK_THRESHOLD, total, accuracy: (tp + tn) / total, precision: tp / Math.max(1, tp + fp), recall: tp / Math.max(1, tp + fn), falsePositiveRate: fp / Math.max(1, fp + tn), tp, tn, fp, fn });
  await prisma.$disconnect();
}
main().catch(async (error) => { console.error(error); await prisma.$disconnect(); process.exit(1); });
