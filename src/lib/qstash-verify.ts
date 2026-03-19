import { Receiver } from "@upstash/qstash";

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY || "",
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY || "",
});

/**
 * Verify QStash request signature
 * @param signature - The signature from request header
 * @param body - The request body as string
 * @returns true if signature is valid
 */
export async function verifyQStashSignature(
  signature: string,
  body: string
): Promise<boolean> {
  // Skip verification in development if keys not configured
  // NEVER skip in production - misconfigured keys will cause verification to fail
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY) {
    if (process.env.NODE_ENV === "production") {
      console.error("[QStash] Missing signing key in production - verification will fail");
      return false;
    }
    console.warn("[DEV] QStash signature verification skipped - keys not configured");
    return true;
  }

  // Skip verification for local QStash testing (only in non-production)
  if (process.env.QSTASH_URL?.includes("localhost")) {
    if (process.env.NODE_ENV === "production") {
      console.error("[QStash] localhost URL detected in production - verification will fail");
      return false;
    }
    console.warn("[DEV] QStash signature verification skipped - local QStash");
    return true;
  }

  try {
    await receiver.verify({
      signature,
      body,
    });
    return true;
  } catch (error) {
    console.error("[QStash] Signature verification failed:", error);
    return false;
  }
}