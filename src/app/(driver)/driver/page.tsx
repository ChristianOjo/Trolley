import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getDriverByProfileId, getOrdersForDriver, getDriverCompletedOrders } from "@/lib/db";
import { redirect } from "next/navigation";
import DriverViewClient from "@/components/driver/DriverViewClient";

export default async function DriverPage() {
  const { user } = await requireAuth("driver");
  const supabase = await createClient();

  const driver = await getDriverByProfileId(supabase, user.id);
  if (!driver) redirect("/auth/unauthorised");

  const [activeOrders, completedOrders] = await Promise.all([
    getOrdersForDriver(supabase, driver.id),
    getDriverCompletedOrders(supabase, driver.id),
  ]);

  return (
    <DriverViewClient
      driver={driver}
      initialActive={activeOrders}
      initialCompleted={completedOrders}
    />
  );
}
