/**
 * SMS via Africa's Talking
 * Docs: https://developers.africastalking.com/docs/sms/sending
 *
 * All SMS notifications in Trolley flow through this module.
 * Africa's Talking covers Eswatini and has affordable rates.
 */

const AT_BASE_URL = "https://api.africastalking.com/version1/messaging";

/**
 * Send an SMS to one or more recipients.
 * @param to - E.164 format: +26876XXXXXXX
 * @param message - Max 160 chars for single SMS, longer is auto-split
 */
export async function sendSMS(to: string | string[], message: string): Promise<void> {
  const recipients = Array.isArray(to) ? to.join(",") : to;

  const response = await fetch(AT_BASE_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
      apiKey: process.env.AFRICASTALKING_API_KEY!,
    },
    body: new URLSearchParams({
      username: process.env.AFRICASTALKING_USERNAME ?? "trolley",
      to: recipients,
      message,
      from: "Trolley",   // Requires alphanumeric sender ID registration with AT
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Africa's Talking SMS failed: ${response.status} ${text}`);
  }
}

// ── Pre-defined SMS templates ─────────────────────────────────────────────

export const SMS = {
  orderConfirmed: (ref: string, restaurantName: string, orderId: string) =>
    `✅ Trolley: Order ${ref} from ${restaurantName} confirmed! Est. 30–45 min. Track: trolley.sz/track/${orderId}`,

  orderRejected: (ref: string, reason: string) =>
    `❌ Trolley: Sorry, order ${ref} was rejected. Reason: ${reason}. Your refund will be processed within 24 hours.`,

  orderDelivered: (ref: string, restaurantName: string) =>
    `🎉 Trolley: Your order ${ref} from ${restaurantName} has been delivered. Enjoy your meal!`,
};
