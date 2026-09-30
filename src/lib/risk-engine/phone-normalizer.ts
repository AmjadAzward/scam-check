import crypto from "crypto";

export interface NormalizedPhone {
  raw: string;
  normalized: string; // E.164 standard, e.g. +94771234567
  isValid: boolean;
  countryCode: string;
  nationalNumber: string;
  displayFormatted: string; // e.g. +94 77 123 4567
  masked: string; // e.g. +94 77 •••• 567
  hash: string; // SHA256 of normalized string for indexing/matching
  networkOperator?: string; // Sri Lanka carrier identification (Dialog, Mobitel, etc.)
}

export function normalizePhoneNumber(input: string): NormalizedPhone {
  const raw = input.trim();
  // Strip all whitespace, hyphens, brackets, dots
  let digits = raw.replace(/[^\d+]/g, "");

  // Handle leading 00 (e.g. 0094771234567 -> +94771234567)
  if (digits.startsWith("00")) {
    digits = "+" + digits.slice(2);
  }

  let normalized = "";
  let countryCode = "";
  let nationalNumber = "";
  let isValid = false;
  let networkOperator: string | undefined;

  // Sri Lanka normalization rules
  // Standard SL numbers are 9 digits national (e.g. 77 123 4567)
  if (digits.startsWith("+94")) {
    const rest = digits.slice(3);
    if (rest.length === 9) {
      normalized = `+94${rest}`;
      countryCode = "94";
      nationalNumber = rest;
      isValid = true;
    } else if (rest.length === 10 && rest.startsWith("0")) {
      // e.g. +94 077 1234567
      normalized = `+94${rest.slice(1)}`;
      countryCode = "94";
      nationalNumber = rest.slice(1);
      isValid = true;
    }
  } else if (digits.startsWith("0") && digits.length === 10) {
    // Local 10-digit format: 077 123 4567
    normalized = `+94${digits.slice(1)}`;
    countryCode = "94";
    nationalNumber = digits.slice(1);
    isValid = true;
  } else if (digits.length === 9 && !digits.startsWith("+") && !digits.startsWith("0")) {
    // 9-digit direct format: 77 123 4567
    normalized = `+94${digits}`;
    countryCode = "94";
    nationalNumber = digits;
    isValid = true;
  } else if (digits.startsWith("+") && digits.length >= 8 && digits.length <= 16) {
    // International standard number
    normalized = digits;
    countryCode = digits.slice(1, 3);
    nationalNumber = digits.slice(3);
    isValid = true;
  } else {
    // Fallback if formatting is irregular
    normalized = digits.startsWith("+") ? digits : `+${digits}`;
    countryCode = "unknown";
    nationalNumber = digits;
    isValid = digits.length >= 7;
  }

  // Identify Sri Lanka operators if country code is 94
  if (countryCode === "94" && nationalNumber.length === 9) {
    const prefix = nationalNumber.slice(0, 2);
    switch (prefix) {
      case "77":
      case "76":
      case "74":
        networkOperator = "Dialog";
        break;
      case "71":
      case "70":
        networkOperator = "SLT-Mobitel";
        break;
      case "78":
      case "72":
        networkOperator = "Hutch";
        break;
      case "75":
        networkOperator = "Airtel";
        break;
      case "11":
      case "21":
      case "31":
      case "41":
      case "51":
      case "63":
      case "81":
        networkOperator = "Sri Lanka Fixed Line";
        break;
      default:
        networkOperator = "Sri Lanka Telecom";
    }
  }

  // Display formatting
  let displayFormatted = normalized;
  let masked = normalized;

  if (countryCode === "94" && nationalNumber.length === 9) {
    const p1 = nationalNumber.slice(0, 2);
    const p2 = nationalNumber.slice(2, 5);
    const p3 = nationalNumber.slice(5);
    const last3 = nationalNumber.slice(-3);
    displayFormatted = `+94 ${p1} ${p2} ${p3}`;
    masked = `+94 ${p1} •••• ${last3}`;
  } else if (normalized.startsWith("+") && normalized.length > 7) {
    const front = normalized.slice(0, 4);
    const back = normalized.slice(-3);
    displayFormatted = `${front} ${normalized.slice(4, -3)} ${back}`;
    masked = `${front} •••• ${back}`;
  }

  const hash = crypto.createHash("sha256").update(normalized.toLowerCase()).digest("hex");

  return {
    raw,
    normalized,
    isValid,
    countryCode,
    nationalNumber,
    displayFormatted,
    masked,
    hash,
    networkOperator,
  };
}
