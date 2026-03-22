"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import api from "@/lib/api";
import { Chart, registerables } from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { useTheme } from "@/app/ThemeContext";

// Register Chart.js components and datalabels plugin
if (typeof window !== "undefined") {
  Chart.register(...registerables, ChartDataLabels);
}

function titleCase(s) {
  if (!s) return "";
  return String(s)
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const { theme } = useTheme();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [resumen, setResumen] = useState(null);
  const [pendientes, setPendientes] = useState([]);

  const barChartRef = useRef(null);
  const donutChartRef = useRef(null);
  const barInstance = useRef(null);
  const donutInstance = useRef(null);

  const fetchAll = useCallback(async () => {
    if (status !== "authenticated") return;

    setLoading(true);
    setErr("");

    try {
      const r1 = await api.get("/resumen", {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });

      const r2 = await api.get("/pendientes-autorizacion", {
        headers: { Authorization: `Bearer ${session.backendToken}` },
      });

      setResumen(r1.data);
      setPendientes(Array.isArray(r2.data) ? r2.data : []);
    } catch (e) {
      setErr(
        e?.response?.data?.message ||
        e.message ||
        "Error cargando dashboard"
      );
    } finally {
      setLoading(false);
    }
  }, [session?.backendToken, status]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const porEtapa = useMemo(
    () => (resumen?.porEtapa ? resumen.porEtapa : []),
    [resumen]
  );
  const porEstado = useMemo(
    () => (resumen?.porEstado ? resumen.porEstado : []),
    [resumen]
  );
  const porAsesor = useMemo(
    () => (resumen?.porAsesor ? resumen.porAsesor : []),
    [resumen]
  );

  const totalCasos = useMemo(() => {
    if (!resumen) return 0;
    return (resumen.porEtapa || []).reduce(
      (acc, x) => acc + Number(x?._count?._all || 0),
      0
    );
  }, [resumen]);

  const totalPendientes = pendientes?.length || 0;

  const totalEnCurso = useMemo(() => {
    if (!resumen) return 0;
    const row =
      (resumen.porEstado || []).find(
        (x) => String(x.estado || "").toUpperCase() === "EN_CURSO"
      ) ||
      (resumen.porEstado || []).find(
        (x) => String(x.estado || "").toUpperCase() === "ABIERTO"
      );
    return Number(row?._count?._all || 0);
  }, [resumen]);

  const totalNotificaciones = 0;

  // Chart configuration colors based on theme
  const chartTextColor = theme === "dark" ? "#c5c6cd" : "#40484c";
  const chartGridColor = theme === "dark" ? "rgba(143, 144, 151, 0.1)" : "rgba(64, 72, 76, 0.1)";

  // Initialize Bar Chart
  useEffect(() => {
    if (loading || !barChartRef.current || !porEtapa.length) return;

    if (barInstance.current) {
      barInstance.current.destroy();
    }

    const sortedEtapas = [...porEtapa].sort(
      (a, b) => Number(b?._count?._all || 0) - Number(a?._count?._all || 0)
    );

    const ctx = barChartRef.current.getContext("2d");
    barInstance.current = new Chart(ctx, {
      type: "bar",
      data: {
        labels: sortedEtapas.map((x) => titleCase(x.etapa)),
        datasets: [
          {
            label: "Casos",
            data: sortedEtapas.map((x) => Number(x?._count?._all || 0)),
            backgroundColor: [
              "rgba(250, 189, 0, 0.8)",
              "rgba(250, 189, 0, 0.6)",
              "rgba(250, 189, 0, 0.4)",
              "rgba(250, 189, 0, 0.2)",
            ],
            borderColor: "#fabd00",
            borderWidth: 1,
            borderRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: {
          legend: { display: false },
          datalabels: {
            color: "#fff",
            anchor: "center",
            align: "center",
            formatter: (value) => value,
            font: { weight: "bold", size: 12 },
          },
        },
        scales: {
          x: {
            grid: { color: chartGridColor },
            ticks: { color: chartTextColor },
          },
          y: {
            grid: { display: false },
            ticks: { color: chartTextColor, font: { weight: "600" } },
          },
        },
      },
    });

    return () => {
      if (barInstance.current) barInstance.current.destroy();
    };
  }, [loading, porEtapa, theme, chartTextColor, chartGridColor]);

  // Initialize Donut Chart
  useEffect(() => {
    if (loading || !donutChartRef.current || !porEstado.length) return;

    if (donutInstance.current) {
      donutInstance.current.destroy();
    }

    const sortedEstados = [...porEstado].sort(
      (a, b) => Number(b?._count?._all || 0) - Number(a?._count?._all || 0)
    );

    const ctx = donutChartRef.current.getContext("2d");
    donutInstance.current = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: sortedEstados.map((x) => titleCase(x.estado)),
        datasets: [
          {
            data: sortedEstados.map((x) => Number(x?._count?._all || 0)),
            backgroundColor: [
              "#fabd00",
              "rgba(250, 189, 0, 0.85)",
              "rgba(250, 189, 0, 0.7)",
              "rgba(250, 189, 0, 0.55)",
              "rgba(250, 189, 0, 0.4)",
              "rgba(250, 189, 0, 0.25)",
            ],
            borderColor: theme === "dark" ? "#041329" : "#ffffff",
            borderWidth: 2,
            hoverOffset: 15,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "right",
            labels: {
              usePointStyle: true,
              pointStyle: "rectRounded",
              padding: 15,
              color: chartTextColor,
              font: { size: 11 },
            },
          },
          datalabels: {
            color: "#fff",
            formatter: (value) => value,
            font: { weight: "bold", size: 12 },
          },
        },
      },
    });

    return () => {
      if (donutInstance.current) donutInstance.current.destroy();
    };
  }, [loading, porEstado, theme, chartTextColor]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-on-surface">
        Cargando sesión...
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="flex items-center justify-center min-h-[50vh] text-on-surface">
        No autenticado
      </div>
    );
  }

  return (
    <main className="w-full">
      <div className="p-6 max-w-screen-2xl mx-auto">
        {/* Dashboard Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <p className="text-on-surface-variant font-body">
              Señales rápidas para detectar cuellos de botella y riesgos
              operacionales.
            </p>
          </div>
          <div className="flex items-center gap-3">

            <button
              onClick={fetchAll}
              disabled={loading}
              className="bg-primary/10 text-primary hover:bg-primary/20 transition-all px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>{" "}
              Actualizar
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {err && (
          <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20 flex justify-between items-center">
            <span>{err}</span>
            <button
              onClick={fetchAll}
              className="px-3 py-1 bg-on-error-container text-error-container rounded-lg text-xs font-bold"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Card: Casos Totales */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 hover:border-secondary/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                Casos Totales
              </p>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">
                  analytics
                </span>
              </div>
            </div>
            <h3 className="font-headline font-bold text-4xl text-on-surface mb-2 group-hover:text-primary transition-colors">
              {loading ? "..." : totalCasos}
            </h3>
            <p className="text-xs text-on-surface-variant">
              Volumen total en el sistema
            </p>
          </div>

          {/* Card: Pendientes Autorización */}
          <div
            className={`bg-surface-container-low rounded-xl p-6 border-2 relative overflow-hidden group ${totalPendientes
              ? "border-secondary/40"
              : "border-outline-variant/10"
              }`}
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-full -mr-12 -mt-12 group-hover:scale-125 transition-transform duration-500"></div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                Pendientes Autorización
              </p>
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center ${totalPendientes ? "bg-secondary/10" : "bg-surface-container"
                  }`}
              >
                <span
                  className={`material-symbols-outlined ${totalPendientes ? "text-secondary" : "text-on-surface-variant"
                    }`}
                  style={{
                    fontVariationSettings: totalPendientes ? "'FILL' 1" : "",
                  }}
                >
                  pending_actions
                </span>
              </div>
            </div>
            <h3
              className={`font-headline font-bold text-4xl mb-2 ${totalPendientes ? "text-secondary" : "text-on-surface"
                }`}
            >
              {loading ? "..." : totalPendientes}
            </h3>
            <p className="text-xs text-on-surface-variant mb-3">
              Bloquean avance a Siniestro
            </p>
            {totalPendientes > 0 && (
              <button className="w-full py-1.5 bg-secondary text-on-secondary text-[10px] font-bold rounded uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-sm">
                  warning
                </span>{" "}
                Revisar hoy
              </button>
            )}
          </div>

          {/* Card: Casos en Curso */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 hover:border-on-tertiary-container/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                Casos en Curso
              </p>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-tertiary-container">
                  play_circle
                </span>
              </div>
            </div>
            <h3 className="font-headline font-bold text-4xl text-on-surface mb-2">
              {loading ? "..." : totalEnCurso}
            </h3>
            <p className="text-xs text-on-surface-variant">Operación activa</p>
          </div>

          {/* Card: Notificaciones */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 hover:border-outline-variant/30 transition-all group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">
                Notificaciones
              </p>
              <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-surface-variant">
                  mail
                </span>
              </div>
            </div>
            <h3 className="font-headline font-bold text-4xl text-on-surface mb-2">
              {totalNotificaciones}
            </h3>
            <p className="text-xs text-on-surface-variant">Pendientes por leer</p>
          </div>
        </div>

        {/* Distribution Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Distribution by Stage */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 flex flex-col">
            <div className="mb-6">
              <h4 className="font-headline font-bold text-xl mb-1">
                Distribución por etapa
              </h4>
              <p className="text-xs text-on-surface-variant">
                Distribución de carga operativa por fase del proceso (Horizontal).
              </p>
            </div>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="animate-pulse w-full h-full bg-surface-container rounded-lg"></div>
              ) : porEtapa.length ? (
                <canvas ref={barChartRef}></canvas>
              ) : (
                <div className="text-on-surface-variant text-sm italic">
                  Sin datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Distribution by Status */}
          <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 flex flex-col">
            <div className="mb-6">
              <h4 className="font-headline font-bold text-xl mb-1">
                Distribución por estado
              </h4>
              <p className="text-xs text-on-surface-variant">
                Salud del flujo: revisión, en curso, bloqueados, etc.
              </p>
            </div>
            <div className="flex-1 min-h-[300px] flex items-center justify-center">
              {loading ? (
                <div className="animate-pulse w-full h-full bg-surface-container rounded-lg"></div>
              ) : porEstado.length ? (
                <canvas ref={donutChartRef}></canvas>
              ) : (
                <div className="text-on-surface-variant text-sm italic">
                  Sin datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Lower Grid: Table and Status */}
        <div className="grid grid-cols-12 gap-8">
          {/* Pendientes de Autorización Table */}
          <div className="col-span-12 lg:col-span-8 bg-surface-container-low rounded-xl border border-outline-variant/10 overflow-hidden">
            <div className="p-8 border-b border-outline-variant/10 flex justify-between items-center">
              <div>
                <div className="flex items-center gap-3">
                  <h4 className="font-headline font-bold text-xl">
                    Pendientes de autorización
                  </h4>
                  <span className="bg-secondary text-on-secondary text-[10px] px-2 py-0.5 rounded font-bold">
                    {totalPendientes} CASOS
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-1">
                  Estos casos bloquean el avance a SINIESTRO. Prioriza por
                  antigüedad.
                </p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-surface-container text-[10px] uppercase tracking-widest text-on-surface-variant font-bold border-b border-outline-variant/10">
                    <th className="px-8 py-4">Folio</th>
                    <th className="px-8 py-4">Cliente</th>
                    <th className="px-8 py-4">Etapa</th>
                    <th className="px-8 py-4">Estado</th>
                    <th className="px-8 py-4">Creado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/5">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-8 py-10 text-center">
                        <div className="flex justify-center">
                          <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      </td>
                    </tr>
                  ) : pendientes.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-8 py-10 text-center text-on-surface-variant italic"
                      >
                        No hay casos pendientes de autorización 🎉
                      </td>
                    </tr>
                  ) : (
                    pendientes.slice(0, 10).map((item) => (
                      <tr
                        key={item.id}
                        className="hover:bg-surface-container/50 transition-colors group"
                      >
                        <td className="px-8 py-6 font-bold text-on-surface">
                          {item.folio || "-"}
                        </td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-on-surface">
                            {item.nombreCliente || "Sin nombre"}
                          </div>
                          <div className="text-[10px] text-on-surface-variant">
                            {item.rutCliente || ""}
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-xs font-medium">
                            {titleCase(item.etapa)}
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary border border-secondary/20 uppercase tracking-tighter">
                            {titleCase(item.estado)}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-xs text-on-surface-variant">
                          {item.creadoEn
                            ? new Date(item.creadoEn).toLocaleDateString(
                              "es-CL"
                            )
                            : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {!loading && pendientes.length > 10 && (
                <div className="p-4 text-center border-t border-outline-variant/10">
                  <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">
                    Mostrando 10 de {pendientes.length} casos
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Top Asesores */}
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
              <h4 className="font-headline font-bold text-xl mb-1">
                Top asesores
              </h4>
              <p className="text-xs text-on-surface-variant mb-6">
                Carga por asesor (top 10).
              </p>
              <div className="space-y-6">
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-surface-container-highest"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-surface-container-highest rounded"></div>
                          <div className="h-3 w-32 bg-surface-container-highest rounded"></div>
                        </div>
                      </div>
                      <div className="w-8 h-8 bg-surface-container-highest rounded"></div>
                    </div>
                  ))
                ) : porAsesor.length === 0 ? (
                  <p className="text-on-surface-variant text-sm italic">
                    Sin datos de asesores
                  </p>
                ) : (
                  porAsesor.slice(0, 10).map((row, idx) => {
                    const a = row.asesor || {};
                    const initial = (a.nombre || a.email || "A")
                      .slice(0, 2)
                      .toUpperCase();
                    return (
                      <div
                        key={`${a.id || idx}`}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold text-xs border border-outline-variant/20">
                            {initial}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-on-surface truncate">
                              {a.nombre || "Sin nombre"}
                            </p>
                            <p className="text-[10px] text-on-surface-variant truncate">
                              {a.email || "—"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right ml-2 shrink-0">
                          <p className={`text-lg font-headline font-bold ${idx === 0 ? 'text-secondary' : 'text-on-surface'}`}>
                            {row.cantidad || 0}
                          </p>
                          <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-widest">
                            Casos
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
