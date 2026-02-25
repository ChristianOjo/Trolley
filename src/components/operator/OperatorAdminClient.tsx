"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Restaurant, Driver, OrderEnriched, DeliveryZone, CityZone } from "@/types/database.types";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Epilogue:wght@400;600;700;800;900&family=Fira+Code:wght@400;500;600&family=Lato:wght@400;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --ink:#111916; --ink2:#2D3E34; --ink3:#556B5C; --ink4:#8AA494; --ink5:#B8CDBF;
    --paper:#F4F1EB; --paper2:#ECE9E1; --paper3:#E2DDD4; --white:#FFFFFF;
    --g9:#0F2318; --g8:#163222; --g7:#1E4530; --g6:#275A3E; --g5:#317550; --g4:#3D9162;
    --g3:#5AB07E; --g2:#90CCA8; --g1:#C2E5D0; --g0:#E8F5EE;
    --amber:#C4831A; --amber-bg:#FDF6EC; --amber-bd:#F0D4A0;
    --red:#C0392B; --red-bg:#FDF2F0; --red-bd:#EFB8B2;
    --blue:#2563B8; --blue-bg:#EEF4FD; --blue-bd:#BACDE8;
    --sidebar:240px; --fh:'Epilogue',sans-serif; --fb:'Lato',sans-serif; --fm:'Fira Code',monospace;
  }
  body { font-family:var(--fb); background:var(--paper); color:var(--ink); -webkit-font-smoothing:antialiased; }
  .shell { display:flex; min-height:100vh; }
  .sidebar { width:var(--sidebar); background:var(--ink); position:fixed; top:0; left:0; bottom:0; z-index:60; display:flex; flex-direction:column; }
  .sb-top { padding:22px 20px 18px; border-bottom:1px solid rgba(255,255,255,0.07); }
  .sb-logo { font-family:var(--fh); font-size:24px; font-weight:900; letter-spacing:-0.8px; color:#fff; }
  .sb-logo em { color:#E8B55A; font-style:normal; }
  .sb-role { font-size:10px; letter-spacing:2px; text-transform:uppercase; color:var(--ink4); margin-top:3px; font-weight:700; }
  .sb-live { margin:12px 14px; background:rgba(61,145,98,0.12); border:1px solid rgba(61,145,98,0.22); border-radius:10px; padding:10px 14px; display:flex; align-items:center; gap:10px; }
  .live-dot { width:8px; height:8px; border-radius:50%; background:var(--g3); flex-shrink:0; animation:livePulse 2s infinite; }
  @keyframes livePulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(90,176,126,0.5)}50%{opacity:0.7;box-shadow:0 0 0 5px rgba(90,176,126,0)}}
  .live-text { font-size:12px; font-weight:700; color:var(--g2); }
  .live-sub { font-size:10px; color:var(--ink4); margin-top:1px; }
  .sb-nav { flex:1; padding:10px 0; overflow-y:auto; }
  .sb-section-lbl { font-size:9px; letter-spacing:2px; text-transform:uppercase; color:var(--ink4); padding:12px 20px 5px; font-weight:700; }
  .sb-item { display:flex; align-items:center; gap:11px; padding:10px 16px; margin:1px 8px; border-radius:9px; cursor:pointer; color:var(--ink4); font-size:13px; font-weight:600; transition:all 0.15s; border:none; background:transparent; width:calc(100% - 16px); text-align:left; font-family:var(--fb); }
  .sb-item:hover { color:#fff; background:rgba(255,255,255,0.06); }
  .sb-item.active { color:#fff; background:var(--g7); }
  .sb-badge { margin-left:auto; background:var(--amber); color:#fff; font-size:10px; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 4px; }
  .sb-footer { padding:14px 16px; border-top:1px solid rgba(255,255,255,0.07); }
  .main { margin-left:var(--sidebar); flex:1; min-width:0; }
  .topbar { background:#fff; border-bottom:1px solid var(--paper3); height:56px; padding:0 28px; display:flex; align-items:center; justify-content:space-between; position:sticky; top:0; z-index:40; }
  .topbar-title { font-family:var(--fh); font-size:17px; font-weight:800; color:var(--ink); }
  .topbar-btn { background:var(--g7); color:#fff; border:none; cursor:pointer; border-radius:8px; padding:8px 14px; font-family:var(--fh); font-size:13px; font-weight:700; transition:background 0.15s; display:flex; align-items:center; gap:6px; }
  .topbar-btn:hover { background:var(--g6); }
  .content { padding:24px 28px; }
  .kpis { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:24px; }
  .kpi { background:#fff; border:1px solid var(--paper3); border-radius:12px; padding:18px 20px; position:relative; overflow:hidden; }
  .kpi::before { content:''; position:absolute; top:0; left:0; right:0; height:3px; }
  .kpi.green::before { background:linear-gradient(90deg,var(--g5),var(--g3)); }
  .kpi.amber::before { background:linear-gradient(90deg,var(--amber),#E8B55A); }
  .kpi.blue::before { background:linear-gradient(90deg,var(--blue),#60A5FA); }
  .kpi.red::before { background:linear-gradient(90deg,var(--red),#F87171); }
  .kpi-lbl { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--ink3); margin-bottom:10px; }
  .kpi-val { font-family:var(--fh); font-size:32px; font-weight:900; color:var(--ink); line-height:1; letter-spacing:-1px; }
  .kpi-sub { font-size:12px; color:var(--ink4); margin-top:6px; }
  .two-col { display:grid; grid-template-columns:1fr 1fr; gap:20px; margin-bottom:20px; }
  .panel { background:#fff; border:1px solid var(--paper3); border-radius:14px; overflow:hidden; margin-bottom:20px; }
  .ph { padding:14px 20px; border-bottom:1px solid var(--paper3); display:flex; align-items:center; justify-content:space-between; background:var(--paper); }
  .ph h3 { font-family:var(--fh); font-size:14px; font-weight:800; color:var(--ink); }
  .filter-row { display:flex; align-items:center; gap:10px; flex-wrap:wrap; padding:12px 18px; border-bottom:1px solid var(--paper3); background:var(--paper); }
  .filter-select { border:1.5px solid var(--paper3); border-radius:8px; padding:7px 12px; font-family:var(--fb); font-size:13px; color:var(--ink); background:#fff; outline:none; cursor:pointer; }
  .filter-select:focus { border-color:var(--g4); }
  table { width:100%; border-collapse:collapse; }
  th { font-size:10px; font-weight:700; letter-spacing:1.2px; text-transform:uppercase; color:var(--ink4); padding:10px 18px; text-align:left; border-bottom:1px solid var(--paper3); background:var(--paper); white-space:nowrap; }
  td { padding:11px 18px; font-size:13px; color:var(--ink2); border-bottom:1px solid var(--paper2); vertical-align:middle; }
  tr:last-child td { border-bottom:none; }
  tbody tr:hover { background:var(--paper); }
  .td-mono { font-family:var(--fm); font-size:12px; color:var(--ink3); }
  .td-bold { font-weight:700; color:var(--ink); }
  .td-amount { font-family:var(--fm); font-size:13px; font-weight:600; color:var(--g6); }
  .pill { display:inline-flex; align-items:center; gap:5px; font-size:10px; font-weight:700; letter-spacing:0.7px; text-transform:uppercase; padding:3px 8px; border-radius:6px; white-space:nowrap; }
  .pd { width:5px; height:5px; border-radius:50%; background:currentColor; flex-shrink:0; }
  .p-placed,.p-confirmed { background:var(--g0); color:var(--g6); border:1px solid var(--g1); }
  .p-preparing { background:var(--amber-bg); color:var(--amber); border:1px solid var(--amber-bd); }
  .p-ready_for_pickup { background:var(--blue-bg); color:var(--blue); border:1px solid var(--blue-bd); }
  .p-delivered { background:var(--paper2); color:var(--ink3); border:1px solid var(--paper3); }
  .p-cancelled { background:var(--red-bg); color:var(--red); border:1px solid var(--red-bd); }
  .p-active { background:var(--g0); color:var(--g6); border:1px solid var(--g1); }
  .p-inactive { background:var(--paper2); color:var(--ink4); border:1px solid var(--paper3); }
  .tbl-btn { border:none; cursor:pointer; border-radius:6px; font-family:var(--fb); font-size:12px; font-weight:700; padding:5px 10px; transition:all 0.15s; display:inline-flex; align-items:center; gap:5px; }
  .tb-primary { background:var(--g7); color:#fff; }
  .tb-primary:hover { background:var(--g5); }
  .tb-ghost { background:var(--paper); border:1px solid var(--paper3); color:var(--ink2); }
  .tb-ghost:hover { background:var(--paper2); }
  .tb-danger { background:var(--red-bg); color:var(--red); border:1px solid var(--red-bd); }
  .tb-danger:hover { background:#FACECE; }
  .assign-select { border:1.5px solid var(--paper3); border-radius:7px; padding:6px 10px; font-family:var(--fb); font-size:13px; color:var(--ink); background:var(--paper); outline:none; cursor:pointer; }
  .assign-select:focus { border-color:var(--g4); }
  .zone-card { background:#fff; border:1px solid var(--paper3); border-radius:12px; padding:20px 22px; margin-bottom:12px; display:flex; align-items:center; gap:16px; }
  .zone-icon { font-size:32px; flex-shrink:0; }
  .zone-name { font-family:var(--fh); font-size:16px; font-weight:800; color:var(--ink); }
  .zone-desc { font-size:13px; color:var(--ink3); margin-top:2px; }
  .zone-fee-inp { border:2px solid var(--paper3); border-radius:9px; padding:10px 14px; font-family:var(--fm); font-size:18px; font-weight:600; color:var(--ink); width:110px; text-align:right; outline:none; transition:border-color 0.15s; background:var(--paper); }
  .zone-fee-inp:focus { border-color:var(--g4); background:#fff; }
  .zone-save { background:var(--g7); color:#fff; border:none; cursor:pointer; border-radius:8px; padding:10px 14px; font-family:var(--fh); font-size:13px; font-weight:800; transition:background 0.15s; white-space:nowrap; }
  .zone-save:hover { background:var(--g5); }
  .modal-bg { position:fixed; inset:0; background:rgba(17,25,22,0.5); z-index:200; display:flex; align-items:center; justify-content:center; padding:20px; backdrop-filter:blur(3px); animation:fadeIn 0.2s; }
  @keyframes fadeIn{from{opacity:0}to{opacity:1}}
  .modal { background:#fff; border-radius:18px; padding:30px; width:100%; max-width:500px; animation:modalUp 0.25s ease; }
  @keyframes modalUp{from{transform:translateY(16px);opacity:0}to{transform:translateY(0);opacity:1}}
  .modal-title { font-family:var(--fh); font-size:22px; font-weight:900; color:var(--ink); margin-bottom:4px; }
  .modal-sub { font-size:13px; color:var(--ink3); margin-bottom:24px; }
  .fg2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
  .fg { display:flex; flex-direction:column; gap:6px; }
  .fg.full { grid-column:1/-1; }
  .fl { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--ink3); }
  .fi { border:1.5px solid var(--paper3); border-radius:9px; padding:11px 14px; font-family:var(--fb); font-size:14px; color:var(--ink); background:var(--paper); outline:none; transition:border-color 0.15s; width:100%; }
  .fi:focus { border-color:var(--g4); background:#fff; }
  .modal-actions { display:flex; gap:10px; justify-content:flex-end; margin-top:22px; }
  .btn-cancel-m { border:1px solid var(--paper3); background:var(--paper); color:var(--ink2); border-radius:9px; padding:10px 18px; cursor:pointer; font-family:var(--fb); font-size:14px; font-weight:700; }
  .btn-save-m { background:var(--g7); color:#fff; border:none; cursor:pointer; border-radius:9px; padding:10px 22px; font-family:var(--fh); font-size:15px; font-weight:800; transition:background 0.15s; }
  .btn-save-m:hover { background:var(--g5); }
  .btn-save-m:disabled { opacity:0.5; cursor:not-allowed; }
  .toast { position:fixed; bottom:24px; right:24px; background:var(--ink); color:#fff; padding:12px 20px; border-radius:10px; font-size:13px; font-weight:700; z-index:999; animation:toastIn 0.3s; font-family:var(--fb); }
  @keyframes toastIn{from{transform:translateY(10px);opacity:0}to{transform:translateY(0);opacity:1}}
  @media(max-width:1100px){.kpis{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:900px){.two-col{grid-template-columns:1fr}}
  @media(max-width:700px){:root{--sidebar:0px}.sidebar{display:none}.kpis{grid-template-columns:1fr 1fr}}
`;

type Page = "dashboard" | "orders" | "restaurants" | "drivers" | "zones" | "revenue";
const PILL_MAP: Record<string, [string, string]> = {
  placed: ["p-placed", "Placed"], confirmed: ["p-confirmed", "Confirmed"],
  preparing: ["p-preparing", "Preparing"], ready_for_pickup: ["p-ready_for_pickup", "Ready"],
  delivered: ["p-delivered", "Delivered"], cancelled: ["p-cancelled", "Cancelled"],
};

function StatusPill({ status }: { status: string }) {
  const [cls, lbl] = PILL_MAP[status] ?? ["p-placed", status];
  return <span className={`pill ${cls}`}><span className="pd" />{lbl}</span>;
}
function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "just now"; if (m < 60) return `${m}m ago`; return `${Math.floor(m / 60)}h ago`;
}
const today = new Date().toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long" });

interface Props {
  initialOrders: OrderEnriched[];
  initialRestaurants: Restaurant[];
  initialDrivers: Driver[];
  initialZones: DeliveryZone[];
}

export default function OperatorAdminClient({ initialOrders, initialRestaurants, initialDrivers, initialZones }: Props) {
  const supabase = createClient();
  const [page, setPage] = useState<Page>("dashboard");
  const [orders, setOrders] = useState(initialOrders);
  const [restaurants, setRestaurants] = useState(initialRestaurants);
  const [drivers, setDrivers] = useState(initialDrivers);
  const [zones, setZones] = useState(initialZones);
  const [zoneFees, setZoneFees] = useState<number[]>(initialZones.map(z => z.flat_fee_szl));
  const [orderFilter, setOrderFilter] = useState({ status: "all", restaurantId: "all" });
  const [modal, setModal] = useState<"restaurant" | "driver" | null>(null);
  const [newRest, setNewRest] = useState({ name: "", emoji: "🍽️", zone: "Mbabane", cuisine: "", phone: "", email: "", address: "" });
  const [newDriver, setNewDriver] = useState({ name: "", phone: "", zone: "Mbabane" });
  const [toast, setToast] = useState<string | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout>>();

  const showToast = (msg: string) => { setToast(msg); clearTimeout(toastRef.current); toastRef.current = setTimeout(() => setToast(null), 3200); };

  // KPIs
  const delivered = orders.filter(o => o.status === "delivered");
  const todayGMV = delivered.reduce((s, o) => s + o.total_szl, 0);
  const platformFee = Math.round(todayGMV * 0.1);
  const pendingAssign = orders.filter(o => ["confirmed", "preparing"].includes(o.status) && !o.driver_id).length;

  const toggleRestaurant = async (id: string, current: boolean) => {
    await supabase.from("restaurants").update({ is_active: !current }).eq("id", id);
    setRestaurants(r => r.map(x => x.id === id ? { ...x, is_active: !current } : x));
    const r = restaurants.find(x => x.id === id);
    showToast(current ? `${r?.name} deactivated` : `${r?.name} activated`);
  };

  const toggleDriver = async (id: string, current: boolean) => {
    await supabase.from("drivers").update({ is_active: !current }).eq("id", id);
    setDrivers(d => d.map(x => x.id === id ? { ...x, is_active: !current } : x));
    const d = drivers.find(x => x.id === id);
    showToast(`${d?.name} ${current ? "deactivated" : "activated"}`);
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    await supabase.from("orders").update({ driver_id: driverId || null }).eq("id", orderId);
    setOrders(o => o.map(x => x.id === orderId ? { ...x, driver_id: driverId || null } : x));
    if (driverId) {
      const d = drivers.find(x => x.id === driverId);
      showToast(`✓ ${d?.name} assigned`);
    }
  };

  const saveZoneFee = async (idx: number) => {
    const zone = zones[idx];
    await supabase.from("delivery_zones").update({ flat_fee_szl: zoneFees[idx] }).eq("name", zone.name);
    setZones(z => z.map((x, i) => i === idx ? { ...x, flat_fee_szl: zoneFees[idx] } : x));
    showToast(`✓ ${zone.name} fee updated to SZL ${zoneFees[idx]}`);
  };

  const addRestaurant = async () => {
    if (!newRest.name) return;
    const slug = newRest.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { data, error } = await supabase.from("restaurants").insert({
      ...newRest, slug,
      zone: newRest.zone as CityZone,
      is_open: false, is_active: true,
      min_order_szl: 0,
      estimated_delivery_min: 30, estimated_delivery_max: 45,
    }).select().single();
    if (error) { showToast("❌ " + error.message); return; }
    if (data) setRestaurants(r => [...r, data]);
    showToast(`✓ "${newRest.name}" onboarded`);
    setModal(null);
    setNewRest({ name: "", emoji: "🍽️", zone: "Mbabane", cuisine: "", phone: "", email: "", address: "" });
  };

  const addDriver = async () => {
    if (!newDriver.name || !newDriver.phone) return;
    // In production: create auth user first, then create driver record
    // For now we insert with a placeholder profile_id note
    showToast(`✓ ${newDriver.name} added (link Supabase auth user to complete)`);
    setModal(null);
  };

  const filteredOrders = orders.filter(o => {
    const sOk = orderFilter.status === "all" || o.status === orderFilter.status;
    const rOk = orderFilter.restaurantId === "all" || o.restaurant_id === orderFilter.restaurantId;
    return sOk && rOk;
  });

  const NAV: Array<[Page, string, string, number?]> = [
    ["dashboard", "📊", "Dashboard"],
    ["orders", "📋", "All Orders", pendingAssign || undefined],
    ["restaurants", "🍽️", "Restaurants"],
    ["drivers", "🛵", "Drivers"],
    ["zones", "📍", "Delivery Zones"],
    ["revenue", "💰", "Revenue"],
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <aside className="sidebar">
          <div className="sb-top">
            <div className="sb-logo">Trolley<em>.</em></div>
            <div className="sb-role">Operator Admin</div>
          </div>
          <div className="sb-live">
            <span className="live-dot" />
            <div>
              <div className="live-text">Platform Live</div>
              <div className="live-sub">{restaurants.filter(r => r.is_active).length} restaurants · {drivers.filter(d => d.is_active).length} drivers</div>
            </div>
          </div>
          <nav className="sb-nav">
            <div className="sb-section-lbl">Overview</div>
            {NAV.slice(0, 2).map(([id, icon, label, badge]) => (
              <button key={id} className={`sb-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
                <span>{icon}</span>{label}{badge ? <span className="sb-badge">{badge}</span> : null}
              </button>
            ))}
            <div className="sb-section-lbl">Management</div>
            {NAV.slice(2, 5).map(([id, icon, label]) => (
              <button key={id} className={`sb-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
                <span>{icon}</span>{label}
              </button>
            ))}
            <div className="sb-section-lbl">Finance</div>
            {NAV.slice(5).map(([id, icon, label]) => (
              <button key={id} className={`sb-item ${page === id ? "active" : ""}`} onClick={() => setPage(id)}>
                <span>{icon}</span>{label}
              </button>
            ))}
          </nav>
          <div className="sb-footer">
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--g7)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--fh)", fontSize: 14, fontWeight: 800, color: "var(--g2)" }}>T</div>
              <div><div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink5)" }}>Trolley HQ</div><div style={{ fontSize: 10, color: "var(--ink4)" }}>Super Admin</div></div>
            </div>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div className="topbar-title">{NAV.find(n => n[0] === page)?.[2]}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "var(--fm)", fontSize: 11, color: "var(--ink3)" }}>{today}</span>
              {page === "restaurants" && <button className="topbar-btn" onClick={() => setModal("restaurant")}>+ Onboard Restaurant</button>}
              {page === "drivers" && <button className="topbar-btn" onClick={() => setModal("driver")}>+ Add Driver</button>}
            </div>
          </div>

          <div className="content">

            {/* ── DASHBOARD ── */}
            {page === "dashboard" && (<>
              <div className="kpis">
                <div className="kpi green"><div className="kpi-lbl">Platform GMV Today</div><div className="kpi-val">SZL {todayGMV.toFixed(0)}</div><div className="kpi-sub">Gross order value</div></div>
                <div className="kpi amber"><div className="kpi-lbl">Platform Fee</div><div className="kpi-val">SZL {platformFee}</div><div className="kpi-sub">10% commission</div></div>
                <div className="kpi blue"><div className="kpi-lbl">Orders Today</div><div className="kpi-val">{orders.length}</div><div className="kpi-sub">{delivered.length} delivered</div></div>
                <div className="kpi red"><div className="kpi-lbl">Needs Driver</div><div className="kpi-val">{pendingAssign}</div><div className="kpi-sub">Unassigned orders</div></div>
              </div>
              <div className="two-col">
                <div className="panel">
                  <div className="ph"><h3>Recent Orders</h3><button className="tbl-btn tb-ghost" onClick={() => setPage("orders")}>View all →</button></div>
                  <table><thead><tr><th>Order</th><th>Restaurant</th><th>Status</th><th>Total</th></tr></thead>
                    <tbody>{orders.slice(0, 5).map(o => (
                      <tr key={o.id}>
                        <td className="td-mono">{o.ref}</td>
                        <td style={{ fontSize: 12, fontWeight: 600 }}>{o.restaurant_name}</td>
                        <td><StatusPill status={o.status} /></td>
                        <td className="td-amount">SZL {o.total_szl.toFixed(0)}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
                <div className="panel">
                  <div className="ph"><h3>Driver Status</h3><button className="tbl-btn tb-ghost" onClick={() => setPage("drivers")}>Manage →</button></div>
                  <table><thead><tr><th>Driver</th><th>Zone</th><th>Status</th></tr></thead>
                    <tbody>{drivers.map(d => (
                      <tr key={d.id}>
                        <td className="td-bold">{d.name}</td>
                        <td style={{ fontSize: 12 }}>{d.zone}</td>
                        <td><span className={`pill ${d.is_active ? "p-active" : "p-inactive"}`}><span className="pd" />{d.is_active ? "Active" : "Offline"}</span></td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            </>)}

            {/* ── ALL ORDERS ── */}
            {page === "orders" && (
              <div className="panel">
                <div className="filter-row">
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--ink3)" }}>Filter:</span>
                  <select className="filter-select" value={orderFilter.status} onChange={e => setOrderFilter(f => ({ ...f, status: e.target.value }))}>
                    <option value="all">All Statuses</option>
                    {["placed", "confirmed", "preparing", "ready_for_pickup", "delivered", "cancelled"].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select className="filter-select" value={orderFilter.restaurantId} onChange={e => setOrderFilter(f => ({ ...f, restaurantId: e.target.value }))}>
                    <option value="all">All Restaurants</option>
                    {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink3)", fontWeight: 700 }}>{filteredOrders.length} orders</span>
                </div>
                <div style={{ overflowX: "auto" }}>
                  <table>
                    <thead><tr><th>Order</th><th>Restaurant</th><th>Customer</th><th>Total</th><th>Payment</th><th>Status</th><th>Assign Driver</th><th>Time</th></tr></thead>
                    <tbody>
                      {filteredOrders.map(o => {
                        const assignedDriver = drivers.find(d => d.id === o.driver_id);
                        return (
                          <tr key={o.id}>
                            <td className="td-mono">{o.ref}</td>
                            <td style={{ fontSize: 12, fontWeight: 600 }}>{o.restaurant_name}</td>
                            <td className="td-bold" style={{ fontSize: 12 }}>{o.customer_name ?? "Guest"}</td>
                            <td className="td-amount">SZL {o.total_szl.toFixed(0)}</td>
                            <td style={{ fontSize: 11 }}>{o.payment_method === "mtn_momo" ? "📱" : "💳"} {o.payment_method}</td>
                            <td><StatusPill status={o.status} /></td>
                            <td>
                              {["cancelled", "delivered"].includes(o.status) ? (
                                <span style={{ fontSize: 12, color: "var(--ink4)" }}>{assignedDriver?.name.split(" ")[0] ?? "—"}</span>
                              ) : (
                                <select className="assign-select" value={o.driver_id ?? ""} onChange={e => assignDriver(o.id, e.target.value)}>
                                  <option value="">Unassigned</option>
                                  {drivers.filter(d => d.is_active).map(d => <option key={d.id} value={d.id}>{d.name.split(" ")[0]} ({d.zone})</option>)}
                                </select>
                              )}
                            </td>
                            <td style={{ fontSize: 11, color: "var(--ink4)", fontFamily: "var(--fm)", whiteSpace: "nowrap" }}>{timeAgo(o.created_at)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ── RESTAURANTS ── */}
            {page === "restaurants" && (
              <div className="panel">
                <div className="ph"><h3>{restaurants.length} Restaurants</h3><button className="topbar-btn" onClick={() => setModal("restaurant")}>+ Onboard</button></div>
                <table>
                  <thead><tr><th></th><th>Name</th><th>Cuisine</th><th>Zone</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {restaurants.map(r => (
                      <tr key={r.id}>
                        <td style={{ fontSize: 20 }}>{r.emoji}</td>
                        <td className="td-bold">{r.name}</td>
                        <td style={{ fontSize: 12, color: "var(--ink3)" }}>{r.cuisine_type}</td>
                        <td style={{ fontSize: 12 }}>{r.zone}</td>
                        <td><span className={`pill ${r.is_active ? "p-active" : "p-inactive"}`}><span className="pd" />{r.is_active ? "Active" : "Inactive"}</span></td>
                        <td>
                          <button className={`tbl-btn ${r.is_active ? "tb-danger" : "tb-primary"}`} onClick={() => toggleRestaurant(r.id, r.is_active)}>
                            {r.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── DRIVERS ── */}
            {page === "drivers" && (
              <div className="panel">
                <div className="ph"><h3>{drivers.length} Drivers</h3><button className="topbar-btn" onClick={() => setModal("driver")}>+ Add Driver</button></div>
                <table>
                  <thead><tr><th>Name</th><th>Phone</th><th>Zone</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {drivers.map(d => (
                      <tr key={d.id}>
                        <td className="td-bold">{d.name}</td>
                        <td className="td-mono" style={{ fontSize: 12 }}>{d.phone}</td>
                        <td style={{ fontSize: 13 }}>{d.zone}</td>
                        <td><span className={`pill ${d.is_active ? "p-active" : "p-inactive"}`}><span className="pd" />{d.is_active ? "Active" : "Offline"}</span></td>
                        <td>
                          <button className={`tbl-btn ${d.is_active ? "tb-danger" : "tb-primary"}`} onClick={() => toggleDriver(d.id, d.is_active)}>
                            {d.is_active ? "Deactivate" : "Activate"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── ZONES ── */}
            {page === "zones" && (<>
              <p style={{ fontSize: 14, color: "var(--ink3)", marginBottom: 20, maxWidth: 540 }}>
                Set flat delivery fees per zone. Changes take effect immediately for all new orders.
              </p>
              {zones.map((zone, idx) => (
                <div key={zone.id} className="zone-card">
                  <span className="zone-icon">{zone.name === "Mbabane" ? "🏙️" : zone.name === "Manzini" ? "🌇" : "🗺️"}</span>
                  <div style={{ flex: 1 }}>
                    <div className="zone-name">{zone.name}</div>
                    <div className="zone-desc">Flat delivery fee for {zone.name} zone</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 13, color: "var(--ink3)", fontWeight: 700 }}>SZL</span>
                    <input className="zone-fee-inp" type="number" min="0" step="5" value={zoneFees[idx]}
                      onChange={e => setZoneFees(f => f.map((v, i) => i === idx ? Number(e.target.value) : v))} />
                    <button className="zone-save" onClick={() => saveZoneFee(idx)}>Save</button>
                  </div>
                </div>
              ))}
              <div style={{ padding: "14px 18px", background: "var(--amber-bg)", border: "1px solid var(--amber-bd)", borderRadius: 10, fontSize: 13, color: "var(--amber)", fontWeight: 600 }}>
                ⚠ Fees are flat rates. Dynamic / surge pricing is deferred to V2.
              </div>
            </>)}

            {/* ── REVENUE ── */}
            {page === "revenue" && (<>
              <div className="kpis">
                <div className="kpi green"><div className="kpi-lbl">Total GMV Today</div><div className="kpi-val">SZL {todayGMV.toFixed(0)}</div><div className="kpi-sub">Delivered orders only</div></div>
                <div className="kpi amber"><div className="kpi-lbl">Platform Fee Today</div><div className="kpi-val">SZL {platformFee}</div><div className="kpi-sub">10% of GMV</div></div>
                <div className="kpi blue"><div className="kpi-lbl">Total Orders</div><div className="kpi-val">{orders.length}</div><div className="kpi-sub">All statuses today</div></div>
                <div className="kpi"><div className="kpi-lbl">Completion Rate</div>
                  <div className="kpi-val">{orders.length > 0 ? Math.round(delivered.length / orders.length * 100) : 0}%</div>
                  <div className="kpi-sub">Target: &gt;75%</div></div>
              </div>
              <div className="two-col">
                <div className="panel">
                  <div className="ph"><h3>Revenue by Restaurant — Today</h3></div>
                  <table>
                    <thead><tr><th></th><th>Restaurant</th><th>Orders</th><th>GMV</th><th>Fee (10%)</th></tr></thead>
                    <tbody>
                      {restaurants.map(r => {
                        const rOrders = delivered.filter(o => o.restaurant_id === r.id);
                        const gmv = rOrders.reduce((s, o) => s + o.total_szl, 0);
                        if (gmv === 0) return null;
                        return (
                          <tr key={r.id}>
                            <td style={{ fontSize: 16 }}>{r.emoji}</td>
                            <td style={{ fontSize: 12, fontWeight: 700 }}>{r.name}</td>
                            <td className="td-mono">{rOrders.length}</td>
                            <td className="td-amount">SZL {gmv.toFixed(0)}</td>
                            <td style={{ fontFamily: "var(--fm)", fontSize: 13, fontWeight: 600, color: "var(--amber)" }}>SZL {(gmv * 0.1).toFixed(0)}</td>
                          </tr>
                        );
                      })}
                      <tr style={{ background: "var(--g0)" }}>
                        <td colSpan={2} style={{ fontFamily: "var(--fh)", fontWeight: 800, fontSize: 13 }}>Total</td>
                        <td className="td-mono" style={{ fontWeight: 700 }}>{delivered.length}</td>
                        <td style={{ fontFamily: "var(--fm)", fontWeight: 700 }}>SZL {todayGMV.toFixed(0)}</td>
                        <td style={{ fontFamily: "var(--fm)", fontWeight: 700, color: "var(--amber)" }}>SZL {platformFee}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="panel">
                  <div className="ph"><h3>Settlement Note</h3></div>
                  <div style={{ padding: "18px 20px" }}>
                    <div style={{ background: "var(--blue-bg)", border: "1px solid var(--blue-bd)", borderRadius: 10, padding: "14px 16px", fontSize: 13, color: "var(--blue)", fontWeight: 600, marginBottom: 14, lineHeight: 1.6 }}>
                      💳 Restaurant payouts are processed manually via EFT at end of each week.<br />Net = GMV minus 10% platform fee. Automated payouts deferred to V2.
                    </div>
                    <div style={{ fontSize: 13, color: "var(--ink3)", lineHeight: 1.7 }}>
                      <div style={{ marginBottom: 8 }}>📊 Active restaurants: <strong>{restaurants.filter(r => r.is_active).length}</strong></div>
                      <div style={{ marginBottom: 8 }}>🛵 Active drivers: <strong>{drivers.filter(d => d.is_active).length}</strong></div>
                      <div>💰 This week&apos;s projected fee: <strong>SZL {(platformFee * 7).toFixed(0)}</strong></div>
                    </div>
                  </div>
                </div>
              </div>
            </>)}
          </div>
        </main>
      </div>

      {/* ── Add Restaurant Modal ── */}
      {modal === "restaurant" && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-title">Onboard Restaurant</div>
            <div className="modal-sub">Manually add a new restaurant. Only operator-created accounts — no self-serve at MVP.</div>
            <div className="fg2">
              <div className="fg"><span className="fl">Emoji</span><input className="fi" value={newRest.emoji} onChange={e => setNewRest(v => ({ ...v, emoji: e.target.value }))} style={{ fontSize: 24, width: 70 }} /></div>
              <div className="fg"><span className="fl">Zone</span>
                <select className="fi" style={{ appearance: "none" }} value={newRest.zone} onChange={e => setNewRest(v => ({ ...v, zone: e.target.value }))}>
                  <option>Mbabane</option><option>Manzini</option><option>Other</option>
                </select>
              </div>
              <div className="fg full"><span className="fl">Restaurant Name *</span><input className="fi" placeholder="e.g. Swati Braai House" value={newRest.name} onChange={e => setNewRest(v => ({ ...v, name: e.target.value }))} /></div>
              <div className="fg full"><span className="fl">Cuisine Type</span><input className="fi" placeholder="e.g. Braai · Local" value={newRest.cuisine} onChange={e => setNewRest(v => ({ ...v, cuisine: e.target.value }))} /></div>
              <div className="fg"><span className="fl">Phone</span><input className="fi" placeholder="+268 76 XXX XXXX" value={newRest.phone} onChange={e => setNewRest(v => ({ ...v, phone: e.target.value }))} /></div>
              <div className="fg"><span className="fl">Email</span><input className="fi" type="email" placeholder="contact@restaurant.sz" value={newRest.email} onChange={e => setNewRest(v => ({ ...v, email: e.target.value }))} /></div>
              <div className="fg full"><span className="fl">Address</span><input className="fi" placeholder="Street address, Mbabane" value={newRest.address} onChange={e => setNewRest(v => ({ ...v, address: e.target.value }))} /></div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel-m" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-save-m" onClick={addRestaurant} disabled={!newRest.name}>Onboard Restaurant</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Driver Modal ── */}
      {modal === "driver" && (
        <div className="modal-bg" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal">
            <div className="modal-title">Register Driver</div>
            <div className="modal-sub">Add a driver. Create their Supabase Auth account first, then link the profile ID to a driver record.</div>
            <div className="fg2">
              <div className="fg full"><span className="fl">Full Name *</span><input className="fi" placeholder="e.g. Sifiso Mthembu" value={newDriver.name} onChange={e => setNewDriver(v => ({ ...v, name: e.target.value }))} /></div>
              <div className="fg"><span className="fl">Phone *</span><input className="fi" placeholder="+268 76 XXX XXXX" value={newDriver.phone} onChange={e => setNewDriver(v => ({ ...v, phone: e.target.value }))} /></div>
              <div className="fg"><span className="fl">Zone</span>
                <select className="fi" style={{ appearance: "none" }} value={newDriver.zone} onChange={e => setNewDriver(v => ({ ...v, zone: e.target.value }))}>
                  <option>Mbabane</option><option>Manzini</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-cancel-m" onClick={() => setModal(null)}>Cancel</button>
              <button className="btn-save-m" onClick={addDriver} disabled={!newDriver.name || !newDriver.phone}>Register Driver</button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">✓ {toast}</div>}
    </>
  );
}
