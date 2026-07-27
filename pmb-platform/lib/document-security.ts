import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-gcm";
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_BYTE_LENGTH = 16;

/**
 * Get or derive the encryption key from environment variable.
 * Falls back to a development key if not set (for local dev only).
 */
function getEncryptionKey(): Buffer {
  const keyHex = process.env.DOCUMENT_ENCRYPTION_KEY;
  if (keyHex) {
    return Buffer.from(keyHex, "hex");
  }
  // Development fallback — generate deterministic key (DO NOT use in production)
  return crypto.scryptSync("pmb-dev-encryption-key-fallback-2026", "salt", KEY_LENGTH);
}

/**
 * Encrypt a buffer (file content) using AES-256-GCM.
 * Returns the encrypted data as a buffer with format: iv + authTag + ciphertext
 */
export function encryptFile(buffer: Buffer): Buffer {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTE_LENGTH,
  });

  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  const authTag = cipher.getAuthTag();

  // Format: iv (16 bytes) + authTag (16 bytes) + ciphertext (variable)
  return Buffer.concat([iv, authTag, encrypted]);
}

/**
 * Decrypt a buffer that was encrypted with encryptFile().
 * Returns the original plaintext buffer.
 */
export function decryptFile(encryptedBuffer: Buffer): Buffer {
  const key = getEncryptionKey();

  // Parse format: iv (16) + authTag (16) + ciphertext
  const iv = encryptedBuffer.subarray(0, IV_LENGTH);
  const authTag = encryptedBuffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_BYTE_LENGTH);
  const ciphertext = encryptedBuffer.subarray(IV_LENGTH + AUTH_TAG_BYTE_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_BYTE_LENGTH,
  });
  decipher.setAuthTag(authTag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}

/**
 * Generate a signed URL with expiration time for document access.
 * The signature is HMAC-SHA256 over the file path and expiration timestamp.
 */
export function generateSignedUrl(
  filePath: string,
  expiresInMinutes: number = 60
): string {
  const secret = process.env.DOCUMENT_SIGNING_SECRET || "pmb-dev-signing-secret-2026";
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInMinutes * 60;

  const dataToSign = `${filePath}:${expiresAt}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("hex");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3020";
  const encodedPath = encodeURIComponent(filePath);

  return `${baseUrl}/api/applicants/documents/${encodedPath}?expires=${expiresAt}&sig=${signature}`;
}

/**
 * Verify a signed URL.
 * Returns the file path if valid, or null if expired/invalid.
 */
export function verifySignedUrl(
  filePath: string,
  expiresAt: string,
  signature: string
): boolean {
  const secret = process.env.DOCUMENT_SIGNING_SECRET || "pmb-dev-signing-secret-2026";

  // Check expiration
  const now = Math.floor(Date.now() / 1000);
  const exp = parseInt(expiresAt, 10);
  if (isNaN(exp) || now > exp) {
    return false;
  }

  // Verify signature
  const dataToSign = `${filePath}:${exp}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(dataToSign)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * Get the storage path for a document.
 * Documents are stored in the filesystem under a configurable directory.
 */
export function getDocumentStoragePath(filename: string): string {
  const basePath = process.env.DOCUMENT_STORAGE_PATH || "./uploads/documents";
  // Sanitize filename to prevent path traversal
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `${basePath}/${sanitized}`;
}
