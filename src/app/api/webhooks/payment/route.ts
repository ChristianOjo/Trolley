import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendSMS } from "@/lib/sms";

/**
 * POST /api/webhooks/payment
 *
 * Peach Payments calls this endpoint after a transaction completes.
 * We use the service-role client (bypasses RLS) because this is a
 * trusted server-to-server call.
 *
 * IMPORTANT: Validate the webhook signature in production.
 * Peach Payments sends a checksum header — always verify it.
 */
export async function POST(request: NextRequest) {
  const supabase = createServiceClient();

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    id: paymentRef,         // Peach Payments transaction ID
    result,                 // { code: "000.100.110", description: "..." }
    merchantTransactionId,  // Our order ID, passed to Peach at checkout initiation
  } = body;

  if (!merchantTransactionId) {
    return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
  }

  // Peach success codes start with "000." or "000.000."
  const isSuccess = result?.code?.startsWith("000.");

  if (isSuccess) {
    // ── Mark order as placed ───────────────────────────────────────────────
    const { data: order, error } = await supabase
      .from("orders")
      .update({
        status: "placed",
        payment_status: "success",
        payment_ref: paymentRef,
      })
      .eq("id", merchantTransactionId)
      .eq("status", "payment_pending")   // Idempotency guard — only update if still pending
      .select()
      .single();

    if (error || !order) {
      console.error("Order update failed:", error);
      return NextResponse.json({ error: "Order not found or already processed" }, { status: 404 });
    }

    // ── Get restaurant name for SMS ────────────────────────────────────────
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("name")
      .eq("id", order.restaurant_id)
      .single();

    // ── Send confirmation SMS to customer ──────────────────────────────────
    const smsPhone = order.delivery_phone;
    if (smsPhone) {
      await sendSMS(
        smsPhone,
        `✅ Trolley: Your order ${order.ref} from ${restaurant?.name ?? "the restaurant"} is confirmed! ` +
        `Estimated delivery: ${30}–${45} minutes. Track at: trolley.sz/track/${order.id}`
      ).catch(console.error); // Don't fail the webhook if SMS fails
    }

    // ── Notify restaurant via Supabase Realtime ────────────────────────────
    // The restaurant portal is subscribed to orders table changes —
    // the status update above will trigger their realtime listener automatically.

    return NextResponse.json({ received: true, orderId: order.id });
  } else {
    // ── Payment failed ─────────────────────────────────────────────────────
    await supabase
      .from("orders")
      .update({ payment_status: "failed" })
      .eq("id", merchantTransactionId)
      .eq("status", "payment_pending");

    return NextResponse.json({ received: true, status: "payment_failed" });
  }
}
