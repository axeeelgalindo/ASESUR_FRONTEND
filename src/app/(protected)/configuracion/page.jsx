"use client";

import { useEffect, useState, useMemo } from "react";
import { apiGet, apiPatch } from "@/lib/api";
import { useSession } from "next-auth/react";

function cls(...s) {
  return s.filter(Boolean).join(" ");
}

function Modal({ isOpen, onClose, title, children, footer }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg rounded-[2.5rem] border border-outline-variant/10 bg-surface-container shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="flex items-center justify-between border-b border-outline-variant/5 px-8 py-6">
          <h3 className="text-xl font-black text-on-surface uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="h-10 w-10 rounded-full hover:bg-on-surface/5 transition-colors">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-8 space-y-6">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-outline-variant/5 bg-on-surface/[0.02] px-8 py-6">{footer}</div>}
      </div>
    </div>
  );
}

function Section({ title, description, onAdd, children }) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black tracking-tight text-on-surface uppercase">{title}</h3>
          <p className="text-sm font-medium text-on-surface-variant/70">{description}</p>
        </div>
        <Button onClick={onAdd} variant="secondary" className="h-10 px-3 shrink-0">
          <span className="material-symbols-outlined text-lg">add</span>
          Agregar
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Input({ label, value, onChange, onSave, placeholder, type = "text", disabled = false, multiline = false }) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleBlur = () => {
    if (onSave && localValue !== value) {
      onSave(localValue);
    }
  };

  const handleChange = (val) => {
    setLocalValue(val);
    if (onChange) onChange(val);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !multiline) {
      e.currentTarget.blur();
    }
  };

  return (
    <label className={cls("flex flex-col gap-1.5", disabled && "opacity-50")}>
      {label && <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>}
      {multiline ? (
        <textarea
          rows={4}
          value={localValue ?? ""}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          className="w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm resize-none"
        />
      ) : (
        <input
          type={type}
          value={localValue ?? ""}
          placeholder={placeholder}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="h-12 w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm"
        />
      )}
    </label>
  );
}

function Button({ children, onClick, disabled, variant = "primary", className }) {
  const v = {
    primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/10",
    secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border border-outline-variant/30",
    ghost: "text-on-surface-variant hover:bg-surface-container",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition active:scale-95 disabled:opacity-50",
        v,
        className
      )}
    >
      {children}
    </button>
  );
}

