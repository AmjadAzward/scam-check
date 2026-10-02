import { runRiskEngine } from "../src/lib/risk-engine/engine";
import { normalizePhoneNumber } from "../src/lib/risk-engine/phone-normalizer";
import { analyzeUrl } from "../src/lib/risk-engine/url-analyzer";
import { analyzeMessage } from "../src/lib/risk-engine/message-analyzer";
import { maskCreditCard, maskCvv, maskOtp, maskPhoneNumber } from "../src/lib/privacy/masking";
import prisma from "../src/lib/db";
import { calculateIpqsPhoneRisk } from "../src/lib/ipqs-phone";
import { checkRateLimit } from "../src/lib/security/rate-limit";

async function runTests() {
  console.log("🧪 Starting ScamCheck Test Suite...\n");
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName} ${detail ? `(${detail})` : ""}`);
      failed++;
    }
  }

  // --- TEST 1: Sample Scenario from Prompt ---
  console.log("Test Suite 1: Sample Scenario Verification");
  const sampleInput = "Your parcel has been detained. Pay Rs. 450 immediately using this link: http://slpost-customs-clearance.top/pay";
  const scenarioResult = await runRiskEngine({
    scanType: "MESSAGE",
    text: sampleInput,
  });

  assert(
    scenarioResult.riskLevel === "HIGH_RISK" || scenarioResult.riskLevel === "KNOWN_MALICIOUS",
    "Sample scenario assigned HIGH RISK or KNOWN MALICIOUS",
    `Got: ${scenarioResult.riskLevel}, Score: ${scenarioResult.riskScore}`
  );

  const reasonsText = scenarioResult.reasons.map((r) => r.title.toLowerCase()).join(" ");
  assert(
    reasonsText.includes("urgent") || reasonsText.includes("payment") || reasonsText.includes("pressure"),
    "Detected urgent payment request in reasons"
  );
  assert(
    reasonsText.includes("suspicious") || reasonsText.includes("website") || reasonsText.includes("threat") || reasonsText.includes("domain"),
    "Detected suspicious website / threat in reasons"
  );
  assert(
    scenarioResult.signals.some((s) => s.type === "sender_verification") || reasonsText.includes("sender"),
    "Detected unverified sender signal"
  );

  const recsText = scenarioResult.recommendations.join(" ").toLowerCase();
  assert(
    recsText.includes("do not click") && recsText.includes("card") && recsText.includes("verify"),
    "Includes defensive action guidance (do not click, do not enter details, verify directly)"
  );

  // --- TEST 2: Sri Lankan Phone Normalization & Masking ---
  console.log("\nTest Suite 2: Phone Normalization & Privacy Masking");
  const p1 = normalizePhoneNumber("0771234567");
  assert(p1.normalized === "+94771234567", "0771234567 normalized to +94771234567");
  assert(p1.networkOperator === "Dialog", "Identified 77 prefix as Dialog operator");
  assert(p1.masked === "+94 77 •••• 567", "Masked format matches +94 77 •••• 567");

  const p2 = normalizePhoneNumber("+94 71 928 3746");
  assert(p2.normalized === "+94719283746", "+94 71 928 3746 normalized correctly");
  assert(p2.networkOperator === "SLT-Mobitel", "Identified 71 prefix as SLT-Mobitel");

  // --- TEST 3: Privacy Sanitization & Masking ---
  console.log("\nTest Suite 3: Sensitive Content Masking");
  const creditCardText = "Customer card: 4532 1123 8847 9123";
  const maskedCard = maskCreditCard(creditCardText);
  assert(maskedCard.includes("•••• •••• •••• 9123"), "Credit card masked with last 4 digits preserved");

  const otpText = "Your verification OTP code is: 493021";
  const maskedOtp = maskOtp(otpText);
  assert(maskedOtp.includes("••••••") && !maskedOtp.includes("493021"), "OTP code automatically masked");

  const cvvText = "Security code CVV: 892";
  const maskedCvv = maskCvv(cvvText);
  assert(maskedCvv.includes("•••") && !maskedCvv.includes("892"), "CVV code automatically masked");

  // --- TEST 4: Brand Impersonation & URL Intelligence ---
  console.log("\nTest Suite 4: Brand Impersonation & Lookalike Detection");
  const lookalikeUrl = "http://daraz-delivery-tracking.xyz/pay";
  const urlRes = await analyzeUrl(lookalikeUrl, "Daraz");

  assert(!urlRes.officialMatch, "Flagged domain as NOT matching official Daraz domain");
  assert(
    urlRes.brandMismatchReason?.includes("does not match the official domain") || false,
    "Provided brand mismatch explanation"
  );
  assert(urlRes.signals.some((s) => s.type === "threat_intel" || s.type === "brand_impersonation"), "Generated impersonation/threat signal");

  // Official domain should match cleanly
  const officialUrl = "https://daraz.lk/order-tracking";
  const officialRes = await analyzeUrl(officialUrl, "Daraz");
  assert(officialRes.officialMatch, "Recognized official daraz.lk domain match");

  // --- TEST 5: Multilingual Message Analysis (Sinhala & Tamil) ---
  console.log("\nTest Suite 5: Multilingual Analysis (Sinhala & Tamil)");
  const sinhalaMsg = "ඔබගේ ගිණුම අත්හිටුවා ඇත. වහාම Rs. 500 ක් ගෙවන්න.";
  const siRes = analyzeMessage(sinhalaMsg);
  assert(siRes.detectedLanguage === "si", "Detected Sinhala language (si)");
  assert(siRes.indicators.urgencyDetected && siRes.indicators.paymentRequested, "Detected urgency and payment request in Sinhala");

  const tamilMsg = "உடனடியாக பணம் செலுத்துங்கள். உங்கள் கணக்கு முடக்கப்படும்.";
  const taRes = analyzeMessage(tamilMsg);
  assert(taRes.detectedLanguage === "ta", "Detected Tamil language (ta)");
  assert(taRes.indicators.urgencyDetected && taRes.indicators.threatDetected, "Detected urgency and threat in Tamil");

  // --- TEST 6: Community Intelligence Aggregation ---
  console.log("\nTest Suite 6: Community Intelligence");
  const commPhone = "+94770192834";
  const phoneScan = await runRiskEngine({ scanType: "PHONE", phone: commPhone });
  assert(
    phoneScan.signals.some((s) => s.type === "community_reports"),
    "Retrieved community reports for known phone"
  );
  assert(phoneScan.riskLevel === "HIGH_RISK" || phoneScan.riskLevel === "KNOWN_MALICIOUS", "Assigned high risk to phone with multiple reports");

  // --- TEST 7: External Service Failure Fallback ---
  console.log("\nTest Suite 7: External Service Resilience");
  // Test running message analysis without external OpenAI key (offline deterministic mode)
  const offlineScan = await runRiskEngine({
    scanType: "MESSAGE",
    text: "Claim your free prize now! Send your banking password to release $1000.",
  });
  assert(offlineScan.riskScore > 60, "Engine generates accurate risk assessment without OpenAI key");
  assert(offlineScan.reasons.length > 0, "Reasons populated in offline mode");

  // --- TEST 8: Security controls and external score normalization ---
  console.log("\nTest Suite 8: Security Controls");
  const rateKey = `test-${Date.now()}`;
  assert(checkRateLimit("test", rateKey, 2, 60_000).allowed, "Rate limiter allows request within quota");
  checkRateLimit("test", rateKey, 2, 60_000);
  assert(!checkRateLimit("test", rateKey, 2, 60_000).allowed, "Rate limiter blocks request above quota");

  const abusiveRisk = calculateIpqsPhoneRisk({
    available: true, valid: true, active: true, fraudScore: 20, risky: false,
    recentAbuse: true, spammer: false, leaked: false, voip: false, prepaid: false,
    carrier: null, lineType: null, country: null, region: null,
  });
  assert(abusiveRisk >= 85, "Recent external abuse produces a high-risk score");

  console.log("\n=========================================");
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log("=========================================\n");

  await prisma.$disconnect();

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
