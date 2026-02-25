"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { DeliveryZone, CityZone } from "@/types/database.types";
import type { User } from "@supabase/supabase-js";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --green-900:#0F2318;--green-800:#1A3528;--green-700:#233F30;--green-600:#2D5240;--green-300:#6BA88A;--amber:#C8943A;--amber-light:#E8B55A;--cream:#F7F2EA;--cream-dark:#EDE6D8;--text-dark:#0F2318;--text-mid:#3A5042;--text-light:#6B8A78;--white:#FFFFFF; }
  body { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--text-dark); }
  h1,h2,h3 { font-family:'Fraunces',serif; }
  .nav { background:var(--green-900); display:flex; align-items:center; padding:0 24px; height:64px; gap:16px; }
  .back { background:transparent; border:none; cursor:pointer; color:var(--green-300); font-size:14px; display:flex; align-items:center; gap:6px; font-family:'DM Sans',sans-serif; }
  .nav-logo { font-family:'Fraunces',serif; font-size:22px; font-weight:700; color:#F7F2EA; }
  .nav-logo span { color:var(--amber-light); }
  .page { max-width:680px; margin:0 auto; padding:24px; }
  .page-title { font-size:28px; color:var(--green-900); margin-bottom:20px; }
  .section { background:#fff; border-radius:14px; border:1px solid var(--cream-dark); padding:20px 24px; margin-bottom:16px; }
  .section h3 { font-size:16px; font-weight:600; color:var(--green-900); margin-bottom:14px; }
  .field { margin-bottom:14px; }
  .field:last-child { margin-bottom:0; }
  .label { font-size:13px; font-weight:600; color:var(--text-mid); margin-bottom:6px; display:block; }
  .input { width:100%; border:1.5px solid var(--cream-dark); border-radius:8px; padding:11px 14px; font-family:'DM Sans',sans-serif; font-size:15px; color:var(--text-dark); outline:none; transition:border-color 0.18s; background:var(--cream); }
  .input:focus { border-color:#3A6B52; background:#fff; }
  .pay-option { display:flex; align-items:center; gap:14px; border:2px solid var(--cream-dark); border-radius:14px; padding:14px 16px; cursor:pointer; transition:all 0.18s; margin-bottom:10px; }
  .pay-option:last-child { margin-bottom:0; }
  .pay-option.selected { border-color:#2D5240; background:var(--cream); }
  .pay-icon { font-size:24px; }
  .pay-name { font-size:15px; font-weight:600; color:var(--green-900); }
  .pay-desc { font-size:12px; color:var(--text-light); }
  .radio { width:18px; height:18px; border-radius:50%; border:2px solid var(--green-300); display:flex; align-items:center; justify-content:center; margin-left:auto; flex-shrink:0; }
  .radio.checked { border-color:#2D5240; background:#2D5240; }
  .radio.checked::after { content:''; width:7px; height:7px; border-radius:50%; background:#fff; }
  .summary-item { display:flex; justify-content:space-between; font-size:14px; padding:6px 0; color:var(--text-mid); }
  .place-btn { width:100%; background:var(--green-800); color:#F7F2EA; border:none; cursor:pointer; padding:16px; border-radius:14px; font-family:'DM Sans',sans-serif; font-size:16px; font-weight:700; transition:background 0.2s; margin-top:8px; }
  .place-btn:hover { background:#233F30; }
  .place-btn:disabled { opacity:0.5; cursor:not-allowed; }
  .note { font-size:12px; color:var(--text-light); text-align:center; margin-top:12px; }
  .err { background:#FDF2F0; border:1px solid #EFB8B2; border-radius:8px; padding:10px 14px; font-size:13px; color:#C0392B; margin-bottom:14px; }
`;

interface CartItemData { id: string; name: string; price: number; qty: number; emoji: string; }
interface RestaurantData { id: string; name: string; zone: CityZone; deliveryMin: number; deliveryMax: number; }

interface Props {
  zones: DeliveryZone[];
  user: User | null;
  profile: { full_name: string | null; phone: string | null } | null;
}

export default function CheckoutClient({ zones, user, profile }: Props) {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [restaurant, setRestaurant] = useState<RestaurantData | null>(null);
  const [name, setName] = useState(profile?.full_name ?? "");
  const [phone, setPhone] = useState(profile?.phone ?? "");
  const [address, setAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"mtn_momo" | "card">("mtn_momo");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cart = sessionStorage.getItem("trolley_checkout_cart");
    const rest = sessionStorage.getItem("trolley_checkout_restaurant");
    if (cart) setCartItems(JSON.parse(cart));
    if (rest) setRestaurant(JSON.parse(rest));
  }, []);

  const zone = restaurant?.zone ?? "Mbabane";
  const deliveryFee = zones.find(z => z.name === zone)?.flat_fee_szl ?? 15;
  const subtotal = cartItems.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + deliveryFee;
  const canPlace = name && phone && address && cartItems.length > 0;

  const handlePlaceOrder = async () => {
    if (!canPlace || !restaurant) return;
    setLoading(true);
    setError("");

    const supabase = createClient();

    try {
      // 1. Create the order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          restaurant_id: restaurant.id,
          customer_id: user?.id ?? null,
          guest_name: !user ? name : null,
          delivery_address: address,
          delivery_phone: phone,
          delivery_zone: zone as CityZone,
          payment_method: paymentMethod,
          status: "payment_pending",
          payment_status: "pending",
          subtotal_szl: subtotal,
          delivery_fee_szl: deliveryFee,
          total_szl: total,
        })
        .select()
        .single();

      if (orderError || !order) throw new Error(orderError?.message ?? "Order creation failed");

      // 2. Insert order items (snapshot)
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(
          cartItems.map(item => ({
            order_id: order.id,
            menu_item_id: item.id,
            item_name_snapshot: item.name,
            item_price_snapshot: item.price,
            quantity: item.qty,
          }))
        );

      if (itemsError) throw new Error(itemsError.message);

      if (paymentMethod === "mtn_momo") {
        // For MTN MoMo: in production, call Peach Payments API here to
        // initiate a USSD push, then the webhook transitions the order to 'placed'.
        // For now we simulate by updating status directly.
        await supabase.from("orders").update({ status: "placed", payment_status: "success" }).eq("id", order.id);
      }
      // Card payments: redirect to Peach Payments hosted page
      // In production: window.location.href = peachPaymentsUrl

      // Clear cart
      sessionStorage.removeItem("trolley_cart");
      sessionStorage.removeItem("trolley_cart_restaurant");
      sessionStorage.removeItem("trolley_checkout_cart");
      sessionStorage.removeItem("trolley_checkout_restaurant");

      router.push(`/track/${order.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  if (!restaurant || cartItems.length === 0) {
    return (
      <>
        <style>{CSS}</style>
        <nav className="nav"><div className="nav-logo">Trolley<span>.</span></div></nav>
        <div className="page" style={{ textAlign: "center", paddingTop: 60 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🛒</div>
          <p>Your cart is empty.</p>
          <button className="place-btn" style={{ marginTop: 20 }} onClick={() => router.push("/")}>Browse restaurants</button>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <button className="back" onClick={() => router.back()}>← Back</button>
        <div className="nav-logo">Trolley<span>.</span></div>
      </nav>
      <div className="page">
        <h1 className="page-title">Checkout</h1>
        {error && <div className="err">{error}</div>}

        <div className="section">
          <h3>📍 Delivery Details</h3>
          <div className="field"><label className="label">Your Name</label><input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Full name" /></div>
          <div className="field"><label className="label">Phone Number</label><input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+268 76 XXX XXXX" /></div>
          <div className="field"><label className="label">Delivery Address</label><input className="input" value={address} onChange={e => setAddress(e.target.value)} placeholder="Street, area, landmark…" /></div>
        </div>

        <div className="section">
          <h3>💳 Payment Method</h3>
          {[
            { key: "mtn_momo" as const, icon: "📱", name: "MTN Mobile Money", desc: "Pay via USSD push to your MTN number" },
            { key: "card" as const, icon: "💳", name: "Debit / Credit Card", desc: "Secure card payment via Peach Payments" },
          ].map(opt => (
            <div key={opt.key} className={`pay-option ${paymentMethod === opt.key ? "selected" : ""}`} onClick={() => setPaymentMethod(opt.key)}>
              <span className="pay-icon">{opt.icon}</span>
              <div><div className="pay-name">{opt.name}</div><div className="pay-desc">{opt.desc}</div></div>
              <div className={`radio ${paymentMethod === opt.key ? "checked" : ""}`} />
            </div>
          ))}
        </div>

        <div className="section">
          <h3>🧾 Order Summary — {restaurant.name}</h3>
          {cartItems.map(item => (
            <div className="summary-item" key={item.id}><span>{item.qty}× {item.name}</span><span>SZL {(item.price * item.qty).toFixed(2)}</span></div>
          ))}
          <div style={{ borderTop: "1px solid var(--cream-dark)", marginTop: 10, paddingTop: 10 }}>
            <div className="summary-item"><span>Subtotal</span><span>SZL {subtotal.toFixed(2)}</span></div>
            <div className="summary-item"><span>Delivery ({zone})</span><span>SZL {deliveryFee.toFixed(2)}</span></div>
            <div className="summary-item" style={{ fontWeight: 700, color: "var(--green-900)", fontSize: 16 }}><span>Total</span><span>SZL {total.toFixed(2)}</span></div>
          </div>
        </div>

        <button className="place-btn" onClick={handlePlaceOrder} disabled={!canPlace || loading}>
          {loading ? "Placing order…" : `${paymentMethod === "mtn_momo" ? "📱 Pay with MTN MoMo" : "💳 Pay with Card"} · SZL ${total.toFixed(2)}`}
        </button>
        <p className="note">Your payment is securely processed. No card data touches Trolley's servers.</p>
      </div>
    </>
  );
}
