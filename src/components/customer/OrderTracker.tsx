"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { OrderEnriched, OrderItem } from "@/types/database.types";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@700&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root { --green-900:#0F2318;--green-800:#1A3528;--green-600:#2D5240;--green-300:#6BA88A;--amber:#C8943A;--amber-light:#E8B55A;--cream:#F7F2EA;--cream-dark:#EDE6D8;--text-dark:#0F2318;--text-light:#6B8A78;--green-50:#EDF5F0;--green-100:#D5E8DE;--green-200:#A8CCBA; }
  body { font-family:'DM Sans',sans-serif; background:var(--cream); }
  .nav { background:var(--green-900); padding:0 24px; height:64px; display:flex; align-items:center; gap:16px; }
  .back { background:transparent; border:none; cursor:pointer; color:var(--green-300); font-size:14px; font-family:'DM Sans',sans-serif; display:flex; align-items:center; gap:6px; }
  .nav-logo { font-family:'Fraunces',serif; font-size:22px; font-weight:700; color:#F7F2EA; }
  .nav-logo span { color:var(--amber-light); }
  .page { max-width:520px; margin:0 auto; padding:32px 24px; }
  .card { background:#fff; border-radius:32px; border:1px solid var(--cream-dark); overflow:hidden; box-shadow:0 12px 40px rgba(15,35,24,0.18); }
  .card-head { background:var(--green-900); padding:28px 28px 24px; color:#F7F2EA; }
  .order-num { font-size:12px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; color:var(--green-300); margin-bottom:6px; }
  .card-head h2 { font-family:'Fraunces',serif; font-size:26px; margin-bottom:4px; }
  .card-head p { font-size:14px; color:var(--green-300); }
  .eta { background:rgba(200,148,58,0.18); border:1px solid rgba(200,148,58,0.3); border-radius:14px; padding:12px 16px; margin-top:16px; display:flex; align-items:center; gap:10px; }
  .eta-time { font-size:18px; font-weight:700; color:var(--amber-light); }
  .eta-label { font-size:13px; color:var(--amber-light); }
  .steps { padding:28px; }
  .step { display:flex; gap:16px; }
  .step-left { display:flex; flex-direction:column; align-items:center; }
  .dot { width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:15px; flex-shrink:0; border:2.5px solid var(--green-200); background:#fff; color:var(--text-light); z-index:1; }
  .dot.done { background:var(--green-600); border-color:var(--green-600); color:#fff; }
  .dot.active { background:var(--amber); border-color:var(--amber); color:#fff; box-shadow:0 0 0 4px rgba(200,148,58,0.2); }
  .step-line { width:2px; flex:1; min-height:28px; background:var(--green-100); margin:4px 0; }
  .step-line.done { background:var(--green-600); }
  .step-content { padding-bottom:24px; flex:1; }
  .step:last-child .step-content { padding-bottom:0; }
  .step-label { font-size:15px; font-weight:600; color:var(--text-dark); line-height:1.8; }
  .step-label.active { color:var(--amber); }
  .step-label.done { color:var(--text-light); }
  .step-sub { font-size:12px; color:var(--text-light); }
  .rest-strip { margin:0 28px 28px; background:var(--green-50); border-radius:14px; padding:14px 16px; display:flex; align-items:center; gap:12px; }
  .sms-note { text-align:center; margin-top:18px; font-size:13px; color:var(--text-light); }
`;

const STEPS = [
  { key: "placed", label: "Order Placed", icon: "📋", sub: "Your order has been received" },
  { key: "confirmed", label: "Restaurant Confirmed", icon: "✅", sub: "The kitchen is on it" },
  { key: "preparing", label: "Being Prepared", icon: "👨‍🍳", sub: "Your food is being made fresh" },
  { key: "on_the_way", label: "Driver Picked Up", icon: "🛵", sub: "Your order is on its way!" },
  { key: "delivered", label: "Delivered", icon: "🎉", sub: "Enjoy your meal!" },
];

const STATUS_IDX: Record<string, number> = {
  payment_pending: -1, placed: 0, confirmed: 1, preparing: 2,
  ready_for_pickup: 2, on_the_way: 3, delivered: 4,
};

interface Props { order: OrderEnriched; items: OrderItem[]; }

export default function OrderTracker({ order: initialOrder, items }: Props) {
  const router = useRouter();
  const [order, setOrder] = useState(initialOrder);
  const statusIdx = STATUS_IDX[order.status] ?? 0;

  // Subscribe to real-time status changes
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-${order.id}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "orders",
        filter: `id=eq.${order.id}`,
      }, payload => {
        setOrder(prev => ({ ...prev, ...payload.new }));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [order.id]);

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <button className="back" onClick={() => router.push("/")}>← Home</button>
        <div className="nav-logo">Trolley<span>.</span></div>
      </nav>
      <div className="page">
        <div className="card">
          <div className="card-head">
            <div className="order-num">Order · {order.ref}</div>
            <h2>{STEPS[Math.max(statusIdx, 0)]?.label ?? "Processing"}</h2>
            <p>{STEPS[Math.max(statusIdx, 0)]?.sub ?? "We're processing your order"}</p>
            <div className="eta">
              <span style={{ fontSize: 22 }}>⏱</span>
              <div>
                <div className="eta-label">Estimated delivery</div>
                <div className="eta-time">30 – 45 minutes</div>
              </div>
            </div>
          </div>

          <div className="steps">
            {STEPS.map((s, i) => (
              <div className="step" key={s.key}>
                <div className="step-left">
                  <div className={`dot ${i < statusIdx ? "done" : i === statusIdx ? "active" : ""}`}>
                    {i < statusIdx ? "✓" : s.icon}
                  </div>
                  {i < STEPS.length - 1 && <div className={`step-line ${i < statusIdx ? "done" : ""}`} />}
                </div>
                <div className="step-content">
                  <div className={`step-label ${i < statusIdx ? "done" : i === statusIdx ? "active" : ""}`}>{s.label}</div>
                  {i === statusIdx && <div className="step-sub">{s.sub}</div>}
                </div>
              </div>
            ))}
          </div>

          <div className="rest-strip">
            <span style={{ fontSize: 28 }}>{order.restaurant_emoji}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "var(--green-900)" }}>{order.restaurant_name}</div>
              <div style={{ fontSize: 12, color: "var(--text-light)", marginTop: 2 }}>
                {items.map(i => `${i.quantity}× ${i.item_name_snapshot}`).join(" · ")}
              </div>
            </div>
          </div>
        </div>
        <p className="sms-note">📲 A confirmation SMS has been sent to {order.delivery_phone}</p>
      </div>
    </>
  );
}
