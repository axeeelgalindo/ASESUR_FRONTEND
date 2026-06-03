"use client";

// src/app/(protected)/siniestros/page.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api, { apiGet, fileUrl } from "@/lib/api";

/**
 * Labels
 */
const TipoCasoLabel = {
  HIPOTECARIO_A: "Hipotecario (A)",
  POLIZA_PARTICULAR_B: "Póliza Particular (B)",
};

const EstadoSiniestroLabel = {
  ABIERTO: "Abierto",
  EN_REVISION: "En revisión",
  PENDIENTE_AUTORIZACION: "Pendiente autorización",
  AUTORIZADO: "Autorizado",
  RECHAZADO: "Rechazado",
  EN_CURSO: "En curso (Siniestro)",
  CERRADO: "Cerrado",
  INSPECCION: "Liquidación - Inspección",
  PRESUPUESTO: "Liquidación - Presupuesto",
  ENVIO_INFORMACION: "Liquidación - Antecedentes Liquidador",
  RECEPCION_PROPUESTA: "Liquidación - Propuesta Liquidador",
  APROBADA: "Propuesta Aprobada",
  DESCONFORME: "Propuesta Desconforme",
  RECHAZADO_LIQ: "Caso rechazado",
  INFORME_FINAL: "Liquidación - Informe final",
  IMPUGNACION: "Liquidación - Impugnación",
  DEMANDA: "Demanda judicial",
  COBRANZA: "Cobranza",
  FACTURACION: "Facturación",
  DESISTIMIENTO: "Desistido",
};

import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Section } from "@/components/ui/Section";
import { Tabs } from "@/components/ui/Tabs";
import { Pagination } from "@/components/ui/Pagination";

function cls(...s) {
  return s.filter(Boolean).join(" ");
}

const fmt = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

