import { createClient } from "@/lib/supabase/server";
import { getRestaurants, getDeliveryZones } from "@/lib/db";
import CustomerHome from "@/components/customer/CustomerHome";

export const revalidate = 60; // ISR: revalidate restaurant list every 60 seconds

export default async function HomePage() {
  const supabase = await createClient();
  const [restaurants, zones] = await Promise.all([
    getRestaurants(supabase),
    getDeliveryZones(supabase),
  ]);

  return <CustomerHome restaurants={restaurants} zones={zones} />;
}
