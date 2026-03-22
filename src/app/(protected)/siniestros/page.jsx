"use client";

// src/app/(protected)/siniestros/page.jsx
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPostForm, apiPatch, fileUrl } from "@/lib/api";

/**
 * Labels
 */
const TipoCasoLabel = {
  HIPOTECARIO_A: "Hipotecario (A)",
  POLIZA_PARTICULAR_B: "Póliza Particular (B)",
};

const TipoDocumentoLabel = {
  DENUNCIA_SINIESTRO_CORREO: "Correo denuncia siniestro (respaldo)",
  ASIGNACION_FORMAL_CORREO: "Correo asignación formal liquidador",
  POLIZA: "Póliza (opcional)",
  INSPECCION_ASESUR: "Inspección ASESUR",
  FOTOS_VIDEOS: "Fotos y/o videos",
  MANDATO_ASESORIA_NOTARIAL: "Mandato asesoría notarial",
  CONTRATO_ASESORIA: "Contrato asesoría",
  PRESUPUESTO_EXCEL: "Presupuesto (Excel)",
  PROPUESTA_LIQUIDADOR: "Propuesta liquidador",
  INFORME_FINAL: "Informe final",

  // ✅ Facturación
  RESPALDO_PAGO_HONORARIOS: "Respaldo pago honorarios",
  BOLETA: "Boleta",

  OTRO: "Otro",
};

const EstadoGestionLabel = {
  PENDIENTE: "Pendiente",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  BLOQUEADA: "Bloqueada",
  CANCELADA: "Cancelada",
};

const EstadoSiniestroLabel = {
  // ✅ Estados Legados
  ABIERTO: "Abierto",
  EN_REVISION: "En revisión",
  PENDIENTE_AUTORIZACION: "Pendiente autorización",
  AUTORIZADO: "Autorizado",
  RECHAZADO: "Rechazado",
  EN_CURSO: "En curso (Siniestro)",
  CERRADO: "Cerrado",

  // ✅ Nuevos Estados de LIQUIDACION (según schema)
  INSPECCION: "Liquidación - Inspección",
  PRESUPUESTO: "Liquidación - Presupuesto",
  ENVIO_INFORMACION: "Liquidación - Envío de Información",
  RECEPCION_PROPUESTA: "Liquidación - Propuesta Liquidador",
  APROBADA: "Propuesta Aprobada",
  DESCONFORME: "Propuesta Desconforme",
  RECHAZADO_LIQ: "Caso rechazado", // Mapeado a RECHAZADO si es necesario
  INFORME_FINAL: "Liquidación - Informe final",
  COBRANZA: "Cobranza",
  FACTURACION: "Facturación",
};

const TipoGestionLabel = {
  INSPECCION: "Inspección",
  PRESUPUESTO: "Presupuesto",
  DESPACHO_ANTECEDENTES_LIQUIDADOR: "Despacho antecedentes al liquidador",
  RECEPCION_PROPUESTA: "Recepción propuesta",
  INFORME_FINAL: "Informe final",
  IMPUGNACION: "Impugnación",
  CIERRE: "Cierre",
  DESPACHO_BOLETA_INFORME_CLIENTE: "Despacho boleta/informe al cliente",
  PERSONALIZADA: "Personalizada",
};

const EstadoFacturacionLabel = {
  PENDIENTE: "Pendiente",
  PAGADO: "Pagado",
  ENVIADO_CLIENTE: "Enviado a cliente",
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
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
};

function Pill({ children, tone = "gray" }) {
  const tones = {
    gray: "bg-on-surface-variant/5 text-on-surface-variant border-outline-variant/20 hover:bg-on-surface-variant/10",
    blue: "bg-primary/10 text-primary border-primary/20",
    green: "bg-tertiary/10 text-tertiary border-tertiary/20",
    amber: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    red: "bg-error/10 text-error border-error/20",
    purple: "bg-secondary/10 text-secondary border-secondary/20",
  };
  return (
    <span
      className={cls(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition-all duration-300",
        tones[tone] || tones.gray
      )}
    >
      <span className="h-1 w-1 rounded-full bg-current opacity-40"></span>
      {children}
    </span>
  );
}

function Modal({ isOpen, onClose, title, children, footer, maxWidth = "max-w-2xl" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      <div
        className="fixed inset-0 bg-surface/80 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      />
      <div className={cls(
        "relative w-full overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container shadow-2xl transition-all duration-500 animate-in fade-in zoom-in slide-in-from-bottom-8",
        maxWidth
      )}>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-outline-variant/5 px-8 py-6">
          <h3 className="text-xl font-black tracking-tight text-on-surface uppercase">
            {title}
          </h3>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface/5 text-on-surface-variant transition-all hover:bg-error/10 hover:text-error"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto p-8 custom-scrollbar">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-end gap-3 border-t border-outline-variant/5 bg-on-surface/[0.02] px-8 py-6">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function Section({ title, desc, children, right }) {
  return (
    <div className="group overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest/40 p-6 shadow-sm backdrop-blur-md transition-all duration-500 hover:border-outline-variant/30 hover:shadow-xl hover:shadow-primary/5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-black tracking-tight text-on-surface">{title}</h3>
          {desc && <p className="mt-1 text-xs font-bold text-on-surface-variant/60">{desc}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

function Button({ children, onClick, disabled, variant = "primary", className, type = "button" }) {
  const styles = {
    primary: "bg-primary text-on-primary shadow-lg shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-surface-container-high text-on-surface border border-outline-variant/20 hover:bg-surface-container-highest hover:border-outline-variant/40",
    danger: "bg-error text-on-error shadow-lg shadow-error/20 hover:bg-error/90",
    ghost: "bg-transparent text-on-surface hover:bg-on-surface/5 border-transparent",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40",
        styles[variant],
        className
      )}
    >
      {children}
    </button>
  );
}

function Input({ label, value, onChange, placeholder, type = "text", disabled }) {
  return (
    <label className="group flex flex-col gap-1.5">
      <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 transition-colors group-focus-within:text-primary">
        {label}
      </span>
      <input
        type={type}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(v) => onChange(v.target.value)}
        disabled={disabled}
        className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 disabled:bg-surface-container-low"
      />
    </label>
  );
}

function Textarea({ label, value, onChange, placeholder, disabled }) {
  return (
    <label className="group flex flex-col gap-1.5">
      <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 transition-colors group-focus-within:text-primary">
        {label}
      </span>
      <textarea
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(v) => onChange(v.target.value)}
        disabled={disabled}
        className="min-h-[120px] rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 disabled:bg-surface-container-low"
      />
    </label>
  );
}

