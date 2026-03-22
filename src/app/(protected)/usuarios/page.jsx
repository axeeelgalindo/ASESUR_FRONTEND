"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { apiGet, apiPost, apiPatch, apiDel } from "@/lib/api";
import { useSession } from "next-auth/react";

/**
 * Labels UI
 */
const RolLabel = {
  CAPTADOR: "Captador",
  OPERACIONES: "Operaciones",
  FINANZAS: "Finanzas",
  ASESOR: "Asesor",
  INSPECTOR: "Inspector",
  ESTADISTICO: "Estadístico",
  SUPERADMIN: "Superadmin",
};

const RolOptions = [
  { value: "", label: "Todos los Roles" },
  { value: "CAPTADOR", label: "Captador" },
  { value: "OPERACIONES", label: "Operaciones" },
  { value: "FINANZAS", label: "Finanzas" },
  { value: "ASESOR", label: "Asesor" },
  { value: "INSPECTOR", label: "Inspector" },
  { value: "ESTADISTICO", label: "Estadístico" },
  { value: "SUPERADMIN", label: "Superadmin" },
];

const RolTone = {
  SUPERADMIN: "purple",
  OPERACIONES: "blue",
  FINANZAS: "green",
  ASESOR: "amber",
  INSPECTOR: "purple",
  CAPTADOR: "gray",
  ESTADISTICO: "gray",
};

function cls(...s) {
  return s.filter(Boolean).join(" ");
}

const fmt = (d) => {
  if (!d) return "—";
  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(d));
};

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

