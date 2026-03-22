"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { apiGet, apiPatch, fileUrl } from "@/lib/api";
import { useSession } from "next-auth/react";

function cls(...s) {
  return s.filter(Boolean).join(" ");
}

function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-surface-container-high text-on-surface-variant border-outline-variant/20",
    blue: "bg-primary/10 text-primary border-primary/20",
    green: "bg-tertiary-container text-on-tertiary-container border-tertiary/20",
    amber: "bg-secondary/10 text-secondary border-secondary/20",
    red: "bg-error-container text-on-error-container border-error/20",
    purple: "bg-tertiary-fixed-dim text-on-tertiary-fixed border-tertiary-fixed/20",
  };
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
        tones[tone] || tones.gray
      )}
    >
      {children}
    </span>
  );
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
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [casos, setCasos] = useState([]);
  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'

  // Filters
  const [filterEstado, setFilterEstado] = useState("");
  const [filterRamo, setFilterRamo] = useState("");
  const [filterFecha, setFilterFecha] = useState(""); // "" or "hoy" or "semana"

  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  // Asignación de asesor (operaciones)
  const [asesores, setAsesores] = useState([]);
  const [asesorPick, setAsesorPick] = useState("");

  const userRole = (session?.user?.rol || session?.user?.role || "USUARIO").toUpperCase();
  const canCreate = ["CAPTADOR", "ASESOR", "OPERACIONES", "SUPERADMIN"].includes(userRole);
  const canAssignAsesor = ["OPERACIONES", "SUPERADMIN", "FINANZAS"].includes(userRole);

  const refresh = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiGet("/captaciones");
      setCasos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando captaciones");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    let result = [...casos];

    // Search
    const q = query.trim().toLowerCase();
    if (q) {
      result = result.filter((c) =>
        String(c.folio ?? "").includes(q) ||
        String(c.nombreCliente ?? "").toLowerCase().includes(q) ||
        String(c.rutCliente ?? "").toLowerCase().includes(q) ||
        String(c.direccion ?? "").toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (filterEstado) {
      result = result.filter(c => {
        const isAsignado = !!c.asesorId;
        return filterEstado === "ASIGNADO" ? isAsignado : !isAsignado;
      });
    }

    // Branch (Ramo) Filter
    if (filterRamo) {
      result = result.filter(c => c.tipo === filterRamo);
    }

    // Date Filter
    if (filterFecha) {
      const now = new Date();
      result = result.filter(c => {
        const d = new Date(c.creadoEn || c.actualizadoEn);
        if (filterFecha === "hoy") {
          return d.toDateString() === now.toDateString();
        }
        if (filterFecha === "semana") {
          const weekAgo = new Date();
          weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo;
        }
        return true;
      });
    }

    return result.sort((a, b) => new Date(b.actualizadoEn) - new Date(a.actualizadoEn));
  }, [casos, query, filterEstado, filterRamo, filterFecha]);

  const openCaso = async (c) => {
    setError(null);
    setBusy(true);
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
      const full = await apiGet(`/captaciones/${selected.id}`);
      setSelected(full);
      refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error asignando asesor");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="max-w-[1600px] mx-auto px-6 py-10 lg:px-12">
      {/* Header Section */}
      <header className="mb-10 flex flex-col lg:items-center  md:flex-row md:items-end justify-between gap-6">
        <div>
          <p className="text-on-surface-variant font-medium">
            Gestión integral de cartera y nuevas captaciones en terreno.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {canCreate && (
            <button className="bg-secondary text-on-secondary font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-secondary/10">
              <span className="material-symbols-outlined">add</span>
              Nueva Captación
            </button>
          )}
        </div>
      </header>

      {/* Filter Bar */}
      <section className="mb-8">
        <div className="bg-surface-container rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search */}
            <div className="relative flex-1 min-w-[240px]">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant font-light">search</span>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-surface-container-low border border-outline-variant/10 focus:ring-1 focus:ring-primary rounded-xl pl-12 pr-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 transition-all outline-none"
                placeholder="Buscar por Folio, Cliente, RUT o Dirección..."
                type="text"
              />
            </div>

            {/* Select Filters */}
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="bg-surface-container-high text-on-surface text-sm font-semibold px-4 py-2.5 rounded-xl border-none outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {EstadoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select
              value={filterRamo}
              onChange={(e) => setFilterRamo(e.target.value)}
              className="bg-surface-container-high text-on-surface text-sm font-semibold px-4 py-2.5 rounded-xl border-none outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              {RamoOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>

            <select
              value={filterFecha}
              onChange={(e) => setFilterFecha(e.target.value)}
              className="bg-surface-container-high text-on-surface text-sm font-semibold px-4 py-2.5 rounded-xl border-none outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="">Cualquier Fecha</option>
              <option value="hoy">Hoy</option>
              <option value="semana">Últimos 7 días</option>
            </select>
          </div>

          {/* Toggle View */}
          <div className="flex items-center bg-surface-container-lowest p-1 rounded-xl border border-outline-variant/5">
            <button
              onClick={() => setViewMode("list")}
              className={cls(
                "p-2 rounded-lg transition-all",
                viewMode === "list" ? "bg-surface-container-highest text-secondary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined">view_list</span>
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={cls(
                "p-2 rounded-lg transition-all",
                viewMode === "grid" ? "bg-surface-container-highest text-secondary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
              )}
            >
              <span className="material-symbols-outlined">grid_view</span>
            </button>
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
                className="group relative bg-surface-container-low rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:translate-y-[-4px] hover:shadow-2xl hover:shadow-black/20 border border-outline-variant/10"
              >
                <div className={cls("h-1.5 w-full", isAsignado ? "bg-primary" : "bg-secondary")}></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold tracking-widest text-on-surface-variant uppercase">
                      SIN-{String(c.folio).padStart(6, "0")}
                    </span>
                    <Pill tone={isAsignado ? "green" : "amber"}>
                      {isAsignado ? "Asignado" : "Pendiente"}
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
                    className="hover:bg-surface-container/50 transition-colors cursor-pointer group"
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
                    <td className="px-8 py-5">
                      <Pill tone={isAsignado ? "green" : "amber"}>
                        {isAsignado ? "Asignado" : "Pendiente"}
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
      <footer className="mt-12 flex items-center justify-between border-t border-outline-variant/10 pt-8">
        <p className="text-sm text-on-surface-variant font-medium">
          Mostrando <span className="text-on-surface font-bold">{filtered.length}</span> captaciones
        </p>
        <div className="flex items-center gap-2">
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-highest text-secondary font-bold border border-secondary/20">1</button>
          <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high text-on-surface opacity-50 cursor-not-allowed">
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
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
              <button onClick={() => setOpenDetail(false)} className="p-2 hover:bg-surface-container-highest rounded-lg transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-8 space-y-8">
              {/* Resumen */}
              <section className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-on-surface font-bold mb-1">{selected.nombreCliente}</h3>
                    <p className="text-sm text-on-surface-variant">{selected.rutCliente}</p>
                  </div>
                  <Pill tone={!!selected.asesorId ? "green" : "amber"}>
                    {!!selected.asesorId ? "Asignado" : "Sin Asignar"}
                  </Pill>
                </div>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">Dirección</p>
                    <p className="text-on-surface font-medium">{selected.direccion || "—"}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-on-surface-variant font-bold uppercase tracking-tighter opacity-60">Comuna/Ciudad</p>
                    <p className="text-on-surface font-medium">{(selected.comuna || "") + (selected.ciudad ? `, ${selected.ciudad}` : "") || "—"}</p>
                  </div>
                </div>
              </section>

              {/* Asignación (if Operations/Admin) */}
              {canAssignAsesor && (
                <section className="space-y-4">
                  <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-secondary">Asignación de Asesor</h4>
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
                      className="bg-primary text-on-primary font-bold px-6 py-3 rounded-xl disabled:opacity-50 transition-all active:scale-95"
                    >
                      Asignar
                    </button>
                  </div>
                </section>
              )}

              {/* Fotos */}
              <section className="space-y-4">
                <h4 className="font-headline font-bold text-sm uppercase tracking-widest text-primary">Fotografías ({selected.fotos?.length || 0})</h4>
                <div className="grid grid-cols-2 gap-4">
                  {(selected.fotos || []).map(f => (
                    <div key={f.id} className="group relative aspect-video bg-surface-container-highest rounded-xl overflow-hidden border border-outline-variant/10">
                      {f.urlArchivo && (
                        <img src={fileUrl(f.urlArchivo)} alt={f.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-4 flex flex-col justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest">{f.parteCasa || "General"}</p>
                        <p className="text-white/70 text-[10px] truncate">{f.titulo || "Sin título"}</p>
                      </div>
                    </div>
                  ))}
                </div>
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
    </main>
  );
}
