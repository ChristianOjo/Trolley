import { createClient } from "@/lib/supabase/server";
import { getOrderById } from "@/lib/db";
import { notFound } from "next/navigation";
import OrderTracker from "@/components/customer/OrderTracker";

export default async function TrackPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const order = await getOrderById(supabase, params.id);
  if (!order) notFound();

  const { data: items } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", params.id);

  return <OrderTracker order={order} items={items ?? []} />;
}
