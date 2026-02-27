/**
 * Trolley Data Layer
 *
 * All Supabase queries live here — centralised, typed, and reusable.
 * Import the browser client version for client components,
 * server version for server components / route handlers.
 *
 * Pattern:
 *   const supabase = createClient()          ← in client components
 *   const supabase = await createClient()    ← in server components / route handlers
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Restaurant,
  MenuItem,
  MenuCategory,
  Order,
  OrderItem,
  Driver,
  DeliveryZone,
  OrderEnriched,
  CityZone,
  PaymentMethod,
} from "@/types/database.types";

type DB = SupabaseClient<any>;

// ═══════════════════════════════════════════════════════════════════════════
// RESTAURANTS
// ═══════════════════════════════════════════════════════════════════════════

/** All active restaurants, optionally filtered by zone */
export async function getRestaurants(
  supabase: DB,
  zone?: CityZone
): Promise<Restaurant[]> {
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("is_active", true)
    .order("name");

  if (zone) query = query.eq("zone", zone);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Single restaurant by slug (for customer-facing restaurant page) */
export async function getRestaurantBySlug(
  supabase: DB,
  slug: string
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();

  if (error) return null;
  return data;
}

/** Restaurant by ID (used internally) */
export async function getRestaurantById(
  supabase: DB,
  id: string
): Promise<Restaurant | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

/** Toggle restaurant open/closed */
export async function setRestaurantOpen(
  supabase: DB,
  restaurantId: string,
  isOpen: boolean
): Promise<void> {
  const { error } = await supabase
    .from("restaurants")
    .update({ is_open: isOpen })
    .eq("id", restaurantId);
  if (error) throw error;
}

/** Operator: toggle active/inactive */
export async function setRestaurantActive(
  supabase: DB,
  restaurantId: string,
  isActive: boolean
): Promise<void> {
  const { error } = await supabase
    .from("restaurants")
    .update({ is_active: isActive })
    .eq("id", restaurantId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════════════
// MENU
// ═══════════════════════════════════════════════════════════════════════════

export interface MenuCategoryWithItems extends MenuCategory {
  menu_items: MenuItem[];
}

/** Full menu for a restaurant (categories + items) */
export async function getMenu(
  supabase: DB,
  restaurantId: string,
  includeUnavailable = false
): Promise<MenuCategoryWithItems[]> {
  let itemQuery = supabase
    .from("menu_items")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("display_order");

  if (!includeUnavailable) {
    itemQuery = itemQuery.eq("is_available", true);
  }

  const [catResult, itemResult] = await Promise.all([
    supabase
      .from("menu_categories")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("display_order"),
    itemQuery,
  ]);

  if (catResult.error) throw catResult.error;
  if (itemResult.error) throw itemResult.error;

  const cats = catResult.data ?? [];
  const items = itemResult.data ?? [];

  return cats.map((cat) => ({
    ...cat,
    menu_items: items.filter((i) => i.category_id === cat.id),
  }));
}

/** Toggle a menu item's availability (sold out / available) */
export async function setMenuItemAvailable(
  supabase: DB,
  itemId: string,
  isAvailable: boolean
): Promise<void> {
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", itemId);
  if (error) throw error;
}

/** Add a new menu item */
export async function addMenuItem(
  supabase: DB,
  item: Database["public"]["Tables"]["menu_items"]["Insert"]
): Promise<MenuItem> {
  const { data, error } = await supabase
    .from("menu_items")
    .insert(item)
    .select()
    .single();
  if (error) throw error;
  return data;
}

/** Update a menu item */
export async function updateMenuItem(
  supabase: DB,
  itemId: string,
  updates: Database["public"]["Tables"]["menu_items"]["Update"]
): Promise<void> {
  const { error } = await supabase
    .from("menu_items")
    .update(updates)
    .eq("id", itemId);
  if (error) throw error;
}

/** Delete a menu item */
export async function deleteMenuItem(supabase: DB, itemId: string): Promise<void> {
  const { error } = await supabase.from("menu_items").delete().eq("id", itemId);
  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════════════════
// ORDERS
// ═══════════════════════════════════════════════════════════════════════════

export interface CartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateOrderInput {
  restaurantId: string;
  customerId?: string;        // null for guest checkout
  guestName?: string;
  deliveryAddress: string;
  deliveryPhone: string;
  deliveryZone: CityZone;
  paymentMethod: PaymentMethod;
  subtotalSzl: number;
  deliveryFeeSzl: number;
  totalSzl: number;
  items: CartItem[];
}

/**
 * Create an order in payment_pending state.
 * Returns the created order. The order transitions to 'placed' only
 * after the Peach Payments webhook confirms payment success.
 */
export async function createOrder(
  supabase: DB,
  input: CreateOrderInput
): Promise<Order> {
  // 1. Insert the order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      restaurant_id: input.restaurantId,
      customer_id: input.customerId ?? null,
      guest_name: input.guestName ?? null,
      delivery_address: input.deliveryAddress,
      delivery_phone: input.deliveryPhone,
      delivery_zone: input.deliveryZone,
      payment_method: input.paymentMethod,
      status: "payment_pending",
      payment_status: "pending",
      subtotal_szl: input.subtotalSzl,
      delivery_fee_szl: input.deliveryFeeSzl,
      total_szl: input.totalSzl,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  // 2. Insert order items (snapshot names + prices)
  const orderItems = input.items.map((item) => ({
    order_id: order.id,
    menu_item_id: item.menuItemId,
    item_name_snapshot: item.name,
    item_price_snapshot: item.price,
    quantity: item.quantity,
  }));

  const { error: itemsError } = await supabase
    .from("order_items")
    .insert(orderItems);

  if (itemsError) throw itemsError;

  return order;
}

/** Get orders for a restaurant (for restaurant portal) */
export async function getOrdersForRestaurant(
  supabase: DB,
  restaurantId: string,
  date?: string   // ISO date string e.g. "2026-02-21" — defaults to today
): Promise<OrderEnriched[]> {
  const targetDate = date ?? new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("orders_enriched")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .gte("created_at", `${targetDate}T00:00:00`)
    .lte("created_at", `${targetDate}T23:59:59`)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

/** Get order items for an order */
export async function getOrderItems(
  supabase: DB,
  orderId: string
): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId);
  if (error) throw error;
  return data ?? [];
}

/** Get all orders (for operator dashboard), with optional filters */
export async function getAllOrders(
  supabase: DB,
  filters?: {
    status?: string;
    restaurantId?: string;
    date?: string;
  }
): Promise<OrderEnriched[]> {
  let query = supabase
    .from("orders_enriched")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters?.status && filters.status !== "all") {
    query = query.eq("status", filters.status);
  }
  if (filters?.restaurantId) {
    query = query.eq("restaurant_id", filters.restaurantId);
  }
  if (filters?.date) {
    query = query
      .gte("created_at", `${filters.date}T00:00:00`)
      .lte("created_at", `${filters.date}T23:59:59`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

/** Get orders assigned to a driver */
export async function getOrdersForDriver(
  supabase: DB,
  driverId: string
): Promise<OrderEnriched[]> {
  const { data, error } = await supabase
    .from("orders_enriched")
    .select("*")
    .eq("driver_id", driverId)
    .in("status", ["ready_for_pickup", "on_the_way"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Get completed deliveries for a driver (today) */
export async function getDriverCompletedOrders(
  supabase: DB,
  driverId: string,
  date?: string
): Promise<OrderEnriched[]> {
  const targetDate = date ?? new Date().toISOString().split("T")[0];
  const { data, error } = await supabase
    .from("orders_enriched")
    .select("*")
    .eq("driver_id", driverId)
    .eq("status", "delivered")
    .gte("created_at", `${targetDate}T00:00:00`)
    .lte("created_at", `${targetDate}T23:59:59`)
    .order("delivered_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Update order status (restaurant or driver actions) */
export async function updateOrderStatus(
  supabase: DB,
  orderId: string,
  status: Order["status"],
  extra?: { rejectionReason?: string; driverId?: string | null }
): Promise<void> {
  const updates: Database["public"]["Tables"]["orders"]["Update"] = { status };
  if (extra?.rejectionReason) updates.rejection_reason = extra.rejectionReason;
  if (extra?.driverId !== undefined) updates.driver_id = extra.driverId;

  const { error } = await supabase
    .from("orders")
    .update(updates)
    .eq("id", orderId);
  if (error) throw error;
}

/** Assign a driver to an order (operator action) */
export async function assignDriver(
  supabase: DB,
  orderId: string,
  driverId: string | null
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ driver_id: driverId })
    .eq("id", orderId);
  if (error) throw error;
}

/** Get a single order by ID */
export async function getOrderById(
  supabase: DB,
  orderId: string
): Promise<OrderEnriched | null> {
  const { data, error } = await supabase
    .from("orders_enriched")
    .select("*")
    .eq("id", orderId)
    .single();
  if (error) return null;
  return data;
}

/** Get customer's order history (last 10) */
export async function getCustomerOrders(
  supabase: DB,
  customerId: string
): Promise<OrderEnriched[]> {
  const { data, error } = await supabase
    .from("orders_enriched")
    .select("*")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return data ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════
// DRIVERS
// ═══════════════════════════════════════════════════════════════════════════

export async function getDrivers(supabase: DB): Promise<Driver[]> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getActiveDrivers(
  supabase: DB,
  zone?: CityZone
): Promise<Driver[]> {
  let query = supabase.from("drivers").select("*").eq("is_active", true);
  if (zone) query = query.eq("zone", zone);
  const { data, error } = await query.order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getDriverByProfileId(
  supabase: DB,
  profileId: string
): Promise<Driver | null> {
  const { data, error } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", profileId)
    .single();
  if (error) return null;
  return data;
}

// ═══════════════════════════════════════════════════════════════════════════
// DELIVERY ZONES
// ═══════════════════════════════════════════════════════════════════════════

export async function getDeliveryZones(supabase: DB): Promise<DeliveryZone[]> {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("*")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getDeliveryFeeForZone(
  supabase: DB,
  zone: CityZone
): Promise<number> {
  const { data, error } = await supabase
    .from("delivery_zones")
    .select("flat_fee_szl")
    .eq("name", zone)
    .single();
  if (error) return 15; // fallback
  return data.flat_fee_szl;
}

export async function updateZoneFee(
  supabase: DB,
  zone: CityZone,
  feeSzl: number
): Promise<void> {
  const { error } = await supabase
    .from("delivery_zones")
    .update({ flat_fee_szl: feeSzl })
    .eq("name", zone);
  if (error) throw error;
}
