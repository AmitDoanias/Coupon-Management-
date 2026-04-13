/**
 * AES-256-GCM encryption for sensitive coupon fields (card number, expiry, CVV).
 * Runs server-side only — never imported into client components.
 *
 * Requires ENCRYPTION_KEY env variable: 64-character hex string (32 bytes).
 * Generate with:  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
 */

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
  const hex = process.env.ENCRYPTION_KEY ?? "";
  if (hex.length !== 64) {
    throw new Error(
      "ENCRYPTION_KEY must be a 64-character hex string. " +
      "Generate one with: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
    );
  }
  return Buffer.from(hex, "hex");
}

/**
 * Encrypts a plaintext string.
 * Returns a colon-separated string: <iv_hex>:<authTag_hex>:<ciphertext_hex>
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = randomBytes(12); // 96-bit IV recommended for GCM
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 128-bit authentication tag
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted.toString("hex")}`;
}

/**
 * Decrypts a string produced by encrypt().
 * If decryption fails (e.g. legacy plain-text data), returns the value as-is.
 */
export function decrypt(encoded: string): string {
  const parts = encoded.split(":");
  if (parts.length !== 3) return encoded; // not encrypted — legacy plain text

  const [ivHex, authTagHex, ciphertextHex] = parts;
  try {
    const key = getKey();
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const ciphertext = Buffer.from(ciphertextHex, "hex");
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    return decipher.update(ciphertext).toString("utf8") + decipher.final("utf8");
  } catch {
    return encoded; // fallback for legacy plain-text values
  }
}

/** Encrypts only if the value is present. */
export function encryptField(value: string | undefined): string | undefined {
  return value ? encrypt(value) : undefined;
}

/** Decrypts only if the value is present. */
export function decryptField(value: string | undefined): string | undefined {
  return value ? decrypt(value) : undefined;
}
