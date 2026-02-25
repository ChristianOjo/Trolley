/**
 * Database types for Trolley.
 *
 * In production, regenerate this file automatically with:
 *   npm run db:types
 * which runs: supabase gen types typescript --local > src/types/database.types.ts
 *
 * This hand-written version matches the schema in 001_initial_schema.sql
 */

export type UserRole = "customer" | "restaurant_admin" | "driver" | "operator";
export type OrderStatus =
  | "payment_pending"
  | "placed"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "on_the_way"
  | "delivered"
  | "cancelled";
export type PaymentMethod = "mtn_momo" | "card";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";
export type CityZone = "Mbabane" | "Manzini" | "Other";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: UserRole;
          full_name: string | null;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      delivery_zones: {
        Row: {
          id: string;
          name: CityZone;
          flat_fee_szl: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["delivery_zones"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["delivery_zones"]["Insert"]>;
      };
      restaurants: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          cuisine_type: string;
          phone: string;
          email: string;
          address: string;
          zone: CityZone;
          cover_image_url: string | null;
          logo_url: string | null;
          emoji: string;
          is_open: boolean;
          is_active: boolean;
          min_order_szl: number;
          estimated_delivery_min: number;
          estimated_delivery_max: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["restaurants"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["restaurants"]["Insert"]>;
      };
      restaurant_admins: {
        Row: { profile_id: string; restaurant_id: string };
        Insert: Database["public"]["Tables"]["restaurant_admins"]["Row"];
        Update: Partial<Database["public"]["Tables"]["restaurant_admins"]["Row"]>;
      };
      menu_categories: {
        Row: {
          id: string;
          restaurant_id: string;
          name: string;
          display_order: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["menu_categories"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["menu_categories"]["Insert"]>;
      };
      menu_items: {
        Row: {
          id: string;
          category_id: string;
          restaurant_id: string;
          name: string;
          description: string | null;
          price_szl: number;
          emoji: string;
          image_url: string | null;
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["menu_items"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["menu_items"]["Insert"]>;
      };
      drivers: {
        Row: {
          id: string;
          profile_id: string;
          name: string;
          phone: string;
          zone: CityZone;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["drivers"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["drivers"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          ref: string;
          customer_id: string | null;
          restaurant_id: string;
          driver_id: string | null;
          status: OrderStatus;
          subtotal_szl: number;
          delivery_fee_szl: number;
          total_szl: number;
          delivery_address: string;
          delivery_phone: string;
          delivery_zone: CityZone;
          payment_method: PaymentMethod;
          payment_status: PaymentStatus;
          payment_ref: string | null;
          rejection_reason: string | null;
          guest_name: string | null;
          placed_at: string | null;
          confirmed_at: string | null;
          preparing_at: string | null;
          ready_at: string | null;
          picked_up_at: string | null;
          delivered_at: string | null;
          cancelled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "ref" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          menu_item_id: string | null;
          item_name_snapshot: string;
          item_price_snapshot: number;
          quantity: number;
          line_total_szl: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "line_total_szl" | "created_at">;
        Update: never; // order items are immutable after creation
      };
    };
    Views: {
      orders_enriched: {
        Row: Database["public"]["Tables"]["orders"]["Row"] & {
          restaurant_name: string;
          restaurant_emoji: string;
          driver_name: string | null;
          driver_phone: string | null;
          customer_name: string | null;
          customer_phone_profile: string | null;
        };
      };
      daily_gmv_by_restaurant: {
        Row: {
          restaurant_id: string;
          restaurant_name: string;
          emoji: string;
          order_date: string;
          order_count: number;
          gmv_szl: number;
          platform_fee_szl: number;
        };
      };
    };
    Functions: {
      current_user_role: { Args: Record<never, never>; Returns: UserRole };
      is_restaurant_admin_for: { Args: { restaurant_uuid: string }; Returns: boolean };
      is_assigned_driver_for: { Args: { order_uuid: string }; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      order_status: OrderStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      city_zone: CityZone;
    };
  };
}

// ─── Convenience row types ───────────────────────────────────────────────────
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Restaurant = Database["public"]["Tables"]["restaurants"]["Row"];
export type MenuCategory = Database["public"]["Tables"]["menu_categories"]["Row"];
export type MenuItem = Database["public"]["Tables"]["menu_items"]["Row"];
export type Driver = Database["public"]["Tables"]["drivers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type OrderItem = Database["public"]["Tables"]["order_items"]["Row"];
export type DeliveryZone = Database["public"]["Tables"]["delivery_zones"]["Row"];
export type OrderEnriched = Database["public"]["Views"]["orders_enriched"]["Row"];
