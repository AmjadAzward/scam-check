import { normalizePhoneNumber } from "./phone-normalizer";
import { sanitizeSensitiveText } from "@/lib/privacy/masking";

export interface ExtractedFact {
  urls: string[];
  phoneNumbers: string[];
  emailAddresses: string[];
  amounts: { value: number; currency: string }[];
  claimedOrganizations: string[];
}

export interface MessageRiskIndicators {
  urgencyDetected: boolean;
  threatDetected: boolean;
  paymentRequested: boolean;
  otpRequested: boolean;
  credentialRequested: boolean;
  bankingInfoRequested: boolean;
  personalInfoRequested: boolean;
  unrealisticOfferDetected: boolean;
  impersonationDetected: boolean;
  socialEngineeringDetected: boolean;
}

export interface MessageAnalysisSignal {
  type: string;
  score: number;
  confidence: number;
  title: string;
  description: string;
  evidence: string;
  source: string;
}

export interface MessageAnalysisResult {
  sanitizedText: string;
  detectedLanguage: string;
  facts: ExtractedFact;
  indicators: MessageRiskIndicators;
  signals: MessageAnalysisSignal[];
  score: number;
}

// Regex Patterns for English, Sinhala and Tamil
const URGENCY_REGEX =
  /(immediately|urgent|within 24 hours|within 12 hours|act now|expires today|last chance|instant|වහාම|ක්ෂණිකව|පැය 24ක් තුළ|අවසන් අවස්ථාව|අදම|உடனடியாக|24 மணி நேரத்திற்குள்|இன்றே|கடைசி வாய்ப்பு)/i;

const THREAT_SUSPENSION_REGEX =
  /(detained|suspended|account will be closed|blocked|deactivated|police|arrest|legal action|court|customs penalty|නඩු පවරනු ඇත|අත්හිටුවා ඇත|අත්අඩංගුවට|ගිණුම අක්‍රිය|දඩ මුදල්|முடக்கப்படும்|நிறுத்தப்படும்|கைது|நீதிமன்றம்|அபராதம்)/i;

const PAYMENT_REGEX =
  /(pay|transfer|fee|charges|fine|customs duty|release fee|deposit|recharge|ගෙවන්න|මුදල් තැන්පත් කරන්න|ගාස්තුව|බදු මුදල|මුදල් එවන්න|பணம் செலுத்துங்கள்|கட்டணம்|வரி|முன்பணம்)/i;

const OTP_REGEX =
  /(otp|one[-\s]time\s*password|verification\s*code|auth\s*code|pin\s*code|රහස්\s*අංකය|කේතය|සත්‍යාපන\s*කේතය|கடவுச்சொல்|சரிபார்ப்பு\s*குறியீடு)/i;

const CREDENTIAL_REGEX =
  /(password|passcode|secret\s*phrase|seed\s*phrase|cvv|cvc|card\s*number|login\s*details|මුරපදය|කාඩ්පත්\s*අංකය|රහස්\s*වචන|ரகசிய\s*எண்|அட்டை\s*விவரங்கள்)/i;

const BANKING_INFO_REGEX =
  /(bank\s*account|account\s*number|debit\s*card|credit\s*card|internet\s*banking|b-app|vishwa|combank\s*digital|බැංකු\s*ගිණුම|කාඩ්පත්|වීශ්වා|வங்கி\s*கணக்கு|வங்கி\s*விவரங்கள்)/i;