function Select({ label, value, onChange, options, disabled }) {
  return (
    <label className="group flex flex-col gap-1.5">
      <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70 transition-colors group-focus-within:text-primary">
        {label}
      </span>
      <select
        value={value ?? ""}
        onChange={(v) => onChange(v.target.value)}
        disabled={disabled}
        className="rounded-2xl border border-outline-variant/20 bg-surface-container-lowest px-4 py-3 text-sm font-bold text-on-surface outline-none transition-all focus:border-primary/50 focus:ring-4 focus:ring-primary/5 disabled:bg-surface-container-low"
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
  return (
    <>
      <div
        className={cls(
          "fixed inset-0 z-[100] bg-surface/40 backdrop-blur-md transition-opacity duration-500",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cls(
          "fixed inset-y-0 right-0 z-[110] flex w-full max-w-4xl flex-col bg-surface-container-lowest/90 shadow-2xl backdrop-blur-2xl transition-transform duration-500 ease-spring",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-outline-variant/10 p-8">
          <h2 className="text-3xl font-black tracking-tighter text-on-surface">{title}</h2>
          <button onClick={onClose} className="flex h-12 w-12 items-center justify-center rounded-full border border-outline-variant/20 bg-surface-container-high transition hover:scale-110 active:scale-90">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">{children}</div>
      </div>
    </>
  );
}

function Tabs({ tab, setTab, items }) {
  return (
    <div className="flex overflow-hidden rounded-2xl border border-outline-variant/20 bg-surface-container-low p-1.5 shadow-inner">
      {items.map((it) => {
        const active = tab === it.key;
        return (
          <button
            key={it.key}
            onClick={() => setTab(it.key)}
            className={cls(
              "relative flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-[10px] font-black uppercase tracking-widest transition-all duration-500",
              active
                ? "bg-primary text-on-primary shadow-lg shadow-primary/20"
                : "text-on-surface-variant hover:bg-on-surface/5"
            )}
            type="button"
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}

export default function SiniestrosPage() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [casos, setCasos] = useState([]);
  const [query, setQuery] = useState("");
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid");

  // ✅ filtro etapa (abiertos / cerrados)
  const [stageTab, setStageTab] = useState("ABIERTOS"); // ABIERTOS | CERRADOS

  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);

  // Word Generation
  const [openWordModal, setOpenWordModal] = useState(false);
  const [openBudgetModal, setOpenBudgetModal] = useState(false);
  const [selectedFotosWord, setSelectedFotosWord] = useState([]);

  const [tab, setTab] = useState("antecedentes");

  // Document upload form (genérico)
  const [docForm, setDocForm] = useState({
    tipo: "OTRO",
    titulo: "",
    file: null,
  });

  // Bitácora form
  const [bitForm, setBitForm] = useState({
    titulo: "",
    detalle: "",
  });

  // Gestión personalizada
  const [newGestion, setNewGestion] = useState({
    titulo: "",
    observaciones: "",
  });

  // Completar gestión (con doc opcional)
  const [completeModal, setCompleteModal] = useState({
    open: false,
    gestion: null,
    tipoDoc: "",
    tituloDoc: "",
    fechaRecepcion: "",
    observaciones: "",
    file: null,
  });

  // ✅ Facturación form
  const [factForm, setFactForm] = useState({
    estadoFacturacion: "PENDIENTE",
    montoHonorarios: "",
    fechaPago: "",
    fechaEnvioCliente: "",
    notasFacturacion: "",
  });

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiGet("/siniestros");
      setCasos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando siniestros");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (casos || [])
      .filter((c) => {
        // ✅ filtro “cerrados”
        const isCerrado = c.etapa === "CERRADO" || c.estado === "CERRADO";
        if (stageTab === "ABIERTOS" && isCerrado) return false;
        if (stageTab === "CERRADOS" && !isCerrado) return false;

        if (tipoFilter !== "ALL" && c.tipo !== tipoFilter) return false;
        if (estadoFilter !== "ALL" && c.estado !== estadoFilter) return false;

        if (!q) return true;
        return (
          String(c.folio ?? "").includes(q) ||
          String(c.nombreCliente ?? "").toLowerCase().includes(q) ||
          String(c.rutCliente ?? "").toLowerCase().includes(q) ||
          String(c.direccion ?? "").toLowerCase().includes(q) ||
          String(c.companiaSeguro ?? "").toLowerCase().includes(q) ||
          String(c.numeroSiniestro ?? "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.actualizadoEn) - new Date(a.actualizadoEn));
  }, [casos, query, stageTab, tipoFilter, estadoFilter]);

  const hydrateFactForm = (full) => {
    const toDateInput = (d) => {
      if (!d) return "";
      try {
        // yyyy-mm-dd (input date)
        const x = new Date(d);
        const yyyy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      } catch {
        return "";
      }
    };

    setFactForm({
      estadoFacturacion: full.estadoFacturacion || "PENDIENTE",
      montoHonorarios:
        full.montoHonorarios == null ? "" : String(full.montoHonorarios),
      fechaPago: toDateInput(full.fechaPago),
      fechaEnvioCliente: toDateInput(full.fechaEnvioCliente),
      notasFacturacion: full.notasFacturacion || "",
    });
  };

  const toggleFotoWord = (id) => {
    setSelectedFotosWord((prev) =>
      prev.includes(id) ? prev.filter((fid) => fid !== id) : [...prev, id]
    );
  };

  const openGenerarWord = () => {
    setSelectedFotosWord(selected?.fotos?.map(f => f.id) || []);
    setOpenWordModal(true);
  };

  const downloadWordSiniestro = async () => {
    if (!selected?.id) return;
    if (selectedFotosWord.length === 0) {
      alert("Debes seleccionar al menos 1 foto para generar el documento.");
      return;
    }
    try {
      setBusy(true);
      const data = await apiPost(`/casos/${selected.id}/generar-documento-siniestro`, {
        fotosSeleccionadas: selectedFotosWord
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Siniestro_${selected.folio}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setOpenWordModal(false);
    } catch (e) {
      setError("Fallo al generar Documento Ficha 1");
    } finally {
      setBusy(false);
    }
  };

  const downloadBudgetDoc = async () => {
    if (!selected?.id) return;
    try {
      setBusy(true);
      const data = await apiPost(`/casos/${selected.id}/generar-documento-presupuesto`, {
        fotosSeleccionadas: selectedFotosWord
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([data]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `Presupuesto_Evidencia_${selected.folio}.docx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setOpenBudgetModal(false);
    } catch (e) {
      setError("Fallo al generar Documento de Presupuesto");
    } finally {
      setBusy(false);
    }
  };

  const [emailForm, setEmailForm] = useState({
    destinatarios: "",
    asunto: "",
    mensaje: "",
  });
  const [openEmail, setOpenEmail] = useState(false);

  const sendEmailManual = async () => {
    if (!selected?.id) return;
    if (!emailForm.destinatarios || !emailForm.asunto) {
      alert("Faltan destinatarios o asunto");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/casos/${selected.id}/enviar-correo`, {
        destinatarios: emailForm.destinatarios,
        asunto: emailForm.asunto,
        mensaje: emailForm.mensaje
      });
      alert("Correo enviado exitosamente.");
      setOpenEmail(false);
      setEmailForm({ destinatarios: "", asunto: "", mensaje: "" });
    } catch (e) {
      setError(e?.response?.data?.error || "Error enviando correo");
    } finally {
      setBusy(false);
    }
  };

  const openCaso = async (c) => {
    setError(null);
    setBusy(true);
    try {
      const full = await apiGet(`/siniestros/${c.id}`);
      setSelected(full);
      hydrateFactForm(full);
      setOpenDetail(true);
      setTab("antecedentes");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando siniestro");
    } finally {
      setBusy(false);
    }
  };

  const reloadSelected = async () => {
    if (!selected?.id) return;
    const full = await apiGet(`/siniestros/${selected.id}`);
    setSelected(full);
    hydrateFactForm(full);
  };

  const addDocumento = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      if (!docForm.tipo) throw new Error("Falta tipo");
      if (!docForm.file) throw new Error("Selecciona un archivo");

      const fd = new FormData();
      fd.append("tipo", docForm.tipo);
      if (docForm.titulo?.trim()) fd.append("titulo", docForm.titulo.trim());
      fd.append("file", docForm.file);

      await apiPostForm(`/siniestros/${selected.id}/documentos`, fd);
      setDocForm({ tipo: "OTRO", titulo: "", file: null });
      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error subiendo documento");
    } finally {
      setBusy(false);
    }
  };

  const addEvento = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      if (!bitForm.titulo.trim()) throw new Error("Falta título");
      await apiPost(`/siniestros/${selected.id}/bitacora`, {
        titulo: bitForm.titulo.trim(),
        detalle: bitForm.detalle?.trim() || null,
      });
      setBitForm({ titulo: "", detalle: "" });
      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error creando evento");
    } finally {
      setBusy(false);
    }
  };

  const completarEvento = async (eventoId) => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/siniestros/${selected.id}/bitacora/${eventoId}/completar`, {});
      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error completando evento");
    } finally {
      setBusy(false);
    }
  };

  const crearGestionPers = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      if (!newGestion.titulo.trim()) throw new Error("Falta título");
      await apiPost(`/siniestros/${selected.id}/gestiones/personalizada`, {
        titulo: newGestion.titulo.trim(),
        observaciones: newGestion.observaciones?.trim() || null,
      });
      setNewGestion({ titulo: "", observaciones: "" });
      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error creando gestión");
    } finally {
      setBusy(false);
    }
  };

  const openCompletarGestion = (g) => {
    const defaultDoc =
      g.tipo === "INSPECCION"
        ? "INSPECCION_ASESUR"
        : g.tipo === "PRESUPUESTO"
          ? "PRESUPUESTO_EXCEL"
          : g.tipo === "RECEPCION_PROPUESTA"
            ? "PROPUESTA_LIQUIDADOR"
            : g.tipo === "INFORME_FINAL"
              ? "INFORME_FINAL"
              : "OTRO";

    setCompleteModal({
      open: true,
      gestion: g,
      tipoDoc: defaultDoc,
      tituloDoc: g.titulo || "",
      fechaRecepcion: "",
      observaciones: "",
      file: null,
    });
  };

  const completarGestion = async () => {
    if (!selected?.id || !completeModal.gestion?.id) return;
    setError(null);
    setBusy(true);

    try {
      const g = completeModal.gestion;

      const fd = new FormData();
      fd.append("tipoDoc", completeModal.tipoDoc);
      if (completeModal.tituloDoc?.trim()) fd.append("tituloDoc", completeModal.tituloDoc.trim());
      if (completeModal.observaciones?.trim()) fd.append("observaciones", completeModal.observaciones.trim());
      if (g.tipo === "INSPECCION" && completeModal.fechaRecepcion) {
        fd.append("fechaRecepcion", completeModal.fechaRecepcion);
      }
      if (completeModal.file) fd.append("file", completeModal.file);

      await apiPostForm(`/siniestros/${selected.id}/gestiones/${g.id}/completar`, fd);

      setCompleteModal({
        open: false,
        gestion: null,
        tipoDoc: "",
        tituloDoc: "",
        fechaRecepcion: "",
        observaciones: "",
        file: null,
      });

      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error completando gestión");
    } finally {
      setBusy(false);
    }
  };

  const impugnar = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/siniestros/${selected.id}/impugnar`, { observaciones: "Impugnación iniciada desde UI." });
      await reloadSelected();
      setTab("antecedentes");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error creando impugnación");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Facturación: guardar
  const saveFacturacion = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      const payload = {
        estadoFacturacion: factForm.estadoFacturacion,
        montoHonorarios: factForm.montoHonorarios === "" ? null : Number(factForm.montoHonorarios),
        fechaPago: factForm.fechaPago || null,
        fechaEnvioCliente: factForm.fechaEnvioCliente || null,
        notasFacturacion: factForm.notasFacturacion?.trim() || null,
      };

      await apiPatch(`/siniestros/${selected.id}/facturacion`, payload);
      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error guardando facturación");
    } finally {
      setBusy(false);
    }
  };

  // ✅ Facturación: botones rápidos
  const marcarPagado = async () => {
    setFactForm((p) => ({ ...p, estadoFacturacion: "PAGADO", fechaPago: p.fechaPago || new Date().toISOString().slice(0, 10) }));
    // guardado inmediato
    setTimeout(saveFacturacion, 0);
  };

  const marcarEnviado = async () => {
    setFactForm((p) => ({
      ...p,
      estadoFacturacion: "ENVIADO_CLIENTE",
      fechaEnvioCliente: p.fechaEnvioCliente || new Date().toISOString().slice(0, 10),
    }));
    setTimeout(saveFacturacion, 0);
  };

  // ✅ Upload rápido Facturación
  const uploadFactDoc = async (tipo) => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      if (!docForm.file) throw new Error("Selecciona un archivo primero");
      const fd = new FormData();
      fd.append("tipo", tipo);
      fd.append("titulo", docForm.titulo?.trim() || TipoDocumentoLabel[tipo] || tipo);
      fd.append("file", docForm.file);

      await apiPostForm(`/siniestros/${selected.id}/documentos`, fd);
      setDocForm({ tipo: "OTRO", titulo: "", file: null });
      await reloadSelected();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error subiendo documento de facturación");
    } finally {
      setBusy(false);
    }
  };

  const fmt = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleString("es-CL");
    } catch {
      return "—";
    }
  };

  const fmtDate = (d) => {
    if (!d) return "—";
    try {
      return new Date(d).toLocaleDateString("es-CL");
    } catch {
      return "—";
    }
  };

  const gestiones = selected?.gestiones || [];
  const documentos = selected?.documentos || [];
  const bitacora = selected?.bitacora || [];
  const fotos = selected?.fotos || [];

  const isCerradoSelected = selected?.etapa === "CERRADO" || selected?.estado === "CERRADO";

  // docs facturación filtrados
  const factDocs = documentos.filter((d) =>
    ["RESPALDO_PAGO_HONORARIOS", "BOLETA"].includes(d.tipo)
  );

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
          <Button variant="secondary" onClick={refresh} disabled={loading || busy} className="px-6 border-outline-variant/30">
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

      {/* ✅ Barra de Filtros Premium */}
      <div className="mb-10 grid gap-6 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-low/40 shadow-sm backdrop-blur-xl md:grid-cols-6 lg:grid-cols-12">
        <div className="flex flex-col gap-1.5 md:col-span-2 lg:col-span-3">
          <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Estado Etapa</span>
          <Tabs
            tab={stageTab}
            setTab={(v) => setStageTab(v)}
            items={[
              { key: "ABIERTOS", label: "Abiertos" },
              { key: "CERRADOS", label: "Cerrados" },
            ]}
          />
        </div>

        <div className="md:col-span-3 lg:col-span-4">
          <Input
            label="Búsqueda Inteligente"
            value={query}
            onChange={setQuery}
            placeholder="Compañía, cliente, RUT, folio..."
          />
        </div>

        <div className="md:col-span-2 lg:col-span-2">
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

        <div className="md:col-span-2 lg:col-span-2">
          <Select
            label="Estado Liquidación"
            value={estadoFilter}
            onChange={setEstadoFilter}
            options={[
              { value: "ALL", label: "Todos" },
              { value: "INSPECCION", label: "Inspección" },
              { value: "PRESUPUESTO", label: "Presupuesto" },
              { value: "ENVIO_INFORMACION", label: "Envío Información" },
              { value: "APROBADA", label: "Aprobada" },
              { value: "FACTURACION", label: "Facturación" },
            ]}
          />
        </div>

        <div className="flex flex-col gap-1.5 md:col-span-1 lg:col-span-1">
          <span className="ml-1 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Vista</span>
          <div className="flex overflow-hidden rounded-xl border border-outline-variant/20 bg-surface-container-low p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={cls(
                "flex flex-1 items-center justify-center py-1.5 transition-all outline-none",
                viewMode === "grid" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:bg-on-surface/5"
              )}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cls(
                "flex flex-1 items-center justify-center py-1.5 transition-all outline-none",
                viewMode === "list" ? "bg-primary text-on-primary shadow-lg" : "text-on-surface-variant hover:bg-on-surface/5"
              )}
            >
              <span className="material-symbols-outlined text-lg">view_list</span>
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
            <div className="material-symbols-outlined text-6xl animate-pulse">cloud_sync</div>
            <p className="mt-4 text-sm font-black uppercase tracking-widest animate-pulse">Cargando siniestros...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40 animate-in fade-in duration-700">
            <div className="material-symbols-outlined text-6xl">folder_off</div>
            <p className="mt-4 text-sm font-black uppercase tracking-widest">No hay expedientes registrados</p>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openCaso(c)}
                className="group relative flex flex-col overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-low/40 p-6 text-left shadow-sm backdrop-blur-md transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:bg-surface-container-high/60 hover:shadow-2xl hover:shadow-primary/5 outline-none"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-highest text-primary transition-transform duration-500 group-hover:scale-110 group-hover:bg-primary/10">
                    <span className="material-symbols-outlined text-2xl">receipt_long</span>
                  </div>
                  <Pill tone={c.etapa === "CERRADO" ? "gray" : "green"}>
                    {c.etapa === "CERRADO" ? "Finalizado" : "En Curso"}
                  </Pill>
                </div>

                <div className="mt-6 flex flex-col gap-1">
                  <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Expediente</div>
                  <h4 className="text-xl font-black tracking-tight text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</h4>
                </div>

                <div className="mt-4 space-y-3 border-y border-outline-variant/5 py-4">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/40">Asegurado</span>
                    <span className="truncate text-sm font-bold text-on-surface/90">{c.nombreCliente}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/40">Compañía</span>
                    <span className="truncate text-sm font-bold text-on-surface/90">{c.companiaSeguro || "—"}</span>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Pill tone="purple">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                  <Pill tone={c.estado === "APROBADA" ? "green" : "blue"}>
                    {EstadoSiniestroLabel[c.estado] || c.estado}
                  </Pill>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-on-surface-variant/40">
                    Actualizado {c.actualizadoEn ? new Date(c.actualizadoEn).toLocaleDateString("es-CL") : "—"}
                  </div>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary opacity-0 transition-all duration-500 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-sm">chevron_right</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => openCaso(c)}
                className="group flex flex-col gap-4 rounded-[2rem] border border-outline-variant/10 bg-surface-container-low/40 p-6 text-left shadow-sm backdrop-blur-md transition-all duration-300 hover:border-primary/30 hover:bg-surface-container-high/60 sm:flex-row sm:items-center outline-none"
              >
                <div className="flex flex-1 items-center gap-6">
                  <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-[1.25rem] bg-surface-container-highest text-primary transition-transform group-hover:scale-105 sm:flex">
                    <span className="material-symbols-outlined text-2xl">assignment</span>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black tracking-tight text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</span>
                      <Pill tone="purple">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                    </div>
                    <div className="text-sm font-bold border-l-2 border-primary/20 pl-3 text-on-surface/80">
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
      </div>

      <Drawer
        open={openDetail}
        title={selected ? `Gestión Caso SIN-${String(selected.folio).padStart(6, "0")}` : "Gestión Caso"}
        onClose={() => {
          setOpenDetail(false);
          setSelected(null);
        }}
      >
        {!selected ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
            <div className="material-symbols-outlined text-6xl animate-pulse">cloud_sync</div>
            <p className="mt-4 text-sm font-black uppercase tracking-widest animate-pulse">Cargando expediente...</p>
          </div>
        ) : (
          <div className="flex flex-col gap-8 pb-20">
            {/* ✅ Banner de Estado */}
            <div className={cls(
              "flex items-center gap-6 rounded-[2.5rem] border p-8 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700",
              isCerradoSelected
                ? "border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5"
                : "border-outline-variant/10 bg-surface-container-low/40 shadow-sm"
            )}>
              <div className={cls(
                "flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl transition-transform duration-500",
                isCerradoSelected ? "bg-primary text-on-primary shadow-lg" : "bg-surface-container-highest text-primary"
              )}>
                <span className="material-symbols-outlined text-4xl">
                  {isCerradoSelected ? "verified_user" : "pending_actions"}
                </span>
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <h3 className="text-2xl font-black tracking-tighter text-on-surface">
                    {isCerradoSelected ? "Expediente Finalizado" : "Gestión Activa"}
                  </h3>
                  <Pill tone={isCerradoSelected ? "blue" : "green"}>
                    {isCerradoSelected ? "Cerrado" : "En Liquidación"}
                  </Pill>
                </div>
                <p className="text-sm font-bold text-on-surface-variant/60">
                  {isCerradoSelected
                    ? `Auditado y cerrado el ${selected.actualizadoEn ? new Date(selected.actualizadoEn).toLocaleDateString("es-CL") : "—"}`
                    : "El caso se encuentra en proceso de liquidación y seguimiento."}
                </p>
              </div>
            </div>

            <Section
              title="Información del Siniestro"
              desc="Detalles del cliente y datos de la póliza"
              right={
                <div className="flex flex-wrap justify-end gap-3">
                  <Button variant="secondary" onClick={openGenerarWord} className="h-11 px-4 border-outline-variant/30 text-[10px]">
                    <span className="material-symbols-outlined text-lg">description</span>
                    Ficha Word
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSelectedFotosWord(selected?.fotos?.map(f => f.id) || []);
                      setOpenBudgetModal(true);
                    }}
                    className="h-11 px-4 border-outline-variant/30 text-[10px]"
                  >
                    <span className="material-symbols-outlined text-lg">analytics</span>
                    Presupuesto
                  </Button>
                  <Button variant="secondary" onClick={() => setOpenEmail(true)} className="h-11 px-4 border-outline-variant/30 text-[10px]">
                    <span className="material-symbols-outlined text-lg">mail</span>
                    Enviar
                  </Button>
                </div>
              }
            >
              <div className="grid gap-8">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-lowest/50 p-4 border border-outline-variant/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Asegurado</span>
                    <span className="text-lg font-black text-on-surface">{selected.nombreCliente}</span>
                    <span className="text-xs font-bold text-on-surface-variant/60">{selected.rutCliente}</span>
                  </div>
                  <div className="flex flex-col gap-1 rounded-2xl bg-surface-container-lowest/50 p-4 border border-outline-variant/10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40">Dirección</span>
                    <span className="text-xs font-black text-on-surface leading-normal">{selected.direccion}</span>
                    <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">{selected.comuna}</span>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Compañía de Seguros" value={selected.companiaSeguro || ""} onChange={() => { }} disabled />
                  <Input label="Número de Siniestro" value={selected.numeroSiniestro || ""} onChange={() => { }} disabled />
                  <Input label="Nombre Liquidador" value={selected.nombreLiquidador || ""} onChange={() => { }} disabled />
                  <Input label="Email del Liquidador" value={selected.emailLiquidador || ""} onChange={() => { }} disabled />
                </div>

                <div className="mt-4 overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-low/30 p-1.5 shadow-inner backdrop-blur-sm">
                  <Tabs
                    tab={tab}
                    setTab={setTab}
                    items={[
                      { key: "antecedentes", label: "Gestiones" },
                      { key: "fotos", label: `Fotos (${fotos.length})` },
                      { key: "bitacora", label: `Bitácora (${bitacora.length})` },
                      { key: "docs", label: `Documentos (${documentos.length})` },
                      { key: "facturacion", label: "Facturación" },
                    ]}
                  />
                </div>
              </div>
            </Section>

            {tab === "antecedentes" ? (
              <Section
                title="Flujo de Gestiones"
                desc="Seguimiento detallado de hitos y acciones"
                right={
                  <Button
                    variant="secondary"
                    onClick={impugnar}
                    disabled={busy}
                    className="h-10 border-error/20 text-error hover:bg-error/5"
                  >
                    <span className="material-symbols-outlined text-lg text-error">warning</span>
                    Impugnar
                  </Button>
                }
              >
                <div className="flex flex-col gap-6">
                  {gestiones.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-4xl">inventory_2</span>
                      <p className="mt-2 text-xs font-bold uppercase tracking-widest">Sin gestiones registradas</p>
                    </div>
                  ) : (
                    gestiones.map((g) => {
                      const tone =
                        g.estado === "COMPLETADA"
                          ? "green"
                          : g.estado === "BLOQUEADA"
                            ? "red"
                            : g.estado === "EN_PROGRESO"
                              ? "amber"
                              : "gray";

                      const icon = {
                        INSPECCION: "hail",
                        PRESUPUESTO: "request_quote",
                        ENVIO_INFORMACION: "send",
                        APROBADA: "check_circle",
                        FACTURACION: "payments",
                        PERSONALIZADA: "edit_note",
                      }[g.tipo] || "assignment";

                      return (
                        <div key={g.id} className="group relative overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest/40 p-6 shadow-sm transition-all duration-300 hover:border-outline-variant/30 hover:shadow-lg">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={cls(
                                "flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                                g.estado === "COMPLETADA" ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-highest text-on-surface-variant/60"
                              )}>
                                <span className="material-symbols-outlined text-2xl">{icon}</span>
                              </div>
                              <div className="space-y-1">
                                <h4 className="text-sm font-black tracking-tight text-on-surface">
                                  {TipoGestionLabel[g.tipo] || g.tipo}
                                  {g.tipo === "PERSONALIZADA" && g.titulo ? `: ${g.titulo}` : ""}
                                </h4>
                                <Pill tone={tone}>{EstadoGestionLabel[g.estado] || g.estado}</Pill>
                              </div>
                            </div>
                            <div className="text-[10px] font-bold text-on-surface-variant/40">
                              {fmt(g.creadoEn)}
                            </div>
                          </div>

                          <div className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-surface-container-low/30 p-4 border border-outline-variant/5">
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/40">
                                {g.tipo === "INSPECCION" ? "Inspección Liquidador" : "Recepción"}
                              </span>
                              <div className="flex items-center gap-2 font-bold text-on-surface/80">
                                <span className="material-symbols-outlined text-base opacity-40">calendar_today</span>
                                <span className="text-[11px]">{g.fechaRecepcion ? fmtDate(g.fechaRecepcion) : "Pendiente"}</span>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[9px] font-black uppercase tracking-wider text-on-surface-variant/40">Término</span>
                              <div className="flex items-center gap-2 font-bold text-on-surface/80">
                                <span className="material-symbols-outlined text-base opacity-40">event_available</span>
                                <span className="text-[11px]">{g.fechaTermino ? fmtDate(g.fechaTermino) : "Programado"}</span>
                              </div>
                            </div>
                          </div>

                          {g.observaciones && (
                            <div className="mt-4 rounded-xl border-l-2 border-primary/20 bg-primary/5 p-3 text-xs font-bold text-on-surface-variant/80 italic">
                              "{g.observaciones}"
                            </div>
                          )}

                          <div className="mt-6 flex justify-end">
                            <Button
                              variant="primary"
                              onClick={() => openCompletarGestion(g)}
                              disabled={busy || g.estado === "COMPLETADA" || g.estado === "CANCELADA" || g.estado === "BLOQUEADA"}
                              className="h-9 px-4 text-[10px]"
                            >
                              <span className="material-symbols-outlined text-lg">drive_file_rename_outline</span>
                              Gestionar / Adjuntar
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div className="mt-4 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-high/20 p-8 backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">add_circle</span>
                      </div>
                      <h4 className="text-sm font-black tracking-tight text-on-surface uppercase">Nueva Gestión Personalizada</h4>
                    </div>
                    <div className="grid gap-6">
                      <Input
                        label="Título de Gestión"
                        value={newGestion.titulo}
                        onChange={(v) => setNewGestion((p) => ({ ...p, titulo: v }))}
                        placeholder="Ej: Llamada de seguimiento..."
                      />
                      <Textarea
                        label="Observaciones Iniciales"
                        value={newGestion.observaciones}
                        onChange={(v) => setNewGestion((p) => ({ ...p, observaciones: v }))}
                        placeholder="Detalles sobre por qué se crea esta gestión..."
                      />
                      <Button onClick={crearGestionPers} disabled={busy || !newGestion.titulo} className="w-full">
                        <span className="material-symbols-outlined">save</span>
                        Programar Gestión
                      </Button>
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {tab === "fotos" ? (
              <Section title="Fotografías del Siniestro" desc="Registro visual desde la captación y terreno">
                {fotos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
                    <span className="material-symbols-outlined text-6xl">no_photography</span>
                    <p className="mt-4 text-xs font-bold uppercase tracking-widest">Sin registros visuales</p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {fotos.map((f) => (
                      <div key={f.id} className="group relative overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-lowest/40 p-1 shadow-sm transition-all duration-300 hover:border-primary/20 hover:shadow-xl">
                        <div className="aspect-video w-full overflow-hidden rounded-[2.25rem] bg-surface-container-high">
                          <img
                            src={fileUrl(f.urlArchivo)}
                            alt={f.titulo || f.parteCasa}
                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest/80 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                        </div>
                        <div className="p-5">
                          <div className="flex items-center justify-between gap-2">
                            <div className="space-y-0.5">
                              <span className="text-[10px] font-black uppercase tracking-wider text-primary">{f.parteCasa}</span>
                              <h5 className="truncate text-sm font-bold text-on-surface">{f.titulo || "Sin descripción"}</h5>
                            </div>
                            <a
                              href={fileUrl(f.urlArchivo)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-on-primary"
                            >
                              <span className="material-symbols-outlined text-xl">open_in_new</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Section>
            ) : null}

            {tab === "bitacora" ? (
              <Section title="Bitácora de Eventos" desc="Historial completo de acciones y notas de seguimiento">
                <div className="mb-8 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-high/20 p-8 backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">add_comment</span>
                    </div>
                    <h4 className="text-sm font-black tracking-tight text-on-surface uppercase">Registrar Nuevo Evento</h4>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input
                        label="Título del Evento"
                        value={bitForm.titulo}
                        onChange={(v) => setBitForm((p) => ({ ...p, titulo: v }))}
                        placeholder="Ej: Llamada con cliente..."
                      />
                      <div className="flex items-end pb-1.5">
                        <Button onClick={addEvento} disabled={busy || !bitForm.titulo} className="w-full h-12">
                          <span className="material-symbols-outlined">save</span>
                          Agregar a Bitácora
                        </Button>
                      </div>
                    </div>
                    <Textarea
                      label="Detalle del Evento (opcional)"
                      value={bitForm.detalle}
                      onChange={(v) => setBitForm((p) => ({ ...p, detalle: v }))}
                      placeholder="Describa los puntos clave tratados..."
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-6">
                  {bitacora.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-4xl">history</span>
                      <p className="mt-2 text-xs font-bold uppercase tracking-widest">Sin eventos registrados</p>
                    </div>
                  ) : (
                    bitacora.map((ev) => (
                      <div key={ev.id} className="group relative overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest/40 p-6 shadow-sm transition-all duration-300 hover:border-outline-variant/30 hover:shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-1 flex-col gap-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-sm font-black tracking-tight text-on-surface uppercase">{ev.titulo}</h4>
                              {ev.completado ? (
                                <Pill tone="green">Finalizado</Pill>
                              ) : (
                                <Pill tone="amber">Ejecución</Pill>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-on-surface-variant/40">
                              <span className="material-symbols-outlined text-xs">schedule</span>
                              {fmt(ev.creadoEn)}
                            </div>
                          </div>
                        </div>

                        {ev.detalle && (
                          <div className="mt-4 rounded-xl border-l-2 border-primary/20 bg-primary/5 p-4 text-xs font-bold leading-relaxed text-on-surface-variant/80 italic">
                            "{ev.detalle}"
                          </div>
                        )}

                        {!ev.completado && (
                          <div className="mt-6 flex justify-end">
                            <Button
                              variant="secondary"
                              onClick={() => completarEvento(ev.id)}
                              disabled={busy}
                              className="h-9 px-4 text-[10px] border-tertiary/20 text-tertiary hover:bg-tertiary/5"
                            >
                              <span className="material-symbols-outlined text-lg">check_circle</span>
                              Marcar como Resuelto
                            </Button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </Section>
            ) : null}

            {tab === "docs" ? (
              <Section title="Expediente Documental" desc="PDF, Imágenes, Word o Excel de respaldo">
                <div className="mb-8 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-high/20 p-8 backdrop-blur-sm">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <span className="material-symbols-outlined">upload_file</span>
                    </div>
                    <h4 className="text-sm font-black tracking-tight text-on-surface uppercase">Adjuntar Nuevo Archivo</h4>
                  </div>
                  <div className="grid gap-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Select
                        label="Categoría del Documento"
                        value={docForm.tipo}
                        onChange={(v) => setDocForm((p) => ({ ...p, tipo: v }))}
                        options={Object.keys(TipoDocumentoLabel).map((k) => ({
                          value: k,
                          label: TipoDocumentoLabel[k],
                        }))}
                      />
                      <Input
                        label="Título Identificador (opcional)"
                        value={docForm.titulo}
                        onChange={(v) => setDocForm((p) => ({ ...p, titulo: v }))}
                        placeholder="Ej: Presupuesto v1.2..."
                      />
                    </div>

                    <div className="relative overflow-hidden rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/50 p-6 transition-colors hover:border-primary/50">
                      <input
                        type="file"
                        id="drawer-file-upload"
                        onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                        className="absolute inset-0 z-10 cursor-pointer opacity-0"
                      />
                      <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
                        <span className="material-symbols-outlined text-3xl">cloud_upload</span>
                        <div className="text-[10px] font-black uppercase tracking-widest">
                          {docForm.file ? docForm.file.name : "Seleccionar o arrastrar archivo"}
                        </div>
                        <p className="text-[9px] font-bold opacity-40">PDF, JPG, PNG, DOCX, XLSX</p>
                      </div>
                    </div>

                    <Button onClick={addDocumento} disabled={busy || !docForm.file} className="w-full h-12">
                      <span className="material-symbols-outlined">file_upload</span>
                      Subir al Expediente
                    </Button>
                  </div>
                </div>

                <div className="grid gap-4">
                  {documentos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-on-surface-variant/40">
                      <span className="material-symbols-outlined text-4xl">folder_off</span>
                      <p className="mt-2 text-xs font-bold uppercase tracking-widest">Sin documentos adjuntos</p>
                    </div>
                  ) : (
                    documentos.map((d) => (
                      <div key={d.id} className="group flex items-center gap-4 rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest/40 p-4 shadow-sm transition-all duration-300 hover:border-outline-variant/30 hover:shadow-lg">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1.25rem] bg-surface-container-highest text-primary">
                          <span className="material-symbols-outlined text-2xl">
                            {d.tipo.includes("WORD") ? "description" : d.tipo.includes("EXCEL") ? "table_chart" : "draft"}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h5 className="truncate text-[10px] font-black uppercase tracking-widest text-primary">
                            {TipoDocumentoLabel[d.tipo] || d.tipo}
                          </h5>
                          <p className="truncate text-sm font-bold text-on-surface">{d.titulo || "Documento sin título"}</p>
                        </div>
                        <a
                          href={fileUrl(d.urlArchivo)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-10 w-10 items-center justify-center rounded-full bg-on-surface/5 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all"
                        >
                          <span className="material-symbols-outlined text-xl">download</span>
                        </a>
                      </div>
                    ))
                  )}
                </div>
              </Section>
            ) : null}

            {/* ✅ FACTURACIÓN PRO */}
            {tab === "facturacion" ? (
              <Section title="Gestión de Facturación" desc="Seguimiento de honorarios, pagos y comprobantes">
                <div className="flex flex-col gap-8">
                  <div className="overflow-hidden rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-high/20 p-8 backdrop-blur-sm">
                    <div className="mb-8 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className={cls(
                          "flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg",
                          selected.estadoFacturacion === "PAGADO" ? "bg-tertiary text-on-tertiary" : "bg-primary text-on-primary"
                        )}>
                          <span className="material-symbols-outlined text-3xl">
                            {selected.estadoFacturacion === "PAGADO" ? "receipt_long" : "pending_actions"}
                          </span>
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-lg font-black tracking-tight text-on-surface uppercase">Estado Actual</h4>
                          <Pill tone={
                            selected.estadoFacturacion === "ENVIADO_CLIENTE" ? "green" :
                              selected.estadoFacturacion === "PAGADO" ? "blue" : "gray"
                          }>
                            {EstadoFacturacionLabel[selected.estadoFacturacion] || selected.estadoFacturacion || "PENDIENTE"}
                          </Pill>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-8">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                          label="Estado Operativo"
                          value={factForm.estadoFacturacion}
                          onChange={(v) => setFactForm((p) => ({ ...p, estadoFacturacion: v }))}
                          options={[
                            { value: "PENDIENTE", label: "Pendiente" },
                            { value: "PAGADO", label: "Pagado" },
                            { value: "ENVIADO_CLIENTE", label: "Enviado a cliente" },
                          ]}
                        />
                        <Input
                          label="Honorarios (CLP)"
                          type="number"
                          value={factForm.montoHonorarios}
                          onChange={(v) => setFactForm((p) => ({ ...p, montoHonorarios: v }))}
                          placeholder="Ej: 250000"
                        />
                        <Input
                          label="Fecha de Pago"
                          type="date"
                          value={factForm.fechaPago}
                          onChange={(v) => setFactForm((p) => ({ ...p, fechaPago: v }))}
                        />
                        <Input
                          label="Envío a Asegurado"
                          type="date"
                          value={factForm.fechaEnvioCliente}
                          onChange={(v) => setFactForm((p) => ({ ...p, fechaEnvioCliente: v }))}
                        />
                      </div>

                      <Textarea
                        label="Notas de Facturación"
                        value={factForm.notasFacturacion}
                        onChange={(v) => setFactForm((p) => ({ ...p, notasFacturacion: v }))}
                        placeholder="Detalles sobre transferencia, banco o glosa..."
                      />

                      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-outline-variant/10">
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="secondary"
                            onClick={marcarPagado}
                            disabled={busy}
                            className="h-10 border-tertiary/20 text-tertiary hover:bg-tertiary/5"
                          >
                            <span className="material-symbols-outlined text-lg">check_circle</span>
                            Pagado
                          </Button>
                          <Button
                            variant="secondary"
                            onClick={marcarEnviado}
                            disabled={busy}
                            className="h-10 border-primary/20 text-primary hover:bg-primary/5"
                          >
                            <span className="material-symbols-outlined text-lg">mail</span>
                            Enviado
                          </Button>
                        </div>
                        <Button onClick={saveFacturacion} disabled={busy} className="h-12 px-10">
                          <span className="material-symbols-outlined">save</span>
                          Actualizar Facturación
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-high/10 p-8 backdrop-blur-sm">
                    <div className="mb-6 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined">attach_money</span>
                      </div>
                      <h4 className="text-sm font-black tracking-tight text-on-surface uppercase">Documentos de Respaldo</h4>
                    </div>

                    <div className="grid gap-6">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Identificador (Ej: Boleta #123)"
                          value={docForm.titulo}
                          onChange={(v) => setDocForm((p) => ({ ...p, titulo: v }))}
                          placeholder="..."
                        />
                        <div className="relative overflow-hidden rounded-xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/50 p-2 transition-colors hover:border-primary/50">
                          <input
                            type="file"
                            onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                            className="absolute inset-0 z-10 cursor-pointer opacity-0"
                          />
                          <div className="flex items-center gap-3 px-3 py-1.5 text-on-surface-variant/60">
                            <span className="material-symbols-outlined text-xl">add_a_photo</span>
                            <span className="text-[10px] font-black uppercase tracking-widest truncate">
                              {docForm.file ? docForm.file.name : "Subir comprobante"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={() => uploadFactDoc("RESPALDO_PAGO_HONORARIOS")} disabled={busy || !docForm.file} variant="secondary" className="flex-1">
                          <span className="material-symbols-outlined">upload</span>
                          Respaldo Pago
                        </Button>
                        <Button onClick={() => uploadFactDoc("BOLETA")} disabled={busy || !docForm.file} variant="secondary" className="flex-1">
                          <span className="material-symbols-outlined">receipt</span>
                          Boleta
                        </Button>
                      </div>
                    </div>

                    <div className="mt-8 grid gap-4">
                      {factDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-6 text-on-surface-variant/40">
                          <span className="material-symbols-outlined text-2xl opacity-20">inventory_2</span>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-30">Sin documentos</p>
                        </div>
                      ) : (
                        factDocs.map((d) => (
                          <div key={d.id} className="group flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest/40 p-3 shadow-sm transition-all hover:border-outline-variant/30 hover:shadow-md">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                              <span className="material-symbols-outlined text-xl">
                                {d.tipo === "BOLETA" ? "receipt" : "payments"}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="truncate text-[9px] font-black uppercase tracking-widest text-primary">
                                {TipoDocumentoLabel[d.tipo] || d.tipo}
                              </h5>
                              <p className="truncate text-xs font-bold text-on-surface">{d.titulo || "Archivo sin nombre"}</p>
                            </div>
                            <a
                              href={fileUrl(d.urlArchivo)}
                              target="_blank"
                              rel="noreferrer"
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-on-surface/5 text-on-surface-variant hover:bg-primary/10 hover:text-primary transition-all"
                            >
                              <span className="material-symbols-outlined text-base">download</span>
                            </a>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </Section>
            ) : null}

            {/* Modal Word */}
            {openWordModal && (
              <Modal
                isOpen={openWordModal}
                onClose={() => setOpenWordModal(false)}
                title="Generar Ficha Siniestro (Word)"
                footer={
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setOpenWordModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={downloadWordSiniestro} disabled={busy || selectedFotosWord.length === 0}>
                      <span className="material-symbols-outlined">description</span>
                      Generar Documento
                    </Button>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                    <p className="text-xs font-bold leading-relaxed text-on-surface-variant/80">
                      La Ficha se auto-rellenará con los campos del caso. Selecciona las fotografías que deseas incluir en el anexo documental.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {selected?.fotos?.length > 0 ? (
                      selected.fotos.map((f) => {
                        const url = fileUrl(f.urlArchivo);
                        const isChecked = selectedFotosWord.includes(f.id);
                        return (
                          <label key={f.id} className={cls(
                            "group relative aspect-square cursor-pointer overflow-hidden rounded-3xl border-2 transition-all duration-300",
                            isChecked ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-outline-variant/10 bg-surface-container-lowest hover:border-outline-variant/30"
                          )}>
                            <input
                              type="checkbox"
                              className="absolute top-3 left-3 z-10 h-6 w-6 rounded-lg accent-primary"
                              checked={isChecked}
                              onChange={() => toggleFotoWord(f.id)}
                            />
                            <img src={url} alt="Evidencia" className={cls("h-full w-full object-cover transition-transform duration-500 group-hover:scale-110", isChecked ? "opacity-100" : "opacity-60 grayscale-[50%]")} />
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                              <p className="truncate text-[9px] font-black uppercase text-white tracking-widest leading-none">
                                {String(f.parteCasa || "EVIDENCIA").replaceAll("_", " ")}
                              </p>
                            </div>
                          </label>
                        );
                      })
                    ) : (
                      <div className="col-span-full flex flex-col items-center justify-center py-10 rounded-3xl border border-dashed border-outline-variant/30 text-on-surface-variant/40">
                        <span className="material-symbols-outlined text-4xl mb-2">no_photography</span>
                        <p className="text-[10px] font-black uppercase tracking-widest">Sin registros fotográficos</p>
                      </div>
                    )}
                  </div>
                </div>
              </Modal>
            )}

            {/* Modal completar gestión */}
            {completeModal.open && (
              <Modal
                isOpen={completeModal.open}
                onClose={() => setCompleteModal((p) => ({ ...p, open: false }))}
                title={`Completar gestión: ${TipoGestionLabel[completeModal.gestion?.tipo] || completeModal.gestion?.tipo}`}
                footer={
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setCompleteModal((p) => ({ ...p, open: false }))}>
                      Cancelar
                    </Button>
                    <Button onClick={completarGestion} disabled={busy}>
                      <span className="material-symbols-outlined">task_alt</span>
                      Finalizar Gestión
                    </Button>
                  </div>
                }
              >
                <div className="space-y-6">
                  {completeModal.gestion?.tipo === "INSPECCION" && (
                    <Input
                      label="Fecha de Inspección real"
                      type="date"
                      value={completeModal.fechaRecepcion}
                      onChange={(v) => setCompleteModal((p) => ({ ...p, fechaRecepcion: v }))}
                    />
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Select
                      label="Categoría del Adjunto"
                      value={completeModal.tipoDoc}
                      onChange={(v) => setCompleteModal((p) => ({ ...p, tipoDoc: v }))}
                      options={Object.keys(TipoDocumentoLabel).map((k) => ({
                        value: k,
                        label: TipoDocumentoLabel[k],
                      }))}
                    />
                    <Input
                      label="Título del Documento (opcional)"
                      value={completeModal.tituloDoc}
                      onChange={(v) => setCompleteModal((p) => ({ ...p, tituloDoc: v }))}
                      placeholder="Ej: Informe de daños..."
                    />
                  </div>

                  <Textarea
                    label="Observaciones de Cierre"
                    value={completeModal.observaciones}
                    onChange={(v) => setCompleteModal((p) => ({ ...p, observaciones: v }))}
                    placeholder="Detalles sobre el resultado de esta gestión..."
                  />

                  <div className="relative overflow-hidden rounded-2xl border border-dashed border-outline-variant/30 bg-surface-container-lowest/50 p-6 transition-colors hover:border-primary/50">
                    <input
                      type="file"
                      onChange={(e) => setCompleteModal((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                      className="absolute inset-0 z-10 cursor-pointer opacity-0"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 text-on-surface-variant/60">
                      <span className="material-symbols-outlined text-3xl">add_a_photo</span>
                      <div className="text-[10px] font-black uppercase tracking-widest">
                        {completeModal.file ? completeModal.file.name : "Opcional: Adjuntar archivo de respaldo"}
                      </div>
                    </div>
                  </div>
                </div>
              </Modal>
            )}

            {/* Modal Presupuesto + Evidencia */}
            {openBudgetModal && (
              <Modal
                isOpen={openBudgetModal}
                onClose={() => setOpenBudgetModal(false)}
                title="Generar Presupuesto + Evidencia"
                footer={
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setOpenBudgetModal(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={downloadBudgetDoc} disabled={busy}>
                      <span className="material-symbols-outlined">picture_as_pdf</span>
                      Generar Documento
                    </Button>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="rounded-2xl bg-primary/5 p-4 border border-primary/10">
                    <p className="text-xs font-bold leading-relaxed text-on-surface-variant/80">
                      Este documento combina la información de captación con las fotos seleccionadas y la referencia al Excel de presupuesto.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {selected?.fotos?.map((f) => {
                      const isChecked = selectedFotosWord.includes(f.id);
                      return (
                        <label key={f.id} className={cls(
                          "group relative aspect-square cursor-pointer overflow-hidden rounded-3xl border-2 transition-all duration-300",
                          isChecked ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-outline-variant/10 bg-surface-container-lowest hover:border-outline-variant/30"
                        )}>
                          <input
                            type="checkbox"
                            className="absolute top-3 left-3 z-10 h-6 w-6 rounded-lg accent-primary"
                            checked={isChecked}
                            onChange={() => toggleFotoWord(f.id)}
                          />
                          <img src={fileUrl(f.urlArchivo)} className={cls("h-full w-full object-cover transition-transform duration-500 group-hover:scale-110", isChecked ? "opacity-100" : "opacity-60 grayscale-[50%]")} alt="" />
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                            <p className="truncate text-[9px] font-black uppercase text-white tracking-widest leading-none">
                              {String(f.parteCasa || "EVIDENCIA").replaceAll("_", " ")}
                            </p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </Modal>
            )}

            {/* Modal Enviar Correo */}
            {openEmail && (
              <Modal
                isOpen={openEmail}
                onClose={() => setOpenEmail(false)}
                title="Enviar Correo de Respaldo"
                footer={
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => setOpenEmail(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={sendEmailManual} disabled={busy}>
                      <span className="material-symbols-outlined">send</span>
                      Enviar Correo
                    </Button>
                  </div>
                }
              >
                <div className="space-y-6">
                  <div className="flex flex-wrap gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 w-full mb-1">
                      Quick Plantillas
                    </span>
                    <Button
                      variant="secondary"
                      className="h-8 px-4 text-[10px] border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => {
                        setEmailForm({
                          destinatarios: "",
                          asunto: `Asignación Siniestro - Folio SIN-${String(selected?.folio).padStart(6, "0")}`,
                          mensaje: `Estimados,\n\nAdjunto antecedentes para la liquidación del siniestro correspondiente al folio SIN-${String(selected?.folio).padStart(6, "0")}.\n\nQuedamos atentos a sus comentarios.\n\nSaludos cordiales.`
                        });
                      }}
                    >
                      📋 Asignación
                    </Button>
                    <Button
                      variant="secondary"
                      className="h-8 px-4 text-[10px] border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => {
                        setEmailForm({
                          destinatarios: "",
                          asunto: `Presupuesto y Evidencia - Folio SIN-${String(selected?.folio).padStart(6, "0")}`,
                          mensaje: `Buen día,\n\nSe adjunta el presupuesto y la evidencia fotográfica correspondiente al siniestro SIN-${String(selected?.folio).padStart(6, "0")}.\n\nSaludos.`
                        });
                      }}
                    >
                      📋 Presupuesto
                    </Button>
                  </div>

                  <div className="grid gap-6">
                    <Input
                      label="Para (Destinatarios)"
                      value={emailForm.destinatarios}
                      onChange={(v) => setEmailForm((p) => ({ ...p, destinatarios: v }))}
                      placeholder="email1@example.com, email2@example.com..."
                    />
                    <Input
                      label="Asunto"
                      value={emailForm.asunto}
                      onChange={(v) => setEmailForm((p) => ({ ...p, asunto: v }))}
                    />
                    <Textarea
                      label="Cuerpo del Mensaje"
                      value={emailForm.mensaje}
                      onChange={(v) => setEmailForm((p) => ({ ...p, mensaje: v }))}
                      placeholder="Escribe el contenido del correo..."
                    />
                  </div>

                  <div className="rounded-xl border border-outline-variant/10 bg-surface-container-low/40 p-4">
                    <div className="flex items-center gap-3 text-on-surface/60">
                      <span className="material-symbols-outlined text-xl">info</span>
                      <p className="text-[10px] font-bold italic">
                        El sistema adjuntará automáticamente los archivos relevantes según el tipo de envío seleccionado.
                      </p>
                    </div>
                  </div>
                </div>
              </Modal>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}