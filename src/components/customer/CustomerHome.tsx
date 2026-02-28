"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant, DeliveryZone } from "@/types/database.types";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green-900:#0F2318;--green-800:#1A3528;--green-700:#233F30;--green-600:#2D5240;
    --green-500:#3A6B52;--green-400:#4E8A6A;--green-300:#6BA88A;--green-200:#A8CCBA;
    --green-100:#D5E8DE;--green-50:#EDF5F0;--amber:#C8943A;--amber-light:#E8B55A;
    --cream:#F7F2EA;--cream-dark:#EDE6D8;--text-dark:#0F2318;--text-mid:#3A5042;
    --text-light:#6B8A78;--white:#FFFFFF;--shadow-md:0 4px 16px rgba(15,35,24,0.13);
    --radius-lg:22px;--radius-md:14px;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--text-dark); }
  h1,h2,h3,h4 { font-family:'Fraunces',serif; }
  .nav { position:sticky; top:0; z-index:100; background:var(--green-900); display:flex; align-items:center; justify-content:space-between; padding:0 24px; height:64px; }
  .nav-logo { font-family:'Fraunces',serif; font-size:26px; font-weight:700; color:#F7F2EA; }
  .nav-logo span { color:var(--amber-light); }
  .nav-city { font-size:13px; color:var(--green-300); background:rgba(255,255,255,0.06); padding:6px 12px; border-radius:20px; }
  .hero { background:var(--green-900); padding:48px 24px 56px; position:relative; overflow:hidden; }
  .hero::before { content:''; position:absolute; inset:0; background:radial-gradient(ellipse 70% 100% at 80% 50%, rgba(58,107,82,0.35) 0%, transparent 70%); pointer-events:none; }
  .hero-inner { max-width:680px; margin:0 auto; position:relative; }
  .hero-eyebrow { display:inline-flex; align-items:center; gap:8px; background:rgba(200,148,58,0.18); border:1px solid rgba(200,148,58,0.35); color:var(--amber-light); font-size:12px; font-weight:600; letter-spacing:1.2px; text-transform:uppercase; padding:5px 12px; border-radius:20px; margin-bottom:18px; }
  .hero h1 { font-size:clamp(32px,6vw,52px); color:#F7F2EA; line-height:1.1; margin-bottom:14px; font-weight:700; }
  .hero h1 em { font-style:italic; color:var(--amber-light); }
  .hero p { color:var(--green-300); font-size:17px; line-height:1.6; margin-bottom:28px; }
  .filters-bar { background:#fff; border-bottom:1px solid var(--cream-dark); padding:0 24px; display:flex; align-items:center; gap:10px; overflow-x:auto; scrollbar-width:none; }
  .filters-bar::-webkit-scrollbar { display:none; }
  .filter-pill { border:1.5px solid var(--green-200); color:var(--text-mid); background:transparent; padding:7px 16px; border-radius:20px; font-size:13px; font-weight:500; cursor:pointer; white-space:nowrap; transition:all 0.18s; font-family:'DM Sans',sans-serif; margin:10px 0; }
  .filter-pill:hover { border-color:var(--green-500); color:var(--green-700); }
  .filter-pill.active { background:var(--green-800); color:#F7F2EA; border-color:var(--green-800); }
  .filter-divider { width:1px; height:24px; background:var(--cream-dark); flex-shrink:0; }
  .section { padding:32px 24px; max-width:1100px; margin:0 auto; }
  .section-title { font-size:22px; font-weight:600; color:var(--green-900); margin-bottom:20px; }
  .section-title span { color:var(--text-light); font-family:'DM Sans',sans-serif; font-size:14px; font-weight:400; margin-left:8px; }
  .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:20px; }
  .card { background:#fff; border-radius:var(--radius-lg); overflow:hidden; cursor:pointer; transition:transform 0.22s, box-shadow 0.22s; border:1px solid var(--cream-dark); }
  .card:hover { transform:translateY(-3px); box-shadow:var(--shadow-md); }
  .card-img { height:160px; display:flex; align-items:center; justify-content:center; font-size:52px; position:relative; }
  .card-badge { position:absolute; top:10px; left:10px; background:rgba(15,35,24,0.78); color:#F7F2EA; font-size:11px; font-weight:600; padding:3px 9px; border-radius:10px; }
  .card-badge.closed { background:rgba(192,57,43,0.82); }
  .card-body { padding:14px 16px 16px; }
  .card-name { font-size:16px; font-weight:600; color:var(--green-900); margin-bottom:3px; }
  .card-meta { font-size:13px; color:var(--text-light); margin-bottom:10px; }
  .card-footer { display:flex; align-items:center; justify-content:space-between; padding-top:10px; border-top:1px solid var(--cream-dark); font-size:12px; color:var(--text-mid); }
  .loading { text-align:center; padding:60px; color:var(--text-light); font-size:16px; }
`;

interface Props {
  restaurants: Restaurant[];
  zones: DeliveryZone[];
}

const CUISINE_FILTERS = ["All", "Braai", "African", "Pizza", "Asian", "Café", "Chicken"];

export default function CustomerHome({ restaurants, zones }: Props) {
  const router = useRouter();
  const [cuisineFilter, setCuisineFilter] = useState("All");
  const [cityFilter, setCityFilter] = useState("All");

  const filtered = restaurants.filter(r => {
    const cityOk = cityFilter === "All" || r.zone === cityFilter;
    const cuisineOk = cuisineFilter === "All" || r.cuisine_type.toLowerCase().includes(cuisineFilter.toLowerCase());
    return cityOk && cuisineOk;
  });

  const cities = ["All", ...Array.from(new Set(restaurants.map(r => r.zone)))];

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
  <div className="nav-logo">Trolley<span>.</span></div>
  <div style={{display:"flex",alignItems:"center",gap:12}}>
    <div className="nav-city">📍 Ezulwini, Eswatini</div>
    <a href="/auth/login" style={{background:"#C8943A",color:"#fff",padding:"7px 16px",borderRadius:20,fontSize:13,fontWeight:700,textDecoration:"none"}}>Sign In</a>
  </div>
</nav>

      <div className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">🇸🇿 Now delivering in Eswatini</div>
          <h1>Great food,<br /><em>delivered fast.</em></h1>
          <p>Comming Soon: Order from Mbabane and Manzini's best restaurants. Pay with MTN MoMo or card.</p>
        </div>
      </div>

      <div className="filters-bar">
        {cities.map(c => (
          <button key={c} className={`filter-pill ${cityFilter === c ? "active" : ""}`} onClick={() => setCityFilter(c)}>{c}</button>
        ))}
        <div className="filter-divider" />
        {CUISINE_FILTERS.map(f => (
          <button key={f} className={`filter-pill ${cuisineFilter === f ? "active" : ""}`} onClick={() => setCuisineFilter(f)}>{f}</button>
        ))}
      </div>

      <div className="section">
        <div className="section-title">
          Restaurants near you <span>{filtered.length} available</span>
        </div>
        <div className="grid">
          {filtered.map(r => (
            <div key={r.id} className="card" onClick={() => router.push(`/${r.slug}`)}>
              <div className="card-img" style={{ background: "linear-gradient(135deg,#1A3528,#2D5240)", position: "relative", overflow: "hidden" }}>
  {r.cover_image_url
    ? <img src={r.cover_image_url} alt={r.name} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
    : <span style={{ fontSize: 52 }}>{r.emoji}</span>
  }
  <div className={`card-badge ${!r.is_open ? "closed" : ""}`} style={{ position: "absolute", top: 10, right: 10 }}>{r.is_open ? "Open Now" : "Closed"}</div>
</div>
              <div className="card-body">
                <div className="card-name">{r.name}</div>
                <div className="card-meta">{r.cuisine_type} · {r.zone}</div>
                <div className="card-footer">
                  <span>⏱ {r.estimated_delivery_min}–{r.estimated_delivery_max} min</span>
                  <span>🚴 SZL {r.min_order_szl > 0 ? `${r.min_order_szl} min` : "Free"}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