export default function ConfiguracionPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null); // id del parametro que se está guardando
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [parametros, setParametros] = useState([]);
  const [activeCategory, setActiveCategory] = useState("SLA");

  const [openCreate, setOpenCreate] = useState(false);
  const [newParam, setNewParam] = useState({ clave: "", valor: "", tipo: "STRING", categoria: "SLA" });

  const fetchParams = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/configuracion");
      setParametros(data);
    } catch (e) {
      setError("No se pudo cargar la configuración.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchParams();
  }, []);

  const handleUpdate = async (id, valor) => {
    setBusy(id);
    setError(null);
    setSuccess(null);
    try {
      await apiPatch(`/configuracion/${id}`, { valor });
      setParametros(prev => prev.map(p => p.id === id ? { ...p, valor } : p));
      setSuccess("Parámetro actualizado.");
      setTimeout(() => setSuccess(null), 3000);
    } catch (e) {
      setError("Error al actualizar.");
    } finally {
      setBusy(null);
    }
  };

  const handleCreate = async () => {
    setBusy("creating");
    try {
      await apiPost("/configuracion", { ...newParam, categoria: activeCategory });
      await fetchParams();
      setOpenCreate(false);
      setNewParam({ clave: "", valor: "", tipo: "STRING", categoria: activeCategory });
      setSuccess("Parámetro creado correctamente.");
    } catch (e) {
      setError(e?.response?.data?.error || "Error al crear parámetro.");
    } finally {
      setBusy(null);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("¿Seguro que deseas eliminar este parámetro?")) return;
    setBusy(id);
    try {
      await apiDel(`/configuracion/${id}`);
      setParametros(prev => prev.filter(p => p.id !== id));
      setSuccess("Parámetro eliminado.");
    } catch (e) {
      setError("Error al eliminar.");
    } finally {
      setBusy(null);
    }
  };

  const cats = [
    { id: "SLA", label: "Tiempos (SLA)", icon: "timer" },
    { id: "PLANTILLA", label: "Plantillas", icon: "mail" },
    { id: "SISTEMA", label: "Sistema", icon: "settings" },
  ];

  const filtered = useMemo(() => {
    return parametros.filter(p => p.categoria === activeCategory);
  }, [parametros, activeCategory]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 text-on-surface-variant/30">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
        <p className="mt-6 text-xs font-black uppercase tracking-[0.2em]">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-[1400px] px-6 py-10 lg:px-12 animate-in fade-in duration-700">
      <header className="mb-10 flex flex-col gap-4">
        <p className="text-on-surface-variant font-medium">Ajusta los parámetros operativos, tiempos de respuesta y plantillas del sistema.</p>
      </header>

      {(error || success) && (
        <div className={cls(
          "mb-8 flex items-center gap-3 rounded-2xl border p-4 text-sm font-bold animate-in slide-in-from-top-4",
          error ? "border-error/20 bg-error/5 text-error" : "border-tertiary/20 bg-tertiary/5 text-tertiary"
        )}>
          <span className="material-symbols-outlined">{error ? "report" : "check_circle"}</span>
          {error || success}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Navigation Sidebar */}
        <aside className="w-full lg:w-72 shrink-0">
          <nav className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            {cats.map(c => (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={cls(
                  "flex items-center gap-3 rounded-2xl px-5 py-4 text-sm font-bold transition-all whitespace-nowrap",
                  activeCategory === c.id
                    ? "bg-primary text-on-primary shadow-xl shadow-primary/20"
                    : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
                )}
              >
                <span className="material-symbols-outlined">{c.icon}</span>
                {c.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Content Area */}
        <div className="flex-1 space-y-12">
          {activeCategory === "SLA" && (
            <Section
              title="Acuerdos de Nivel de Servicio"
              description="Define los días máximos permitidos para cada etapa."
              onAdd={() => {
                setNewParam({ clave: "", valor: "", tipo: "NUMBER", categoria: "SLA" });
                setOpenCreate(true);
              }}
            >
              {filtered.map(p => (
                <div key={p.id} className="group relative rounded-[2rem] border border-outline-variant/10 bg-surface-container-low/40 p-6 transition-all hover:bg-surface-container-low hover:shadow-xl">
                  <div className="mb-4 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Días Permitidos</span>
                    <div className="flex items-center gap-2">
                      {busy === p.id && <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />}
                      <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-full hover:bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </div>
                  <Input
                    label={p.clave.replace(/_/g, " ").toUpperCase()}
                    type="number"
                    value={p.valor}
                    onSave={v => handleUpdate(p.id, v)}
                  />
                </div>
              ))}
            </Section>
          )}

          {activeCategory === "PLANTILLA" && (
            <Section
              title="Plantillas de Correo"
              description="Configura el asunto y el mensaje que se envía automáticamente."
              onAdd={() => {
                setNewParam({ clave: "", valor: "", tipo: "STRING", categoria: "PLANTILLA" });
                setOpenCreate(true);
              }}
            >
              <div className="grid grid-cols-1 gap-8 w-full">
                <div className="space-y-6">
                  {filtered.map(p => (
                    <div key={p.id} className="group relative rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-low/40 p-8 shadow-sm hover:bg-surface-container-low transition-all">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-primary">{p.clave.includes("asunto") ? "subject" : "notes"}</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">{p.clave}</span>
                        </div>
                        <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-full hover:bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black">
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                      <Input
                        multiline={p.clave.includes("mensaje")}
                        value={p.valor}
                        onSave={v => handleUpdate(p.id, v)}
                      />
                    </div>
                  ))}
                  <div className="rounded-xl bg-on-surface/[0.03] p-4 text-[10px] font-bold text-on-surface-variant/60 flex items-center gap-3">
                    <span className="material-symbols-outlined text-sm">lightbulb</span>
                    Etiquetas sugeridas: <code className="text-primary font-black">%FOLIO%</code>, <code className="text-primary font-black">%CLIENTE%</code>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {activeCategory === "SISTEMA" && (
            <Section
              title="Parámetros Globales"
              description="Información general y parámetros técnicos."
              onAdd={() => {
                setNewParam({ clave: "", valor: "", tipo: "STRING", categoria: "SISTEMA" });
                setOpenCreate(true);
              }}
            >
              {filtered.map(p => (
                <div key={p.id} className="group relative rounded-[2rem] border border-outline-variant/10 bg-surface-container-low/40 p-8 transition-all hover:bg-surface-container-low hover:shadow-xl">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">{p.tipo}</span>
                    <button onClick={() => handleDelete(p.id)} className="h-8 w-8 rounded-full hover:bg-error/10 text-error opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center font-black">
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  </div>
                  <Input
                    label={p.clave.replace(/_/g, " ").toUpperCase()}
                    value={p.valor}
                    onSave={v => handleUpdate(p.id, v)}
                  />
                </div>
              ))}
            </Section>
          )}
        </div>
      </div>

      <Modal
        isOpen={openCreate}
        onClose={() => setOpenCreate(false)}
        title={`Agregar en ${activeCategory}`}
        footer={(
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={busy === "creating"}>Crear Parámetro</Button>
          </>
        )}
      >
        <div className="grid gap-6">
          <Input label="Clave Única (sin espacios)" placeholder="ej: mi_nueva_plantilla" value={newParam.clave} onChange={v => setNewParam({ ...newParam, clave: v })} />
          <Input label="Valor Inicial" multiline value={newParam.valor} onChange={v => setNewParam({ ...newParam, valor: v })} />
          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">Tipo</span>
              <select
                value={newParam.tipo}
                onChange={e => setNewParam({ ...newParam, tipo: e.target.value })}
                className="h-12 w-full rounded-2xl border border-outline-variant/10 bg-surface-container-low px-4 text-sm font-bold text-on-surface outline-none"
              >
                <option value="STRING">Texto (String)</option>
                <option value="NUMBER">Número (Number)</option>
                <option value="JSON">JSON (Objeto)</option>
                <option value="BOOLEAN">Booleano (True/False)</option>
              </select>
            </label>
          </div>
        </div>
      </Modal>
    </main>
  );
}