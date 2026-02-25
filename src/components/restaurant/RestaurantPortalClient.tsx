"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, OrderEnriched, Driver } from "@/types/database.types";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:#0F1F16;--ink2:#2E4A38;--ink3:#5A7A65;--ink4:#8FAD9A;--ink5:#B8CDBF;
    --paper:#F6F3EE;--paper2:#EDE9E0;--paper3:#E2DDD3;--white:#FFFFFF;
    --g9:#0F2318;--g8:#163222;--g7:#1E4530;--g6:#275A3E;--g5:#317550;--g4:#3D9162;
    --g3:#5AB07E;--g2:#90CCA8;--g1:#C2E5D0;--g0:#E8F5EE;
    --amber:#C4831A;--amber-bg:#FDF6EC;--amber-bd:#F0D4A0;
    --red:#C0392B;--red-bg:#FDF2F0;--red-bd:#EFB8B2;
    --sidebar:240px; --fh:'Syne',sans-serif; --fb:'IBM Plex Sans',sans-serif; --fm:'IBM Plex Mono',monospace;
  }
  body { font-family:var(--fb); background:var(--paper); color:var(--ink); }
  .shell { display:flex; min-height:100vh; }
  .sidebar { width:var(--sidebar); background:var(--g9); position:fixed; top:0; left:0; bottom:0; z-index:50; display:flex; flex-direction:column; }
  .sb-top { padding:22px 20px 18px; border-bottom:1px solid rgba(255,255,255,0.07); }
  .sb-logo { font-family:var(--fh); font-size:24px; font-weight:800; color:#fff; letter-spacing:-0.5px; }
  .sb-logo em { color:#E8B55A; font-style:normal; }
  .sb-role { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--ink4); margin-top:3px; font-weight:700; }
  .toggle-row { margin:12px 14px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.06); border-radius:10px; padding:10px 14px; display:flex; align-items:center; justify-content:space-between; }
  .toggle-label { font-size:12px; font-weight:700; color:var(--g2); display:flex; align-items:center; gap:7px; }
  .live-dot { width:7px; height:7px; border-radius:50%; }
  .live-dot.on { background:#4AC97E; box-shadow:0 0 6px rgba(74,201,126,0.6); animation:blink 2s infinite; }
  .live-dot.off { background:var(--ink4); }
  @keyframes blink{0%,100%{opacity:1}50%{opacity:0.5}}
  .toggle-sw { width:38px; height:22px; border-radius:11px; background:var(--g7); border:none; cursor:pointer; position:relative; transition:background 0.2s; }
  .toggle-sw.on { background:var(--g4); }
  .toggle-sw::after { content:''; position:absolute; top:3px; left:3px; width:16px; height:16px; border-radius:50%; background:#fff; transition:transform 0.2s; }
  .toggle-sw.on::after { transform:translateX(16px); }
  .nav-section { padding:10px 0; }
  .nav-label { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--g4); padding:10px 20px 4px; font-weight:700; }
  .nav-item { display:flex; align-items:center; gap:11px; padding:10px 16px; margin:1px 8px; border-radius:9px; cursor:pointer; color:var(--ink4); font-size:13px; font-weight:600; transition:all 0.15s; border:none; background:transparent; width:calc(100% - 16px); font-family:var(--fb); }
  .nav-item:hover { color:#fff; background:rgba(255,255,255,0.05); }
  .nav-item.active { color:#fff; background:var(--g7); }
  .nb { margin-left:auto; background:var(--amber); color:#fff; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; animation:badgePulse 1.5s infinite; }
  @keyframes badgePulse{0%,100%{box-shadow:0 0 0 0 rgba(196,131,26,0.6)}50%{box-shadow:0 0 0 6px rgba(196,131,26,0)}}
  .sb-footer { margin-top:auto; padding:14px 16px; border-top:1px solid rgba(255,255,255,0.06); }
  .sb-user { display:flex; align-items:center; gap:10px; }
  .sb-av { width:32px; height:32px; border-radius:50%; background:var(--g6); display:flex; align-items:center; justify-content:center; font-family:var(--fh); font-size:14px; font-weight:800; color:var(--g2); }
  .sb-uname { font-size:12px; font-weight:700; color:var(--ink5); }
  .sb-urole { font-size:10px; color:var(--ink4); }
  .main { margin-left:var(--sidebar); flex:1; min-width:0; }
  .topbar { background:#fff; border-bottom:1px solid var(--paper3); height:56px; padding:0 28px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:40; }
  .topbar-title { font-family:var(--fh); font-size:17px; font-weight:800; color:var(--ink); }
  .content { padding:24px 28px; }
  .stats { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
  .stat { background:#fff; border:1px solid var(--paper3); border-radius:12px; padding:16px 18px; }
  .stat-label { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--ink3); margin-bottom:8px; }
  .stat-val { font-family:var(--fh); font-size:28px; font-weight:800; color:var(--ink); line-height:1; }
  .stat-sub { font-size:11px; color:var(--ink4); margin-top:5px; }
  .stat.hl { background:var(--g8); border-color:var(--g7); }
  .stat.hl .stat-label { color:var(--g3); }
  .stat.hl .stat-val { color:var(--g1); }
  .tabs { display:flex; gap:0; margin-bottom:16px; border-bottom:2px solid var(--paper3); }
  .tab { padding:9px 16px; font-size:13px; font-weight:700; color:var(--ink3); cursor:pointer; border:none; background:transparent; font-family:var(--fb); border-bottom:2px solid transparent; margin-bottom:-2px; transition:all 0.15s; display:flex; align-items:center; gap:7px; }
  .tab.active { color:var(--g6); border-bottom-color:var(--g5); }
  .tc { background:var(--g1); color:var(--g7); font-size:10px; font-weight:700; padding:1px 6px; border-radius:8px; }
  .tc.u { background:var(--amber-bg); color:var(--amber); }
  .orders { display:flex; flex-direction:column; gap:12px; }
  .ocard { background:#fff; border:1px solid var(--paper3); border-radius:12px; overflow:hidden; }
  .ocard.new { border-left:4px solid var(--amber); }
  .ocard.confirmed { border-left:4px solid var(--g4); }
  .ocard.preparing { border-left:4px solid var(--g5); }
  .ocard.ready_for_pickup { border-left:4px solid var(--g5); }
  .oh { display:flex; align-items:flex-start; justify-content:space-between; padding:14px 16px 10px; gap:12px; }
  .oid { font-family:var(--fm); font-size:13px; font-weight:500; }
  .pill { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; letter-spacing:0.7px; text-transform:uppercase; padding:3px 8px; border-radius:6px; }
  .p-new { background:#FFF3E0; color:#B86800; }
  .p-confirmed,.p-placed { background:var(--g0); color:var(--g6); border:1px solid var(--g1); }
  .p-preparing { background:var(--amber-bg); color:var(--amber); border:1px solid var(--amber-bd); }
  .p-ready_for_pickup { background:var(--g0); color:var(--g5); }
  .p-delivered { background:var(--paper2); color:var(--ink3); }
  .p-cancelled { background:var(--red-bg); color:var(--red); border:1px solid var(--red-bd); }
  .otime { font-size:11px; color:var(--ink4); font-family:var(--fm); white-space:nowrap; }
  .ocust { font-size:13px; color:var(--ink2); margin-top:2px; }
  .oaddr { font-size:12px; color:var(--ink3); margin-top:2px; }
  .oitems { padding:0 16px 12px; display:flex; flex-wrap:wrap; gap:6px; }
  .ochip { background:var(--paper); border:1px solid var(--paper3); border-radius:6px; padding:4px 8px; font-size:12px; color:var(--ink2); font-weight:500; }
  .ochip span { color:var(--ink4); font-size:11px; }
  .ofoot { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; background:var(--paper); border-top:1px solid var(--paper3); gap:10px; flex-wrap:wrap; }
  .ototal { font-family:var(--fh); font-size:16px; font-weight:800; color:var(--ink); }
  .opay { font-size:11px; color:var(--ink3); }
  .oactions { display:flex; gap:8px; }
  .btn { border:none; cursor:pointer; border-radius:8px; font-family:var(--fb); font-weight:700; font-size:13px; padding:8px 14px; transition:all 0.15s; display:flex; align-items:center; gap:6px; white-space:nowrap; }
  .btn-accept { background:var(--g7); color:var(--g0); }
  .btn-accept:hover { background:var(--g5); }
  .btn-reject { background:var(--red-bg); color:var(--red); border:1px solid var(--red-bd); }
  .btn-reject:hover { background:#FAE0E0; }
  .btn-ready { background:var(--amber); color:#fff; }
  .btn-ready:hover { background:#E8A230; }
  .btn-ghost { background:transparent; border:1px solid var(--paper3); color:var(--ink2); }
  .modal-bg { position:fixed; inset:0; background:rgba(15,35,24,0.5); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(2px); }
  .modal { background:#fff; border-radius:16px; padding:28px; width:100%; max-width:420px; }
  .modal h3 { font-family:var(--fh); font-size:18px; color:var(--ink); margin-bottom:6px; }
  .modal p { font-size:13px; color:var(--ink3); margin-bottom:18px; }
  .reasons { display:flex; flex-direction:column; gap:8px; margin-bottom:18px; }
  .reason { border:1.5px solid var(--paper3); border-radius:8px; padding:10px 14px; cursor:pointer; transition:all 0.15s; font-size:14px; color:var(--ink2); }
  .reason:hover,.reason.sel { border-color:var(--red); background:var(--red-bg); color:var(--red); font-weight:600; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; }
  .btn-cancel-m { border:1px solid var(--paper3); background:var(--paper); color:var(--ink2); border-radius:9px; padding:10px 18px; cursor:pointer; font-family:var(--fb); font-size:14px; font-weight:700; }
  .btn-confirm-r { background:var(--red); color:#fff; border:none; cursor:pointer; border-radius:9px; padding:10px 22px; font-family:var(--fh); font-size:15px; font-weight:800; }
  .btn-confirm-r:disabled { opacity:0.5; cursor:not-allowed; }
  .toast { position:fixed; bottom:24px; right:24px; background:var(--g8); color:var(--g1); padding:11px 18px; border-radius:10px; font-size:13px; font-weight:500; box-shadow:0 8px 28px rgba(10,31,20,0.3); z-index:999; animation:toastIn 0.3s; font-family:var(--fb); }
  @keyframes toastIn{from{transform:translateX(20px);opacity:0}to{transform:translateX(0);opacity:1}}
  .empty { background:#fff; border:1px solid var(--paper3); border-radius:12px; padding:48px 24px; text-align:center; color:var(--ink3); }
`;

const REJECT_REASONS = ["Item temporarily unavailable","Too busy right now","Restaurant closing soon","Delivery address out of range","Other"];

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`;
  return `${Math.floor(m/60)}h ago`;
}
function statusPillClass(s: string) {
  return { new:"p-new", placed:"p-placed", confirmed:"p-confirmed", preparing:"p-preparing",
    ready_for_pickup:"p-ready_for_pickup", delivered:"p-delivered", cancelled:"p-cancelled" }[s] ?? "p-placed";
}
function statusLabel(s: string) {
  return { new:"New", placed:"Placed", confirmed:"Confirmed", preparing:"Preparing",
    ready_for_pickup:"Ready", delivered:"Delivered", cancelled:"Cancelled" }[s] ?? s;
}

interface Category { id: string; name: string; menu_items: Array<{ id: string; name: string; price_szl: number; emoji: string; is_available: boolean; description: string | null; }>; }
interface Props { restaurant: Restaurant; initialOrders: OrderEnriched[]; initialCategories: Category[]; activeDrivers: Array<{ id: string; name: string; zone: string }>; }

export default function RestaurantPortalClient({ restaurant, initialOrders, initialCategories, activeDrivers }: Props) {
  const supabase = createClient();
  const [page, setPage] = useState<"orders"|"menu"|"summary">("orders");
  const [isOpen, setIsOpen] = useState(restaurant.is_open);
  const [orders, setOrders] = useState<OrderEnriched[]>(initialOrders);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [tab, setTab] = useState<"active"|"done">("active");
  const [rejectId, setRejectId] = useState<string|null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [activeCat, setActiveCat] = useState(initialCategories[0]?.name ?? "");
  const [toast, setToast] = useState<string|null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (msg: string) => { setToast(msg); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(null), 3000); };

  // Realtime subscription
  useEffect(() => {
    const channel = supabase.channel("restaurant-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `restaurant_id=eq.${restaurant.id}` },
        payload => {
          if (payload.eventType === "INSERT") {
            setOrders(o => [payload.new as OrderEnriched, ...o]);
            showToast("🔔 New order received!");
          } else if (payload.eventType === "UPDATE") {
            setOrders(o => o.map(x => x.id === (payload.new as any).id ? { ...x, ...payload.new } : x));
          }
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [restaurant.id]);

  const updateStatus = async (orderId: string, status: string, extra?: { rejection_reason?: string }) => {
    const res = await fetch(`/api/orders/${orderId}/status`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, ...extra }),
    });
    if (!res.ok) { showToast("❌ Update failed"); return; }
    setOrders(o => o.map(x => x.id === orderId ? { ...x, status: status as any, ...extra } : x));
  };

  const toggleOpen = async () => {
    const next = !isOpen;
    await supabase.from("restaurants").update({ is_open: next }).eq("id", restaurant.id);
    setIsOpen(next);
    showToast(next ? "Restaurant is now Open" : "Restaurant is now Closed");
  };

  const toggleAvailability = async (catName: string, itemId: string, current: boolean) => {
    await supabase.from("menu_items").update({ is_available: !current }).eq("id", itemId);
    setCategories(c => c.map(cat => cat.name === catName ? { ...cat, menu_items: cat.menu_items.map(i => i.id === itemId ? { ...i, is_available: !current } : i) } : cat));
    showToast(!current ? "Item marked available" : "Item marked sold out");
  };

  const activeOrders = orders.filter(o => ["placed","confirmed","preparing","ready_for_pickup"].includes(o.status));
  const doneOrders = orders.filter(o => ["delivered","cancelled"].includes(o.status));
  const newCount = orders.filter(o => o.status === "placed").length;
  const todayGMV = doneOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.total_szl, 0);
  const displayedOrders = tab === "active" ? activeOrders : doneOrders;
  const currentCatItems = categories.find(c => c.name === activeCat)?.menu_items ?? [];

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="sb-top">
            <div className="sb-logo">Trolley<em>.</em></div>
            <div className="sb-role">Restaurant Portal</div>
          </div>
          <div className="toggle-row">
            <span className="toggle-label"><span className={`live-dot ${isOpen ? "on" : "off"}`} />{isOpen ? "Open for orders" : "Closed"}</span>
            <button className={`toggle-sw ${isOpen ? "on" : ""}`} onClick={toggleOpen} />
          </div>
          <div className="nav-section">
            {[["orders","📋","Orders",newCount],["menu","🍽️","Menu",0],["summary","📊","Daily Summary",0]].map(([id,icon,label,badge]) => (
              <button key={id as string} className={`nav-item ${page === id ? "active" : ""}`} onClick={() => setPage(id as any)}>
                <span>{icon}</span>{label}
                {(badge as number) > 0 && <span className="nb">{badge}</span>}
              </button>
            ))}
          </div>
          <div className="sb-footer">
            <div className="sb-user">
              <div className="sb-av">{restaurant.emoji}</div>
              <div><div className="sb-uname">{restaurant.name}</div><div className="sb-urole">Restaurant Admin</div></div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">
              {page === "orders" && "Order Management"}
              {page === "menu" && "Menu Management"}
              {page === "summary" && "Daily Summary"}
            </div>
          </div>
          <div className="content">

            {page === "orders" && (<>
              <div className="stats">
                <div className="stat hl"><div className="stat-label">New Orders</div><div className="stat-val">{newCount}</div><div className="stat-sub">Awaiting acceptance</div></div>
                <div className="stat"><div className="stat-label">Active</div><div className="stat-val">{activeOrders.length}</div><div className="stat-sub">In progress</div></div>
                <div className="stat"><div className="stat-label">Delivered Today</div><div className="stat-val">{doneOrders.filter(o=>o.status==="delivered").length}</div><div className="stat-sub">Completed</div></div>
                <div className="stat"><div className="stat-label">Revenue</div><div className="stat-val">SZL {todayGMV.toFixed(0)}</div><div className="stat-sub">Today</div></div>
              </div>
              <div className="tabs">
                <button className={`tab ${tab==="active"?"active":""}`} onClick={()=>setTab("active")}>Active <span className={`tc ${newCount>0?"u":""}`}>{activeOrders.length}</span></button>
                <button className={`tab ${tab==="done"?"active":""}`} onClick={()=>setTab("done")}>Completed <span className="tc">{doneOrders.length}</span></button>
              </div>
              <div className="orders">
                {displayedOrders.length === 0 && <div className="empty"><div style={{fontSize:36,marginBottom:12}}>✅</div>No {tab==="active"?"active":"completed"} orders right now.</div>}
                {displayedOrders.map(o => (
                  <div key={o.id} className={`ocard ${o.status}`}>
                    <div className="oh">
                      <div>
                        <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
                          <span className="oid">{o.ref}</span>
                          <span className={`pill ${statusPillClass(o.status)}`}>{statusLabel(o.status)}</span>
                        </div>
                        <div className="ocust">👤 {o.customer_name ?? o.guest_name ?? "Guest"} · {o.customer_phone_profile ?? o.delivery_phone}</div>
                        <div className="oaddr">📍 {o.delivery_address}</div>
                      </div>
                      <div className="otime">{timeAgo(o.created_at)}</div>
                    </div>
                    <div className="oitems">
                      {/* order items loaded separately - show total for now */}
                      <span className="ochip">SZL {o.total_szl.toFixed(2)} total</span>
                      <span className="ochip">{o.payment_method === "mtn_momo" ? "📱 MTN MoMo" : "💳 Card"}</span>
                    </div>
                    <div className="ofoot">
                      <div><div className="ototal">SZL {o.total_szl.toFixed(2)}</div></div>
                      <div className="oactions">
                        {o.status === "placed" && <>
                          <button className="btn btn-reject" onClick={() => { setRejectId(o.id); setRejectReason(""); }}>✕ Reject</button>
                          <button className="btn btn-accept" onClick={() => { updateStatus(o.id,"confirmed"); showToast("✓ Order accepted"); }}>✓ Accept</button>
                        </>}
                        {o.status === "confirmed" && <button className="btn btn-ready" onClick={() => { updateStatus(o.id,"preparing"); showToast("Marked as preparing"); }}>👨‍🍳 Start Preparing</button>}
                        {o.status === "preparing" && <button className="btn btn-ready" onClick={() => { updateStatus(o.id,"ready_for_pickup"); showToast("🛵 Driver notified"); }}>✅ Ready for Pickup</button>}
                        {o.status === "ready_for_pickup" && <button className="btn btn-ghost" style={{cursor:"default"}}>⏳ Awaiting driver…</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>)}

            {page === "menu" && (<>
              <div style={{display:"flex",gap:20,alignItems:"flex-start"}}>
                <div style={{width:220,background:"#fff",border:"1px solid var(--paper3)",borderRadius:12,overflow:"hidden",flexShrink:0}}>
                  <div style={{padding:"12px 14px",fontFamily:"var(--fh)",fontSize:13,fontWeight:700,background:"var(--paper)",borderBottom:"1px solid var(--paper3)"}}>Categories</div>
                  {categories.map(cat => (
                    <div key={cat.id} onClick={() => setActiveCat(cat.name)}
                      style={{padding:"10px 14px",cursor:"pointer",borderBottom:"1px solid var(--paper2)",fontSize:13,fontWeight:activeCat===cat.name?700:400,background:activeCat===cat.name?"var(--g0)":"transparent",color:activeCat===cat.name?"var(--g7)":"var(--ink2)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      {cat.name}
                      <span style={{fontSize:11,background:activeCat===cat.name?"var(--g1)":"var(--paper2)",padding:"2px 6px",borderRadius:5,color:activeCat===cat.name?"var(--g7)":"var(--ink3)"}}>{cat.menu_items.length}</span>
                    </div>
                  ))}
                </div>
                <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
                  {currentCatItems.map(item => (
                    <div key={item.id} style={{background:"#fff",border:"1px solid var(--paper3)",borderRadius:12,padding:"14px 16px",display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:52,height:52,borderRadius:10,background:"var(--g0)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}}>{item.emoji}</div>
                      <div style={{flex:1}}>
                        <div style={{fontSize:14,fontWeight:700,color:"var(--ink)"}}>{item.name} {!item.is_available && <span style={{fontSize:10,fontWeight:700,background:"var(--red-bg)",color:"var(--red)",padding:"2px 7px",borderRadius:5,marginLeft:8}}>SOLD OUT</span>}</div>
                        <div style={{fontSize:12,color:"var(--ink3)",marginTop:2}}>{item.description}</div>
                        <div style={{fontFamily:"var(--fm)",fontSize:14,fontWeight:600,color:"var(--g6)",marginTop:4}}>SZL {item.price_szl.toFixed(2)}</div>
                      </div>
                      <button onClick={() => toggleAvailability(activeCat, item.id, item.is_available)}
                        style={{display:"flex",alignItems:"center",gap:6,fontSize:11,fontWeight:700,color:"var(--ink3)",background:"var(--paper)",border:"1px solid var(--paper3)",borderRadius:6,padding:"5px 9px",cursor:"pointer",fontFamily:"var(--fb)"}}>
                        <span style={{width:7,height:7,borderRadius:"50%",background:item.is_available?"var(--g4)":"var(--red)",flexShrink:0,display:"inline-block"}} />
                        {item.is_available ? "Available" : "Sold Out"}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </>)}

            {page === "summary" && (<>
              <div className="stats">
                <div className="stat hl"><div className="stat-label">Total Orders</div><div className="stat-val">{orders.length}</div><div className="stat-sub">Today</div></div>
                <div className="stat"><div className="stat-label">Delivered</div><div className="stat-val">{doneOrders.filter(o=>o.status==="delivered").length}</div><div className="stat-sub">Completed</div></div>
                <div className="stat"><div className="stat-label">Cancelled</div><div className="stat-val">{doneOrders.filter(o=>o.status==="cancelled").length}</div><div className="stat-sub">Today</div></div>
                <div className="stat"><div className="stat-label">Revenue</div><div className="stat-val">SZL {todayGMV.toFixed(0)}</div><div className="stat-sub">Gross</div></div>
              </div>
              <div style={{background:"#fff",border:"1px solid var(--paper3)",borderRadius:12,overflow:"hidden"}}>
                <div style={{padding:"14px 18px",background:"var(--paper)",borderBottom:"1px solid var(--paper3)",fontFamily:"var(--fh)",fontSize:14,fontWeight:700}}>All Orders Today</div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Order","Customer","Status","Total"].map(h => <th key={h} style={{fontSize:10,fontWeight:700,letterSpacing:"1px",textTransform:"uppercase",color:"var(--ink4)",padding:"10px 18px",textAlign:"left",borderBottom:"1px solid var(--paper3)",background:"var(--paper)"}}>{h}</th>)}</tr></thead>
                  <tbody>
                    {orders.map(o => (
                      <tr key={o.id} style={{borderBottom:"1px solid var(--paper2)"}}>
                        <td style={{padding:"10px 18px",fontFamily:"var(--fm)",fontSize:12,color:"var(--ink3)"}}>{o.ref}</td>
                        <td style={{padding:"10px 18px",fontSize:13}}>{o.customer_name ?? "Guest"}</td>
                        <td style={{padding:"10px 18px"}}><span className={`pill ${statusPillClass(o.status)}`}>{statusLabel(o.status)}</span></td>
                        <td style={{padding:"10px 18px",fontFamily:"var(--fm)",fontSize:13,fontWeight:600,color:"var(--g6)"}}>SZL {o.total_szl.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>)}
          </div>
        </main>
      </div>

      {rejectId && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setRejectId(null)}>
          <div className="modal">
            <h3>Reject Order</h3>
            <p>Select a reason. The customer will be notified via SMS and refunded within 24 hours.</p>
            <div className="reasons">
              {REJECT_REASONS.map(r => <div key={r} className={`reason ${rejectReason===r?"sel":""}`} onClick={() => setRejectReason(r)}>{rejectReason===r?"◉":"○"} {r}</div>)}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel-m" onClick={() => setRejectId(null)}>Cancel</button>
              <button className="btn-confirm-r" disabled={!rejectReason} onClick={() => { updateStatus(rejectId,"cancelled",{rejection_reason:rejectReason}); setRejectId(null); showToast("Order rejected"); }}>Confirm Rejection</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
