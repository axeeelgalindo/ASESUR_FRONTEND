"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("superadmin@asesur.cl");
  const [password, setPassword] = useState("123456");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Credenciales inválidas");
      setLoading(false);
      return;
    }

    // éxito
    window.location.href = "/dashboard";
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ width: 420, border: "1px solid #e5e7eb", borderRadius: 14, padding: 24, background: "white" }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>ASESUR</h1>
        <p style={{ color: "#6b7280", marginBottom: 18 }}>Inicia sesión para continuar</p>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, color: "#6b7280" }}>Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}
              placeholder="correo@asesur.cl"
            />
          </div>

          <div>
            <label style={{ fontSize: 12, color: "#6b7280" }}>Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              style={{ width: "100%", padding: 10, border: "1px solid #e5e7eb", borderRadius: 10 }}
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div style={{ background: "#fee2e2", color: "#991b1b", padding: 10, borderRadius: 10 }}>
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: 12,
              borderRadius: 12,
              border: "none",
              background: "#0f172a",
              color: "white",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <div style={{ fontSize: 12, color: "#6b7280" }}>
            Password seed: <b>123456</b>
          </div>
        </form>
      </div>
    </div>
  );
}
