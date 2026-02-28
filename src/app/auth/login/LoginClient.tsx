"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

const CSS = `
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Lato', sans-serif; }
  :root {
    --g9: #0A1F14; --g7: #1A3827; --g5: #317550; --g4: #3D9162;
    --g3: #5AB07E; --g2: #90CCA8; --g1: #C2E5D0; --g0: #E8F5EE;
    --amber: #E8A230; --text: #EDF2EE; --text3: #6A806A; --text4: #8FAD9A;
    --border: #2A342A; --surface: #161A16; --surface2: #1E241E;
  }
  .shell {
    min-height: 100vh; background: var(--g9); display: flex;
    align-items: center; justify-content: center; padding: 20px;
    background-image: radial-gradient(ellipse 60% 70% at 50% 30%, rgba(49,117,80,0.15) 0%, transparent 65%);
    font-family: 'Lato', sans-serif;
  }
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 20px; padding: 40px 36px; width: 100%; max-width: 400px;
  }
  .logo { font-family: 'Barlow Condensed', sans-serif; font-size: 36px; font-weight: 900; color: var(--text); margin-bottom: 4px; }
  .logo em { color: var(--amber); font-style: normal; }
  .sub { font-size: 14px; color: var(--text4); margin-bottom: 32px; }
  .role-tabs { display: flex; gap: 6px; margin-bottom: 24px; }
  .role-tab {
    flex: 1; padding: 8px 6px; border-radius: 8px; border: 1.5px solid var(--border);
    background: transparent; color: var(--text4); font-size: 11px; font-weight: 700;
    letter-spacing: 0.5px; cursor: pointer; transition: all 0.15s; text-align: center;
    font-family: 'Lato', sans-serif;
  }
  .role-tab.active { background: var(--g7); border-color: var(--g5); color: var(--g1); }
  .label { font-size: 11px; font-weight: 700; letter-spacing: 1.2px; text-transform: uppercase; color: var(--text4); margin-bottom: 7px; display: block; }
  .inp {
    width: 100%; background: var(--surface2); border: 1.5px solid var(--border);
    border-radius: 10px; padding: 13px 16px; color: var(--text);
    font-family: 'Lato', sans-serif; font-size: 15px; outline: none;
    transition: border-color 0.15s; margin-bottom: 14px;
  }
  .inp:focus { border-color: var(--g4); }
  .inp::placeholder { color: var(--text3); }
  .btn {
    width: 100%; background: var(--g5); color: var(--text);
    border: none; cursor: pointer; border-radius: 10px; padding: 14px;
    font-family: 'Barlow Condensed', sans-serif; font-size: 18px; font-weight: 800;
    transition: background 0.15s; margin-top: 4px;
  }
  .btn:hover { background: var(--g4); }
  .btn:disabled { opacity: 0.5; cursor: not-allowed; }
  .err { background: rgba(192,57,43,0.15); border: 1px solid rgba(192,57,43,0.3); border-radius: 8px; padding: 10px 14px; font-size: 13px; color: #F08080; margin-bottom: 14px; }
  .hint { font-size: 12px; color: var(--text4); text-align: center; margin-top: 16px; }
  .hint a { color: var(--g3); text-decoration: none; }
`;

const ROLES = [
  { key: "customer", label: "Customer" },
  { key: "restaurant", label: "Restaurant" },
  { key: "driver", label: "Driver" },
  { key: "operator", label: "Operator" },
];

const ROLE_REDIRECTS: Record<string, string> = {
  customer: "/",
  restaurant_admin: "/restaurant",
  driver: "/driver",
  operator: "/operator",
};

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");

  const [selectedRole, setSelectedRole] = useState("customer");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Fetch role and redirect appropriately
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .single();

    if (redirectTo) {
      router.push(redirectTo);
    } else {
      router.push(ROLE_REDIRECTS[profile?.role ?? "customer"] ?? "/");
    }
    router.refresh();
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <div className="card">
          <div className="logo">Trolley<em>.</em></div>
          <div className="sub">Sign in to continue</div>

          <div className="role-tabs">
            {ROLES.map(r => (
              <button key={r.key} className={`role-tab ${selectedRole === r.key ? "active" : ""}`} onClick={() => setSelectedRole(r.key)}>
                {r.label}
              </button>
            ))}
          </div>

          {error && <div className="err">{error}</div>}

          <label className="label">Email</label>
          <input className="inp" type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />

          <label className="label">Password</label>
          <input className="inp" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && handleLogin()} />

          <button className="btn" onClick={handleLogin} disabled={loading || !email || !password}>
            {loading ? "Signing in…" : "SIGN IN →"}
          </button>

          {selectedRole === "customer" && (
            <div className="hint">New customer? <a href="/auth/signup">Create an account</a> or <a href="/">continue as guest</a></div>
          )}
        </div>
      </div>
    </>
  );
}
