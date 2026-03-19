/**
 * Test the full QStash reminder flow
 *
 * Prerequisites:
 * 1. Dev server running: npm run dev
 * 2. QStash local running: npx @upstash/qstash-local
 *
 * Run: npx tsx scripts/test-reminder-flow.ts
 */

import { Client } from "@upstash/qstash";
import * as dotenv from "dotenv";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: resolve(__dirname, "../.env") });

const prisma = new PrismaClient();

const QSTASH_URL = process.env.QSTASH_URL;
const QSTASH_TOKEN = process.env.QSTASH_TOKEN;
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function testReminderFlow() {
  console.log("=".repeat(60));
  console.log("🧪 Testing QStash Reminder Flow");
  console.log("=".repeat(60));

  // Step 1: Check prerequisites
  console.log("\n📋 Step 1: Checking prerequisites...");

  if (!QSTASH_TOKEN) {
    console.log("❌ QSTASH_TOKEN not set");
    return;
  }
  console.log("  ✅ QSTASH_TOKEN set");

  // Check if dev server is running
  console.log(`\n  Checking dev server at ${APP_URL}...`);
  try {
    const response = await fetch(APP_URL);
    if (response.ok) {
      console.log("  ✅ Dev server is running");
    } else {
      console.log("  ⚠️ Dev server responded but may have issues");
    }
  } catch {
    console.log("  ❌ Dev server is NOT running!");
    console.log("     Please run: npm run dev");
    return;
  }

  // Step 2: Find or create test booking
  console.log("\n📝 Step 2: Setting up test data...");

  const shop = await prisma.shop.findFirst({
    where: { slug: "demo-barbershop" },
    include: { services: true },
  });

  if (!shop) {
    console.log("  ❌ Demo shop not found. Run: npx prisma db seed");
    return;
  }
  console.log(`  ✅ Found shop: ${shop.name}`);

  // Create a test booking for tomorrow (so reminder will be scheduled)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2); // 2 days from now
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
    include: { service: true, shop: true },
  });

  console.log(`  ✅ Created test booking: ${booking.id}`);
  console.log(`     Date: ${tomorrow.toDateString()}`);
  console.log(`     Time: 10:00`);

  // Step 3: Schedule reminder
  console.log("\n📤 Step 3: Scheduling reminder via QStash...");

  const client = new Client({
    token: QSTASH_TOKEN,
    baseUrl: QSTASH_URL,
  });

  // Schedule for 10 seconds from now (for testing)
  const reminderTime = Math.floor(Date.now() / 1000) + 10;
  const callbackUrl = `${APP_URL}/api/bookings/send-reminder`;

  console.log(`  Callback URL: ${callbackUrl}`);
  console.log(`  Reminder will trigger in: 10 seconds`);

  try {
    const result = await client.publishJSON({
      url: callbackUrl,
      body: { bookingId: booking.id },
      notBefore: reminderTime,
    });

    console.log(`  ✅ Reminder scheduled!`);
    console.log(`  Message ID: ${result.messageId}`);

    // Update booking with QStash message ID
    await prisma.booking.update({
      where: { id: booking.id },
      data: { qstashMessageId: result.messageId },
    });
  } catch (error) {
    console.log("  ❌ Failed to schedule reminder:");
    console.error(error);
    return;
  }

  // Step 4: Wait for reminder
  console.log("\n⏳ Step 4: Waiting for QStash to call webhook...");
  console.log("  (Watch your dev server console for logs)\n");

  for (let i = 10; i > 0; i--) {
    process.stdout.write(`\r  Waiting ${i} seconds... `);
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log("\n");

  // Step 5: Check result
  console.log("🔍 Step 5: Checking if reminder was sent...");

  const updatedBooking = await prisma.booking.findUnique({
    where: { id: booking.id },
  });

  if (updatedBooking?.reminderSent) {
    console.log("  ✅ Reminder was sent successfully!");
    console.log("     Check your WhatsApp (or dev console for log)");
  } else {
    console.log("  ⚠️ Reminder not marked as sent yet");
    console.log("     Check dev server logs for errors");
    console.log("     The webhook call may still be processing");
  }

  // Cleanup
  console.log("\n🧹 Cleaning up test booking...");
  await prisma.booking.delete({ where: { id: booking.id } });
  console.log("  ✅ Test booking deleted");

  console.log("\n" + "=".repeat(60));
  console.log("✅ Test completed!");
  console.log("=".repeat(60));
}

testReminderFlow()
  .catch(console.error)
  .finally(() => prisma.$disconnect());