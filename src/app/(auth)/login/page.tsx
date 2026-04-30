"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEnvelope, faLock, faChartLine, faSpinner } from "@fortawesome/free-solid-svg-icons";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.get("email"), password: data.get("password") }),
    });
    if (res.ok) {
      router.push("/dashboard");
      router.refresh();
    } else {
      const json = await res.json();
      setError(json.error ?? "Login failed");
      setLoading(false);
    }
  }

  return (
    <div style={{ width: "100%", maxWidth: 420, padding: "0 16px" }}>
      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
          marginBottom: 16, boxShadow: "0 0 30px rgba(124,58,237,0.4)",
        }}>
          <FontAwesomeIcon icon={faChartLine} style={{ fontSize: 24, color: "#fff" }} />
        </div>
        <h1 style={{ margin: 0, fontSize: 28, fontWeight: 700, color: "#f1f5f9", letterSpacing: -0.5 }}>Fundy</h1>
        <p style={{ margin: "6px 0 0", fontSize: 14, color: "#64748b" }}>Fund Management Platform</p>
      </div>

      {/* Card */}
      <div style={{
        background: "#0e0e1c", border: "1px solid #1e1e38",
        borderRadius: 20, padding: 32,
        boxShadow: "0 0 60px rgba(0,0,0,0.5)",
      }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600, color: "#f1f5f9" }}>Welcome back</h2>
        <p style={{ margin: "0 0 28px", fontSize: 13, color: "#64748b" }}>Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Email
            </label>
            <div style={{ position: "relative" }}>
              <FontAwesomeIcon icon={faEnvelope} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13 }} />
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                style={{
                  width: "100%", boxSizing: "border-box", background: "#141428",
                  border: "1px solid #1e1e38", borderRadius: 10, padding: "11px 14px 11px 38px",
                  color: "#f1f5f9", fontSize: 14, outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#1e1e38")}
              />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Password
            </label>
            <div style={{ position: "relative" }}>
              <FontAwesomeIcon icon={faLock} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "#475569", fontSize: 13 }} />
              <input
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
                style={{
                  width: "100%", boxSizing: "border-box", background: "#141428",
                  border: "1px solid #1e1e38", borderRadius: 10, padding: "11px 14px 11px 38px",
                  color: "#f1f5f9", fontSize: 14, outline: "none", transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = "#7c3aed")}
                onBlur={e => (e.target.style.borderColor = "#1e1e38")}
              />
            </div>
          </div>

          {error && (
            <div style={{
              background: "#450a0a", border: "1px solid #ef444440",
              borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#f87171",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? "#2e1065" : "linear-gradient(135deg, #7c3aed, #4f46e5)",
              color: "#fff", border: "none", borderRadius: 10, padding: "13px 0",
              fontSize: 14, fontWeight: 600, cursor: loading ? "not-allowed" : "pointer",
              transition: "all 0.2s", boxShadow: loading ? "none" : "0 4px 20px rgba(124,58,237,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              marginTop: 4,
            }}
          >
            {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>

      <p style={{ textAlign: "center", fontSize: 12, color: "#334155", marginTop: 24 }}>
        Fundy © 2026 — All amounts in BDT
      </p>
    </div>
  );
}