function Button({ children, onClick, disabled, variant = "primary", className, type = "button" }) {
  const v = {
    primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/10",
    secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30",
    danger: "bg-error text-on-error hover:bg-error/90 shadow-lg shadow-error/10",
    ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      type={type}
      className={cls(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
        v,
        className
      )}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", disabled = false }) {
  return (
    <label className={cls("flex flex-col gap-1.5", disabled && "opacity-50")}>
      {label && <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>}
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm disabled:bg-surface-container-highest"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, disabled = false }) {
  return (
    <label className={cls("flex flex-col gap-1.5", disabled && "opacity-50")}>
      {label && <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>}
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 text-sm font-bold text-on-surface outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Drawer({ open, title, onClose, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-surface/40 backdrop-blur-sm transition-opacity duration-500 animate-in fade-in" onClick={onClose} />
      <div className="relative h-full w-full max-w-xl border-l border-outline-variant/20 bg-surface-container p-0 shadow-2xl animate-in slide-in-from-right duration-500">
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-outline-variant/10 px-8 py-6">
            <h2 className="text-2xl font-black tracking-tight text-on-surface uppercase">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-error/10 hover:text-error transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto px-8 py-2 custom-scrollbar">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-2xl" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-surface/60 backdrop-blur-md" onClick={onClose} />
      <div className={cls("relative w-full overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container shadow-2xl transition-all duration-300 animate-in zoom-in-95", maxWidth)}>
        <div className="flex items-center justify-between border-b border-outline-variant/5 px-8 py-6">
          <h3 className="text-xl font-black tracking-tight text-on-surface uppercase">{title}</h3>
          <button onClick={onClose} className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-error/10 hover:text-error">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto p-8">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-outline-variant/5 bg-on-surface/[0.02] px-8 py-18">{footer}</div>}
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [usuarios, setUsuarios] = useState([]);
  const [query, setQuery] = useState("");
  const [filterRol, setFilterRol] = useState("");
  const [viewMode, setViewMode] = useState("grid");

  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  const [openCreate, setOpenCreate] = useState(false);
  const [newUser, setNewUser] = useState({ email: "", password: "", nombre: "", rol: "ASESOR", activo: true });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGet("/usuarios");
      setUsuarios(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || "Error cargando usuarios");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    return usuarios.filter((u) => {
      const q = query.toLowerCase();
      const matchesQuery = u.nombre?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
      const matchesRol = !filterRol || u.rol === filterRol;
      return matchesQuery && matchesRol;
    });
  }, [usuarios, query, filterRol]);

  const openUser = async (u) => {
    setBusy(true);
    try {
      const full = await apiGet(`/usuarios/${u.id}`);
      setSelected(full);
      setOpenDetail(true);
    } catch (e) {
      setError("Error cargando detalle");
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      await apiPost("/usuarios", newUser);
      await fetchUsers();
      setOpenCreate(false);
      setNewUser({ email: "", password: "", nombre: "", rol: "ASESOR", activo: true });
    } catch (e) {
      setError(e?.response?.data?.error || "Error creando usuario");
    } finally {
      setBusy(false);
    }
  };

  const handleSave = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      const data = {
        email: selected.email,
        nombre: selected.nombre,
        rol: selected.rol,
        activo: selected.activo,
      };
      if (selected.password) data.password = selected.password;

      await apiPatch(`/usuarios/${selected.id}`, data);
      await fetchUsers();
      setOpenDetail(false);
    } catch (e) {
      setError("Error actualizando usuario");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("¿Seguro que deseas eliminar este usuario?")) return;
    setBusy(true);
    try {
      await apiDel(`/usuarios/${selected.id}`);
      await fetchUsers();
      setOpenDetail(false);
    } catch (e) {
      setError(e?.response?.data?.error || "Error eliminando usuario");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-[1600px] px-6 py-10 lg:px-12 animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="space-y-1">
          <p className="text-on-surface-variant font-medium">Gestión de equipo, roles y visibilidad del sistema.</p>
        </div>
        <Button onClick={() => setOpenCreate(true)}>
          <span className="material-symbols-outlined text-xl">person_add</span>
          Nuevo Usuario
        </Button>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-error/20 bg-error/5 p-4 text-sm font-bold text-error flex items-center gap-3">
          <span className="material-symbols-outlined">report</span>
          {error}
          <button className="ml-auto underline" onClick={() => setError(null)}>Cerrar</button>
        </div>
      )}

      {/* Stats Quick View */}
      <div className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10">
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-1">Total Usuarios</div>
          <div className="text-3xl font-black text-on-surface">{usuarios.length}</div>
        </div>
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10">
          <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-1">Activos</div>
          <div className="text-3xl font-black text-tertiary">{usuarios.filter(u => u.activo).length}</div>
        </div>
      </div>

      <section className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3 min-w-[300px]">
          <div className="relative flex-1 min-w-[240px]">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/50">search</span>
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="h-11 w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low pl-12 pr-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
            />
          </div>
          <select
            value={filterRol}
            onChange={(e) => setFilterRol(e.target.value)}
            className="h-11 rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 text-sm font-bold text-on-surface outline-none transition focus:ring-4 focus:ring-primary/5 cursor-pointer"
          >
            {RolOptions.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
          </select>
        </div>

        <div className="flex items-center rounded-2xl border border-outline-variant/10 bg-surface-container-lowest p-1 shadow-sm">
          <button onClick={() => setViewMode("grid")} className={cls("flex h-9 w-9 items-center justify-center rounded-xl transition", viewMode === "grid" ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant/60 hover:bg-on-surface/5")}>
            <span className="material-symbols-outlined text-xl">grid_view</span>
          </button>
          <button onClick={() => setViewMode("list")} className={cls("flex h-9 w-9 items-center justify-center rounded-xl transition", viewMode === "list" ? "bg-primary text-on-primary shadow-lg shadow-primary/20" : "text-on-surface-variant/60 hover:bg-on-surface/5")}>
            <span className="material-symbols-outlined text-xl">view_list</span>
          </button>
        </div>
      </section>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 text-on-surface-variant/30">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
          <p className="mt-6 text-xs font-black uppercase tracking-[0.2em]">Sincronizando equipo...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/30">
          <span className="material-symbols-outlined text-6xl">person_search</span>
          <p className="mt-4 font-bold">No se encontraron usuarios que coincidan.</p>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((u) => (
            <button
              key={u.id}
              onClick={() => openUser(u)}
              className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-low/40 p-6 text-left transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:bg-surface-container-high/60 hover:shadow-2xl hover:shadow-primary/5 outline-none"
            >
              <div className="mb-6 flex items-start justify-between">
                <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary text-on-primary text-2xl font-black shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
                  {u.nombre?.charAt(0).toUpperCase() || "?"}
                </div>
                <Pill tone={u.activo ? "green" : "gray"}>{u.activo ? "Activo" : "Inactivo"}</Pill>
              </div>
              <h3 className="text-xl font-black tracking-tight text-on-surface group-hover:text-primary transition-colors line-clamp-1">{u.nombre || "Sin Nombre"}</h3>
              <p className="mt-1 text-sm font-bold text-on-surface-variant/70 line-clamp-1">{u.email}</p>

              <div className="mt-6 pt-6 border-t border-outline-variant/5 flex items-center justify-between">
                <Pill tone={RolTone[u.rol]}>{RolLabel[u.rol] || u.rol}</Pill>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-1">
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-low/40 backdrop-blur-md">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-outline-variant/10 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">
                <th className="px-8 py-5">Nombre / Email</th>
                <th className="px-8 py-5">RolUsuario</th>
                <th className="px-8 py-5">Estado</th>
                <th className="px-8 py-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filtered.map((u) => (
                <tr key={u.id} className="group hover:bg-on-surface/[0.02] transition-colors">
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-black text-primary uppercase">{u.nombre?.charAt(0) || "?"}</div>
                      <div>
                        <div className="text-sm font-bold text-on-surface">{u.nombre || "—"}</div>
                        <div className="text-xs font-semibold text-on-surface-variant/60">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-4"><Pill tone={RolTone[u.rol]}>{RolLabel[u.rol] || u.rol}</Pill></td>
                  <td className="px-8 py-4"><Pill tone={u.activo ? "green" : "gray"}>{u.activo ? "Activo" : "Inactivo"}</Pill></td>
                  <td className="px-8 py-4 text-right">
                    <button onClick={() => openUser(u)} className="h-10 w-10 rounded-full hover:bg-on-surface/5 text-on-surface-variant transition-all hover:text-primary">
                      <span className="material-symbols-outlined">edit</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Drawer Detalle / Edición */}
      <Drawer open={openDetail} title="Detalle de Usuario" onClose={() => setOpenDetail(false)}>
        {selected && (
          <div className="space-y-10">
            <div className="flex items-center gap-6 p-6 rounded-[2rem] bg-surface-container-low border border-outline-variant/10 shadow-sm animate-in fade-in slide-in-from-top-4">
              <div className="h-20 w-20 flex items-center justify-center bg-primary text-on-primary rounded-[1.5rem] text-4xl font-black shadow-xl shadow-primary/20">
                {selected.nombre?.charAt(0).toUpperCase() || "?"}
              </div>
              <div>
                <h3 className="text-2xl font-black text-on-surface">{selected.nombre || "Sin Nombre"}</h3>
                <Pill tone="purple">{RolLabel[selected.rol] || selected.rol}</Pill>
              </div>
            </div>

            <div className="grid gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Input label="Nombre completo" value={selected.nombre} onChange={v => setSelected({ ...selected, nombre: v })} />
              <Input label="Correo electrónico" value={selected.email} onChange={v => setSelected({ ...selected, email: v })} />
              <Input label="Nueva contraseña (dejar en blanco para no cambiar)" type="password" placeholder="••••••••" value={selected.password || ""} onChange={v => setSelected({ ...selected, password: v })} />
              <Select label="Rol en el sistema" value={selected.rol} options={RolOptions.filter(o => o.value !== "")} onChange={v => setSelected({ ...selected, rol: v })} />

              <div className="flex items-center justify-between p-4 rounded-2xl bg-surface-container-lowest border border-outline-variant/10">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-on-surface">Estado de cuenta</span>
                  <span className="text-xs font-bold text-on-surface-variant/60">{selected.activo ? "Permitir acceso al sistema" : "Acceso bloqueado"}</span>
                </div>
                <button
                  onClick={() => setSelected({ ...selected, activo: !selected.activo })}
                  className={cls("relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 outline-none", selected.activo ? "bg-tertiary" : "bg-on-surface-variant/20")}
                >
                  <span className={cls("pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200", selected.activo ? "translate-x-5" : "translate-x-0")} />
                </button>
              </div>

              <div className="pt-6 flex flex-col gap-3">
                <Button onClick={handleSave} disabled={busy} className="w-full h-12">Guardar Cambios</Button>
                {session?.user?.rol === "SUPERADMIN" && (
                  <Button variant="danger" onClick={handleDelete} disabled={busy} className="w-full h-12">Eliminar Definitivamente</Button>
                )}
                <Button variant="secondary" onClick={() => setOpenDetail(false)} disabled={busy} className="w-full h-12">Cancelar</Button>
              </div>
            </div>

            {/* Gestión de Supervisión */}
            <hr className="border-outline-variant/10" />
            <div className="space-y-6">
              <h4 className="text-lg font-black text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">visibility</span>
                Jerarquía de Supervisión
              </h4>

              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-3">Supervisa a:</div>
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 min-h-[60px] flex flex-col gap-2">
                    {selected.supervisaA?.length > 0 ? selected.supervisaA.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm p-2 bg-on-surface/5 rounded-xl border border-outline-variant/5">
                        <span className="font-bold">{s.supervisado?.nombre}</span>
                        <Pill tone={RolTone[s.supervisado?.rol]}>{RolLabel[s.supervisado?.rol] || s.supervisado?.rol}</Pill>
                        <button className="ml-auto text-error hover:scale-110 transition-transform" onClick={async () => {
                          if (!confirm(`¿Quitar supervisión de ${s.supervisado?.nombre}?`)) return;
                          await apiDel(`/usuarios/${selected.id}/supervision/${s.supervisadoId}`);
                          openUser(selected); // refresh detail
                        }}>
                          <span className="material-symbols-outlined text-sm">remove_circle</span>
                        </button>
                      </div>
                    )) : <div className="text-xs italic text-on-surface-variant/40 py-2">No supervisa a nadie actualmente.</div>}
                  </div>
                  {/* Agregar subordinado */}
                  <div className="mt-4 flex gap-2">
                    <select
                      className="flex-1 h-10 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-xs font-bold text-on-surface outline-none focus:border-primary/50"
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (!val) return;
                        try {
                          await apiPost(`/usuarios/${selected.id}/supervision`, { supervisadoId: val });
                          openUser(selected);
                          e.target.value = "";
                        } catch (err) {
                          alert(err?.response?.data?.error || "Error agregando supervisión");
                        }
                      }}
                    >
                      <option value="">+ Agregar a quien supervisa...</option>
                      {usuarios
                        .filter(u => u.id !== selected.id && !selected.supervisaA?.some(s => s.supervisadoId === u.id))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.nombre} ({RolLabel[u.rol]})</option>
                        ))
                      }
                    </select>
                  </div>
                </div>

                <div className="pb-4">
                  <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 mb-3">Supervisado por:</div>
                  <div className="bg-surface-container-low rounded-2xl p-4 border border-outline-variant/10 min-h-[60px] flex flex-col gap-2">
                    {selected.supervisadoPor?.length > 0 ? selected.supervisadoPor.map(s => (
                      <div key={s.id} className="flex items-center justify-between text-sm p-2 gap-3 bg-on-surface/5 rounded-xl border border-outline-variant/5">
                        <span className="font-bold">{s.supervisor?.nombre}</span>
                        <Pill tone={RolTone[s.supervisor?.rol]}>{RolLabel[s.supervisor?.rol] || s.supervisor?.rol}</Pill>
                        <button className="ml-auto text-error hover:scale-110 transition-transform" onClick={async () => {
                          if (!confirm(`¿Quitar supervisión de ${s.supervisor?.nombre}?`)) return;
                          await apiDel(`/usuarios/${s.supervisorId}/supervision/${selected.id}`);
                          openUser(selected); // refresh detail
                        }}>
                          <span className="material-symbols-outlined text-sm">remove_circle</span>
                        </button>
                      </div>
                    )) : <div className="text-xs italic text-on-surface-variant/40 py-2">No tiene supervisores asignados.</div>}
                  </div>
                  {/* Agregar supervisor */}
                  <div className="mt-4 flex gap-2 ">
                    <select
                      className="flex-1 h-10 rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 text-xs font-bold text-on-surface outline-none focus:border-primary/50"
                      onChange={async (e) => {
                        const val = e.target.value;
                        if (!val) return;
                        try {
                          await apiPost(`/usuarios/${val}/supervision`, { supervisadoId: selected.id });
                          openUser(selected);
                          e.target.value = "";
                        } catch (err) {
                          alert(err?.response?.data?.error || "Error agregando supervisor");
                        }
                      }}
                    >
                      <option value="">+ Agregar supervisor...</option>
                      {usuarios
                        .filter(u => u.id !== selected.id && !selected.supervisadoPor?.some(s => s.supervisorId === u.id))
                        .map(u => (
                          <option key={u.id} value={u.id}>{u.nombre} ({RolLabel[u.rol]})</option>
                        ))
                      }
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Modal Nuevo Usuario */}
      <Modal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        title="Crear Nuevo Usuario"
        footer={(
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)} disabled={busy}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={busy}>Crear Usuario</Button>
          </>
        )}
      >
        <div className="grid gap-6">
          <Input label="Nombre del usuario" placeholder="Ej: Juan Pérez" value={newUser.nombre} onChange={v => setNewUser({ ...newUser, nombre: v })} />
          <Input label="Email institucional" placeholder="juan@asesur.cl" value={newUser.email} onChange={v => setNewUser({ ...newUser, email: v })} />
          <Input label="Contraseña temporal" type="password" placeholder="••••••••" value={newUser.password} onChange={v => setNewUser({ ...newUser, password: v })} />
          <Select label="Rol asignado" value={newUser.rol} options={RolOptions.filter(o => o.value !== "")} onChange={v => setNewUser({ ...newUser, rol: v })} />
        </div>
      </Modal>
    </main>
  );
}