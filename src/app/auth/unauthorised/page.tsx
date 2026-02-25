import Link from "next/link";

export default function UnauthorisedPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#0A1F14", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", color: "#C2E5D0", textAlign: "center", padding: 20 }}>
      <div>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>Access Denied</h1>
        <p style={{ color: "#6A806A", marginBottom: 24 }}>You don't have permission to view this page.</p>
        <Link href="/auth/login" style={{ background: "#317550", color: "white", padding: "12px 24px", borderRadius: 10, textDecoration: "none", fontWeight: 700 }}>Back to Login</Link>
      </div>
    </div>
  );
}
