import { createClient } from "@/lib/supabase/server";
import { getRestaurantBySlug, getMenu } from "@/lib/db";
import { notFound } from "next/navigation";
import RestaurantMenu from "@/components/customer/RestaurantMenu";

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  const supabase = await createClient();
  const [restaurant, menu] = await Promise.all([
    getRestaurantBySlug(supabase, params.slug),
    (async () => {
      const r = await getRestaurantBySlug(supabase, params.slug);
      if (!r) return [];
      return getMenu(supabase, r.id);
    })(),
  ]);

  if (!restaurant) notFound();

  return <RestaurantMenu restaurant={restaurant} menu={menu} />;
}
