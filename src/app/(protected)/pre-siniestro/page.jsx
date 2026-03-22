"use client";

// src/app/(protected)/pre-siniestro/page.jsx
import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { apiGet, apiPost, apiPostForm, apiPatch, fileUrl } from "@/lib/api";

/**
 * Labels UI
 */
const TipoCasoLabel = {
  HIPOTECARIO_A: "Hipotecario (A)",
  POLIZA_PARTICULAR_B: "Póliza Particular (B)",
};

const EstadoCasoLabel = {
  ABIERTO: "Abierto",
  EN_REVISION: "En revisión",
  PENDIENTE_AUTORIZACION: "Pendiente autorización",
  AUTORIZADO: "Autorizado",
  RECHAZADO: "Rechazado",
};

const TipoDocumentoLabel = {
  DENUNCIA_SINIESTRO_CORREO: "Correo denuncia siniestro (respaldo)",
  ASIGNACION_FORMAL_CORREO: "Correo asignación formal liquidador",
  POLIZA: "Póliza (opcional)",

  // ✅ Solo para B (o generales si se requieren)
  CERT_DOMINIO_VIGENTE: "Certificado Dominio Vigente (Solo B)",
  CERT_HIPOTECAS_Y_GRAVAMENES: "Certificado Hipotecas y Gravámenes (Solo B)",
  RECEPCION_MUNICIPAL: "Recepción Municipal (Solo B)",

  INSPECCION_ASESUR: "Inspección ASESUR (obligatorio para pasar a siniestro)",
  FOTOS_VIDEOS: "Fotos y/o videos (obligatorio para pasar a siniestro)",
  MANDATO_ASESORIA_NOTARIAL: "Mandato asesoría notarial (obligatorio)",
  CONTRATO_ASESORIA: "Contrato asesoría (obligatorio)",
  OTRO: "Otro",
};

const PRE_REQ_EMAILS = [
  "DENUNCIA_SINIESTRO_CORREO",
  "ASIGNACION_FORMAL_CORREO",
];
const PRE_REQ_DOCS_TIPO_B = [
  "CERT_DOMINIO_VIGENTE",
  "CERT_HIPOTECAS_Y_GRAVAMENES",
  "RECEPCION_MUNICIPAL",
];
const OPS_REQ_PASO_SINIESTRO_DOCS = [
  "INSPECCION_ASESUR",
  "FOTOS_VIDEOS",
  "MANDATO_ASESORIA_NOTARIAL",
  "CONTRATO_ASESORIA",
];

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

