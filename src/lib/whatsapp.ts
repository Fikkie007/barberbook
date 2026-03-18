interface WhatsAppMessage {
  target: string;
  message: string;
  countryCode?: string;
}

interface FonnteResponse {
  status: boolean;
  reason?: string;
  data?: {
    id: string;
    phone: string;
    status: string;
  };
}

const FONNTE_API_KEY = process.env.FONNTE_API_KEY;
const FONNTE_API_URL = process.env.FONNTE_API_URL || "https://api.fonnte.com/send";

export async function sendWhatsAppMessage({
  target,
  message,
  countryCode = "62",
}: WhatsAppMessage): Promise<FonnteResponse> {
  // If no API key, simulate success for development
  if (!FONNTE_API_KEY || FONNTE_API_KEY === "your-fonnte-api-key") {
    console.log("[DEV] WhatsApp message would be sent:", { target, message });
    return { status: true, data: { id: "dev-id", phone: target, status: "sent" } };
  }

  try {
    const response = await fetch(FONNTE_API_URL, {
      method: "POST",
      headers: {
        Authorization: FONNTE_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        target,
        message,
        countryCode,
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("WhatsApp API error:", error);
    return { status: false, reason: "API request failed" };
  }
}

// Message templates
export function generateBookingConfirmationMessage(data: {
  customerName: string;
  shopName: string;
  serviceName: string;
  barberName?: string;
  date: string;
  time: string;
  price: number;
}): string {
  return `💈 *KONFIRMASI BOOKING*

Halo ${data.customerName}!

Booking Anda di *${data.shopName}* telah diterima:

📅 Tanggal: ${data.date}
⏰ Waktu: ${data.time}
✂️ Layanan: ${data.serviceName}
${data.barberName ? `👨 Barber: ${data.barberName}` : ""}
💰 Total: Rp ${data.price.toLocaleString("id-ID")}

Harap datang 10 menit sebelum jadwal. Terima kasih! 🙏`;
}

export function generateBookingReminderMessage(data: {
  customerName: string;
  shopName: string;
  serviceName: string;
  time: string;
}): string {
  return `⏰ *PENGINGAT BOOKING*

Halo ${data.customerName}!

Ini adalah pengingat bahwa Anda memiliki booking besok:

💈 ${data.shopName}
✂️ ${data.serviceName}
⏰ ${data.time}

Jangan lupa ya! Terima kasih 🙏`;
}

export function generateBookingCompletedMessage(data: {
  customerName: string;
  shopName: string;
  serviceName: string;
}): string {
  return `✨ *TERIMA KASIH*

Halo ${data.customerName}!

Terima kasih telah berkunjung ke *${data.shopName}* untuk layanan ${data.serviceName}.

Semoga puas dengan hasilnya! Jangan lupa untuk booking lagi ya 💈

_Kritik & saran sangat kami harapkan untuk meningkatkan pelayanan._`;
}

export function generateBookingCancelledMessage(data: {
  customerName: string;
  shopName: string;
  date: string;
  time: string;
}): string {
  return `❌ *BOOKING DIBATALKAN*

Halo ${data.customerName},

Maaf, booking Anda di *${data.shopName}*:
📅 ${data.date} pukul ${data.time}

Telah dibatalkan. Silakan booking ulang jika ingin mengatur jadwal baru.

Terima kasih 🙏`;
}