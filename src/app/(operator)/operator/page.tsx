import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getAllOrders, getRestaurants, getDrivers, getDeliveryZones } from "@/lib/db";
import OperatorAdminClient from "@/components/operator/OperatorAdminClient";

export default async function OperatorPage() {
  await requireAuth("operator");
  const supabase = await createClient();

  const [orders, restaurants, drivers, zones] = await Promise.all([
    getAllOrders(supabase),
    getRestaurants(supabase).catch(() => []), // include inactive via service client in real use
    getDrivers(supabase),
    getDeliveryZones(supabase),
  ]);

  // Also get inactive restaurants for full operator view
  const { data: allRestaurants } = await supabase
    .from("restaurants")
    .select("*")
    .order("name");

  return (
    <OperatorAdminClient
      initialOrders={orders}
      initialRestaurants={allRestaurants ?? restaurants}
      initialDrivers={drivers}
      initialZones={zones}
    />
  );
}
