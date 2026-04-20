"use client";

import { useState, useEffect } from "react";
import { BlockedSlot } from "@/types";

export function useBarberAvailability(
  barberId: string | undefined,
  bookingDate: Date | undefined
): BlockedSlot[] {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function fetchBlockedSlots() {
      if (!barberId || !bookingDate) {
        return [];
      }

      try {
        // Format date as YYYY-MM-DD (local date string, not ISO UTC)
        const year = bookingDate.getFullYear();
        const month = String(bookingDate.getMonth() + 1).padStart(2, "0");
        const day = String(bookingDate.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;

        const response = await fetch(
          `/api/bookings/barber-availability?barberId=${barberId}&date=${dateStr}`
        );
        const data = await response.json();
        if (response.ok && isMounted) {
          return data.blockedSlots;
        }
      } catch (err) {
        console.error("Failed to fetch barber availability:", err);
      }
      return [];
    }

    fetchBlockedSlots().then((slots) => {
      if (isMounted) {
        setBlockedSlots(slots);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [barberId, bookingDate]);

  return blockedSlots;
}

export function isTimeSlotAvailable(
  time: string,
  duration: number,
  blockedSlots: BlockedSlot[],
  selectedDate: Date | undefined,
  now: Date = new Date()
): boolean {
  if (!selectedDate) return true;

  // If selected date is today, check if time has passed
  const isToday =
    selectedDate.getFullYear() === now.getFullYear() &&
    selectedDate.getMonth() === now.getMonth() &&
    selectedDate.getDate() === now.getDate();

  if (isToday) {
    const [hour, min] = time.split(":").map(Number);
    const slotTime = new Date(selectedDate);
    slotTime.setHours(hour, min, 0, 0);
    if (slotTime <= now) return false;
  }

  // Check for barber conflicts
  if (blockedSlots.length > 0) {
    const slotStartMinutes =
      parseInt(time.split(":")[0]) * 60 + parseInt(time.split(":")[1]);
    const slotEndMinutes = slotStartMinutes + duration;

    for (const blocked of blockedSlots) {
      if (slotStartMinutes < blocked.end && slotEndMinutes > blocked.start) {
        return false;
      }
    }
  }

  return true;
}