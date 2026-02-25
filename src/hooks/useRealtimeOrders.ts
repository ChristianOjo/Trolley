"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { OrderEnriched } from "@/types/database.types";

interface UseRealtimeOrdersOptions {
  /** Filter to orders for this restaurant */
  restaurantId?: string;
  /** Filter to orders assigned to this driver ID */
  driverId?: string;
  /** Callback when any order changes */
  onOrderChange: (payload: { new: Partial<OrderEnriched>; old: Partial<OrderEnriched>; eventType: string }) => void;
}

/**
 * Subscribe to real-time order updates via Supabase Realtime.
 *
 * The restaurant portal uses this to receive new orders without polling.
 * The driver view uses this to see when an order is assigned to them.
 *
 * Prerequisites: Run in Supabase SQL editor:
 *   ALTER PUBLICATION supabase_realtime ADD TABLE orders;
 */
export function useRealtimeOrders({
  restaurantId,
  driverId,
  onOrderChange,
}: UseRealtimeOrdersOptions) {
  const supabase = createClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const callbackRef = useRef(onOrderChange);
  callbackRef.current = onOrderChange;

  useEffect(() => {
    let filter = "orders";
    if (restaurantId) filter += `:restaurant_id=eq.${restaurantId}`;
    else if (driverId) filter += `:driver_id=eq.${driverId}`;

    const channel = supabase
      .channel(`orders-${restaurantId ?? driverId ?? "all"}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          ...(restaurantId ? { filter: `restaurant_id=eq.${restaurantId}` } : {}),
          ...(driverId ? { filter: `driver_id=eq.${driverId}` } : {}),
        },
        (payload) => {
          callbackRef.current({
            new: payload.new as Partial<OrderEnriched>,
            old: payload.old as Partial<OrderEnriched>,
            eventType: payload.eventType,
          });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [restaurantId, driverId]);
}

/**
 * Polls orders every N seconds as a fallback when Realtime is not available.
 * PRD specifies 30-second auto-refresh as the minimum for MVP.
 */
export function useOrderPolling(
  fetchFn: () => Promise<void>,
  intervalMs = 30_000
) {
  const fnRef = useRef(fetchFn);
  fnRef.current = fetchFn;

  useEffect(() => {
    const id = setInterval(() => fnRef.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
}
