import OpenAI from "openai";
import { analyzeMessage, MessageAnalysisResult } from "./message-analyzer";

export interface AIAnalysisResponse {
  language: string;
  summary: string;
  claimedOrganization: string | null;
  amount: number | null;
  currency: string | null;
  paymentRequested: boolean;
  urgencyDetected: boolean;
  threatDetected: boolean;
  credentialRequest: boolean;
  otpRequest: boolean;
  bankingInfoRequest: boolean;
  personalInfoRequest: boolean;
  impersonationDetected: boolean;
  urls: string[];
  phoneNumbers: string[];
  emailAddresses: string[];
  riskIndicators: string[];
  confidence: number;
}

export async function analyzeWithAI(
  rawText: string,
  localAnalysis: MessageAnalysisResult
): Promise<AIAnalysisResponse> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();

  // If no OpenAI API key is supplied, use our robust multi-lingual rule engine to generate the structured response
  if (!apiKey || apiKey === "your-openai-api-key" || apiKey.length < 10) {
    return generateFallbackAIResponse(rawText, localAnalysis);
  }

  try {
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a specialized cybersecurity AI assisting ScamCheck, a digital safety platform in Sri Lanka.
Analyze the provided user input for scam, phishing, fraud, and social engineering risk.
Strict rules:
1. Never invent organizations, URLs, phone numbers, amounts, or identities. Extract only what is verifiably present.
2. If uncertain, return null or low confidence.
3. Return valid JSON matching the exact schema.`;

    const userPrompt = `Analyze this suspicious text or message:
"""
${rawText.slice(0, 3000)}
"""`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (content) {
      const parsed = JSON.parse(content) as Partial<AIAnalysisResponse>;
      return {
        language: parsed.language || localAnalysis.detectedLanguage,
        summary: parsed.summary || generateDeterministicSummary(localAnalysis),
        claimedOrganization: parsed.claimedOrganization || localAnalysis.facts.claimedOrganizations[0] || null,
        amount: parsed.amount ?? (localAnalysis.facts.amounts[0]?.value || null),
        currency: parsed.currency ?? (localAnalysis.facts.amounts[0]?.currency || null),
        paymentRequested: parsed.paymentRequested ?? localAnalysis.indicators.paymentRequested,
        urgencyDetected: parsed.urgencyDetected ?? localAnalysis.indicators.urgencyDetected,
        threatDetected: parsed.threatDetected ?? localAnalysis.indicators.threatDetected,
        credentialRequest: parsed.credentialRequest ?? localAnalysis.indicators.credentialRequested,
        otpRequest: parsed.otpRequest ?? localAnalysis.indicators.otpRequested,
        bankingInfoRequest: parsed.bankingInfoRequest ?? localAnalysis.indicators.bankingInfoRequested,
        personalInfoRequest: parsed.personalInfoRequest ?? localAnalysis.indicators.personalInfoRequested,
        impersonationDetected: parsed.impersonationDetected ?? localAnalysis.indicators.impersonationDetected,
        urls: parsed.urls && parsed.urls.length > 0 ? parsed.urls : localAnalysis.facts.urls,
        phoneNumbers: parsed.phoneNumbers && parsed.phoneNumbers.length > 0 ? parsed.phoneNumbers : localAnalysis.facts.phoneNumbers,
        emailAddresses: parsed.emailAddresses && parsed.emailAddresses.length > 0 ? parsed.emailAddresses : localAnalysis.facts.emailAddresses,
        riskIndicators: parsed.riskIndicators || localAnalysis.signals.map((s) => s.title),
        confidence: parsed.confidence || 90,
      };
    }
  } catch (err) {
    console.warn("OpenAI API call failed or timed out, gracefully using internal intelligence engine:", err);
  }

  return generateFallbackAIResponse(rawText, localAnalysis);
}

function generateDeterministicSummary(local: MessageAnalysisResult): string {
  const parts: string[] = [];
  if (local.facts.claimedOrganizations.length > 0) {
    parts.push(`Communication claiming to be from ${local.facts.claimedOrganizations.join(", ")}`);
  }
  if (local.indicators.otpRequested) {
    parts.push("requesting sensitive one-time verification codes");
  } else if (local.indicators.paymentRequested) {
    parts.push("requesting urgent payment or fee transfer");
  } else if (local.indicators.credentialRequested) {
    parts.push("requesting account login credentials");
  }

  if (parts.length === 0) {
    return local.signals.length > 0
      ? `Suspicious message showing ${local.signals.length} risk signals.`
      : "Message analyzed with no high-risk indicators detected.";
  }

  return parts.join(" ");
}

function generateFallbackAIResponse(
  rawText: string,
  local: MessageAnalysisResult
): AIAnalysisResponse {
  const riskIndicators = local.signals.map((s) => s.title);

  return {
    language: local.detectedLanguage,
    summary: generateDeterministicSummary(local),
    claimedOrganization: local.facts.claimedOrganizations[0] || null,
    amount: local.facts.amounts[0]?.value || null,
    currency: local.facts.amounts[0]?.currency || null,
    paymentRequested: local.indicators.paymentRequested,
    urgencyDetected: local.indicators.urgencyDetected,
    threatDetected: local.indicators.threatDetected,
    credentialRequest: local.indicators.credentialRequested,
    otpRequest: local.indicators.otpRequested,
    bankingInfoRequest: local.indicators.bankingInfoRequested,
    personalInfoRequest: local.indicators.personalInfoRequested,
    impersonationDetected: local.indicators.impersonationDetected,
    urls: local.facts.urls,
    phoneNumbers: local.facts.phoneNumbers,
    emailAddresses: local.facts.emailAddresses,
    riskIndicators,
    confidence: local.signals.length > 0 ? 92 : 85,
  };
}
