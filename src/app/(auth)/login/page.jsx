"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("cribortech@asesur.com");
  const [password, setPassword] = useState("cribortech2026");
  const [rutBusquilla, setRutBusquilla] = useState("");
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

    window.location.href = "/";
  };

  const onBuscarCaso = (e) => {
    e.preventDefault();
    if (!rutBusquilla) return;
    window.location.href = `/mi-caso/${rutBusquilla}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container">
      <div className="w-full md:h-screen md:min-h-screen grid grid-cols-1 md:grid-cols-2 gap-px bg-outline-variant/10 md:rounded-none overflow-hidden md:shadow-none shadow-2xl relative z-10 my-0 md:my-0 lg:max-w-none">

        {/* Left Column: Administrator/Agent Login */}
        <section className="bg-surface-container-low p-6 lg:p-10 flex flex-col justify-center items-center border border-outline-variant/30">
          <div className="mb-12">
            <h1 className="font-headline text-4xl text-center font-extrabold text-on-surface tracking-tight mb-4">ASESUR</h1>
            <p className="text-on-surface-variant text-lg lg:text-start text-center">Inicie sesión para gestionar casos.</p>
          </div>
          <form onSubmit={onSubmit} className="space-y-6 w-full">
            <div className="space-y-2">
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Correo Electrónico</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">alternate_email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 transition-all outline-none"
                  placeholder="agente@asesur.com"
                />
              </div>
            </div>

            <div className="space-y-2 ">
              <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-semibold">Contraseña</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">lock</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-surface-container border-none focus:ring-1 focus:ring-primary rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/50 transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl text-sm border bg-error-container text-on-error-container border-error/50">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary-container text-on-secondary font-headline font-bold py-4 rounded-lg hover:brightness-110 active:scale-[0.98] transition-all text-lg shadow-lg shadow-secondary-container/10 disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </section>

        {/* Right Column: Public Case Tracker */}
        <section className="relative bg-surface p-12 lg:p-20 flex flex-col justify-center items-center lg:items-start overflow-hidden">
          {/* Background Decorative Element */}
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-secondary-container rounded-full blur-[120px]"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-primary-container rounded-full blur-[100px]"></div>
          </div>

          <div className="relative z-10">
            <div className="mb-12">
              <div className="w-full lg:w-auto inline-flex items-center gap-2 px-3 py-1 rounded-full bg-tertiary-container text-on-tertiary-container text-xs justify-center lg:justify-start font-bold uppercase tracking-tighter mb-6">
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                Portal Público
              </div>
              <h2 className="font-headline text-4xl font-extrabold text-on-surface tracking-tight mb-4 text-center lg:text-start">Estado de Trámite</h2>
              <p className="text-on-surface-variant text-lg max-w-md text-center lg:text-start leading-relaxed">Consulta el estado de tu gestión de forma segura ingresando tu identificador nacional.</p>
            </div>

            <div className="bg-surface-container-highest/10 backdrop-blur-xl p-8 rounded-2xl border border-outline-variant/20 shadow-xl max-w-md">
              <form onSubmit={onBuscarCaso} className="space-y-6">
                <div className="space-y-2">
                  <label className="font-label text-xs uppercase tracking-widest text-secondary-fixed-dim font-semibold drop-shadow-sm">Número de RUT</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-secondary">search</span>
                    <input
                      type="text"
                      value={rutBusquilla}
                      onChange={(e) => setRutBusquilla(e.target.value)}
                      className="w-full bg-surface-container-low/80 border border-outline-variant/30 focus:border-secondary focus:ring-0 rounded-lg py-4 pl-12 pr-4 text-on-surface placeholder:text-outline/60 transition-all font-mono outline-none"
                      placeholder="12.345.678-9"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full border border-secondary text-secondary hover:bg-secondary/10 font-headline font-bold py-4 rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                  Consultar Estado
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="text-[10px] text-center text-outline uppercase tracking-widest pt-2">Protegido por cifrado de grado bancario</p>
              </form>
            </div>

            <div className="mt-16 grid grid-cols-2 gap-8">
              <div className="flex items-center flex-col gap-1">
                <span className="text-secondary font-headline font-bold text-2xl tracking-tighter">24/7</span>
                <span className="text-on-surface-variant text-xs uppercase tracking-widest font-semibold">Disponibilidad</span>
              </div>
              <div className="flex items-center flex-col gap-1">
                <span className="text-secondary font-headline font-bold text-2xl tracking-tighter">BLINDAJE</span>
                <span className="text-on-surface-variant text-xs uppercase tracking-widest font-semibold">Seguridad Total</span>
              </div>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