function Section({ title, desc, children, right }) {
  return (
    <div className="rounded-[2rem] border border-outline-variant/30 bg-surface-container-lowest p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-xl font-black tracking-tight text-on-surface">{title}</h3>
          {desc && <p className="mt-1 text-sm font-medium text-on-surface-variant/70">{desc}</p>}
        </div>
        {right && <div className="shrink-0">{right}</div>}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

function Button({
  children,
  onClick,
  disabled,
  variant = "primary",
  className,
}) {
  const v = {
    primary: "bg-primary text-on-primary hover:bg-primary/90 shadow-lg shadow-primary/10 border-transparent",
    secondary: "bg-surface-container-high text-on-surface hover:bg-surface-container-highest border-outline-variant/30",
    danger: "bg-error text-on-error hover:bg-error/90 shadow-lg shadow-error/10 border-transparent",
    ghost: "text-on-surface-variant hover:bg-surface-container hover:text-on-surface border-transparent",
  }[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cls(
        "inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-bold transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100",
        v,
        className
      )}
      type="button"
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
        className="h-11 w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-4 text-sm font-bold text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5 shadow-sm disabled:bg-surface-container-highest disabled:cursor-not-allowed"
      />
    </label>
  );
}

function Select({ label, value, onChange, options }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
      <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">{label}</span>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
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

function Checkbox({ checked, onChange, label, disabled = false }) {
  return (
    <label className={cls("flex items-center gap-2 text-sm font-bold text-on-surface select-none cursor-pointer", disabled && "opacity-50 cursor-not-allowed")}>
      <input
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-5 w-5 rounded border-outline-variant/30 bg-surface-container-low text-primary focus:ring-primary/20 accent-primary"
      />
      <span>{label}</span>
    </label>
  );
}

function Modal({ open, title, children, onClose, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-container-lowest/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] border border-outline-variant/30 bg-surface shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-outline-variant/10 px-8 py-6">
          <h2 className="text-2xl font-black tracking-tight text-on-surface">{title}</h2>
          <button onClick={onClose} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container">
            <span className="material-symbols-outlined text-on-surface-variant">close</span>
          </button>
        </div>
        <div className="px-8 py-6 max-h-[70vh] overflow-y-auto">{children}</div>
        {footer && <div className="flex items-center justify-end gap-3 border-t border-outline-variant/10 bg-surface-container-lowest/50 px-8 py-6">{footer}</div>}
      </div>
    </div>
  );
}

function Drawer({ open, title, onClose, children }) {
  return (
    <>
      <div
        className={cls(
          "fixed inset-0 z-[100] bg-surface-container-lowest/40 blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={onClose}
      />
      <div
        className={cls(
          "fixed inset-y-0 right-0 z-[101] w-full max-w-3xl transform bg-surface shadow-2xl transition-transform duration-500 ease-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-outline-variant/10 bg-surface-container-low px-8 py-6">
            <h2 className="text-2xl font-black tracking-tight text-on-surface">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container-high text-on-surface-variant transition hover:bg-surface-container-highest hover:text-on-surface"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8">{children}</div>
        </div>
      </div>
    </>
  );
}

export default function PreSiniestroPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.rol || null;
  const isOps = userRole === "OPERACIONES" || userRole === "SUPERADMIN";
  const isAsesor = userRole === "ASESOR";

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [casos, setCasos] = useState([]);

  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [flagFilter, setFlagFilter] = useState("ALL");

  const [openCreate, setOpenCreate] = useState(false);
  const [newCaso, setNewCaso] = useState({
    tipo: "HIPOTECARIO_A",
    nombreCliente: "",
    rutCliente: "",
    direccion: "",
  });

  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);

  // ✅ subir doc
  const [docForm, setDocForm] = useState({
    tipo: "DENUNCIA_SINIESTRO_CORREO",
    titulo: "",
    file: null,
  });

  const [openReject, setOpenReject] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const [datosForm, setDatosForm] = useState({
    companiaSeguro: "",
    numeroSiniestro: "",

    addNombreLiquidador: false,
    addEmailLiquidador: false,
    addTelefonoLiquidador: false,
    addNombreAnalista: false,

    nombreLiquidador: "",
    emailLiquidador: "",
    telefonoLiquidador: "",
    nombreAnalista: "",
  });

  // ✅ enviar correo manual
  const [openEmail, setOpenEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    destinatarios: "",
    asunto: "",
    mensaje: "",
  });

  // ✅ generar word siniestro
  const [openWordModal, setOpenWordModal] = useState(false);
  const [selectedFotosWord, setSelectedFotosWord] = useState([]);

  const [openEditCaptacion, setOpenEditCaptacion] = useState(false);
  const [editForm, setEditForm] = useState({
    nombreCliente: "",
    rutCliente: "",
    direccion: "",
    comuna: "",
    ciudad: "",
  });

  const openEdit = () => {
    if (!selected) return;
    setEditForm({
      nombreCliente: selected.nombreCliente || "",
      rutCliente: selected.rutCliente || "",
      direccion: selected.direccion || "",
      comuna: selected.comuna || "",
      ciudad: selected.ciudad || "",
    });
    setOpenEditCaptacion(true);
  };

  const saveEdit = async () => {
    if (!selected) return;
    setBusy(true);
    try {
      await apiPatch(`/casos/${selected.id}`, editForm);
      setOpenEditCaptacion(false);
      await openCaso(selected); // Re-fetch selected to update UI
    } catch (e) {
      setError("Error al actualizar datos de captación");
    } finally {
      setBusy(false);
    }
  };

  const refresh = async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await apiGet("/pre-siniestro");
      setCasos(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return casos
      .filter((c) => {
        if (tipoFilter !== "ALL" && c.tipo !== tipoFilter) return false;
        if (estadoFilter !== "ALL" && c.estado !== estadoFilter) return false;

        if (flagFilter === "VB_PENDIENTE") {
          if (c.vbPreFecha) return false;
        } else if (flagFilter === "PEND_AUT") {
          if (c.estado !== "PENDIENTE_AUTORIZACION") return false;
        } else if (flagFilter === "RECHAZADO") {
          if (c.estado !== "RECHAZADO") return false;
        } else if (flagFilter === "AUTORIZADO") {
          if (c.estado !== "AUTORIZADO") return false;
        }

        if (!q) return true;
        return (
          String(c.folio ?? "").includes(q) ||
          String(c.nombreCliente ?? "")
            .toLowerCase()
            .includes(q) ||
          String(c.rutCliente ?? "")
            .toLowerCase()
            .includes(q) ||
          String(c.direccion ?? "")
            .toLowerCase()
            .includes(q) ||
          String(c.companiaSeguro ?? "")
            .toLowerCase()
            .includes(q) ||
          String(c.numeroSiniestro ?? "")
            .toLowerCase()
            .includes(q)
        );
      })
      .sort((a, b) => new Date(b.creadoEn) - new Date(a.creadoEn));
  }, [casos, query, tipoFilter, estadoFilter, flagFilter]);

  const openCaso = async (c) => {
    setError(null);
    setBusy(true);
    try {
      // ✅ si es CAPTACION, el detalle viene de /captaciones/:id
      // ✅ si es PRE_SINIESTRO, viene de /pre-siniestro/:id
      const full =
        c.etapa === "CAPTACION"
          ? await apiGet(`/captaciones/${c.id}`)
          : await apiGet(`/pre-siniestro/${c.id}`);

      setSelected(full);
      setSelectedDocs(full.documentos || []);
      setOpenDetail(true);

      // hidrata form (si el objeto trae esos campos)
      setDatosForm({
        companiaSeguro: full.companiaSeguro || "",
        numeroSiniestro: full.numeroSiniestro || "",

        addNombreLiquidador: Boolean(full.nombreLiquidador),
        addEmailLiquidador: Boolean(full.emailLiquidador),
        addTelefonoLiquidador: Boolean(full.telefonoLiquidador),
        addNombreAnalista: Boolean(full.nombreAnalista),

        nombreLiquidador: full.nombreLiquidador || "",
        emailLiquidador: full.emailLiquidador || "",
        telefonoLiquidador: full.telefonoLiquidador || "",
        nombreAnalista: full.nombreAnalista || "",
      });
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || "Error cargando detalle"
      );
    } finally {
      setBusy(false);
    }
  };

  const createCaso = async () => {
    setError(null);
    setBusy(true);
    try {
      const payload = {
        tipo: newCaso.tipo,
        nombreCliente: newCaso.nombreCliente.trim(),
        rutCliente: newCaso.rutCliente.trim(),
        direccion: newCaso.direccion.trim(),
      };
      if (!payload.nombreCliente || !payload.rutCliente || !payload.direccion) {
        throw new Error("Completa nombre, RUT y dirección");
      }
      await apiPost("/pre-siniestro/create", payload);
      setOpenCreate(false);
      setNewCaso({
        tipo: "HIPOTECARIO_A",
        nombreCliente: "",
        rutCliente: "",
        direccion: "",
      });
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error creando caso");
    } finally {
      setBusy(false);
    }
  };

  const doVB = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);

    try {
      // ✅ si viene desde CAPTACION: convierte a PRE_SINIESTRO
      if (selected.etapa === "CAPTACION") {
        await apiPost(`/captaciones/${selected.id}/vb-pre`, {});
        const full = await apiGet(`/pre-siniestro/${selected.id}`); // ahora ya debería venir como PRE_SINIESTRO
        setSelected(full);
        setSelectedDocs(full.documentos || []);
        await refresh();
        return;
      }

      // ✅ si ya es PRE_SINIESTRO: vb normal (si quieres mantenerlo)
      await apiPost(`/pre-siniestro/${selected.id}/vb`, {});
      const full = await apiGet(`/pre-siniestro/${selected.id}`);
      setSelected(full);
      setSelectedDocs(full.documentos || []);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error VB");
    } finally {
      setBusy(false);
    }
  };

  // ✅ guardar campos siniestro
  const saveDatos = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      const payload = {
        companiaSeguro: datosForm.companiaSeguro.trim(),
        numeroSiniestro: datosForm.numeroSiniestro.trim(),
      };

      // obligatorios para el checklist ops
      if (!payload.companiaSeguro) throw new Error("Compañía es obligatoria");
      if (!payload.numeroSiniestro)
        throw new Error("Nº de siniestro es obligatorio");

      // opcionales con checkbox
      payload.nombreLiquidador = datosForm.addNombreLiquidador
        ? datosForm.nombreLiquidador.trim() || null
        : null;
      payload.emailLiquidador = datosForm.addEmailLiquidador
        ? datosForm.emailLiquidador.trim() || null
        : null;
      payload.telefonoLiquidador = datosForm.addTelefonoLiquidador
        ? datosForm.telefonoLiquidador.trim() || null
        : null;
      payload.nombreAnalista = datosForm.addNombreAnalista
        ? datosForm.nombreAnalista.trim() || null
        : null;

      await apiPatch(`/pre-siniestro/${selected.id}/datos`, payload);

      const full = await apiGet(`/pre-siniestro/${selected.id}`);
      setSelected(full);
      setSelectedDocs(full.documentos || []);

      // re-hidrata
      setDatosForm((p) => ({
        ...p,
        companiaSeguro: full.companiaSeguro || "",
        numeroSiniestro: full.numeroSiniestro || "",
        nombreLiquidador: full.nombreLiquidador || "",
        emailLiquidador: full.emailLiquidador || "",
        telefonoLiquidador: full.telefonoLiquidador || "",
        nombreAnalista: full.nombreAnalista || "",
        addNombreLiquidador: Boolean(full.nombreLiquidador),
        addEmailLiquidador: Boolean(full.emailLiquidador),
        addTelefonoLiquidador: Boolean(full.telefonoLiquidador),
        addNombreAnalista: Boolean(full.nombreAnalista),
      }));

      await refresh();
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || "Error guardando datos"
      );
    } finally {
      setBusy(false);
    }
  };

  // ✅ SUBIR ARCHIVO REAL (multipart)
  const addDoc = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);

    try {
      if (!docForm.tipo) throw new Error("Falta Tipo");
      if (!docForm.file) throw new Error("Selecciona un archivo");

      const fd = new FormData();
      fd.append("tipo", docForm.tipo);
      if (docForm.titulo?.trim()) fd.append("titulo", docForm.titulo.trim());
      fd.append("file", docForm.file);

      await apiPostForm(`/pre-siniestro/${selected.id}/documentos`, fd);

      const full = await apiGet(`/pre-siniestro/${selected.id}`);
      setSelected(full);
      setSelectedDocs(full.documentos || []);

      setDocForm((p) => ({ ...p, titulo: "", file: null }));
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || "Error subiendo documento"
      );
    } finally {
      setBusy(false);
    }
  };

  const solicitarOps = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/pre-siniestro/${selected.id}/solicitar-autorizacion`, {});
      await refresh();
      const full = await apiGet(`/pre-siniestro/${selected.id}`);
      setSelected(full);
      setSelectedDocs(full.documentos || []);
    } catch (e) {
      const faltantes = e?.response?.data?.faltantes;
      if (Array.isArray(faltantes) && faltantes.length) {
        setError(
          `Faltan: ${faltantes
            .map((x) => TipoDocumentoLabel[x] || x)
            .join(", ")}`
        );
      } else {
        setError(
          e?.response?.data?.error ||
          e?.message ||
          "Error solicitando autorización"
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const autorizar = async () => {
    if (!selected?.id) return;
    setError(null);
    setBusy(true);
    try {
      await apiPost(`/pre-siniestro/${selected.id}/autorizar`, {});
      await refresh();
      const full = await apiGet(`/pre-siniestro/${selected.id}`);
      setSelected(full);
      setSelectedDocs(full.documentos || []);
    } catch (e) {
      const faltantes = e?.response?.data?.faltantes;
      if (Array.isArray(faltantes) && faltantes.length) {
        setError(
          `Faltan: ${faltantes
            .map((x) => TipoDocumentoLabel[x] || x)
            .join(", ")}`
        );
      } else {
        setError(e?.response?.data?.error || e?.message || "Error autorizando");
      }
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
      setSelectedDocs([]);
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error rechazando");
    } finally {
      setBusy(false);
    }
  };

  const openGenerarWord = () => {
    // por defecto selecciona todas las fotos para ahorrar tiempo
    setSelectedFotosWord(selected?.fotos?.map((f) => f.id) || []);
    setOpenWordModal(true);
  };

  const toggleFotoWord = (id) => {
    setSelectedFotosWord((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
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

  const sendEmailManual = async () => {
    if (!selected?.id) return;
    const dests = emailForm.destinatarios.split(",").map(d => d.trim()).filter(Boolean);
    if (!dests.length || !emailForm.asunto || !emailForm.mensaje) {
      setError("Todos los campos del correo son obligatorios.");
      return;
    }
    try {
      setBusy(true);
      await apiPost(`/casos/${selected.id}/enviar-correo`, {
        destinatarios: dests,
        asunto: emailForm.asunto,
        mensaje: emailForm.mensaje
      });
      setOpenEmail(false);
      setEmailForm({ destinatarios: "", asunto: "", mensaje: "" });
      alert("Correo enviado exitosamente con Reply-To");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error enviando correo");
    } finally {
      setBusy(false);
    }
  };

  const computeChecklist = (caso, docs = []) => {
    const docTypes = new Set((docs || []).map((d) => d.tipo));

    const mk = (key, group) => ({
      key,
      label: TipoDocumentoLabel[key] || key,
      ok: docTypes.has(key),
      group,
    });

    // 1) ASESOR: requisitos para pedir autorización a OPS
    const isTipoB = caso?.tipo === "POLIZA_PARTICULAR_B";

    const reqSolicitarOps = [];
    // VB es obligatorio siempre (botón)
    reqSolicitarOps.push({
      key: "VB",
      label: TipoDocumentoLabel["VB"] || "VB",
      ok: Boolean(caso?.vbPreFecha),
      group: "REQ_SOLICITAR_OPS",
    });

    // Documentos obligatorios para B
    if (isTipoB) {
      for (const t of PRE_REQ_DOCS_TIPO_B)
        reqSolicitarOps.push(mk(t, "REQ_SOLICITAR_OPS"));
    }

    // Nota: El usuario dice "A no tiene obligatorios", asumimos que ni siquiera los mails de denuncia/asignación
    // son bloqueantes para A si se quiere rapidez, PERO para avanzar a Siniestro suelen pedirse.
    // Dejaremos los emails como opcionales para A según el texto: "A = no tiene obligatorios".

    const emails = ["DENUNCIA_SINIESTRO_CORREO", "ASIGNACION_FORMAL_CORREO"];
    const otrosDocs = ["POLIZA", ...(!isTipoB ? PRE_REQ_DOCS_TIPO_B : [])];

    if (isTipoB) {
      // Para B, los emails sí son obligatorios
      for (const t of emails) reqSolicitarOps.push(mk(t, "REQ_SOLICITAR_OPS"));
    } else {
      // Para A, los agregamos a otrosDocs
      otrosDocs.push(...emails);
    }
    const reqAutorizar = [];
    for (const t of OPS_REQ_PASO_SINIESTRO_DOCS)
      reqAutorizar.push(mk(t, "REQ_AUTORIZAR"));

    reqAutorizar.push({
      key: "numeroSiniestro",
      label: "Nº de siniestro (campo)",
      ok: Boolean(caso?.numeroSiniestro),
      group: "REQ_AUTORIZAR",
    });

    reqAutorizar.push({
      key: "companiaSeguro",
      label: "Compañía (campo)",
      ok: Boolean(caso?.companiaSeguro),
      group: "REQ_AUTORIZAR",
    });

    // 3) Otros / opcionales (solo para ordenar UI)
    const opcionalesUI = [];
    for (const t of otrosDocs) opcionalesUI.push(mk(t, "OPCIONALES"));

    // OTRO: si tienes docs tipo OTRO, lo dejamos como "ok" si existe alguno
    opcionalesUI.push({
      key: "OTRO",
      label: TipoDocumentoLabel.OTRO,
      ok: docTypes.has("OTRO"),
      group: "OPCIONALES",
    });

    return {
      reqSolicitarOps,
      reqAutorizar,
      opcionales: opcionalesUI,
    };
  };

  const checklist = useMemo(() => {
    if (!selected)
      return { reqSolicitarOps: [], reqAutorizar: [], opcionales: [] };
    return computeChecklist(selected, selectedDocs);
  }, [selected, selectedDocs]);

  const preReadyForRequestOps = useMemo(() => {
    return checklist.reqSolicitarOps.every((x) => x.ok);
  }, [checklist]);

  const opsReadyToAuthorize = useMemo(() => {
    return checklist.reqAutorizar.every((x) => x.ok);
  }, [checklist]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Header Area */}
      <div className="relative overflow-hidden bg-surface-container-low px-4 pt-8 pb-6 md:px-8">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex justify-center items-center gap-3">
              <span className="material-symbols-outlined text-primary-fixed text-3xl">assignment_late</span>
              <p className="text-sm font-medium text-on-surface-variant/80">
                Validación, denuncias y autorización a etapa de Siniestro.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refresh}
              disabled={loading || busy}
              className="flex h-11 items-center gap-2 rounded-xl border border-outline-variant bg-surface px-4 text-sm font-bold text-on-surface transition hover:bg-surface-container-high disabled:opacity-50"
            >
              <span className={cls("material-symbols-outlined text-xl", (loading || busy) && "animate-spin")}>
                refresh
              </span>
              Actualizar
            </button>
            <button
              onClick={() => setOpenCreate(true)}
              disabled={busy}
              className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary transition hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              <span className="material-symbols-outlined text-xl text-on-primary">add</span>
              Nuevo Pre-Siniestro
            </button>
          </div>
        </div>

        {/* glass decorations */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-secondary/5 blur-3xl"></div>
      </div>

      <div className="p-4 md:p-8">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-error/20 bg-error-container/30 p-4 text-sm font-bold text-on-error-container animate-in fade-in slide-in-from-top-2">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {/* Filters Bar */}
        <div className="mb-8 flex flex-col gap-4">
          <div className="flex flex-col gap-4 rounded-3xl border border-outline-variant/30 bg-surface-container-lowest p-4 shadow-sm md:flex-row md:items-center">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
              <input
                type="text"
                placeholder="Folio, cliente, RUT, dirección..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 w-full rounded-2xl border-none bg-surface-container px-12 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/50 focus:ring-2 focus:ring-primary/50"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select
                value={tipoFilter}
                onChange={(e) => setTipoFilter(e.target.value)}
                className="h-12 rounded-2xl border-none bg-surface-container px-4 pr-10 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Todos los Tipos</option>
                <option value="HIPOTECARIO_A">Hipotecario (A)</option>
                <option value="POLIZA_PARTICULAR_B">Póliza Particular (B)</option>
              </select>

              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="h-12 rounded-2xl border-none bg-surface-container px-4 pr-10 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Todos los Estados</option>
                <option value="ABIERTO">Abierto</option>
                <option value="EN_REVISION">En revisión</option>
                <option value="PENDIENTE_AUTORIZACION">Pendiente autorización</option>
                <option value="AUTORIZADO">Autorizado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>

              <select
                value={flagFilter}
                onChange={(e) => setFlagFilter(e.target.value)}
                className="h-12 rounded-2xl border-none bg-surface-container px-4 pr-10 text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/50"
              >
                <option value="ALL">Todas las Banderas</option>
                <option value="VB_PENDIENTE">VB pendiente</option>
                <option value="PEND_AUT">Pendiente Ops</option>
                <option value="AUTORIZADO">Autorizado</option>
                <option value="RECHAZADO">Rechazado</option>
              </select>

              <div className="flex h-12 items-center gap-1 rounded-2xl bg-surface-container p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cls(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    viewMode === "grid" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span className="material-symbols-outlined">grid_view</span>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cls(
                    "flex h-10 w-10 items-center justify-center rounded-xl transition",
                    viewMode === "list" ? "bg-surface text-primary shadow-sm" : "text-on-surface-variant hover:text-on-surface"
                  )}
                >
                  <span className="material-symbols-outlined">view_list</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-outline-variant bg-surface-container-lowest">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary/20 border-t-primary"></div>
            <p className="text-sm font-bold text-on-surface-variant">Cargando unidades...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-outline-variant bg-surface-container-lowest">
            <span className="material-symbols-outlined text-6xl text-outline-variant">folder_off</span>
            <div className="text-center">
              <p className="text-lg font-bold text-on-surface">No se encontraron casos</p>
              <p className="text-sm text-on-surface-variant">Intenta ajustar los filtros de búsqueda</p>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((c) => {
              const vbPend = !c.vbPreFecha;
              const toneEstado =
                c.estado === "PENDIENTE_AUTORIZACION"
                  ? "amber"
                  : c.estado === "AUTORIZADO"
                    ? "green"
                    : c.estado === "RECHAZADO"
                      ? "red"
                      : "gray";

              return (
                <button
                  key={c.id}
                  onClick={() => openCaso(c)}
                  className="group relative flex w-full flex-col overflow-hidden rounded-[2.5rem] border border-outline-variant/80 bg-surface shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 outline-none p-0 hover:cursor-pointer"
                >
                  {/* Card Header */}
                  <div className="p-6 pb-4">
                    <div className="mb-4 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-on-primary">
                        <span className="material-symbols-outlined">description</span>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Folio</div>
                        <div className="text-lg font-black text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</div>
                      </div>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-2">
                      <Pill tone="purple">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                      <Pill tone={toneEstado}>{EstadoCasoLabel[c.estado] || c.estado}</Pill>
                      {vbPend ? <Pill tone="amber">VB pendiente</Pill> : <Pill tone="green">VB OK</Pill>}
                    </div>

                    <h3 className="line-clamp-1 text-base font-extrabold text-on-surface group-hover:text-primary transition">
                      {c.nombreCliente}
                    </h3>
                    <p className="mt-1 text-xs font-bold text-on-surface-variant/60">{c.rutCliente}</p>
                  </div>

                  {/* Divider */}
                  <div className="mx-6 border-t border-outline-variant/30"></div>

                  {/* Card Body */}
                  <div className="flex-1 p-6 pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-lg text-primary">location_on</span>
                        <div className="text-xs font-bold text-on-surface-variant">
                          <p className="line-clamp-1">{c.direccion}</p>
                          <p className="opacity-60">{c.comuna || ""}{c.comuna && c.ciudad ? ", " : ""}{c.ciudad || ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-lg text-primary">person</span>
                        <div className="text-xs font-bold text-on-surface-variant">
                          <span>Asesor: </span>
                          <span className="text-on-surface">{c.asesor?.nombre || "No asignado"}</span>
                        </div>
                      </div>
                      {c.vbPreFecha && c.etapa !== "SINIESTRO" && (
                        <div className="flex items-center gap-3">
                          <span className="material-symbols-outlined text-lg text-secondary animate-pulse">timer</span>
                          <div className="text-xs font-bold text-secondary">
                            {Math.floor((new Date() - new Date(c.vbPreFecha)) / (1000 * 60 * 60 * 24))} días en Pre-Siniestro
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="w-full bg-surface-container-high/30 px-6 py-4 transition group-hover:bg-primary/5">
                    <div className="flex w-full items-center justify-between">
                      <div className="text-[10px] font-bold text-on-surface-variant/50">
                        {fmt(c.creadoEn)}
                      </div>
                      <div className="flex items-end gap-1 text-xs font-black text-primary transition group-hover:translate-x-1">
                        GESTIONAR
                        <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          /* List View */
          <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-lowest shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-surface-container-low">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Folio</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Cliente</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Tipo / Estado</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Asesor</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Ubicación</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Creado</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/30">
                  {filtered.map((c) => {
                    const toneEstado =
                      c.estado === "PENDIENTE_AUTORIZACION"
                        ? "amber"
                        : c.estado === "AUTORIZADO"
                          ? "green"
                          : c.estado === "RECHAZADO"
                            ? "red"
                            : "gray";
                    return (
                      <tr
                        key={c.id}
                        onClick={() => openCaso(c)}
                        className="group cursor-pointer transition hover:bg-surface-container-low"
                      >
                        <td className="px-6 py-4">
                          <div className="text-sm font-black text-on-surface">SIN-{String(c.folio).padStart(6, "0")}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-on-surface">{c.nombreCliente}</div>
                          <div className="text-[10px] font-bold text-on-surface-variant/60">{c.rutCliente}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            <Pill tone="purple">{TipoCasoLabel[c.tipo] || c.tipo}</Pill>
                            <Pill tone={toneEstado}>{EstadoCasoLabel[c.estado] || c.estado}</Pill>
                            {!c.vbPreFecha && <Pill tone="amber">VB Pend.</Pill>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-on-surface-variant">
                          {c.asesor?.nombre || "No asignado"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="line-clamp-1 text-[11px] font-bold text-on-surface-variant">{c.direccion}</div>
                          <div className="text-[10px] font-medium text-on-surface-variant/60">
                            {c.comuna || ""} {c.ciudad || ""}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs font-bold text-on-surface-variant/50">{fmt(c.creadoEn)}</td>
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
      </div>

      {/* MODALES */}
      <Modal
        open={openCreate}
        title="Nuevo Pre-Siniestro"
        onClose={() => setOpenCreate(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={createCaso} disabled={busy}>
              Crear Caso
            </Button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          <Select
            label="Tipo de caso"
            value={newCaso.tipo}
            onChange={(v) => setNewCaso((p) => ({ ...p, tipo: v }))}
            options={[
              { value: "HIPOTECARIO_A", label: "Hipotecario (A)" },
              { value: "POLIZA_PARTICULAR_B", label: "Póliza Particular (B)" },
            ]}
          />
          <Input
            label="RUT Cliente"
            value={newCaso.rutCliente}
            onChange={(v) => setNewCaso((p) => ({ ...p, rutCliente: v }))}
            placeholder="12.345.678-9"
          />
          <div className="md:col-span-2">
            <Input
              label="Nombre Cliente"
              value={newCaso.nombreCliente}
              onChange={(v) => setNewCaso((p) => ({ ...p, nombreCliente: v }))}
              placeholder="Nombre completo"
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Dirección"
              value={newCaso.direccion}
              onChange={(v) => setNewCaso((p) => ({ ...p, direccion: v }))}
              placeholder="Calle, número, depto, ciudad..."
            />
          </div>
        </div>
      </Modal>

      <Modal
        open={openReject}
        title="Rechazar Pre-Siniestro"
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
            Por favor, indica el motivo del rechazo para que el asesor pueda realizar las correcciones necesarias.
          </p>
          <textarea
            value={rejectMotivo}
            onChange={(e) => setRejectMotivo(e.target.value)}
            className="min-h-[140px] w-full rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4 text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/5"
            placeholder="Ej: Falta mandato notarial, fotos borrosas, o información de contacto incompleta..."
          />
        </div>
      </Modal>

      <Modal
        open={openEmail}
        title="Enviar Correo de Respaldo"
        onClose={() => setOpenEmail(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenEmail(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={sendEmailManual} disabled={busy}>
              <span className="material-symbols-outlined text-sm">send</span>
              Enviar Correo
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <div className="space-y-2">
            <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">Plantillas rápidas</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setEmailForm(p => ({
                  ...p,
                  asunto: `Asignación Siniestro - Folio SIN-${String(selected?.folio).padStart(6, "0")}`,
                  mensaje: `Estimados,\n\nAdjunto antecedentes para la liquidación del siniestro correspondiente al folio SIN-${String(selected?.folio).padStart(6, "0")}.\n\nQuedamos atentos a sus comentarios.\n\nSaludos cordiales.`
                }))}
                className="rounded-lg bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/20 transition"
              >
                📋 Asignación
              </button>
              <button
                onClick={() => setEmailForm(p => ({
                  ...p,
                  asunto: `Respaldo Documental - Folio SIN-${String(selected?.folio).padStart(6, "0")}`,
                  mensaje: `Hola,\n\nEnvío los documentos de respaldo solicitados para el caso SIN-${String(selected?.folio).padStart(6, "0")}.\n\nFavor confirmar recepción.\n\nAtentamente.`
                }))}
                className="rounded-lg bg-secondary/10 px-3 py-1.5 text-[11px] font-bold text-secondary hover:bg-secondary/20 transition"
              >
                📋 Respaldos
              </button>
            </div>
          </div>

          <Input
            label="Destinatarios (separados por coma)"
            value={emailForm.destinatarios}
            onChange={(v) => setEmailForm((p) => ({ ...p, destinatarios: v }))}
            placeholder="correo1@seguro.com, correo2@peritajes.cl"
          />
          <Input
            label="Asunto"
            value={emailForm.asunto}
            onChange={(v) => setEmailForm((p) => ({ ...p, asunto: v }))}
            placeholder="Asunto del correo..."
          />
          <div className="flex flex-col gap-1.5">
            <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">Mensaje</span>
            <textarea
              value={emailForm.mensaje}
              onChange={(e) => setEmailForm((p) => ({ ...p, mensaje: e.target.value }))}
              placeholder="Cuerpo del mensaje..."
              className="min-h-[140px] w-full rounded-xl border border-outline-variant/20 bg-surface-container-low p-3 text-sm font-medium text-on-surface outline-none focus:border-primary/50"
            />
            <p className="mt-2 text-[10px] italic text-on-surface-variant/60">
              * Las respuestas llegarán directamente a tu correo a través del Reply-To.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        open={openWordModal}
        title="Generar Ficha Siniestro (Word)"
        onClose={() => setOpenWordModal(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenWordModal(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={downloadWordSiniestro} disabled={busy || selectedFotosWord.length === 0}>
              <span className="material-symbols-outlined text-sm">file_download</span>
              Descargar Word
            </Button>
          </>
        }
      >
        <div className="grid gap-6">
          <p className="text-sm font-medium text-on-surface-variant">
            Selecciona las fotografías que deseas incluir en el informe final. <span className="font-bold text-primary">(Mínimo 1 requerida)</span>
          </p>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {selected?.fotos?.length > 0 ? (
              selected.fotos.map((f) => {
                const url = fileUrl(f.urlArchivo);
                const isChecked = selectedFotosWord.includes(f.id);
                return (
                  <label
                    key={f.id}
                    className={cls(
                      "relative cursor-pointer overflow-hidden rounded-2xl border-2 transition-all p-1",
                      isChecked ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-outline-variant/20 bg-surface-container-lowest"
                    )}
                  >
                    <input
                      type="checkbox"
                      className="absolute left-3 top-3 z-10 size-5 rounded border-outline-variant accent-primary"
                      checked={isChecked}
                      onChange={() => toggleFotoWord(f.id)}
                    />
                    <img src={url} alt="" className="aspect-square w-full rounded-xl object-cover opacity-80 transition hover:opacity-100" />
                    <div className="mt-2 text-center text-[10px] font-black uppercase tracking-tighter text-on-surface-variant truncate px-1">
                      {String(f.parteCasa || "EVIDENCIA").replaceAll("_", " ")}
                    </div>
                  </label>
                );
              })
            ) : (
              <div className="col-span-full rounded-2xl border border-error/20 bg-error-container/10 p-4 text-center text-sm font-bold text-on-error-container">
                No hay fotografías disponibles en este caso.
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Drawer
        open={openDetail}
        title={
          selected
            ? `Gestión Caso SIN-${String(selected.folio).padStart(6, "0")}`
            : "Gestión Caso"
        }
        onClose={() => {
          setOpenDetail(false);
          setSelected(null);
          setSelectedDocs([]);
        }}
      >
        {!selected ? (
          <div className="flex flex-col items-center justify-center py-20 text-on-surface-variant/40">
            <div className="material-symbols-outlined text-6xl animate-pulse group-hover:scale-110 transition-transform">cloud_sync</div>
            <p className="mt-4 text-sm font-black uppercase tracking-widest">Cargando expediente...</p>
          </div>
        ) : (
          <div className="space-y-8 text-on-surface">
            {/* Cabecera de Resumen */}
            <Section
              title="Resumen del Caso"
              desc="Información general y estado actual"
              right={
                <div className="flex flex-wrap gap-2">
                  <Pill tone="purple">{TipoCasoLabel[selected.tipo] || selected.tipo}</Pill>
                  <Pill
                    tone={
                      selected.estado === "PENDIENTE_AUTORIZACION"
                        ? "amber"
                        : selected.estado === "AUTORIZADO"
                          ? "green"
                          : selected.estado === "RECHAZADO"
                            ? "red"
                            : "gray"
                    }
                  >
                    {EstadoCasoLabel[selected.estado] || selected.estado}
                  </Pill>
                  {selected.vbPreFecha ? <Pill tone="green">VB OK</Pill> : <Pill tone="amber">VB Pendiente</Pill>}
                </div>
              }
            >
              <div className="grid gap-6">
                <div className="flex flex-col gap-1">
                  <h4 className="text-2xl font-black">{selected.nombreCliente}</h4>
                  <p className="text-sm font-bold text-on-surface-variant/60">{selected.rutCliente} · {selected.direccion}</p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="group rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low p-5 transition hover:bg-surface-container-high">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/50">Asesor Asignado</span>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <span className="material-symbols-outlined text-xl">person</span>
                      </div>
                      <div>
                        <div className="text-sm font-black">{selected.asesor?.nombre || "No asignado"}</div>
                        <div className="text-[11px] font-medium text-on-surface-variant/60">{selected.asesor?.email || "—"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="group rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low p-5 transition hover:bg-surface-container-high">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/50">Captado por</span>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                        <span className="material-symbols-outlined text-xl">camera</span>
                      </div>
                      <div>
                        <div className="text-sm font-black">{selected.captadoPor?.nombre || "—"}</div>
                        <div className="text-[11px] font-medium text-on-surface-variant/60">{selected.captadoPor?.email || "—"}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {selected.vbPreFecha && (
                  <div className="flex items-center gap-4 rounded-2xl border border-tertiary/20 bg-tertiary-container/5 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-tertiary/10 text-tertiary">
                      <span className="material-symbols-outlined">verified</span>
                    </div>
                    <div>
                      <div className="text-sm font-black">Visto Bueno (VB) Realizado</div>
                      <p className="text-xs font-medium text-on-surface-variant/70">
                        Por {selected.vbPreUsuario?.nombre || "Usuario"} el {new Date(selected.vbPreFecha).toLocaleString("es-CL")}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Acciones Rápidas */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  className="flex-1 min-w-[180px]"
                  onClick={doVB}
                  disabled={busy || Boolean(selected.vbPreFecha)}
                >
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  {selected.etapa === "CAPTACION" ? "Dar VB y Escalar" : "VB Pre-Siniestro"}
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1 min-w-[180px]"
                  onClick={solicitarOps}
                  disabled={busy || !preReadyForRequestOps || selected?.estado === "PENDIENTE_AUTORIZACION"}
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  {selected?.estado === "PENDIENTE_AUTORIZACION" ? "Escalado a Ops" : "Solicitar Autorización"}
                </Button>
                <Button
                  className="flex-1 min-w-[180px]"
                  onClick={autorizar}
                  disabled={busy || !opsReadyToAuthorize || selected?.estado !== "PENDIENTE_AUTORIZACION"}
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Autorizar Siniestro
                </Button>
              </div>

              <div className="mt-4 flex flex-wrap gap-2 border-t border-outline-variant/10 pt-4">
                <Button variant="ghost" onClick={openGenerarWord}>
                  <span className="material-symbols-outlined text-sm">description</span>
                  Generar Word
                </Button>
                <Button variant="ghost" onClick={openEdit}>
                  <span className="material-symbols-outlined text-sm">edit_square</span>
                  Editar Datos
                </Button>
                <Button variant="ghost" onClick={() => setOpenEmail(true)}>
                  <span className="material-symbols-outlined text-sm">alternate_email</span>
                  Email Respaldo
                </Button>
                <Button variant="ghost" onClick={() => setOpenReject(true)} className="text-error hover:bg-error/10">
                  <span className="material-symbols-outlined text-sm">cancel</span>
                  Rechazar Caso
                </Button>
              </div>
            </Section>

            {/* Recintos Afectados */}
            {selected?.recintos?.length > 0 && (
              <Section title={`Recintos Afectados (${selected.recintos.length})`}>
                <div className="grid gap-3 sm:grid-cols-2">
                  {selected.recintos.map((r) => (
                    <div key={r.id} className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 shadow-sm transition hover:border-primary/20">
                      <h5 className="text-sm font-black text-on-surface">{r.nombre}</h5>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Pill tone="blue">{r.tipoDanio}</Pill>
                        <Pill tone="gray">{r.superficieM2 || "?"} m²</Pill>
                      </div>
                      {r.descripcion && <p className="mt-2 text-[11px] leading-relaxed text-on-surface-variant/70">{r.descripcion}</p>}
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Datos del Siniestro */}
            <Section title="Estructura del Siniestro" desc="Información obligatoria para paso a Siniestro">
              <div className="grid gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    label="Compañía de Seguros"
                    value={datosForm.companiaSeguro}
                    onChange={(v) => setDatosForm((p) => ({ ...p, companiaSeguro: v }))}
                    placeholder="Ej: HDI, BCI, Zurich..."
                    disabled={isAsesor}
                  />
                  <Input
                    label="Nº de Siniestro"
                    value={datosForm.numeroSiniestro}
                    onChange={(v) => setDatosForm((p) => ({ ...p, numeroSiniestro: v }))}
                    placeholder="Ej: 987654321"
                    disabled={isAsesor}
                  />
                </div>

                <div className="rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
                  <h6 className="mb-4 text-xs font-black uppercase tracking-widest text-on-surface-variant/50">Datos del Liquidador</h6>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <Checkbox
                        label="Nombre Liquidador"
                        checked={datosForm.addNombreLiquidador}
                        disabled={isAsesor}
                        onChange={(v) => setDatosForm((p) => ({ ...p, addNombreLiquidador: v, nombreLiquidador: v ? p.nombreLiquidador : "" }))}
                      />
                      {datosForm.addNombreLiquidador && (
                        <Input
                          value={datosForm.nombreLiquidador}
                          onChange={(v) => setDatosForm((p) => ({ ...p, nombreLiquidador: v }))}
                          placeholder="Nombre del perito..."
                        />
                      )}
                    </div>
                    <div className="space-y-3">
                      <Checkbox
                        label="Email Liquidador"
                        checked={datosForm.addEmailLiquidador}
                        disabled={isAsesor}
                        onChange={(v) => setDatosForm((p) => ({ ...p, addEmailLiquidador: v, emailLiquidador: v ? p.emailLiquidador : "" }))}
                      />
                      {datosForm.addEmailLiquidador && (
                        <Input
                          value={datosForm.emailLiquidador}
                          onChange={(v) => setDatosForm((p) => ({ ...p, emailLiquidador: v }))}
                          placeholder="ejemplo@liquidador.cl"
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-8 flex justify-end gap-3">
                    <Button onClick={saveDatos} disabled={busy}>
                      <span className="material-symbols-outlined text-sm">save</span>
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              </div>
            </Section>

            {/* Checklists de Requisitos */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-[2.5rem] border border-outline-variant/20 bg-surface-container-low p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Visto Bueno Ops</h6>
                  {preReadyForRequestOps ? <Pill tone="green">OK</Pill> : <Pill tone="amber">Pendiente</Pill>}
                </div>
                <ul className="space-y-4">
                  {checklist.reqSolicitarOps.map((it) => (
                    <li key={it.key} className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-on-surface/80">{it.label}</span>
                      <span className={cls("material-symbols-outlined text-lg", it.ok ? "text-tertiary" : "text-on-surface-variant/30")}>
                        {it.ok ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[2.5rem] border border-outline-variant/20 bg-surface-container-low p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h6 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Paso a Siniestro</h6>
                  {opsReadyToAuthorize ? <Pill tone="green">OK</Pill> : <Pill tone="amber">Pendiente</Pill>}
                </div>
                <ul className="space-y-4">
                  {checklist.reqAutorizar.map((it) => (
                    <li key={it.key} className="flex items-center justify-between gap-4">
                      <span className="text-xs font-bold text-on-surface/80">{it.label}</span>
                      <span className={cls("material-symbols-outlined text-lg", it.ok ? "text-tertiary" : "text-on-surface-variant/30")}>
                        {it.ok ? "check_circle" : "radio_button_unchecked"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Documentos */}
            <Section title="Documentos Adjuntos" desc="Sube los respaldos necesarios para la liquidación">
              <div className="grid gap-6 rounded-3xl border border-outline-variant/20 bg-surface-container-low p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <Select
                    label="Tipo de Documento"
                    value={docForm.tipo}
                    onChange={(v) => setDocForm((p) => ({ ...p, tipo: v }))}
                    options={Object.keys(TipoDocumentoLabel)
                      .filter((k) => (isAsesor ? !OPS_REQ_PASO_SINIESTRO_DOCS.includes(k) : true))
                      .map((k) => ({ value: k, label: TipoDocumentoLabel[k] }))}
                  />
                  <Input
                    label="Título Descriptivo"
                    value={docForm.titulo}
                    onChange={(v) => setDocForm((p) => ({ ...p, titulo: v }))}
                    placeholder="Ej: Resolución Municipal..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">Seleccionar Archivo</span>
                  <div className="relative flex items-center justify-center rounded-2xl border-2 border-dashed border-outline-variant/20 bg-surface-container-lowest px-6 py-10 transition hover:border-primary/30">
                    <input
                      type="file"
                      accept="application/pdf,image/*"
                      onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                      className="absolute inset-0 cursor-pointer opacity-0"
                    />
                    <div className="flex flex-col items-center gap-2 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-4xl">cloud_upload</span>
                      <p className="text-sm font-bold">
                        {docForm.file ? docForm.file.name : "Haz clic o arrastra para subir un archivo"}
                      </p>
                      <p className="text-xs font-medium opacity-60">PDF o Imágenes (Máx 20MB)</p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button onClick={addDoc} disabled={busy || !docForm.file || !docForm.tipo} className="rounded-2xl">
                    <span className="material-symbols-outlined text-sm">add</span>
                    Subir Documento
                  </Button>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                <h6 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 ml-2 mb-2">Expediente Documental</h6>
                {selectedDocs.length === 0 ? (
                  <div className="text-center py-12 text-on-surface-variant/40 border border-outline-variant/10 rounded-3xl">
                    <span className="material-symbols-outlined text-5xl mb-2">folder_off</span>
                    <p className="text-sm font-bold">Sin registros</p>
                  </div>
                ) : (
                  selectedDocs.map((d) => (
                    <div key={d.id} className="group flex items-center justify-between rounded-2xl border border-outline-variant/10 bg-surface-container-low p-4 transition hover:bg-surface-container-high">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-highest text-primary">
                          <span className="material-symbols-outlined">
                            {d.tipo.includes("FOTO") ? "image" : "description"}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-black text-on-surface">
                            {TipoDocumentoLabel[d.tipo] || d.titulo || "Documento"}
                          </div>
                          <div className="text-[11px] font-bold text-on-surface-variant/60">{d.titulo || "Sin descripción"}</div>
                        </div>
                      </div>
                      <a
                        href={fileUrl(d.urlArchivo)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-primary/10 hover:text-primary"
                      >
                        <span className="material-symbols-outlined">visibility</span>
                      </a>
                    </div>
                  ))
                )}
              </div>
            </Section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
