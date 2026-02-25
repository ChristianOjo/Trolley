"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Restaurant } from "@/types/database.types";
import type { MenuCategoryWithItems } from "@/lib/db";

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,700;1,9..144,400&family=DM+Sans:wght@400;500;600&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --green-900:#0F2318;--green-800:#1A3528;--green-700:#233F30;--green-600:#2D5240;
    --green-500:#3A6B52;--green-400:#4E8A6A;--green-300:#6BA88A;--green-200:#A8CCBA;
    --green-50:#EDF5F0;--amber:#C8943A;--amber-light:#E8B55A;--cream:#F7F2EA;
    --cream-dark:#EDE6D8;--text-dark:#0F2318;--text-mid:#3A5042;--text-light:#6B8A78;
    --white:#FFFFFF;--shadow-md:0 4px 16px rgba(15,35,24,0.13);--radius-lg:22px;--radius-md:14px;--radius-sm:8px;
  }
  body { font-family:'DM Sans',sans-serif; background:var(--cream); color:var(--text-dark); }
  h1,h2,h3 { font-family:'Fraunces',serif; }
  .nav { background:var(--green-900); display:flex; align-items:center; padding:0 24px; height:64px; gap:16px; }
  .back { background:transparent; border:none; cursor:pointer; color:var(--green-300); font-size:14px; display:flex; align-items:center; gap:6px; font-family:'DM Sans',sans-serif; }
  .nav-logo { font-family:'Fraunces',serif; font-size:22px; font-weight:700; color:#F7F2EA; }
  .nav-logo span { color:var(--amber-light); }
  .cart-btn { margin-left:auto; background:var(--amber); color:#fff; border:none; cursor:pointer; padding:8px 16px; border-radius:20px; font-family:'DM Sans',sans-serif; font-size:14px; font-weight:600; display:flex; align-items:center; gap:8px; }
  .cart-badge { background:var(--green-900); color:#F7F2EA; width:20px; height:20px; border-radius:50%; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; }
  .r-hero { height:180px; background:var(--green-800); display:flex; align-items:center; justify-content:center; font-size:72px; position:relative; }
  .r-hero-overlay { position:absolute; inset:0; background:linear-gradient(to bottom,transparent 40%,rgba(15,35,24,0.5) 100%); }
  .r-info { background:#fff; padding:18px 24px; border-bottom:1px solid var(--cream-dark); }
  .r-info h2 { font-size:24px; margin-bottom:4px; }
  .r-info-meta { font-size:13px; color:var(--text-light); display:flex; gap:16px; flex-wrap:wrap; margin-top:6px; }
  .open-badge { display:inline-flex; align-items:center; gap:5px; background:#E8F5EF; color:#2E7D52; font-size:12px; font-weight:600; padding:3px 10px; border-radius:10px; }
  .open-dot { width:7px; height:7px; border-radius:50%; background:#2E7D52; animation:pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1}50%{opacity:0.4} }
  .layout { display:flex; gap:24px; max-width:1100px; margin:0 auto; padding:24px; align-items:flex-start; }
  .menu-main { flex:1; min-width:0; }
  .cat-title { font-size:18px; font-weight:600; color:var(--green-900); margin-bottom:14px; padding-bottom:8px; border-bottom:2px solid var(--green-50); }
  .menu-cat { margin-bottom:32px; }
  .menu-item { display:flex; gap:14px; padding:14px 0; border-bottom:1px solid var(--cream-dark); align-items:flex-start; }
  .menu-item:last-child { border-bottom:none; }
  .item-emoji { font-size:38px; flex-shrink:0; width:58px; height:58px; background:var(--green-50); border-radius:var(--radius-sm); display:flex; align-items:center; justify-content:center; }
  .item-info { flex:1; }
  .item-name { font-size:15px; font-weight:600; color:var(--green-900); margin-bottom:3px; }
  .item-desc { font-size:13px; color:var(--text-light); line-height:1.5; margin-bottom:6px; }
  .item-price { font-size:15px; font-weight:700; color:var(--green-600); }
  .add-btn { flex-shrink:0; align-self:flex-end; background:var(--green-800); color:#F7F2EA; border:none; cursor:pointer; width:34px; height:34px; border-radius:50%; font-size:22px; display:flex; align-items:center; justify-content:center; transition:all 0.18s; }
  .add-btn:hover { background:var(--green-600); transform:scale(1.1); }
  .qty-ctrl { display:flex; align-items:center; gap:8px; align-self:flex-end; }
  .qty-btn { background:var(--cream-dark); border:none; cursor:pointer; width:30px; height:30px; border-radius:50%; font-size:18px; display:flex; align-items:center; justify-content:center; color:var(--text-dark); }
  .qty-btn:hover { background:var(--green-200); }
  .qty-num { font-size:15px; font-weight:700; min-width:20px; text-align:center; }
  .cart-sidebar { width:320px; flex-shrink:0; position:sticky; top:84px; background:#fff; border-radius:var(--radius-lg); border:1px solid var(--cream-dark); box-shadow:var(--shadow-md); overflow:hidden; }
  .cart-head { background:var(--green-900); padding:16px 20px; color:#F7F2EA; }
  .cart-head h3 { font-size:17px; font-weight:600; }
  .cart-head p { font-size:12px; color:var(--green-300); margin-top:2px; }
  .cart-items { padding:12px 20px; max-height:320px; overflow-y:auto; }
  .cart-item { display:flex; align-items:center; gap:10px; padding:10px 0; border-bottom:1px solid var(--cream-dark); }
  .cart-item:last-child { border-bottom:none; }
  .cart-item-name { flex:1; font-size:14px; font-weight:500; }
  .cart-item-price { font-size:13px; color:var(--text-mid); font-weight:600; }
  .cart-empty { padding:32px 20px; text-align:center; color:var(--text-light); font-size:14px; }
  .cart-totals { padding:14px 20px; background:var(--green-50); border-top:1px solid var(--green-100); }
  .cart-row { display:flex; justify-content:space-between; font-size:13px; color:var(--text-mid); margin-bottom:6px; }
  .cart-row.total { font-size:16px; font-weight:700; color:var(--green-900); margin-top:8px; padding-top:8px; border-top:1px solid var(--green-200); margin-bottom:0; }
  .checkout-btn { width:calc(100% - 40px); margin:14px 20px 16px; background:var(--amber); color:#fff; border:none; cursor:pointer; padding:14px; border-radius:var(--radius-md); font-family:'DM Sans',sans-serif; font-size:15px; font-weight:700; transition:background 0.2s; }
  .checkout-btn:hover { background:var(--amber-light); }
  .checkout-btn:disabled { background:var(--green-200); cursor:not-allowed; color:var(--text-light); }
  @media(max-width:720px){ .layout{flex-direction:column;} .cart-sidebar{width:100%;position:static;} }
`;

interface Props {
  restaurant: Restaurant;
  menu: MenuCategoryWithItems[];
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  qty: number;
  restaurantId: string;
}

// Cart is stored in sessionStorage so it persists across the checkout navigation
const CART_KEY = "trolley_cart";
const CART_RESTAURANT_KEY = "trolley_cart_restaurant";

function loadCart(): Record<string, number> {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(sessionStorage.getItem(CART_KEY) ?? "{}"); } catch { return {}; }
}
function saveCart(cart: Record<string, number>, restaurantId: string) {
  sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
  sessionStorage.setItem(CART_RESTAURANT_KEY, restaurantId);
}

export default function RestaurantMenu({ restaurant: r, menu }: Props) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>(() => {
    const stored = loadCart();
    const storedRestaurant = typeof window !== "undefined" ? sessionStorage.getItem(CART_RESTAURANT_KEY) : null;
    return storedRestaurant === r.id ? stored : {};
  });

  const allItems = menu.flatMap(c => c.menu_items);
  const cartItems = Object.entries(cart)
    .map(([id, qty]) => ({ ...allItems.find(i => i.id === id)!, qty }))
    .filter(i => i.id);

  const subtotal = cartItems.reduce((s, i) => s + i.price_szl * i.qty, 0);
  const totalQty = cartItems.reduce((s, i) => s + i.qty, 0);

  const addItem = (item: typeof allItems[0]) => {
    if (!r.is_open) return;
    const next = { ...cart, [item.id]: (cart[item.id] ?? 0) + 1 };
    setCart(next);
    saveCart(next, r.id);
  };

  const updateQty = (itemId: string, delta: number) => {
    const next = { ...cart, [itemId]: (cart[itemId] ?? 0) + delta };
    if ((next[itemId] ?? 0) <= 0) delete next[itemId];
    setCart(next);
    saveCart(next, r.id);
  };

  const goCheckout = () => {
    // Save full cart data for checkout page
    const cartData = cartItems.map(i => ({
      id: i.id, name: i.item_name_snapshot ?? i.name, price: i.price_szl, qty: i.qty, emoji: i.emoji,
    }));
    sessionStorage.setItem("trolley_checkout_cart", JSON.stringify(cartData));
    sessionStorage.setItem("trolley_checkout_restaurant", JSON.stringify({ id: r.id, name: r.name, zone: r.zone, deliveryMin: r.estimated_delivery_min, deliveryMax: r.estimated_delivery_max }));
    router.push("/checkout");
  };

  return (
    <>
      <style>{CSS}</style>
      <nav className="nav">
        <button className="back" onClick={() => router.push("/")}>← Back</button>
        <div className="nav-logo">Trolley<span>.</span></div>
        {totalQty > 0 && (
          <button className="cart-btn" onClick={goCheckout}>
            🛒 Cart <span className="cart-badge">{totalQty}</span>
          </button>
        )}
      </nav>

      <div className="r-hero" style={{ background: r.is_open ? "linear-gradient(135deg,#1A3528,#2D5240)" : "linear-gradient(135deg,#2a2a2a,#444)" }}>
        <span>{r.emoji}</span>
        <div className="r-hero-overlay" />
      </div>

      <div className="r-info">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2>{r.name}</h2>
            <div className="r-info-meta">
              <span>{r.cuisine_type}</span>
              <span>⏱ {r.estimated_delivery_min}–{r.estimated_delivery_max} min</span>
              {r.min_order_szl > 0 && <span>Min. SZL {r.min_order_szl}</span>}
            </div>
          </div>
          {r.is_open ? (
            <div className="open-badge"><span className="open-dot" />Open Now</div>
          ) : (
            <div className="open-badge" style={{ background: "#FFEDED", color: "#C0392B" }}>Closed</div>
          )}
        </div>
      </div>

      <div className="layout">
        <div className="menu-main">
          {menu.map(cat => (
            <div className="menu-cat" key={cat.id}>
              <div className="cat-title">{cat.name}</div>
              {cat.menu_items.map(item => (
                <div className="menu-item" key={item.id}>
                  <div className="item-emoji">{item.emoji}</div>
                  <div className="item-info">
                    <div className="item-name">{item.name}</div>
                    <div className="item-desc">{item.description}</div>
                    <div className="item-price">SZL {item.price_szl.toFixed(2)}</div>
                  </div>
                  {cart[item.id] ? (
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-num">{cart[item.id]}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                  ) : (
                    <button className="add-btn" onClick={() => addItem(item)} disabled={!r.is_open}>+</button>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="cart-sidebar">
          <div className="cart-head">
            <h3>🛒 Your Cart</h3>
            <p>{r.name}</p>
          </div>
          {cartItems.length === 0 ? (
            <div className="cart-empty"><div style={{ fontSize: 32, marginBottom: 10 }}>🍽️</div>Add items to get started</div>
          ) : (
            <>
              <div className="cart-items">
                {cartItems.map(item => (
                  <div className="cart-item" key={item.id}>
                    <div className="qty-ctrl">
                      <button className="qty-btn" onClick={() => updateQty(item.id, -1)}>−</button>
                      <span className="qty-num">{item.qty}</span>
                      <button className="qty-btn" onClick={() => updateQty(item.id, 1)}>+</button>
                    </div>
                    <div className="cart-item-name">{item.name}</div>
                    <div className="cart-item-price">SZL {(item.price_szl * item.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>
              <div className="cart-totals">
                <div className="cart-row"><span>Subtotal</span><span>SZL {subtotal.toFixed(2)}</span></div>
                <div className="cart-row total"><span>Total</span><span>SZL {subtotal.toFixed(2)}</span></div>
              </div>
            </>
          )}
          <button className="checkout-btn" onClick={goCheckout} disabled={cartItems.length === 0 || !r.is_open}>
            {!r.is_open ? "Restaurant Closed" : cartItems.length === 0 ? "Add items to checkout" : `Checkout · SZL ${subtotal.toFixed(2)}`}
          </button>
        </div>
      </div>
    </>
  );
}
