/**
 * Privacy and Data Protection Masking Utilities
 * Detects and automatically masks sensitive data before persistence or display
 */

// Mask Credit/Debit Card Numbers (13 to 19 digits)
export function maskCreditCard(text: string): string {
  return text.replace(
    /\b(?:\d{4}[- ]?){3}\d{1,4}\b|\b\d{13,19}\b/g,
    (match) => {
      const clean = match.replace(/[- ]/g, "");
      if (clean.length < 13 || clean.length > 19) return match;
      const last4 = clean.slice(-4);
      return `•••• •••• •••• ${last4}`;
    }
  );
}

// Mask CVV / CVC (3-4 digits in context of card or security code)
export function maskCvv(text: string): string {
  return text.replace(/(?:cvv|cvc|security\s*code|cvn)[\s:=]+([0-9]{3,4})/gi, (match, cvv) => {
    return match.replace(cvv, "•••");
  });
}

// Mask OTP / Verification Codes (4-8 digits when mentioned near OTP, code, pin)
export function maskOtp(text: string): string {
  return text.replace(
    /(?:otp|one[-\s]time\s*password|verification\s*code|auth\s*code|pin\s*code|security\s*code|රහස්\s*අංක|கடவுச்சொல்)(?:[^\d\n]{1,20})([0-9]{4,8})\b/gi,
    (match, code) => {
      return match.replace(code, "••••••");
    }
  );
}

// Mask Sri Lankan National Identity Card (NIC) numbers
// Old format: 9 digits + V/X (e.g. 912345678V)
// New format: 12 digits (e.g. 199123456789)
export function maskNationalId(text: string): string {
  // Old NIC
  let result = text.replace(/\b(\d{2})(\d{6,7})([vVxX])\b/g, (match, prefix, middle, suffix) => {
    return `${prefix}••••••${suffix.toUpperCase()}`;
  });
  // New NIC
  result = result.replace(/\b(\d{4})(\d{6})(\d{2})\b/g, (match, prefix, middle, suffix) => {
    return `${prefix}••••••${suffix}`;
  });
  return result;
}

// Mask Bank Account Numbers (8-16 digits when near account/acc keywords)
export function maskBankAccount(text: string): string {
  return text.replace(/(?:account|acc|acct|ගිණුම්|கணக்கு)[\s#:=]+([0-9]{8,16})/gi, (match, acc) => {
    const last3 = acc.slice(-3);
    return match.replace(acc, `••••${last3}`);
  });
}

// Mask Phone Numbers for Community Display
// E.g. +94 77 123 4567 -> +94 77 •••• 567
export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/[^\d+]/g, "");
  if (clean.length < 8) return phone;

  if (clean.startsWith("+94")) {
    const area = clean.slice(3, 5); // e.g. 77
    const last3 = clean.slice(-3);
    return `+94 ${area} •••• ${last3}`;
  } else if (clean.startsWith("0")) {
    const area = clean.slice(1, 3);
    const last3 = clean.slice(-3);
    return `0${area} •••• ${last3}`;
  }

  // Generic fallback
  const first2 = clean.slice(0, 3);
  const last2 = clean.slice(-3);
  return `${first2} •••• ${last2}`;
}

// Mask URLs for Safe Preview (defangs and obfuscates sensitive queries)
export function maskUrl(urlStr: string): string {
  try {
    const u = new URL(urlStr.startsWith("http") ? urlStr : `https://${urlStr}`);
    const host = u.hostname;
    const parts = host.split(".");
    let maskedHost = host;
    if (parts.length >= 2) {
      const name = parts[parts.length - 2];
      if (name.length > 4) {
        maskedHost = host.replace(name, `${name.slice(0, 3)}••••`);
      }
    }
    return `${u.protocol}//${maskedHost}${u.pathname.length > 1 ? u.pathname.slice(0, 10) + "..." : ""}`;
  } catch {
    return urlStr.replace(/([a-zA-Z0-9]{4})[a-zA-Z0-9]+(\.[a-zA-Z]{2,})/g, "$1••••$2");
  }
}

// Master sanitizer: Masks all sensitive credential and financial data in raw text
export function sanitizeSensitiveText(text: string): string {
  if (!text) return "";
  let clean = text;
  clean = maskCreditCard(clean);
  clean = maskCvv(clean);
  clean = maskOtp(clean);
  clean = maskNationalId(clean);
  clean = maskBankAccount(clean);
  return clean;
}
