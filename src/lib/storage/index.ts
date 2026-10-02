import fs from "fs";
import path from "path";
import crypto from "crypto";
import { requireServerSecret } from "@/lib/security/secrets";

const UPLOAD_DIR = path.join(process.cwd(), "private_uploads");

// Ensure private upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export interface UploadedFileResult {
  storageKey: string;
  mimeType: string;
  originalName: string;
  sizeBytes: number;
}

/**
 * Saves uploaded file securely to private storage
 */
export async function savePrivateFile(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<UploadedFileResult> {
  // Validate allowed extensions and mime types
  const allowedMime = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowedMime.includes(mimeType.toLowerCase())) {
    throw new Error("Invalid file type. Only JPG, PNG, and WEBP images up to 10MB are permitted.");
  }

  // 10MB size limit check
  if (buffer.length > 10 * 1024 * 1024) {
    throw new Error("File exceeds maximum allowed size of 10MB.");
  }

  const isJpeg = buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const isWebp = buffer.length >= 12 && buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP";
  const signatureMatches =
    ((mimeType === "image/jpeg" || mimeType === "image/jpg") && isJpeg) ||
    (mimeType === "image/png" && isPng) ||
    (mimeType === "image/webp" && isWebp);
  if (!signatureMatches) {
    throw new Error("The uploaded file content does not match its declared image type.");
  }

  // Generate unique, unpredictable storage key
  const ext = isJpeg ? ".jpg" : isPng ? ".png" : ".webp";
  const randomKey = crypto.randomBytes(24).toString("hex") + ext;
  const targetPath = path.join(UPLOAD_DIR, randomKey);

  await fs.promises.writeFile(targetPath, buffer);

  return {
    storageKey: randomKey,
    mimeType,
    originalName,
    sizeBytes: buffer.length,
  };
}

/**
 * Deletes a file from private storage permanently
 */
export async function deletePrivateFile(storageKey: string): Promise<boolean> {
  try {
    const safeKey = path.basename(storageKey);
    const targetPath = path.join(UPLOAD_DIR, safeKey);
    if (fs.existsSync(targetPath)) {
      await fs.promises.unlink(targetPath);
      return true;
    }
  } catch (err) {
    console.error("Failed to delete private file:", err);
  }
  return false;
}

/**
 * Generates a temporary signed URL for safe, restricted-time viewing
 */
export function generateSignedFileUrl(storageKey: string, expiresInSeconds: number = 300): string {
  const safeKey = path.basename(storageKey);
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const secret = requireServerSecret("NEXTAUTH_SECRET");
  const signature = crypto
    .createHmac("sha256", secret)
    .update(`${safeKey}:${expiresAt}`)
    .digest("hex");

  return `/api/upload?key=${encodeURIComponent(safeKey)}&expires=${expiresAt}&sig=${signature}`;
}

/**
 * Verifies a signed URL request
 */
export function verifySignedUrl(storageKey: string, expires: number, signature: string): boolean {
  if (Math.floor(Date.now() / 1000) > expires) {
    return false; // Expired
  }
  const safeKey = path.basename(storageKey);
  const secret = requireServerSecret("NEXTAUTH_SECRET");
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${safeKey}:${expires}`)
    .digest("hex");

  if (signature.length !== expectedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));
}

/**
 * Reads the raw private file buffer
 */
export async function getPrivateFileBuffer(storageKey: string): Promise<Buffer | null> {
  try {
    const safeKey = path.basename(storageKey);
    const targetPath = path.join(UPLOAD_DIR, safeKey);
    if (fs.existsSync(targetPath)) {
      return await fs.promises.readFile(targetPath);
    }
  } catch (err) {
    console.error("Error reading file buffer:", err);
  }
  return null;
}
