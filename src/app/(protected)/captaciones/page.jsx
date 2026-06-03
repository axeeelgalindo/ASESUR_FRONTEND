"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiGet, apiPost, apiPatch, fileUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Drawer } from "@/components/ui/Drawer";
import { Section } from "@/components/ui/Section";
import { Pagination } from "@/components/ui/Pagination";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

function cls(...s) {
  return s.filter(Boolean).join(" ");
}

const TipoCasoLabel = {
  HIPOTECARIO_A: "Hipotecario (A)",
  POLIZA_PARTICULAR_B: "Póliza Particular (B)",
};

const RamoOptions = [
  { value: "", label: "Todos los Ramos" },
  { value: "HIPOTECARIO_A", label: "Hipotecario (A)" },
  { value: "POLIZA_PARTICULAR_B", label: "Póliza Particular (B)" },
];

const EstadoOptions = [
  { value: "", label: "Todos los Estados" },
  { value: "ASIGNADO", label: "Asignado" },
  { value: "SIN_ASIGNAR", label: "Sin Asignar" },
];

export default function CaptacionesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [casos, setCasos] = useState([]);
  const [meta, setMeta] = useState({ total: 0, paginas: 1, pagina: 1 });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(20);

  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Filters
  const [filterEstado, setFilterEstado] = useState("");
  const [filterRamo, setFilterRamo] = useState("");
  const [filterFecha, setFilterFecha] = useState(""); // "" or "hoy" or "semana"
  const [filterOrigen, setFilterOrigen] = useState("");
  const [filterOrden, setFilterOrden] = useState("desc");

  const [openReject, setOpenReject] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState("");
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);


  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Asignación de asesor (operaciones)
  const [asesores, setAsesores] = useState([]);
  const [asesorPick, setAsesorPick] = useState("");

  const [openEditCaptacion, setOpenEditCaptacion] = useState(false);
  const [editForm, setEditForm] = useState({
    nombreCliente: "",
    rutCliente: "",
    direccion: "",
    comuna: "",
    region: "",
    ciudad: "",
    numeroDocumentoCI: "",
    firmaNotarial: "",
    fechaOcurrencia: "",
    antiguedadEdificio: "",
    m2ViviendaTotal: "",
  });

  const openEdit = () => {
    if (!selected) return;
    setEditForm({
      nombreCliente: selected.nombreCliente || "",
      rutCliente: selected.rutCliente || "",
      direccion: selected.direccion || "",
      comuna: selected.comuna || "",
      region: selected.region || selected.ciudad || "",
      ciudad: selected.ciudad || "",
      numeroDocumentoCI: selected.numeroDocumentoCI || "",
      firmaNotarial: selected.firmaNotarial || "",
      fechaOcurrencia: selected.fechaOcurrencia ? selected.fechaOcurrencia.split('T')[0] : "",
      antiguedadEdificio: selected.antiguedadEdificio || "",
      m2ViviendaTotal: selected.m2ViviendaTotal || "",
    });
    setOpenEditCaptacion(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await apiPatch(`/casos/${selected.id}`, editForm);
      setOpenEditCaptacion(false);
      await openCaso(selected);
    } catch (e) {
      setError("Error al actualizar datos de captación");
    } finally {
      setBusy(false);
    }
  };

  const userRole = (session?.user?.rol || session?.user?.role || "USUARIO").toUpperCase();
  const canCreate = ["CAPTADOR", "ASESOR", "OPERACIONES", "SUPERADMIN"].includes(userRole);
  const canAssignAsesor = ["OPERACIONES", "SUPERADMIN", "FINANZAS"].includes(userRole);

  const refresh = useCallback(async (q = query) => {
    setError(null);
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.append("pagina", pagina);
      p.append("limite", limite);
      if (q) p.append("q", q);
      if (filterEstado) p.append("estado", filterEstado);
      if (filterRamo) p.append("ramo", filterRamo);
      if (filterFecha) p.append("fecha", filterFecha);
      if (filterOrigen) p.append("origen", filterOrigen);
      if (filterOrden) p.append("orden", filterOrden);

      const res = await apiGet(`/captaciones?${p.toString()}`);
      if (res && res.data) {
        setCasos(res.data);
        if (res.meta) setMeta(res.meta);
      } else {
        setCasos(Array.isArray(res) ? res : []);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando captaciones");
    } finally {
      setLoading(false);
    }
  }, [pagina, limite, filterEstado, filterRamo, filterFecha, filterOrigen, filterOrden]);

  // Debounced Search Effect
  useEffect(() => {
    const handler = setTimeout(() => {
      refresh(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query, refresh]);

  useEffect(() => {
    setPagina(1); // Reset page on filter change
  }, [filterEstado, filterRamo, filterFecha, filterOrigen, filterOrden]);

  // Sync from URL
  useEffect(() => {
    const estado = searchParams.get("estado");
    const ramo = searchParams.get("ramo") || searchParams.get("tipo");
    const origen = searchParams.get("origen");

    if (estado) setFilterEstado(estado.toUpperCase());
    if (ramo) setFilterRamo(ramo.toUpperCase());
    if (origen) setFilterOrigen(origen.toUpperCase());
  }, [searchParams]);

  const filtered = casos;

  const openCaso = async (c) => {
    setError(null);
    setBusy(true);
    setCurrentPhotoIndex(0);
    try {
      const full = await apiGet(`/captaciones/${c.id}`);
      setSelected(full);
      setOpenDetail(true);

      if (canAssignAsesor) {
        try {
          const users = await apiGet("/usuarios?rol=ASESOR");
          const list = Array.isArray(users) ? users : users?.items || [];
          setAsesores(list);
        } catch {
          setAsesores([]);
        }
      }
      setAsesorPick(full?.asesorId || "");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando detalle");
    } finally {
      setBusy(false);
    }
  };

  const saveAsignacion = async () => {
    if (!selected?.id || !asesorPick) return;
    setBusy(true);
    try {
      await apiPatch(`/captaciones/${selected.id}/asignar-asesor`, { asesorId: asesorPick });
      setOpenDetail(false);
      setSelected(null);
      setSuccessToast({
        message: "¡Caso pasado a Pre-Siniestro exitosamente!",
        detail: "Se ha asignado el asesor y el caso ha sido escalado para revisión de Pre-Siniestro."
      });
      refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error asignando asesor");
    } finally {
      setBusy(false);
    }
  };

  const rechazar = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      const motivo = rejectMotivo.trim();
      if (!motivo) throw new Error("Escribe un motivo");
      await apiPost(`/pre-siniestro/${selected.id}/rechazar`, { motivo });
      setOpenReject(false);
      setRejectMotivo("");
      setOpenDetail(false);
      setSelected(null);
      setSuccessToast({
        message: "¡Captación rechazada exitosamente!",
        detail: "El caso ha quedado en estado RECHAZADO y se ha notificado al asesor."
      });
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error rechazando captación");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-10 lg:px-12">
      {/* Header Area */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between font-sans">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-3xl font-light">campaign</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Captaciones</h1>
            <p className="text-sm font-medium text-on-surface-variant/70 mt-0.5">
              Gestión integral de cartera y nuevas captaciones en terreno.
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
        </div>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-bold text-sm">
            <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
            <span>{successToast.message}</span>
          </div>
          {successToast.detail && (
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {successToast.detail}
            </p>
          )}
        </div>
      )}

      {/* Filters Bar */}
      <section className="mb-8">
        <div className="bg-surface-container-low rounded-[2rem] border border-outline-variant/10 p-6 md:p-8 shadow-sm backdrop-blur-xl">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-end font-sans">
            {/* Row 1, Col 1-2: Search */}
            <div className="sm:col-span-2 relative">
              <span className="text-[11px] font-bold text-on-surface-variant/70 tracking-wider mb-1.5 block">Búsqueda Inteligente</span>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-light">search</span>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-surface-container focus:bg-surface-container-high border border-outline-variant/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-4 h-12 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none text-sm font-medium"
                  placeholder="Buscar por folio, cliente, RUT, dirección..."
                  type="text"
                />
              </div>
            </div>
            
            {/* Row 1, Col 3: Estado */}
            {/* Row 1, Col 3: Estado */}
            <Select
              label="Estado"
              value={filterEstado}
              onChange={setFilterEstado}
              options={EstadoOptions}
            />

            {/* Row 1, Col 4: Tipo de Caso */}
            <Select
              label="Tipo de Caso"
              value={filterRamo}
              onChange={setFilterRamo}
              options={RamoOptions}
            />

            {/* Row 2, Col 1: Fecha */}
            <Select
              label="Fecha de Creación"
              value={filterFecha}
              onChange={setFilterFecha}
              options={[
                { value: "", label: "Cualquier Fecha" },
                { value: "hoy", label: "Hoy" },
                { value: "semana", label: "Últimos 7 días" },
              ]}
            />

            {/* Row 2, Col 2: Origen */}
            <Select
              label="Origen"
              value={filterOrigen}
              onChange={setFilterOrigen}
              options={[
                { value: "", label: "Todos los Orígenes" },
                { value: "ASESUR", label: "Asesur" },
                { value: "PROPIO", label: "Propio" },
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
                  onClick={() => setViewMode("grid")}
                  className={cls(
                    "flex h-10 flex-1 items-center justify-center rounded-xl transition-all cursor-pointer",
                    viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span className="material-symbols-outlined text-xl">grid_view</span>
                  <span className="text-xs font-bold ml-1.5 hidden sm:inline">Tarjetas</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cls(
                    "flex h-10 flex-1 items-center justify-center rounded-xl transition-all cursor-pointer",
                    viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
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

      {error && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl border border-error/20 flex justify-between items-center">
          <span className="text-sm font-bold uppercase tracking-tight">{error}</span>
          <button onClick={refresh} className="px-3 py-1 bg-on-error-container text-error-container rounded-lg text-xs font-black">REINTENTAR</button>
        </div>
      )}

      {/* Content Area */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-surface-container-low h-64 rounded-xl animate-pulse"></div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
          <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 opacity-20">search_off</span>
          <p className="text-on-surface-variant font-medium">No se encontraron captaciones con los criterios actuales.</p>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filtered.map((c) => {
            const isAsignado = !!c.asesorId;
            return (
              <div
                key={c.id}
                onClick={() => openCaso(c)}
                className={cls(
                  "group relative bg-surface-container-low rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-black/20 border border-outline-variant/10",
                  c.esCasoAsesur ? "border-l-4 border-l-primary bg-primary/[0.02]" : "border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
                )}
              >
                <div className={cls("h-1.5 w-full", isAsignado ? "bg-primary" : "bg-secondary")}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                      SIN-{String(c.folio).padStart(6, "0")}
                    </span>
                    <Pill tone={isAsignado ? "green" : c.estado === "PENDIENTE_AUTORIZACION" ? "blue" : "amber"}>
                      {isAsignado ? "Asignado" : c.estado === "PENDIENTE_AUTORIZACION" ? "Espera VB" : "Pendiente"}
                    </Pill>
                  </div>
                  <h3 className="font-headline font-bold text-lg text-on-surface mb-1 truncate">
                    {c.nombreCliente || "Sin Cliente"}
                  </h3>
                  <p className="text-sm text-on-surface-variant mb-6 font-medium">
                    {TipoCasoLabel[c.tipo] || c.tipo}
                  </p>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant uppercase font-bold tracking-tighter opacity-70">Dirección</span>
                      <span className="text-on-surface font-semibold truncate max-w-[140px]">{c.direccion || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant uppercase font-bold tracking-tighter opacity-70">Captador</span>
                      <span className="text-on-surface font-semibold truncate max-w-[140px]">{c.captadoPor?.nombre || c.captadoPor?.email || "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-on-surface-variant uppercase font-bold tracking-tighter opacity-70">Actualización</span>
                      <span className="text-on-surface">
                        {c.actualizadoEn ? new Date(c.actualizadoEn).toLocaleDateString("es-CL") : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-surface-container-highest text-on-surface text-[10px] font-bold py-3 rounded-lg hover:bg-primary hover:text-on-primary transition-colors uppercase tracking-widest">
                      Detalles
                    </button>
                    <button className="aspect-square bg-surface-container-highest text-on-surface p-2 rounded-lg hover:text-secondary transition-colors flex items-center justify-center">
                      <span className="material-symbols-outlined text-sm">more_vert</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-surface-container-low rounded-2xl border border-outline-variant/10 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-surface-container text-[10px] uppercase tracking-widest text-on-surface-variant font-bold border-b border-outline-variant/10">
                <th className="px-8 py-5">Folio</th>
                <th className="px-8 py-5">Cliente</th>
                <th className="px-8 py-5">Ramo</th>
                <th className="px-8 py-5">Captador</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5">Actualizado</th>
                <th className="px-8 py-5"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filtered.map((c) => {
                const isAsignado = !!c.asesorId;
                return (
                  <tr
                    key={c.id}
                    onClick={() => openCaso(c)}
                    className={cls(
                       "hover:bg-surface-container/50 transition-colors cursor-pointer group",
                       c.esCasoAsesur ? "border-l-4 border-l-primary bg-primary/[0.01]" : "border-l-4 border-l-amber-500 bg-amber-500/[0.01]"
                    )}
                  >
                    <td className="px-8 py-5 font-bold text-on-surface">
                      SIN-{String(c.folio).padStart(6, "0")}
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-on-surface">{c.nombreCliente}</div>
                      <div className="text-[10px] text-on-surface-variant font-medium">{c.rutCliente}</div>
                    </td>
                    <td className="px-8 py-5 text-xs text-on-surface font-medium">
                      {TipoCasoLabel[c.tipo] || c.tipo}
                    </td>
                    <td className="px-8 py-5 text-xs text-on-surface font-medium">
                      {c.captadoPor?.nombre || c.captadoPor?.email || "—"}
                    </td>
                    <td className="px-8 py-5">
                      <Pill tone={isAsignado ? "green" : c.estado === "PENDIENTE_AUTORIZACION" ? "blue" : "amber"}>
                        {isAsignado ? "Asignado" : c.estado === "PENDIENTE_AUTORIZACION" ? "Espera VB" : "Pendiente"}
                      </Pill>
                    </td>
                    <td className="px-8 py-5 text-xs text-on-surface-variant font-medium">
                      {c.actualizadoEn ? new Date(c.actualizadoEn).toLocaleDateString("es-CL") : "—"}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">chevron_right</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 flex flex-col md:flex-row items-center justify-between border-t border-outline-variant/10 pt-8 gap-4">
        <p className="text-sm text-on-surface-variant font-medium">
          Mostrando página <span className="text-on-surface font-bold">{meta.pagina}</span> de <span className="text-on-surface font-bold">{meta.paginas}</span> ({meta.total} captaciones en total)
        </p>
        <Pagination current={meta.pagina} total={meta.paginas} onPageChange={setPagina} />
      </footer>

      {/* Detail Drawer */}
      {openDetail && (
        <div className="fixed inset-0 z-[70] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpenDetail(false)}></div>
          <div className="relative w-full max-w-2xl bg-surface-container h-full shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="sticky top-0 z-10 flex items-center justify-between px-8 py-6 bg-surface-container border-b border-outline-variant/10">
              <h2 className="font-headline font-extrabold text-xl text-on-surface uppercase tracking-tight">
                Detalle SIN-{String(selected?.folio).padStart(6, "0")}
              </h2>
              <div className="flex gap-2">
                <button onClick={openEdit} className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">edit</span>
                </button>
                <button onClick={() => setOpenDetail(false)} className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant flex items-center justify-center">
                  <span className="material-symbols-outlined text-xl">close</span>
                </button>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Resumen */}
              <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-on-surface font-bold mb-1">{selected.nombreCliente}</h3>
                    <p className="text-sm text-on-surface-variant">{selected.rutCliente}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Pill tone={!!selected.asesorId ? "green" : selected.estado === "PENDIENTE_AUTORIZACION" ? "blue" : "amber"}>
                      {!!selected.asesorId ? "Asignado" : selected.estado === "PENDIENTE_AUTORIZACION" ? "Espera VB" : "Pendiente"}
                    </Pill>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">Dirección</p>
                    <p className="text-on-surface font-medium">{selected.direccion || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">Comuna/Región</p>
                    <p className="text-on-surface font-medium">{(selected.comuna || "") + (selected.region || selected.ciudad ? `, ${selected.region || selected.ciudad}` : "") || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">Captador</p>
                    <p className="text-on-surface font-medium">{selected.captadoPor?.nombre || selected.captadoPor?.email || "—"}</p>
                  </div>
                </div>
              </section>

              {/* Asignación (if Operations/Admin) */}
              {canAssignAsesor && (
                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-secondary">Validación y Asignación de Asesor</h4>
                  
                  {selected.estado !== "PENDIENTE_AUTORIZACION" && !selected.asesorId ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-800 text-sm flex items-center gap-3">
                       <span className="material-symbols-outlined">warning</span>
                       <p className="font-medium">La captación aún no está lista para VB. El captador debe finalizarla.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <p className="text-[11px] text-on-surface-variant/70 font-medium">
                        Al asignar un asesor, se otorgará automáticamente el Visto Bueno (VB) y el caso se escalará a la etapa de <span className="font-bold text-secondary">PRE-SINIESTRO</span>.
                      </p>
                      <div className="flex gap-4">
                        <select
                          value={asesorPick}
                          onChange={(e) => setAsesorPick(e.target.value)}
                          className="flex-1 bg-surface-container-low text-on-surface text-sm font-semibold p-3 rounded-xl border border-outline-variant/10 outline-none focus:ring-1 focus:ring-primary"
                        >
                          <option value="">Seleccionar asesor...</option>
                          {asesores.map(u => (
                            <option key={u.id} value={u.id}>{u.nombre || u.email}</option>
                          ))}
                        </select>
                        <button
                          onClick={saveAsignacion}
                          disabled={busy || !asesorPick}
                          className="bg-secondary hover:bg-secondary/90 text-on-secondary font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-lg">fact_check</span>
                          Dar VB y Escalar
                        </button>
                      </div>
                      
                      <div className="flex justify-end pt-2 border-t border-outline-variant/10">
                        <button
                          onClick={() => {
                            setOpenReject(true);
                            setRejectMotivo("");
                          }}
                          disabled={busy}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-error text-error hover:bg-error/10 font-bold transition-all active:scale-95 cursor-pointer text-xs"
                        >
                          <span className="material-symbols-outlined text-sm">cancel</span>
                          Rechazar Captación
                        </button>
                      </div>
                    </div>
                  )}
                </section>
              )}

              {/* Fotos */}
              <section className="space-y-4">
                <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary">Fotografías ({selected.fotos?.length || 0})</h4>
                {selected.fotos?.length > 0 ? (
                  <div className="flex flex-col gap-3">
                    <div className="relative aspect-[4/3] bg-surface-container-highest rounded-2xl overflow-hidden border border-outline-variant/10 flex items-center justify-center">
                       <img src={fileUrl(selected.fotos[currentPhotoIndex]?.urlArchivo)} className="w-full h-full object-contain bg-black/5" />
                       
                       <button 
                         onClick={() => setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : selected.fotos.length - 1)}
                         className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                       >
                         <span className="material-symbols-outlined">chevron_left</span>
                       </button>

                       <button 
                         onClick={() => setCurrentPhotoIndex(prev => prev < selected.fotos.length - 1 ? prev + 1 : 0)}
                         className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                       >
                         <span className="material-symbols-outlined">chevron_right</span>
                       </button>
                       
                       <div className="absolute top-4 right-4 bg-black/60 text-white text-[10px] font-bold px-3 py-1 rounded-full">
                         {currentPhotoIndex + 1} / {selected.fotos.length}
                       </div>
                    </div>

                    <div className="bg-surface-container-low p-4 rounded-xl border border-outline-variant/10">
                       <p className="text-on-surface font-bold text-sm uppercase tracking-widest">{selected.fotos[currentPhotoIndex]?.parteCasa || "General"}</p>
                       {selected.fotos[currentPhotoIndex]?.titulo ? (
                         <p className="text-on-surface-variant text-sm mt-1">{selected.fotos[currentPhotoIndex].titulo}</p>
                       ) : (
                         <p className="text-on-surface-variant/50 text-sm mt-1 italic">Sin comentarios u observaciones.</p>
                       )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                      {selected.fotos.map((f, idx) => (
                        <button
                          key={f.id}
                          onClick={() => setCurrentPhotoIndex(idx)}
                          className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${idx === currentPhotoIndex ? 'border-primary shadow-md' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          <img src={fileUrl(f.urlArchivo)} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 text-center">
                    <p className="text-on-surface-variant text-sm">No hay fotografías disponibles.</p>
                  </div>
                )}
              </section>

              {/* Documentos */}
              <section className="space-y-4">
                <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary">Documentos ({selected.documentos?.length || 0})</h4>
                <div className="space-y-2">
                  {(selected.documentos || []).map(d => (
                    <a
                      key={d.id}
                      href={fileUrl(d.urlArchivo)}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl hover:bg-surface-container-highest transition-colors group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary">description</span>
                        <div>
                          <p className="text-on-surface text-xs font-bold">{d.tipo}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium">{d.titulo || "Sin título"}</p>
                        </div>
                      </div>
                      <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-all">download</span>
                    </a>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Datos */}
      <Modal
        open={openEditCaptacion}
        title="Editar Datos de Captación"
        onClose={() => setOpenEditCaptacion(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenEditCaptacion(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={saveEdit} disabled={busy}>
              Guardar Cambios
            </Button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Input
            label="Nombre Cliente"
            value={editForm.nombreCliente}
            onChange={(v) => setEditForm((p) => ({ ...p, nombreCliente: v }))}
          />
          <Input
            label="RUT Cliente"
            value={editForm.rutCliente}
            onChange={(v) => setEditForm((p) => ({ ...p, rutCliente: v }))}
          />
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={editForm.direccion}
              onChange={(v) => setEditForm((p) => ({ ...p, direccion: v }))}
            />
          </div>
          <Input
            label="Comuna"
            value={editForm.comuna}
            onChange={(v) => setEditForm((p) => ({ ...p, comuna: v }))}
          />
          <Input
            label="Región"
            value={editForm.region}
            onChange={(v) => setEditForm((p) => ({ ...p, region: v }))}
          />
          <Input
            label="N° Documento C.I."
            value={editForm.numeroDocumentoCI}
            onChange={(v) => setEditForm((p) => ({ ...p, numeroDocumentoCI: v }))}
          />
          <Input
            label="Firma Notarial"
            value={editForm.firmaNotarial}
            onChange={(v) => setEditForm((p) => ({ ...p, firmaNotarial: v }))}
          />
          <Input
            label="Fecha Ocurrencia"
            type="date"
            value={editForm.fechaOcurrencia}
            onChange={(v) => setEditForm((p) => ({ ...p, fechaOcurrencia: v }))}
          />
          <Input
            label="Antigüedad Edificio (años)"
            type="number"
            value={editForm.antiguedadEdificio}
            onChange={(v) => setEditForm((p) => ({ ...p, antiguedadEdificio: v }))}
          />
          <Input
            label="m2 Vivienda Total"
            type="number"
            step="0.01"
            value={editForm.m2ViviendaTotal}
            onChange={(v) => setEditForm((p) => ({ ...p, m2ViviendaTotal: v }))}
          />
        </div>
      </Modal>

      {/* Modal Rechazar Captación */}
      <Modal
        open={openReject}
        title="Rechazar Captación"
        onClose={() => setOpenReject(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenReject(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={rechazar} disabled={busy}>
              Confirmar Rechazo
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <p className="text-sm font-medium text-on-surface-variant">
            Por favor, indica el motivo del rechazo para que el captador pueda realizar las correcciones necesarias.
          </p>
          <textarea
            value={rejectMotivo}
            onChange={(e) => setRejectMotivo(e.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
            placeholder="Ej: Falta mandato notarial, fotos borrosas, o información de contacto incompleta..."
          />
        </div>
      </Modal>
    </main>
  );
}
