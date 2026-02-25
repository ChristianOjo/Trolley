"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Driver, OrderEnriched } from "@/types/database.types";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@500;600;700;800;900&family=Barlow:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0D0F0D; --surface:#161A16; --surface2:#1E241E; --surface3:#252D25;
    --border:#2A342A; --border2:#334033;
    --amber:#E8A230; --amber2:#F5BC58; --amber-dim:#7A5418;
    --green:#3DBE75; --green2:#5FD494; --green-dim:#1A5232;
    --red:#E05252; --text:#EDF2EE; --text2:#A8BCA8; --text3:#6A806A;
    --fh:'Barlow Condensed',sans-serif; --fb:'Barlow',sans-serif;
  }
  body { font-family:var(--fb); background:var(--bg); color:var(--text); max-width:430px; margin:0 auto; -webkit-font-smoothing:antialiased; }
  .header { background:var(--surface); border-bottom:1px solid var(--border); padding:14px 20px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:50; }
  .header-logo { font-family:var(--fh); font-size:22px; font-weight:900; color:var(--text); }
  .header-logo em { color:var(--amber); font-style:normal; }
  .status-pill { font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; padding:4px 9px; border-radius:6px; }
  .sp-active { background:rgba(61,190,117,0.15); color:var(--green); border:1px solid rgba(61,190,117,0.25); }
  .sp-idle { background:var(--surface3); color:var(--text3); border:1px solid var(--border); }
  .driver-name { font-size:13px; font-weight:600; color:var(--text); text-align:right; }
  .driver-sub { font-size:11px; color:var(--text3); }
  .tabs { display:flex; background:var(--surface); border-bottom:1px solid var(--border); }
  .tab { flex:1; padding:13px 0; font-family:var(--fh); font-size:15px; font-weight:700; text-align:center; color:var(--text3); cursor:pointer; border:none; background:transparent; border-bottom:3px solid transparent; margin-bottom:-1px; transition:all 0.15s; display:flex; align-items:center; justify-content:center; gap:8px; -webkit-tap-highlight-color:transparent; }
  .tab.active { color:var(--amber); border-bottom-color:var(--amber); }
  .tab-badge { background:var(--amber); color:var(--bg); font-size:11px; font-weight:800; min-width:19px; height:19px; border-radius:10px; display:flex; align-items:center; justify-content:center; padding:0 4px; }
  .scroll { flex:1; overflow-y:auto; padding:16px; min-height:calc(100vh - 112px); }
  .active-card { background:var(--surface); border:1px solid var(--border); border-radius:22px; overflow:hidden; margin-bottom:14px; animation:cardIn 0.3s ease; }
  @keyframes cardIn{from{transform:translateY(8px);opacity:0}to{transform:translateY(0);opacity:1}}
  .banner { padding:14px 18px; display:flex; align-items:center; gap:10px; }
  .banner.pickup { background:linear-gradient(135deg,#3A2A10,var(--amber-dim)); }
  .banner.delivering { background:linear-gradient(135deg,#1A3A28,var(--green-dim)); }
  .banner-icon { font-size:22px; }
  .banner-label { font-family:var(--fh); font-size:13px; font-weight:800; letter-spacing:1.5px; text-transform:uppercase; }
  .banner-label.amber { color:var(--amber2); }
  .banner-label.green { color:var(--green2); }
  .banner-sub { font-size:11px; color:rgba(255,255,255,0.45); margin-top:1px; }
  .card-body { padding:18px; }
  .order-ref { font-family:var(--fh); font-size:13px; font-weight:600; letter-spacing:1.5px; text-transform:uppercase; color:var(--text3); margin-bottom:4px; }
  .order-value { font-family:var(--fh); font-size:36px; font-weight:900; letter-spacing:-1px; color:var(--text); line-height:1; margin-bottom:14px; }
  .order-value small { font-size:18px; color:var(--text3); font-weight:600; margin-right:4px; }
  .loc-block { border-radius:10px; padding:13px 15px; margin-bottom:10px; display:flex; align-items:flex-start; gap:12px; }
  .loc-pickup { background:rgba(232,162,48,0.09); border:1px solid rgba(232,162,48,0.2); }
  .loc-dropoff { background:rgba(61,190,117,0.09); border:1px solid rgba(61,190,117,0.2); }
  .loc-icon { font-size:20px; margin-top:1px; flex-shrink:0; }
  .loc-label { font-size:10px; font-weight:700; letter-spacing:1.5px; text-transform:uppercase; margin-bottom:3px; }
  .loc-label.amber { color:var(--amber); }
  .loc-label.green { color:var(--green); }
  .loc-name { font-size:15px; font-weight:600; color:var(--text); line-height:1.3; }
  .loc-addr { font-size:13px; color:var(--text2); margin-top:2px; line-height:1.4; }
  .actions { display:flex; flex-direction:column; gap:10px; }
  .actions.split { flex-direction:row; }
  .action-btn { border:none; cursor:pointer; border-radius:10px; font-family:var(--fh); font-weight:800; letter-spacing:0.5px; font-size:18px; padding:17px 16px; display:flex; align-items:center; justify-content:center; gap:10px; transition:opacity 0.15s,transform 0.1s; -webkit-tap-highlight-color:transparent; width:100%; }
  .action-btn:active { transform:scale(0.97); }
  .btn-maps { background:rgba(232,162,48,0.15); border:1.5px solid rgba(232,162,48,0.35); color:var(--amber2); font-size:15px; }
  .btn-deliver { background:var(--green); color:var(--bg); }
  .btn-call { background:rgba(61,190,117,0.12); border:1.5px solid rgba(61,190,117,0.25); color:var(--green2); font-size:15px; }
  .btn-sm { font-size:14px; padding:12px 14px; flex:1; }
  .empty { border:1.5px dashed var(--border2); border-radius:22px; padding:52px 24px; text-align:center; }
  .empty-icon { font-size:52px; margin-bottom:14px; display:block; opacity:0.7; }
  .empty-title { font-family:var(--fh); font-size:22px; font-weight:800; color:var(--text2); margin-bottom:6px; }
  .empty-sub { font-size:14px; color:var(--text3); line-height:1.5; }
  .summary-strip { background:var(--surface2); border:1px solid var(--border); border-radius:14px; padding:14px 16px; display:flex; gap:0; margin-bottom:14px; }
  .sum-item { flex:1; text-align:center; position:relative; }
  .sum-item+.sum-item::before { content:''; position:absolute; left:0; top:10%; bottom:10%; width:1px; background:var(--border); }
  .sum-val { font-family:var(--fh); font-size:26px; font-weight:900; color:var(--text); letter-spacing:-0.5px; }
  .sum-val.amber { color:var(--amber2); }
  .sum-lbl { font-size:10px; color:var(--text3); font-weight:500; margin-top:2px; text-transform:uppercase; letter-spacing:0.8px; }
  .run-card { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:15px 16px; margin-bottom:10px; display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
  .run-id { font-family:var(--fh); font-size:13px; font-weight:600; letter-spacing:1px; color:var(--text3); text-transform:uppercase; }
  .run-customer { font-size:15px; font-weight:600; color:var(--text); margin-top:2px; }
  .run-addr { font-size:12px; color:var(--text3); margin-top:3px; }
  .run-status { display:inline-flex; align-items:center; gap:5px; background:rgba(61,190,117,0.12); color:var(--green); font-size:11px; font-weight:700; letter-spacing:0.8px; text-transform:uppercase; padding:3px 8px; border-radius:6px; margin-top:6px; }
  .run-earnings { font-family:var(--fh); font-size:20px; font-weight:800; color:var(--text); white-space:nowrap; }
  .run-earnings-sub { font-size:10px; color:var(--text3); text-align:right; margin-top:1px; }
  .confirm-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.75); z-index:100; display:flex; align-items:flex-end; padding:20px; backdrop-filter:blur(3px); animation:fadeIn 0.2s; }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .confirm-sheet { background:var(--surface); border:1px solid var(--border2); border-radius:22px 22px 10px 10px; padding:28px 24px 32px; width:100%; animation:sheetUp 0.25s ease; }
  @keyframes sheetUp{from{transform:translateY(20px)}to{transform:translateY(0)}}
  .confirm-title { font-family:var(--fh); font-size:26px; font-weight:900; color:var(--text); margin-bottom:8px; }
  .confirm-sub { font-size:14px; color:var(--text2); margin-bottom:24px; line-height:1.5; }
  .btn-confirm-yes { border:none; cursor:pointer; border-radius:10px; background:var(--green); color:var(--bg); font-family:var(--fh); font-size:20px; font-weight:900; padding:18px; width:100%; transition:background 0.15s; }
  .btn-cancel-c { border:none; cursor:pointer; background:transparent; color:var(--text3); font-family:var(--fh); font-size:16px; font-weight:700; padding:14px; width:100%; margin-top:4px; }
  .toast { position:fixed; top:80px; left:50%; transform:translateX(-50%); background:var(--green); color:var(--bg); padding:11px 22px; border-radius:30px; font-family:var(--fh); font-size:16px; font-weight:800; z-index:200; white-space:nowrap; animation:toastIn 0.3s ease; }
  @keyframes toastIn{from{transform:translateX(-50%) translateY(-10px);opacity:0}to{transform:translateX(-50%) translateY(0);opacity:1}}
`;

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
}
function mapsUrl(address: string) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address + ", Mbabane, Eswatini")}`;
}

interface Props {
  driver: Driver;
  initialActive: OrderEnriched[];
  initialCompleted: OrderEnriched[];
}

export default function DriverViewClient({ driver, initialActive, initialCompleted }: Props) {
  const supabase = createClient();
  const [tab, setTab] = useState<"active" | "done">("active");
  const [active, setActive] = useState<OrderEnriched[]>(initialActive);
  const [completed, setCompleted] = useState<OrderEnriched[]>(initialCompleted);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (msg: string) => {
    setToast(msg);
    clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 3000);
  };

  // Realtime: listen for new assignments and status changes
  useEffect(() => {
    const channel = supabase.channel("driver-orders")
      .on("postgres_changes", {
        event: "*", schema: "public", table: "orders",
        filter: `driver_id=eq.${driver.id}`,
      }, payload => {
        const updated = payload.new as OrderEnriched;
        if (payload.eventType === "INSERT") {
          setActive(a => [updated, ...a]);
          showToast("📦 New delivery assigned!");
        } else if (payload.eventType === "UPDATE") {
          // If delivered, move to completed list
          if (updated.status === "delivered") {
            setActive(a => a.filter(x => x.id !== updated.id));
            setCompleted(c => [updated, ...c]);
          } else {
            setActive(a => a.map(x => x.id === updated.id ? { ...x, ...updated } : x));
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [driver.id]);

  const updateStatus = async (orderId: string, status: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
  };

  const markPickedUp = async (orderId: string) => {
    await updateStatus(orderId, "on_the_way");
    setActive(a => a.map(x => x.id === orderId ? { ...x, status: "on_the_way" as any } : x));
    showToast("🛵 Marked as picked up — head to customer");
  };

  const confirmDelivered = async () => {
    if (!confirmId) return;
    await updateStatus(confirmId, "delivered");
    const order = active.find(o => o.id === confirmId);
    if (order) {
      setActive(a => a.filter(x => x.id !== confirmId));
      setCompleted(c => [{ ...order, status: "delivered" as any }, ...c]);
    }
    setConfirmId(null);
    showToast("✓ Delivery complete — great work!");
  };

  const todayEarnings = completed.length * 25; // SZL 25 driver fee per delivery
  const DRIVER_FEE = 25;

  return (
    <>
      <style>{CSS}</style>
      <div>
        <div className="header">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div className="header-logo">Trolley<em>.</em></div>
            <span className={`status-pill ${active.length > 0 ? "sp-active" : "sp-idle"}`}>
              {active.length > 0 ? "ON DELIVERY" : "STANDING BY"}
            </span>
          </div>
          <div>
            <div className="driver-name">{driver.name.split(" ")[0]}</div>
            <div className="driver-sub">Driver · {driver.zone}</div>
          </div>
        </div>

        <div className="tabs">
          <button className={`tab ${tab === "active" ? "active" : ""}`} onClick={() => setTab("active")}>
            MY DELIVERIES {active.length > 0 && <span className="tab-badge">{active.length}</span>}
          </button>
          <button className={`tab ${tab === "done" ? "active" : ""}`} onClick={() => setTab("done")}>
            COMPLETED
          </button>
        </div>

        <div className="scroll">
          {tab === "active" && (<>
            {active.length === 0 ? (
              <div className="empty">
                <span className="empty-icon">🛵</span>
                <div className="empty-title">No deliveries assigned</div>
                <div className="empty-sub">The operator will assign you orders as they come in. Stand by.</div>
              </div>
            ) : (
              active.map(order => (
                <div key={order.id} className="active-card">
                  <div className={`banner ${order.status === "on_the_way" ? "delivering" : "pickup"}`}>
                    <span className="banner-icon">{order.status === "on_the_way" ? "🏃" : "📦"}</span>
                    <div>
                      <div className={`banner-label ${order.status === "on_the_way" ? "green" : "amber"}`}>
                        {order.status === "on_the_way" ? "EN ROUTE TO CUSTOMER" : "COLLECT FROM RESTAURANT"}
                      </div>
                      <div className="banner-sub">Assigned {timeAgo(order.created_at)}</div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="order-ref">{order.ref}</div>
                    <div className="order-value"><small>SZL</small>{order.total_szl.toFixed(0)}</div>

                    <div className="loc-block loc-pickup">
                      <span className="loc-icon">{order.restaurant_emoji}</span>
                      <div>
                        <div className="loc-label amber">Collect From</div>
                        <div className="loc-name">{order.restaurant_name}</div>
                      </div>
                    </div>

                    <div className="loc-block loc-dropoff">
                      <span className="loc-icon">📍</span>
                      <div>
                        <div className="loc-label green">Deliver To</div>
                        <div className="loc-name">{order.customer_name ?? "Customer"}</div>
                        <div className="loc-addr">{order.delivery_address}</div>
                      </div>
                    </div>

                    <div className="actions">
                      <a
                        href={mapsUrl(order.status === "on_the_way" ? order.delivery_address : (order.restaurant_name + ", Mbabane"))}
                        target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}
                      >
                        <button className="action-btn btn-maps" style={{ width: "100%" }}>🗺️ Open in Google Maps</button>
                      </a>

                      {order.status === "ready_for_pickup" && (
                        <button className="action-btn btn-deliver" onClick={() => markPickedUp(order.id)}>
                          📦 CONFIRM PICKUP
                        </button>
                      )}

                      {order.status === "on_the_way" && (
                        <div className="actions split">
                          <a href={`tel:${order.delivery_phone}`} style={{ textDecoration: "none", flex: 1 }}>
                            <button className="action-btn btn-call btn-sm">📞 Call Customer</button>
                          </a>
                          <button className="action-btn btn-deliver btn-sm" onClick={() => setConfirmId(order.id)}>
                            ✓ DELIVERED
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>)}

          {tab === "done" && (<>
            <div className="summary-strip">
              <div className="sum-item"><div className="sum-val">{completed.length}</div><div className="sum-lbl">Deliveries</div></div>
              <div className="sum-item"><div className="sum-val amber">SZL {todayEarnings}</div><div className="sum-lbl">Earned Today</div></div>
              <div className="sum-item"><div className="sum-val">{active.length + completed.length > 0 ? Math.round(completed.length / (active.length + completed.length) * 100) : 0}%</div><div className="sum-lbl">Completion</div></div>
            </div>
            {completed.length === 0 ? (
              <div className="empty" style={{ padding: 32 }}>
                <span className="empty-icon" style={{ fontSize: 36 }}>📋</span>
                <div className="empty-title">No completed runs yet</div>
              </div>
            ) : (
              completed.map(run => (
                <div key={run.id} className="run-card">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="run-id">{run.ref}</div>
                    <div className="run-customer">{run.customer_name ?? "Customer"}</div>
                    <div className="run-addr">📍 {run.delivery_address}</div>
                    <div className="run-status">✓ Delivered · {run.delivered_at ? timeAgo(run.delivered_at) : "today"}</div>
                  </div>
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <div className="run-earnings">+SZL {DRIVER_FEE}</div>
                    <div className="run-earnings-sub">Driver fee</div>
                  </div>
                </div>
              ))
            )}
          </>)}
        </div>

        {confirmId && (
          <div className="confirm-overlay" onClick={e => e.target === e.currentTarget && setConfirmId(null)}>
            <div className="confirm-sheet">
              <div className="confirm-title">Confirm Delivery?</div>
              <div className="confirm-sub">
                Only mark as delivered once the customer has received their order. This will notify the customer.
              </div>
              <button className="btn-confirm-yes" onClick={confirmDelivered}>✓ YES, MARK AS DELIVERED</button>
              <button className="btn-cancel-c" onClick={() => setConfirmId(null)}>Cancel</button>
            </div>
          </div>
        )}

        {toast && <div className="toast">{toast}</div>}
      </div>
    </>
  );
}
