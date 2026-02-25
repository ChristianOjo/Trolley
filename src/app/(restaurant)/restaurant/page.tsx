import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth";
import { getOrdersForRestaurant } from "@/lib/db";
import { redirect } from "next/navigation";
import RestaurantPortalClient from "@/components/restaurant/RestaurantPortalClient";

export default async function RestaurantPortalPage() {
  const { user } = await requireAuth("restaurant_admin");
  const supabase = await createClient();

  // Get the restaurant this admin manages
  const { data: adminLink } = await supabase
    .from("restaurant_admins")
    .select("restaurant_id, restaurants(*)")
    .eq("profile_id", user.id)
    .single();

  if (!adminLink?.restaurants) redirect("/auth/unauthorised");

  const restaurant = adminLink.restaurants as any;
  const orders = await getOrdersForRestaurant(supabase, restaurant.id);

  // Load menu
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", restaurant.id)
    .order("display_order");

  const { data: drivers } = await supabase
    .from("drivers")
    .select("id, name, zone")
    .eq("is_active", true);

  return (
    <RestaurantPortalClient
      restaurant={restaurant}
      initialOrders={orders}
      initialCategories={categories ?? []}
      activeDrivers={drivers ?? []}
    />
  );
}
