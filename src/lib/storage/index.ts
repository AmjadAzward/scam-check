import fs from "fs";
import path from "path";
import crypto from "crypto";

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

  // Generate unique, unpredictable storage key
  const ext = path.extname(originalName) || ".png";
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
  const secret = process.env.NEXTAUTH_SECRET || "scamcheck-temp-secret";
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
  const secret = process.env.NEXTAUTH_SECRET || "scamcheck-temp-secret";
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${safeKey}:${expires}`)
    .digest("hex");

  return signature === expectedSig;
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
