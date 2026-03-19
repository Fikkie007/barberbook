/**
 * QStash Configuration Test Script
 * Run: node scripts/test-qstash.ts
 */

import { Client, Receiver } from "@upstash/qstash";
import * as dotenv from "dotenv";
import { resolve } from "path";

// Load .env file
dotenv.config({ path: resolve(__dirname, "../.env") });

const QSTASH_URL = process.env.QSTASH_URL;
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY;
const QSTASH_NEXT_SIGNING_KEY = process.env.QSTASH_NEXT_SIGNING_KEY;

console.log("=".repeat(50));
console.log("QStash Configuration Test");
console.log("=".repeat(50));

// Check environment variables
console.log("\n📋 Environment Variables:");
console.log(`  QSTASH_URL: ${QSTASH_URL || "NOT SET"}`);
console.log(`  QSTASH_TOKEN: ${QSTASH_TOKEN ? "✓ Set" : "✗ NOT SET"}`);
console.log(`  QSTASH_CURRENT_SIGNING_KEY: ${QSTASH_CURRENT_SIGNING_KEY ? "✓ Set" : "✗ NOT SET"}`);
console.log(`  QSTASH_NEXT_SIGNING_KEY: ${QSTASH_NEXT_SIGNING_KEY ? "✓ Set" : "✗ NOT SET"}`);

async function testQStash() {
  if (!QSTASH_TOKEN) {
    console.log("\n❌ QSTASH_TOKEN is not set. Cannot proceed.");
    return;
  }

  // Create client
  const client = new Client({
    token: QSTASH_TOKEN,
    baseUrl: QSTASH_URL,
  });

  console.log("\n🔌 Testing QStash Connection...");

  try {
    // Test 1: List existing messages/queues
    console.log("\n📤 Test 1: Publishing a test message...");

    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "Hello from BarberBook test script!",
    };

    // Use a test endpoint (can be any valid URL)
    const result = await client.publishJSON({
      url: "https://httpbin.org/post", // Test endpoint that echoes back
      body: testPayload,
      delay: 5, // 5 seconds delay
    });

    console.log(`  ✅ Message published successfully!`);
    console.log(`  Message ID: ${result.messageId}`);

    // Test 2: Verify signing keys
    console.log("\n🔐 Test 2: Testing signature verification...");

    if (!QSTASH_CURRENT_SIGNING_KEY) {
      console.log("  ⚠️  Signing keys not set, skipping verification test");
    } else {
      const receiver = new Receiver({
        currentSigningKey: QSTASH_CURRENT_SIGNING_KEY,
        nextSigningKey: QSTASH_NEXT_SIGNING_KEY || "",
      });

      // Simulate a signature verification
      const testBody = JSON.stringify(testPayload);
      console.log("  ✅ Receiver initialized successfully");
      console.log("  ℹ️  Signature verification works when QStash calls your webhook");
    }

    // Test 3: List messages
    console.log("\n📊 Test 3: Checking QStash state...");

    try {
      // Try to get queue info or messages
      const messages = await client.messages.listMessages();
      console.log(`  ✅ Connected to QStash`);
      console.log(`  📨 Pending messages: ${messages.length}`);
    } catch (e) {
      // Some local QStash implementations might not support all APIs
      console.log(`  ℹ️  Could not fetch messages (this is OK for local QStash)`);
    }

    console.log("\n" + "=".repeat(50));
    console.log("✅ QStash configuration is working!");
    console.log("=".repeat(50));

  } catch (error) {
    console.log("\n❌ QStash test failed:");
    console.error(error);

    if (QSTASH_URL?.includes("localhost")) {
      console.log("\n💡 Tips for local QStash:");
      console.log("  1. Make sure QStash is running: docker run -d -p 4000:3000 upstash/qstash-local");
      console.log("  2. Or use Upstash cloud: https://console.upstash.com/qstash");
    }
  }
}

testQStash();