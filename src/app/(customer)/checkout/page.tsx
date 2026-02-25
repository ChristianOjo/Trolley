import CheckoutClient from "@/components/customer/CheckoutClient";
import { createClient } from "@/lib/supabase/server";
import { getDeliveryZones } from "@/lib/db";

export default async function CheckoutPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const zones = await getDeliveryZones(supabase);

  let profile = null;
  if (user) {
    const { data } = await supabase.from("profiles").select("full_name, phone").eq("id", user.id).single();
    profile = data;
  }

  return <CheckoutClient zones={zones} user={user} profile={profile} />;
}