export default function SiniestrosPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [casos, setCasos] = useState([]);
  const [meta, setMeta] = useState({ total: 0, paginas: 1, pagina: 1 });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(20);

  const [query, setQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [origenFilter, setOrigenFilter] = useState("ALL");
  const [asesorFilter, setAsesorFilter] = useState("ALL");
  const [flagFilter, setFlagFilter] = useState("ALL");
  const [asesores, setAsesores] = useState([]);

  // ✅ filtro etapa (abiertos / cerrados)
  const [stageTab, setStageTab] = useState("ABIERTOS"); // ABIERTOS | CERRADOS
  const [viewMode, setViewMode] = useState("TABLE"); // "GRID" | "TABLE"
  const [filterOrden, setFilterOrden] = useState("desc");

  const refresh = async (q = query) => {
    setError(null);
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.append("pagina", pagina);
      p.append("limite", limite);
      if (q) p.append("q", q);
      p.append("modo", stageTab);
      if (tipoFilter !== "ALL") p.append("ramo", tipoFilter);
      if (estadoFilter !== "ALL") p.append("estado", estadoFilter);
      if (origenFilter !== "ALL") p.append("origen", origenFilter);
      if (asesorFilter !== "ALL") p.append("asesorId", asesorFilter);
      if (flagFilter !== "ALL") p.append("flag", flagFilter);
      if (filterOrden) p.append("orden", filterOrden);

      const res = await apiGet(`/siniestros?${p.toString()}`);
      if (res && res.data) {
        setCasos(res.data);
        if (res.meta) setMeta(res.meta);
      } else {
        setCasos(Array.isArray(res) ? res : []);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando siniestros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      refresh(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query, pagina, limite, stageTab, tipoFilter, estadoFilter, origenFilter, asesorFilter, flagFilter, filterOrden]);

  useEffect(() => {
    async function loadAsesores() {
      try {
        const res = await apiGet("/usuarios?rol=ASESOR");
        setAsesores(res || []);
      } catch (e) {
        console.error("Error cargando asesores", e);
      }
    }
    loadAsesores();
  }, []);

  useEffect(() => {
    setPagina(1);
  }, [stageTab, tipoFilter, estadoFilter, origenFilter, flagFilter, asesorFilter, filterOrden]);

  // Sync from URL
  useEffect(() => {
    const modo = searchParams.get("modo");
    const estado = searchParams.get("estado");
    const ramo = searchParams.get("ramo") || searchParams.get("tipo");
    const origen = searchParams.get("origen");
    const flag = searchParams.get("flag");
    const asesorId = searchParams.get("asesorId");

    if (modo) setStageTab(modo.toUpperCase());
    if (estado) setEstadoFilter(estado.toUpperCase());
    if (ramo) setTipoFilter(ramo.toUpperCase());
    if (origen) setOrigenFilter(origen.toUpperCase());
    if (flag) setFlagFilter(flag.toUpperCase());
    if (asesorId) setAsesorFilter(asesorId);
  }, [searchParams]);

  const exportExcel = async () => {
    try {
      setBusy(true);
      setError(null);
      const p = new URLSearchParams();
      if (query) p.append("q", query);
      p.append("modo", stageTab);
      if (tipoFilter !== "ALL") p.append("ramo", tipoFilter);
      if (estadoFilter !== "ALL") p.append("estado", estadoFilter);
      if (origenFilter !== "ALL") p.append("origen", origenFilter);
      if (asesorFilter !== "ALL") p.append("asesorId", asesorFilter);

      const res = await api.get(`/casos/exportar/excel?${p.toString()}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Siniestros_${stageTab}_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (e) {
      console.error(e);
      setError("Error al exportar Excel");
    } finally {
      setBusy(false);
    }
  };

  const openCaso = (c) => {
    router.push(`/siniestros/${c.id}`);
  };

  const filtered = casos;

  return (
    <div className="min-h-screen bg-surface px-6 pb-20 pt-8 text-on-surface transition-colors duration-500 md:px-10 font-sans">
      {/* Header Area */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-3xl font-light">task_alt</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Siniestros</h1>
            <p className="text-sm font-medium text-on-surface-variant/70 mt-0.5">
              Seguimiento de liquidaciones y cierres de casos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" onClick={() => refresh(query)} disabled={loading || busy} className="px-5 border-outline-variant/30 font-bold h-11 rounded-xl">
            <span className={cls("material-symbols-outlined text-xl transition-transform duration-700", loading && "animate-spin")}>
              sync
            </span>
            Actualizar
          </Button>
          <Button variant="secondary" onClick={exportExcel} disabled={loading || busy} className="px-5 border-outline-variant/30 font-bold h-11 rounded-xl">
            <span className="material-symbols-outlined text-xl">download</span>
            Exportar Excel
          </Button>
        </div>
      </div>

      {error ? (
        <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      <div className="mb-10 mt-8 flex flex-col gap-6">
        <div className="relative z-0">
          <Tabs
            items={[
              { key: "ABIERTOS", label: "En Liquidación / Abiertos" },
              { key: "CERRADOS", label: "Finalizados / Cerrados" },
            ]}
            value={stageTab}
            onChange={setStageTab}
          />
        </div>

        {/* Filters Bar */}
        <section>
          <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-6 md:p-8 shadow-sm backdrop-blur-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-end">
              {/* Row 1, Col 1-2: Search */}
              <div className="sm:col-span-2">
                <Input
                  label="Búsqueda Inteligente"
                  value={query}
                  onChange={setQuery}
                  placeholder="Compañía, cliente, RUT, folio..."
                />
              </div>

              {/* Row 1, Col 3: Tipo */}
              <Select
                label="Tipo de Caso"
                value={tipoFilter}
                onChange={setTipoFilter}
                options={[
                  { value: "ALL", label: "Todos" },
                  { value: "HIPOTECARIO_A", label: "Hipotecario" },
                  { value: "POLIZA_PARTICULAR_B", label: "Póliza Particular" },
                ]}
              />

              {/* Row 1, Col 4: Estado */}
              <Select
                label="Estado Liquidación"
                value={estadoFilter}
                onChange={setEstadoFilter}
                options={[
                  { value: "ALL", label: "Todos" },
                  { value: "AUTORIZADO", label: "Liq. - Autorizado" },
                  { value: "INSPECCION", label: "Liq. - Inspección" },
                  { value: "PRESUPUESTO", label: "Liq. - Presupuesto" },
                  { value: "ENVIO_INFORMACION", label: "Liq. - Antecedentes Liquidador" },
                  { value: "RECEPCION_PROPUESTA", label: "Propuesta Liq." },
                  { value: "INFORME_FINAL", label: "Liq. - Informe Final" },
                  { value: "IMPUGNACION", label: "Liq. - Impugnación" },
                  { value: "DEMANDA", label: "Demanda Judicial" },
                  { value: "COBRANZA", label: "Cobranza" },
                  { value: "FACTURACION", label: "Facturación" },
                  { value: "DESISTIMIENTO", label: "Desistido" },
                  { value: "CERRADO", label: "Cerrado" },
                ]}
              />

              {/* Row 2, Col 1: Origen */}
              <Select
                label="Origen"
                value={origenFilter}
                onChange={setOrigenFilter}
                options={[
                  { value: "ALL", label: "Todos" },
                  { value: "ASESUR", label: "Asesur" },
                  { value: "PROPIO", label: "Propio" },
                ]}
              />

              {/* Row 2, Col 2: Asesor Asignado */}
              <Select
                label="Asesor Asignado"
                value={asesorFilter}
                onChange={setAsesorFilter}
                options={[
                  { value: "ALL", label: "Todos los Asesores" },
                  ...asesores.map(a => ({ value: a.id, label: a.nombre }))
                ]}
              />

              {/* Row 2, Col 3: Orden */}
              <Select
                label="Orden"
                value={filterOrden}
                onChange={setFilterOrden}
                options={[
                  { value: "desc", label: "Más Recientes" },
                  { value: "asc", label: "Más Antiguos" },
                ]}
              />

              {/* Row 2, Col 4: Vista */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-bold text-on-surface-variant/70 tracking-wider">Vista</span>
                <div className="flex h-12 items-center gap-1 rounded-2xl bg-surface-container p-1 border border-outline-variant/10 w-full justify-around">
                  <button
                    onClick={() => setViewMode("GRID")}
                    className={cls(
                      "flex h-10 flex-1 items-center justify-center rounded-xl transition-all cursor-pointer",
                      viewMode === "GRID" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    <span className="material-symbols-outlined text-xl">grid_view</span>
                    <span className="text-xs font-bold ml-1.5 hidden sm:inline">Tarjetas</span>
                  </button>
                  <button
                    onClick={() => setViewMode("TABLE")}
                    className={cls(
                      "flex h-10 flex-1 items-center justify-center rounded-xl transition-all cursor-pointer",
                      viewMode === "TABLE" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                    )}
                  >
                    <span className="material-symbols-outlined text-xl">view_list</span>
                    <span className="text-xs font-bold ml-1.5 hidden sm:inline">Lista</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="mt-8">
        {flagFilter !== "ALL" && (
          <div className="mb-6 flex items-center gap-3 bg-primary/10 text-primary border border-primary/20 rounded-2xl px-5 py-3 text-xs font-bold animate-fadeIn">
            <span className="material-symbols-outlined">filter_alt</span>
            <span>
              Filtrando por: Impugnaciones Activas
            </span>
            <button 
              onClick={() => {
                setFlagFilter("ALL");
                router.replace("/siniestros");
              }} 
              className="ml-auto bg-primary/20 hover:bg-primary/30 text-primary rounded-full px-3 py-1 transition-all cursor-pointer"
            >
              Quitar filtro
            </button>
          </div>
        )}
        {loading && casos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 grayscale opacity-40">
            <div className="material-symbols-outlined text-6xl animate-pulse">database</div>
            <p className="mt-4 text-xs font-black uppercase tracking-widest animate-pulse">Sincronizando información...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
            <div className="material-symbols-outlined text-6xl">search_off</div>
            <p className="mt-4 text-sm font-bold uppercase tracking-widest">No se encontraron casos</p>
          </div>
        ) : (
          <>
            {viewMode === "GRID" ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCaso(c)}
                    className={cls(
                      "group flex flex-col gap-4 rounded-3xl border border-outline-variant/10 p-5 transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 text-left",
                      c.esCasoAsesur ? "border-l-4 border-l-primary bg-primary/[0.02]" : "border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
                    )}
                  >
                    <div className="space-y-1 w-full flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-black tracking-tight text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</span>
                        <Pill tone="purple" className="truncate max-w-[120px] text-[10px]">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                      </div>
                      <div className="text-left text-sm font-bold border-l-2 border-primary/20 pl-3 mt-4 text-on-surface/80">
                        {c.nombreCliente}
                      </div>
                      <div className="text-xs font-semibold text-on-surface-variant/60 ml-3">
                        {c.direccion}
                      </div>
                    </div>

                    <div className="flex w-full items-center justify-between mt-auto pt-4 border-t border-outline-variant/10">
                      <div className="flex flex-col gap-1 w-[75%] text-left">
                        <div className="truncate">
                          <Pill tone={c.estado === "APROBADA" ? "green" : "blue"}>
                            {EstadoSiniestroLabel[c.estado] || c.estado}
                          </Pill>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 mt-1">
                          N° SINIESTRO: {c.numeroSiniestro || "—"}
                        </div>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-surface/5 text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary">
                        <span className="material-symbols-outlined transition-transform duration-500 group-hover:translate-x-0.5">arrow_forward</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Folio</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Cliente</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo / Compañía</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Estado / N° Siniestro</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ubicación</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Autorizado</th>
                        <th className="px-6 py-4"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {filtered.map((c) => {
                        const toneEstado =
                          c.estado === "APROBADA"
                            ? "green"
                            : c.estado === "DESCONFORME"
                              ? "red"
                              : "blue";
                        return (
                          <tr
                            key={c.id}
                            onClick={() => openCaso(c)}
                            className={cls(
                              "group cursor-pointer transition hover:bg-surface-container-low",
                              c.esCasoAsesur ? "border-l-4 border-l-primary bg-primary/[0.01]" : "border-l-4 border-l-amber-500 bg-amber-500/[0.01]"
                            )}
                          >
                            <td className="px-6 py-4">
                              <div className="text-sm font-black text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm font-bold text-on-surface">{c.nombreCliente}</div>
                              <div className="text-[10px] font-bold text-on-surface-variant/60">{c.rutCliente}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 items-start">
                                <Pill tone="purple">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                                <span className="text-xs font-bold text-on-surface-variant">{c.companiaSeguro || "—"}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col gap-1 items-start">
                                <Pill tone={toneEstado}>{EstadoSiniestroLabel[c.estado] || c.estado}</Pill>
                                <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                                  N° {c.numeroSiniestro || "—"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="line-clamp-1 text-[11px] font-bold text-on-surface-variant">
                                {c.direccion}
                                {c.comuna && `, ${c.comuna}`}
                                {c.region && ` (${c.region})`}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-on-surface-variant/50">
                              {fmt(c.autorizacionFecha)}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="rounded-full p-2 text-on-surface-variant transition group-hover:bg-primary/10 group-hover:text-primary">
                                <span className="material-symbols-outlined">chevron_right</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Footer Paginación */}
        {filtered.length > 0 && (
          <footer className="mt-8 flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/10 pt-8 gap-4 px-2">
            <p className="text-sm text-on-surface-variant font-medium">
              Mostrando página <span className="text-on-surface font-bold">{meta.pagina}</span> de <span className="text-on-surface font-bold">{meta.paginas}</span> ({meta.total} casos en total)
            </p>
            <Pagination current={meta.pagina} total={meta.paginas} onPageChange={setPagina} />
          </footer>
        )}
      </div>
    </div>
  );
}