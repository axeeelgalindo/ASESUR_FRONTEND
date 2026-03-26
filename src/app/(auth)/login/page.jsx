"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("cribortech@asesur.com");
  const [password, setPassword] = useState("cribortech2026");
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

    // éxito - redirigir a la raíz para que la lógica de roles decida el destino
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <div className="w-full max-w-[420px] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-white dark:bg-slate-900 shadow-sm relative z-10">
        <h1 className="text-2xl font-bold mb-2">ASESUR</h1>
        <p className="text-slate-500 dark:text-slate-400 mb-6">Inicia sesión para continuar</p>

        <form onSubmit={onSubmit} className="grid gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="correo@asesur.cl"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1.5 block">Contraseña</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
              placeholder="••••••••"
            />
          </div>

          {error ? (
            <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-xl text-sm border border-red-100 dark:border-red-900/50">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 p-3 rounded-xl bg-slate-900 dark:bg-blue-600 text-white font-semibold disabled:opacity-50 transition-colors hover:bg-slate-800 dark:hover:bg-blue-500"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>

          <div className="text-xs text-slate-500 dark:text-slate-400 mt-2 text-center">
            Password seed: <span className="font-bold text-slate-700 dark:text-slate-300">123456</span>
          </div>
        </form>
      </div>
    </div>
  );
}
