/**
 * Manually test the webhook by simulating QStash call
 * Run: npx tsx scripts/test-webhook-manual.ts
 */

import * as dotenv from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

dotenv.config({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const QSTASH_CURRENT_SIGNING_KEY = process.env.QSTASH_CURRENT_SIGNING_KEY!;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testWebhook() {
  console.log("=".repeat(60));
  console.log("🧪 Testing Webhook with Manual Signature");
  console.log("=".repeat(60));

  // Step 1: Create test booking
  console.log("\n📝 Creating test booking...");

  const shop = await prisma.shop.findFirst({
    where: { slug: "demo-barbershop" },
    include: { services: true },
  });

  if (!shop) {
    console.log("❌ Demo shop not found");
    return;
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2);
  tomorrow.setHours(10, 0, 0, 0);

  const booking = await prisma.booking.create({
    data: {
      shopId: shop.id,
      serviceId: shop.services[0].id,
      customerName: "Test Customer",
      customerPhone: "081234567890",
      customerEmail: "test@test.com",
      bookingDate: tomorrow,
      bookingTime: "10:00",
      totalPrice: shop.services[0].price,
      status: "CONFIRMED",
    },
  });

  console.log(`✅ Created booking: ${booking.id}`);

  // Step 2: Create signature
  console.log("\n🔐 Creating signature...");

  const body = JSON.stringify({ bookingId: booking.id });
  const timestamp = Date.now();
  const url = `${APP_URL}/api/bookings/send-reminder`;

  // QStash signature format: t=timestamp:v1=signature
  const signaturePayload = `${timestamp}.${url}.${body}`;
  const signature = crypto
    .createHmac("sha256", QSTASH_CURRENT_SIGNING_KEY)
    .update(signaturePayload)
    .digest("base64");

  const upstashSignature = `t=${timestamp}:v1=${signature}`;

  console.log(`✅ Signature: ${upstashSignature.substring(0, 50)}...`);

  // Step 3: Call webhook
  console.log("\n📤 Calling webhook...");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "upstash-signature": upstashSignature,
      },
      body: body,
    });

    const result = await response.json();

    console.log(`Status: ${response.status}`);
    console.log(`Response:`, JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log("\n✅ Webhook executed successfully!");
    } else {
      console.log("\n❌ Webhook failed");
    }
  } catch (error) {
    console.log("\n❌ Request failed:");
    console.error(error);
  }

  // Step 4: Check database
  console.log("\n🔍 Checking database...");

  const updated = await prisma.booking.findUnique({
    where: { id: booking.id },
  });

  if (updated?.reminderSent) {
    console.log("✅ Reminder marked as sent!");
  } else {
    console.log("❌ Reminder NOT marked as sent");
  }

  // Cleanup
  console.log("\n🧹 Cleaning up...");
  await prisma.booking.delete({ where: { id: booking.id } });
  console.log("✅ Done");

  console.log("\n" + "=".repeat(60));
}

testWebhook()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
