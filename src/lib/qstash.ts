import { Client } from "@upstash/qstash";

const QSTASH_TOKEN = process.env.QSTASH_TOKEN;

if (!QSTASH_TOKEN) {
  console.warn("QSTASH_TOKEN not configured - reminder scheduling will be disabled");
}

export const qstashClient = QSTASH_TOKEN ? new Client({ token: QSTASH_TOKEN }) : null;

/**
 * Schedule a WhatsApp reminder for a booking
 * @param bookingId - The booking ID
 * @param scheduledTime - Unix timestamp (seconds) when to send the reminder
 * @returns QStash message ID or null if scheduling fails
 */
export async function scheduleBookingReminder(
  bookingId: string,
  scheduledTime: number
): Promise<string | null> {
  if (!qstashClient) {
    console.log("[DEV] QStash not configured - reminder scheduling skipped");
    return null;
  }

  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/send-reminder`;

    const result = await qstashClient.publishJSON({
      url: callbackUrl,
      body: { bookingId },
      notBefore: scheduledTime,
    });

    console.log(
      `[QStash] Scheduled reminder for booking ${bookingId} at ${new Date(scheduledTime * 1000).toISOString()}`
    );
    return result.messageId;
  } catch (error) {
    console.error("[QStash] Failed to schedule reminder:", error);
    return null;
  }
}

/**
 * Calculate the reminder time (24 hours before appointment)
 * @param bookingDate - The booking date
 * @param bookingTime - The booking time in "HH:mm" format
 * @returns Unix timestamp in seconds, or null if appointment is too soon
 */
export function calculateReminderTime(
  bookingDate: Date,
  bookingTime: string
): number | null {
  // Parse booking time (format: "HH:mm")
  const [hours, minutes] = bookingTime.split(":").map(Number);

  // Create appointment datetime
  const appointmentDate = new Date(bookingDate);
  appointmentDate.setHours(hours, minutes, 0, 0);

  // Calculate reminder time (24 hours before)
  const reminderDate = new Date(appointmentDate.getTime() - 24 * 60 * 60 * 1000);

  // Check if reminder time is in the past
  const now = new Date();
  if (reminderDate <= now) {
    console.log(
      `[QStash] Reminder time is in the past for appointment at ${appointmentDate.toISOString()}`
    );
    return null;
  }

  // Return Unix timestamp in seconds
  return Math.floor(reminderDate.getTime() / 1000);
}