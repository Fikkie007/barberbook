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
  if (!process.env.QSTASH_CURRENT_SIGNING_KEY) {
    console.warn("[DEV] QStash signature verification skipped - keys not configured");
    return true;
  }

  // TEMPORARY: Skip verification for local QStash testing
  if (process.env.QSTASH_URL?.includes("localhost")) {
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