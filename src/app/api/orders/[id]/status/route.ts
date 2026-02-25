import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { updateOrderStatus } from "@/lib/db";
import { sendSMS, SMS } from "@/lib/sms";
import type { OrderStatus } from "@/types/database.types";

/**
 * PATCH /api/orders/[id]/status
 *
 * Updates an order's status. Called by:
 *   - Restaurant portal: confirmed, preparing, ready_for_pickup, cancelled
 *   - Driver view: on_the_way, delivered
 *   - Operator admin: any transition + driver assignment
 *
 * RLS on the orders table enforces who can update what.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const serviceSupabase = createServiceClient();

  // Verify authentication
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const body = await request.json() as {
    status: OrderStatus;
    rejectionReason?: string;
    driverId?: string;
  };

  const { status, rejectionReason, driverId } = body;

  if (!status) {
    return NextResponse.json({ error: "status is required" }, { status: 400 });
  }

  // Fetch current order state (validates it exists and user can see it)
  const { data: currentOrder, error: fetchError } = await supabase
    .from("orders")
    .select("id, ref, status, delivery_phone, restaurant_id")
    .eq("id", params.id)
    .single();

  if (fetchError || !currentOrder) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Perform the status update (RLS enforced)
  try {
    await updateOrderStatus(supabase, params.id, status, {
      rejectionReason,
      driverId,
    });
  } catch (err) {
    console.error("Status update failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }

  // ── Side effects: send SMS notifications ─────────────────────────────────
  // Use service client for side effects (SMS sends don't need RLS)
  if (status === "cancelled" && currentOrder.delivery_phone && rejectionReason) {
    sendSMS(
      currentOrder.delivery_phone,
      SMS.orderRejected(currentOrder.ref, rejectionReason)
    ).catch(console.error);
  }

  if (status === "delivered" && currentOrder.delivery_phone) {
    const { data: restaurant } = await serviceSupabase
      .from("restaurants")
      .select("name")
      .eq("id", currentOrder.restaurant_id)
      .single();

    sendSMS(
      currentOrder.delivery_phone,
      SMS.orderDelivered(currentOrder.ref, restaurant?.name ?? "the restaurant")
    ).catch(console.error);
  }

  return NextResponse.json({ success: true, orderId: params.id, status });
}
