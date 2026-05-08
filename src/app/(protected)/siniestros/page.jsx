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
  ENVIO_INFORMACION: "Liquidación - Envío de Información",
  RECEPCION_PROPUESTA: "Liquidación - Propuesta Liquidador",
  APROBADA: "Propuesta Aprobada",
  DESCONFORME: "Propuesta Desconforme",
  RECHAZADO_LIQ: "Caso rechazado",
  INFORME_FINAL: "Liquidación - Informe final",
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
  const [asesores, setAsesores] = useState([]);

  // ✅ filtro etapa (abiertos / cerrados)
  const [stageTab, setStageTab] = useState("ABIERTOS"); // ABIERTOS | CERRADOS
  const [viewMode, setViewMode] = useState("TABLE"); // "GRID" | "TABLE"

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
  }, [query, pagina, limite, stageTab, tipoFilter, estadoFilter, origenFilter, asesorFilter]);

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
  }, [stageTab, tipoFilter, estadoFilter, origenFilter]);

  // Sync from URL
  useEffect(() => {
    const modo = searchParams.get("modo");
    const estado = searchParams.get("estado");
    const ramo = searchParams.get("ramo") || searchParams.get("tipo");
    const origen = searchParams.get("origen");

    if (modo) setStageTab(modo.toUpperCase());
    if (estado) setEstadoFilter(estado.toUpperCase());
    if (ramo) setTipoFilter(ramo.toUpperCase());
    if (origen) setOrigenFilter(origen.toUpperCase());
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
    <div className="min-h-screen bg-surface px-6 pb-20 pt-8 text-on-surface transition-colors duration-500 md:px-10">
      <div className="mb-12 flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20">
              <span className="material-symbols-outlined text-3xl">task_alt</span>
            </div>
            <p className="ml-1 text-sm font-bold text-on-surface-variant/60">
              Seguimiento de liquidaciones y cierres de casos.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1 shadow-sm">
            <button
              onClick={() => setViewMode("TABLE")}
              className={cls(
                "flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all",
                viewMode === "TABLE" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              <span className="material-symbols-outlined mr-2 text-sm">table_rows</span>

            </button>
            <button
              onClick={() => setViewMode("GRID")}
              className={cls(
                "flex h-9 items-center justify-center rounded-xl px-4 text-xs font-bold transition-all",
                viewMode === "GRID" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:bg-surface-container"
              )}
            >
              <span className="material-symbols-outlined mr-2 text-sm">grid_view</span>

            </button>
          </div>
          <Button variant="secondary" onClick={exportExcel} disabled={loading || busy} className="px-6 border-outline-variant/30">
            <span className="material-symbols-outlined text-sm">download</span>
            Exportar Excel
          </Button>
          <Button variant="secondary" onClick={() => refresh(query)} disabled={loading || busy} className="px-6 border-outline-variant/30">
            <span className={cls("material-symbols-outlined text-sm transition-transform duration-700", loading && "animate-spin")}>
              sync
            </span>
            Actualizar
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

        <div className="grid gap-6 rounded-[2rem] border border-outline-variant/10 bg-surface-container-low/40 p-6 md:p-8 shadow-sm backdrop-blur-xl md:grid-cols-6 lg:grid-cols-12">
          <div className="md:col-span-6 lg:col-span-5">
            <Input
              label="Búsqueda Inteligente"
              value={query}
              onChange={setQuery}
              placeholder="Compañía, cliente, RUT, folio..."
            />
          </div>

          <div className="md:col-span-2 lg:col-span-3">
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
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Select
              label="Estado Liquidación"
              value={estadoFilter}
              onChange={setEstadoFilter}
              options={[
                { value: "ALL", label: "Todos" },
                { value: "INSPECCION", label: "Liq. - Inspección" },
                { value: "PRESUPUESTO", label: "Liq. - Presupuesto" },
                { value: "ENVIO_INFORMACION", label: "Liq. - Envío Info" },
                { value: "RECEPCION_PROPUESTA", label: "Propuesta Liq." },
                { value: "INFORME_FINAL", label: "Liq. - Informe Final" },
                { value: "COBRANZA", label: "Cobranza" },
                { value: "FACTURACION", label: "Facturación" },
                { value: "DESISTIMIENTO", label: "Desistido" },
                { value: "CERRADO", label: "Cerrado" },
              ]}
            />
          </div>

          <div className="md:col-span-2 lg:col-span-2">
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
          </div>

          <div className="md:col-span-2 lg:col-span-3">
            <Select
              label="Asesor Asignado"
              value={asesorFilter}
              onChange={setAsesorFilter}
              options={[
                { value: "ALL", label: "Todos los Asesores" },
                ...asesores.map(a => ({ value: a.id, label: a.nombre }))
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-8">
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
              <div className="grid gap-4">
                {filtered.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => openCaso(c)}
                    className={cls(
                      "group flex flex-col gap-6 rounded-[2rem] border border-outline-variant/10 p-6 transition-all duration-500 hover:border-primary/20 hover:shadow-xl hover:shadow-primary/5 md:flex-row md:items-center",
                      c.esCasoAsesur ? "border-l-4 border-l-primary bg-primary/[0.02]" : "border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
                    )}
                  >
                    <div className="flex flex-1 items-center gap-6">
                      <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-surface-container-high text-primary transition-transform group-hover:scale-105 sm:flex">
                        <span className="material-symbols-outlined text-2xl">assignment</span>
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-black tracking-tight text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</span>
                          <Pill tone="purple">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                        </div>
                        <div className="text-left text-sm font-bold border-l-2 border-primary/20 pl-3 text-on-surface/80">
                          {c.nombreCliente} <span className="mx-2 text-on-surface-variant/30">|</span> <span className="text-xs font-semibold text-on-surface-variant/60">{c.direccion}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2 text-right">
                      <Pill tone={c.estado === "APROBADA" ? "green" : "blue"}>
                        {EstadoSiniestroLabel[c.estado] || c.estado}
                      </Pill>
                      <div className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40">
                        Siniestro: {c.numeroSiniestro || "—"}
                      </div>
                    </div>

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-on-surface/5 text-on-surface-variant group-hover:bg-primary/20 group-hover:text-primary">
                      <span className="material-symbols-outlined transition-transform duration-500 group-hover:translate-x-0.5">arrow_forward</span>
                    </div>
                  </button>
                ))}
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