const PERSONAL_INFO_REGEX =
  /(national\s*id|nic|passport\s*number|mother'?s\s*maiden|date\s*of\s*birth|හැඳුනුම්පත්\s*අංකය|උපන්\s*දිනය|அடையாள\s*அட்டை|பிறந்த\s*தேதி)/i;

const UNREALISTIC_OFFER_REGEX =
  /(won|congratulations|lottery|lucky\s*draw|prize|free\s*gift|guaranteed\s*return|daily\s*income|200%|crypto\s*task|like\s*and\s*earn|ත්‍යාගයක්|දිනුමක්|නොමිලේ|වාසනාවන්ත|லாட்டரி|பரிசு|வென்றுள்ளீர்கள்|இலவசம்)/i;

const GIFT_CARD_PAYMENT_REGEX = /(purchase|buy)\s+gift\s+cards?|send\s+(?:the\s+)?(?:gift\s+card\s+)?codes?/i;

const BRAND_PATTERNS = [
  { name: "Daraz", regex: /(daraz|ඩරාස්|டராஸ்)/i },
  { name: "Sri Lanka Post", regex: /(sl\s*post|sri\s*lanka\s*post|colombo\s*central\s*post|postal\s*department|තැපැල්\s*දෙපාර්තමේන්තුව|அஞ்சல்\s*திணைக்களம்)/i },
  { name: "Commercial Bank", regex: /(commercial\s*bank|combank|cbc|කොමර්ෂල්\s*බැංකුව|கொமர்ஷல்\s*வங்கி)/i },
  { name: "Bank of Ceylon", regex: /(bank\s*of\s*ceylon|boc|ලංකා\s*බැංකුව|இலங்கை\s*வங்கி)/i },
  { name: "Sampath Bank", regex: /(sampath\s*bank|sampath|සම්පත්\s*බැංකුව|சம்பத்\s*வங்கி)/i },
  { name: "Dialog Axiata", regex: /(dialog|ඩයලොග්|டயலொக்)/i },
  { name: "SLT-Mobitel", regex: /(mobitel|slt|sri\s*lanka\s*telecom|මොබිටෙල්|மொபிடெல்)/i },
  { name: "Central Bank of Sri Lanka", regex: /(central\s*bank|cbsl|ශ්‍රී\s*ලංකා\s*මහ\s*බැංකුව|இலங்கை\s*மத்திய\s*வங்கி)/i },
  { name: "DHL", regex: /(dhl|dhl\s*express)/i },
  { name: "WhatsApp", regex: /(whatsapp|වට්ස්ඇප්|வாட்ஸ்அப்)/i },
  { name: "Telegram", regex: /(telegram|ටෙලිග්‍රෑම්|டெலிகிராம்)/i },
];

export function analyzeMessage(rawText: string): MessageAnalysisResult {
  const sanitized = sanitizeSensitiveText(rawText);

  // 1. Language Detection
  let detectedLanguage = "en";
  const sinhalaChars = (rawText.match(/[\u0D80-\u0DFF]/g) || []).length;
  const tamilChars = (rawText.match(/[\u0B80-\u0BFF]/g) || []).length;

  if (sinhalaChars > 5 && sinhalaChars >= tamilChars) {
    detectedLanguage = "si";
  } else if (tamilChars > 5 && tamilChars > sinhalaChars) {
    detectedLanguage = "ta";
  }

  // 2. Extract Facts (URLs, Phone numbers, Emails, Amounts, claimed orgs)
  const urlMatches = rawText.match(/\bhttps?:\/\/[^\s<>"'{}|\\^`]+|\b[a-zA-Z0-9-]+\.(?:lk|com|xyz|top|cc|net|org|site|click|online)\/[^\s<>"'{}|\\^`]*/gi) || [];
  const urls = Array.from(new Set(urlMatches));

  // Phone extraction (looking for +94, 07x, etc.)
  const phoneMatches = rawText.match(/(?:\+94|0094|0)?\s?[71][0-9\s-]{7,11}\b/g) || [];
  const normalizedPhones: string[] = [];
  phoneMatches.forEach((pm) => {
    const norm = normalizePhoneNumber(pm);
    if (norm.isValid) normalizedPhones.push(norm.normalized);
  });
  const phoneNumbers = Array.from(new Set(normalizedPhones));

  const emailMatches = rawText.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g) || [];
  const emailAddresses = Array.from(new Set(emailMatches));

  // Currency and amount extraction (Rs., LKR, $, USD)
  const amountRegex = /(?:Rs\.?|LKR|\$|USD)\s?([0-9,]+(?:\.[0-9]{2})?)/gi;
  const amounts: { value: number; currency: string }[] = [];
  let aMatch;
  while ((aMatch = amountRegex.exec(rawText)) !== null) {
    const val = parseFloat(aMatch[1].replace(/,/g, ""));
    const curr = aMatch[0].toUpperCase().includes("LKR") || aMatch[0].includes("Rs") ? "LKR" : "USD";
    if (!isNaN(val)) amounts.push({ value: val, currency: curr });
  }

  // Claimed Organization detection
  const claimedOrganizations: string[] = [];
  BRAND_PATTERNS.forEach((bp) => {
    if (bp.regex.test(rawText)) {
      claimedOrganizations.push(bp.name);
    }
  });

  const facts: ExtractedFact = {
    urls,
    phoneNumbers,
    emailAddresses,
    amounts,
    claimedOrganizations,
  };

  // 3. Indicator Detection
  const urgencyDetected = URGENCY_REGEX.test(rawText);
  const threatDetected = THREAT_SUSPENSION_REGEX.test(rawText);
  const explicitSafetyAdvice = /(?:never|do not|don't|will not|won't)\s+(?:ask\s+(?:you\s+)?(?:for|to share)|share|send|provide).{0,45}(?:password|pin|otp|one[-\s]time|verification code)/i.test(rawText);
  const paymentNegated = /(?:no|not)\s+payment\s+(?:is\s+)?required|payment\s+is\s+not\s+required/i.test(rawText);
  const paymentRequested = (PAYMENT_REGEX.test(rawText) || GIFT_CARD_PAYMENT_REGEX.test(rawText)) && !paymentNegated;
  const otpRequested = OTP_REGEX.test(rawText) && !explicitSafetyAdvice;
  const credentialRequested = CREDENTIAL_REGEX.test(rawText) && !explicitSafetyAdvice;
  const bankingInfoRequested = BANKING_INFO_REGEX.test(rawText);
  const personalInfoRequested = PERSONAL_INFO_REGEX.test(rawText);
  const unrealisticOfferDetected = UNREALISTIC_OFFER_REGEX.test(rawText);
  const impersonationDetected = claimedOrganizations.length > 0;
  const socialEngineeringDetected = (urgencyDetected || threatDetected) && (paymentRequested || credentialRequested || otpRequested);

  const indicators: MessageRiskIndicators = {
    urgencyDetected,
    threatDetected,
    paymentRequested,
    otpRequested,
    credentialRequested,
    bankingInfoRequested,
    personalInfoRequested,
    unrealisticOfferDetected,
    impersonationDetected,
    socialEngineeringDetected,
  };

  // 4. Generate Explainable Signals
  const signals: MessageAnalysisSignal[] = [];

  if (urgencyDetected) {
    signals.push({
      type: "ai_message_analysis",
      score: 75,
      confidence: 90,
      title: "Urgent pressure language",
      description: "The message pressures you to act immediately or within a strict time limit, a classic coercion technique.",
      evidence: "High-urgency phrasing detected",
      source: "Message Analysis Engine",
    });
  }

  if (threatDetected) {
    signals.push({
      type: "ai_message_analysis",
      score: 85,
      confidence: 92,
      title: "Account threat or legal intimidation",
      description: "The sender threatens account suspension, package detention, police, or legal repercussions to create anxiety.",
      evidence: "Threat / suspension keywords identified",
      source: "Message Analysis Engine",
    });
  }

  if (paymentRequested) {
    signals.push({
      type: "sensitive_information",
      score: 80,
      confidence: 88,
      title: "Immediate payment request",
      description: "The message instructs you to pay fees, customs duties, or deposits via unconventional or informal channels.",
      evidence: amounts.length > 0 ? `Amount: ${amounts[0].currency} ${amounts[0].value}` : "Payment requested",
      source: "Message Analysis Engine",
    });
  }

  if (otpRequested) {
    signals.push({
      type: "sensitive_information",
      score: 95,
      confidence: 98,
      title: "One-Time Password (OTP) request",
      description: "Never share an OTP. Legitimate institutions, couriers, and banks will NEVER ask for your OTP via message or phone.",
      evidence: "OTP / verification code solicitation",
      source: "Message Analysis Engine",
    });
  }

  if (credentialRequested || bankingInfoRequested) {
    signals.push({
      type: "sensitive_information",
      score: 90,
      confidence: 95,
      title: "Credential or banking information request",
      description: "Soliciting passwords, PINs, card numbers, or online banking access is a hallmark of credential harvesting phishing.",
      evidence: "Bank/Card/Password solicitation",
      source: "Message Analysis Engine",
    });
  }

  if (unrealisticOfferDetected) {
    signals.push({
      type: "ai_message_analysis",
      score: 80,
      confidence: 85,
      title: "Unrealistic reward, prize or job offer",
      description: "Promising unsolicited lottery winnings, free gifts, or unrealistic daily returns is indicative of advance-fee fraud.",
      evidence: "Prize / easy money patterns detected",
      source: "Message Analysis Engine",
    });
  }

  if (impersonationDetected && (paymentRequested || threatDetected || urgencyDetected)) {
    signals.push({
      type: "brand_impersonation",
      score: 85,
      confidence: 90,
      title: `Claimed organization: ${claimedOrganizations.join(", ")}`,
      description: `The communication claims to represent ${claimedOrganizations.join(", ")}, but couples it with urgent payment or verification demands.`,
      evidence: `Claimed entity: ${claimedOrganizations.join(", ")}`,
      source: "Brand Impersonation Engine",
    });
  }

  // Calculate score
  let score = 15;
  if (signals.length > 0) {
    // Weighted max calculation
    const scores = signals.map((s) => s.score);
    const highest = Math.max(...scores);
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    score = Math.min(100, Math.round(highest * 0.7 + avg * 0.3));
  }

  return {
    sanitizedText: sanitized,
    detectedLanguage,
    facts,
    indicators,
    signals,
    score,
  };
}
