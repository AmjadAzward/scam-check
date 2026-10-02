import crypto from "crypto";
import { requireServerSecret } from "./secrets";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function generateTotpSecret(): string {
  const bytes = crypto.randomBytes(20);
  let bits = "";
  for (let index = 0; index < bytes.length; index += 1) bits += bytes[index].toString(2).padStart(8, "0");
  let result = "";
  for (let index = 0; index < bits.length; index += 5) result += ALPHABET[parseInt(bits.slice(index, index + 5).padEnd(5, "0"), 2)];
  return result;
}

function decodeBase32(value: string): Buffer {
  const bits = value.replace(/=+$/, "").toUpperCase().split("").map((char) => ALPHABET.indexOf(char).toString(2).padStart(5, "0")).join("");
  const bytes: number[] = [];
  for (let index = 0; index + 8 <= bits.length; index += 8) bytes.push(parseInt(bits.slice(index, index + 8), 2));
  return Buffer.from(bytes);
}

export function generateTotpCode(secret: string, at = Date.now()): string {
  const counter = Math.floor(at / 30_000);
  const buffer = Buffer.alloc(8);
  buffer.writeBigUInt64BE(BigInt(counter));
  const digest = crypto.createHmac("sha1", decodeBase32(secret)).update(buffer).digest();
  const offset = digest[digest.length - 1] & 15;
  const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000;
  return value.toString().padStart(6, "0");
}

export function verifyTotp(secret: string, token: string): boolean {
  if (!/^\d{6}$/.test(token)) return false;
  const counter = Math.floor(Date.now() / 30_000);
  return [-1, 0, 1].some((offset) => crypto.timingSafeEqual(Buffer.from(generateTotpCode(secret, (counter + offset) * 30_000)), Buffer.from(token)));
}

function encryptionKey() { return crypto.createHash("sha256").update(requireServerSecret("NEXTAUTH_SECRET")).digest(); }

export function encryptTotpSecret(secret: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secret, "utf8"), cipher.final()]);
  return [iv, cipher.getAuthTag(), encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptTotpSecret(payload: string): string {
  const [iv, tag, encrypted] = payload.split(".").map((part) => Buffer.from(part, "base64url"));
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function generateRecoveryCodes(): { plain: string[]; hashes: string[] } {
  const plain = Array.from({ length: 8 }, () => `${crypto.randomBytes(4).toString("hex").slice(0, 4)}-${crypto.randomBytes(4).toString("hex").slice(0, 4)}`);
  return { plain, hashes: plain.map((code) => crypto.createHash("sha256").update(code).digest("hex")) };
}

export function hashRecoveryCode(code: string) { return crypto.createHash("sha256").update(code.trim().toLowerCase()).digest("hex"); }
