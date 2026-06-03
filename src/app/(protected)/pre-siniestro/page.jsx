"use client";

// src/app/(protected)/pre-siniestro/page.jsx
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import api, { apiGet, apiPost, apiPostForm, apiPatch, apiPutForm, fileUrl } from "@/lib/api";
import { validateRut, formatRut } from "@/lib/rut";
import comunasData from "@/lib/comunas.json";

/**
 * Labels UI
 */
const TipoCasoLabel = {
  HIPOTECARIO_A: "Hipotecario (A)",
  POLIZA_PARTICULAR_B: "Póliza Particular (B)",
};

const COMPANIAS_SEGURO = [
  { value: "BCI", label: "BCI" },
  { value: "Sura", label: "Sura" },
  { value: "Consorcio", label: "Consorcio" },
  { value: "Chilena Consolidada", label: "Chilena Consolidada" },
  { value: "Mapfre", label: "Mapfre" },
  { value: "HDI", label: "HDI" },
  { value: "Otra", label: "Otra..." },
];

const COMPANIAS_BASICAS = COMPANIAS_SEGURO.filter(c => c.value !== "Otra").map(c => c.value);

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
  ENVIO_INFORMACION_LIQUIDADOR: "Envío antecedentes liquidador (respaldo)",
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
  "FOTOS_VIDEOS",
  "MANDATO_ASESORIA_NOTARIAL",
  "CONTRATO_ASESORIA",
];

import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Checkbox } from "@/components/ui/Checkbox";
import { Switch } from "@/components/ui/Switch";
import { Section } from "@/components/ui/Section";
import { Drawer } from "@/components/ui/Drawer";
import { Modal } from "@/components/ui/Modal";
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
};

export default function PreSiniestroPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userRole = session?.user?.rol || null;
  const userId = session?.user?.id || session?.user?.sub || null;
  const isOps = ["OPERACIONES", "SUPERADMIN", "GERENTE", "MASTER"].includes(userRole);
  const isAsesor = userRole === "ASESOR";
  // Puede editar/reemplazar documentos
  const canEditDocs = (caso) => {
    if (["OPERACIONES", "SUPERADMIN", "GERENTE", "MASTER"].includes(userRole)) return true;
    if (userRole === "ASESOR" && caso?.asesorId === userId) return true;
    return false;
  };

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const [casos, setCasos] = useState([]);
  const [meta, setMeta] = useState({ total: 0, paginas: 1, pagina: 1 });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(20);

  const [query, setQuery] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'list'
  const [tipoFilter, setTipoFilter] = useState("ALL");
  const [estadoFilter, setEstadoFilter] = useState("ALL");
  const [flagFilter, setFlagFilter] = useState("ALL");
  const [origenFilter, setOrigenFilter] = useState("ALL");
  const [filterOrden, setFilterOrden] = useState("desc");
  const [successToast, setSuccessToast] = useState(null);

  useEffect(() => {
    if (successToast) {
      const timer = setTimeout(() => setSuccessToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [successToast]);

  const [usuarios, setUsuarios] = useState([]);

  // Datos para autorizar paso a siniestro
  const [authData, setAuthData] = useState({
    inspectorId: "",
    numeroSiniestro: "",
    companiaSeguro: "",
  });

  const [openCreate, setOpenCreate] = useState(false);
  const [openAuth, setOpenAuth] = useState(false); // Modal para autorizar
  const [createBusy, setCreateBusy] = useState(false);
  const [createError, setCreateError] = useState(null);
  const [createdCasoSuccess, setCreatedCasoSuccess] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const handleOpenCreate = () => {
    setCreateError(null);
    setOpenCreate(true);
  };
  const [newCaso, setNewCaso] = useState({
    tipo: "HIPOTECARIO_A",
    nombreCliente: "",
    rutCliente: "",
    direccion: "",
    region: "",
    comuna: "",
    companiaSeguro: "",
    numeroSiniestro: "",
    esCasoAsesur: true,
    asesorId: "",
    banco: "",
    emailCliente: "",
    telefonoCliente1: "",
    numeroDocumentoCI: "",
    antiguedadEdificio: "",
    m2ViviendaTotal: "",
    fechaOcurrencia: "",
    archivos: {
      INSPECCION_ASESUR: [],
      FOTOS_VIDEOS: [],
      MANDATO_ASESORIA_NOTARIAL: [],
      CONTRATO_ASESORIA: [],
      DENUNCIA_SINIESTRO_CORREO: [],
      ASIGNACION_FORMAL_CORREO: [],
    },
    fotos: {
      FACHADA: [],
      LIVING_COMEDOR: [],
      COCINA: [],
      DORMITORIO_PRINCIPAL: [],
      DORMITORIO_SECUNDARIO: [],
      BANO: [],
      TECHUMBRE: [],
      PATIO: [],
      OTRO: [],
    },
  });

  // Lista de asesores para el selector (solo OPS/MASTER)
  const [asesoresList, setAsesoresList] = useState([]);

  const [openDetail, setOpenDetail] = useState(false);
  const [selected, setSelected] = useState(null);
  const [selectedDocs, setSelectedDocs] = useState([]);

  // ✅ subir doc
  const [docForm, setDocForm] = useState({
    tipo: "DENUNCIA_SINIESTRO_CORREO",
    titulo: "",
    file: null,
  });

  // ✅ reemplazar doc existente
  const [editDocModal, setEditDocModal] = useState({
    open: false,
    doc: null,
    newFile: null,
    newTitulo: "",
    successMsg: null,
    errorMsg: null,
  });

  const [openReject, setOpenReject] = useState(false);
  const [rejectMotivo, setRejectMotivo] = useState("");

  const [datosForm, setDatosForm] = useState({
    companiaSeguro: "",
    numeroSiniestro: "",

    nombreLiquidador: "",
    emailLiquidador: "",
    telefonoLiquidador: "",
    nombreAnalista: "",
  });

  // ✅ enviar correo manual
  const [openEmail, setOpenEmail] = useState(false);
  const [emailForm, setEmailForm] = useState({
    destinatarios: "",
    cc: "",
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
    region: "",
    comuna: "",
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
      region: selected.region || "",
      comuna: selected.comuna || "",
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
      await openCaso(selected); // Re-fetch selected to update UI
    } catch (e) {
      setError("Error al actualizar datos de captación");
    } finally {
      setBusy(false);
    }
  };

  const refresh = async (q = query) => {
    setError(null);
    setLoading(true);
    try {
      const p = new URLSearchParams();
      p.append("pagina", pagina);
      p.append("limite", limite);
      if (q) p.append("q", q);
      if (tipoFilter !== "ALL") p.append("ramo", tipoFilter);
      if (estadoFilter !== "ALL") p.append("estado", estadoFilter);
      if (flagFilter !== "ALL") p.append("flag", flagFilter);
      if (origenFilter !== "ALL") p.append("origen", origenFilter);
      if (filterOrden) p.append("orden", filterOrden);

      const res = await apiGet(`/pre-siniestro?${p.toString()}`);
      if (res && res.data) {
        setCasos(res.data);
        if (res.meta) setMeta(res.meta);
      } else {
        setCasos(Array.isArray(res) ? res : []);
      }
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error cargando");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      refresh(query);
    }, 400);
    return () => clearTimeout(handler);
  }, [query, pagina, limite, tipoFilter, estadoFilter, flagFilter, origenFilter, filterOrden]);

  useEffect(() => {
    setPagina(1);
  }, [tipoFilter, estadoFilter, flagFilter, origenFilter, filterOrden]);

  // Cargar lista de asesores disponibles para el selector
  useEffect(() => {
    apiGet("/usuarios?rol=ASESOR&activo=true").then((res) => {
      const list = res?.data || res || [];
      setAsesoresList(Array.isArray(list) ? list : []);
    }).catch(() => { });
  }, []);

  useEffect(() => {
    fetchUsuarios();
  }, []);

  const fetchUsuarios = async () => {
    try {
      const res = await apiGet("/usuarios");
      // El backend devuelve { ok: true, usuarios: [...] }
      if (res && res.usuarios) setUsuarios(res.usuarios);
      else if (Array.isArray(res)) setUsuarios(res);
    } catch (e) {
      console.error("Error fetching users:", e);
    }
  };

  // Sync from URL
  useEffect(() => {
    const flag = searchParams.get("flag");
    const estado = searchParams.get("estado");
    const tipo = searchParams.get("tipo") || searchParams.get("ramo");
    const origen = searchParams.get("origen");

    if (flag) setFlagFilter(flag.toUpperCase());
    if (estado) setEstadoFilter(estado.toUpperCase());
    if (tipo) setTipoFilter(tipo.toUpperCase());
    if (origen) setOrigenFilter(origen.toUpperCase());
  }, [searchParams]);

  const exportExcel = async () => {
    try {
      setBusy(true);
      setError(null);
      const p = new URLSearchParams();
      if (query) p.append("q", query);
      if (tipoFilter !== "ALL") p.append("ramo", tipoFilter);
      if (estadoFilter !== "ALL") p.append("estado", estadoFilter);
      p.append("etapa", "PRE_SINIESTRO_LIST");

      const res = await api.get(`/casos/exportar/excel?${p.toString()}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Pre_Siniestros_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const filtered = casos;

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
      setSelectedFotosWord(full.fotos?.map(f => f.id) || []);
      setOpenDetail(true);

      // hidrata form (si el objeto trae esos campos)
      setDatosForm({
        companiaSeguro: full.companiaSeguro || "",
        numeroSiniestro: full.numeroSiniestro || "",

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
    console.log("[createCaso] Iniciando creación de caso...");
    setCreateError(null);
    setCreatedCasoSuccess(null);
    setCreateBusy(true);
    try {
      if (isAsesor) {
        const totalPhotos = Object.values(newCaso.fotos).reduce((sum, list) => sum + (list?.length || 0), 0);
        console.log("[createCaso] Total de fotos seleccionadas por Asesor:", totalPhotos);
        if (totalPhotos === 0) {
          throw new Error("Debes subir al menos una foto en general");
        }
      }

      const payload = {
        tipo: newCaso.tipo,
        nombreCliente: newCaso.nombreCliente.trim(),
        rutCliente: newCaso.rutCliente.trim(),
        direccion: newCaso.direccion.trim(),
        region: newCaso.region,
        comuna: newCaso.comuna,
        esCasoAsesur: newCaso.esCasoAsesur,
        // Si es asesor, el backend lo auto-asigna. Si no, pasamos el asesorId elegido.
        ...(newCaso.asesorId ? { asesorId: newCaso.asesorId } : {}),
        ...(isAsesor ? {
          banco: newCaso.banco?.trim() || null,
          emailCliente: newCaso.emailCliente?.trim() || null,
          telefonoCliente1: newCaso.telefonoCliente1?.trim() || null,
          numeroDocumentoCI: newCaso.numeroDocumentoCI?.trim() || null,
          antiguedadEdificio: newCaso.antiguedadEdificio ? parseInt(newCaso.antiguedadEdificio, 10) : null,
          m2ViviendaTotal: newCaso.m2ViviendaTotal ? parseFloat(newCaso.m2ViviendaTotal) : null,
          fechaOcurrencia: newCaso.fechaOcurrencia ? new Date(newCaso.fechaOcurrencia).toISOString() : null,
        } : {})
      };

      console.log("[createCaso] Validando datos mínimos...");
      if (!payload.nombreCliente || !payload.rutCliente || !payload.direccion) {
        throw new Error("Completa nombre, RUT y dirección");
      }
      if (!validateRut(payload.rutCliente)) {
        throw new Error("El RUT ingresado no es válido");
      }

      console.log("[createCaso] Enviando POST a /pre-siniestro/create...", payload);
      const created = await apiPost("/pre-siniestro/create", payload);
      console.log("[createCaso] Respuesta de creación recibida con éxito:", created);

      // El backend retorna el caso directamente: { id, folio, etapa, ... }
      const newCasoId = created?.id || created?.data?.id;
      if (!newCasoId) {
        throw new Error(`No se obtuvo el ID del caso creado. Respuesta: ${JSON.stringify(created)}`);
      }

      // Update insurance data if provided (no bloqueante, solo si no es asesor)
      if (!isAsesor && (newCaso.companiaSeguro?.trim() || newCaso.numeroSiniestro?.trim())) {
        console.log("[createCaso] Guardando datos complementarios de seguro...");
        try {
          await apiPatch(`/pre-siniestro/${newCasoId}/datos`, {
            companiaSeguro: newCaso.companiaSeguro?.trim() || "",
            numeroSiniestro: newCaso.numeroSiniestro?.trim() || "",
          });
          console.log("[createCaso] Datos complementarios guardados.");
        } catch (patchErr) {
          console.error("Error guardando datos del siniestro:", patchErr?.response?.data || patchErr?.message);
        }
      }

      // Upload files — subida individual con acumulación de errores para retroalimentación visual
      if (isAsesor) {
        console.log("[createCaso] Iniciando subida de fotos por sector...");
        const parts = Object.keys(newCaso.fotos);
        const uploadErrors = [];
        for (const partKey of parts) {
          const items = newCaso.fotos[partKey];
          if (items && items.length > 0) {
            console.log(`[createCaso] Subiendo ${items.length} fotos para el sector: ${partKey}`);
            for (const item of items) {
              try {
                const fd = new FormData();
                fd.append("parteCasa", partKey);
                fd.append("titulo", item.comment?.trim() || item.file.name);
                fd.append("file", item.file);
                console.log(`[createCaso] Subiendo foto "${item.file.name}"...`);
                const uploadRes = await apiPostForm(`/casos/${newCasoId}/fotos`, fd);
                console.log(`[createCaso] Foto "${item.file.name}" subida con éxito:`, uploadRes);
              } catch (uploadErr) {
                const errDetail = uploadErr?.response?.data?.message || uploadErr?.response?.data?.error || uploadErr?.message || "Error de red/servidor";
                console.error(`Error subiendo foto de ${partKey}:`, errDetail);
                uploadErrors.push(`[${partKey}] ${item.file.name}: ${errDetail}`);
              }
            }
          }
        }
        console.log("[createCaso] Finalizada la subida de fotos por sector.");
        if (uploadErrors.length > 0) {
          throw new Error(`Se creó el caso (Folio ${created?.folio || created?.data?.folio || "OK"}) pero falló la subida de las fotos: ${uploadErrors.join(", ")}`);
        }
      } else {
        console.log("[createCaso] Iniciando subida de archivos tradicionales...");
        const fileTypes = [
          "INSPECCION_ASESUR",
          "FOTOS_VIDEOS",
          "MANDATO_ASESORIA_NOTARIAL",
          "CONTRATO_ASESORIA",
          "DENUNCIA_SINIESTRO_CORREO",
          "ASIGNACION_FORMAL_CORREO",
        ];
        const uploadErrors = [];
        for (const tipo of fileTypes) {
          const files = newCaso.archivos[tipo];
          if (files && files.length > 0) {
            console.log(`[createCaso] Subiendo ${files.length} archivos de tipo: ${tipo}`);
            for (const file of files) {
              try {
                const fd = new FormData();
                fd.append("tipo", tipo);
                fd.append("titulo", file.name);
                fd.append("file", file);
                console.log(`[createCaso] Subiendo archivo "${file.name}"...`);
                const uploadRes = await apiPostForm(`/pre-siniestro/${newCasoId}/documentos`, fd);
                console.log(`[createCaso] Archivo "${file.name}" subido con éxito:`, uploadRes);
              } catch (uploadErr) {
                const errDetail = uploadErr?.response?.data?.message || uploadErr?.response?.data?.error || uploadErr?.message || "Error de red/servidor";
                console.error(`Error subiendo archivo ${tipo}:`, errDetail);
                uploadErrors.push(`[${tipo}] ${file.name}: ${errDetail}`);
              }
            }
          }
        }
        console.log("[createCaso] Finalizada la subida de archivos tradicionales.");
        if (uploadErrors.length > 0) {
          throw new Error(`Se creó el caso (Folio ${created?.folio || created?.data?.folio || "OK"}) pero falló la subida de documentos: ${uploadErrors.join(", ")}`);
        }
      }

      console.log("[createCaso] Limpiando formulario, cerrando modal y refrescando lista...");
      setOpenCreate(false);
      setNewCaso({
        tipo: "HIPOTECARIO_A",
        nombreCliente: "",
        rutCliente: "",
        direccion: "",
        region: "",
        comuna: "",
        companiaSeguro: "",
        numeroSiniestro: "",
        esCasoAsesur: true,
        asesorId: "",
        banco: "",
        emailCliente: "",
        telefonoCliente1: "",
        numeroDocumentoCI: "",
        antiguedadEdificio: "",
        m2ViviendaTotal: "",
        fechaOcurrencia: "",
        archivos: {
          INSPECCION_ASESUR: [],
          FOTOS_VIDEOS: [],
          MANDATO_ASESORIA_NOTARIAL: [],
          CONTRATO_ASESORIA: [],
          DENUNCIA_SINIESTRO_CORREO: [],
          ASIGNACION_FORMAL_CORREO: [],
        },
        fotos: {
          FACHADA: [],
          LIVING_COMEDOR: [],
          COCINA: [],
          DORMITORIO_PRINCIPAL: [],
          DORMITORIO_SECUNDARIO: [],
          BANO: [],
          TECHUMBRE: [],
          PATIO: [],
          OTRO: [],
        },
      });

      // Establecer el caso creado exitosamente para mostrar el banner de éxito
      setCreatedCasoSuccess(created);

      console.log("[createCaso] Ejecutando refresh() para actualizar el listado principal...");
      await refresh();
      console.log("[createCaso] ¡Todo el flujo de creación finalizó exitosamente!");
    } catch (e) {
      console.error("[createCaso] Ocurrió un error en el flujo de creación:", e);
      setCreateError(e?.response?.data?.error || e?.message || "Error creando caso");
    } finally {
      setCreateBusy(false);
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
      if (!payload.numeroSiniestro) throw new Error("Nº de siniestro es obligatorio");

      payload.nombreLiquidador = datosForm.nombreLiquidador.trim() || null;
      payload.emailLiquidador = datosForm.emailLiquidador.trim() || null;
      payload.telefonoLiquidador = datosForm.telefonoLiquidador.trim() || null;
      payload.nombreAnalista = datosForm.nombreAnalista.trim() || null;


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
      setFileInputKey(prev => prev + 1);
    } catch (e) {
      setError(
        e?.response?.data?.error || e?.message || "Error subiendo documento"
      );
    } finally {
      setBusy(false);
    }
  };

  const reemplazarDocPre = async () => {
    if (!selected?.id || !editDocModal.doc || !editDocModal.newFile) return;
    setEditDocModal((p) => ({ ...p, errorMsg: null, successMsg: null }));
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", editDocModal.newFile);
      if (editDocModal.newTitulo.trim()) fd.append("titulo", editDocModal.newTitulo.trim());

      await apiPutForm(`/pre-siniestro/${selected.id}/documentos/${editDocModal.doc.id}`, fd);

      const full = await apiGet(`/pre-siniestro/${selected.id}`);
      setSelected(full);
      setSelectedDocs(full.documentos || []);
      // Mostrar éxito brevemente antes de cerrar
      setEditDocModal((p) => ({ ...p, successMsg: "✅ Documento reemplazado correctamente.", newFile: null }));
      setTimeout(() => setEditDocModal({ open: false, doc: null, newFile: null, newTitulo: "", successMsg: null, errorMsg: null }), 1500);
    } catch (e) {
      setEditDocModal((p) => ({ ...p, errorMsg: e?.response?.data?.error || e?.message || "Error reemplazando documento" }));
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
      setOpenDetail(false);
      setSelected(null);
      setSelectedDocs([]);
      setSuccessToast({
        message: "¡Solicitud de autorización enviada con éxito!",
        detail: "El caso ha sido enviado a Operaciones para su validación a Siniestro."
      });
      await refresh();
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
    if (!authData.numeroSiniestro || !authData.companiaSeguro) {
      alert("Nro de Siniestro y Compañía son obligatorios.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/pre-siniestro/${selected.id}/autorizar`, authData);
      setOpenAuth(false);
      setOpenDetail(false);
      setSelected(null);
      setSelectedDocs([]);
      setSuccessToast({
        message: "¡Caso autorizado y traspasado a Siniestro con éxito!",
        detail: `Se asignó la compañía ${authData.companiaSeguro} y el Nº de Siniestro ${authData.numeroSiniestro}.`
      });
      await refresh();
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error al autorizar caso");
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
    const ccs = emailForm.cc?.split(",").map(c => c.trim()).filter(Boolean) || [];
    if (!dests.length || !emailForm.asunto || !emailForm.mensaje) {
      setError("Faltan campos obligatorios para el correo.");
      return;
    }
    try {
      setBusy(true);
      await apiPost(`/casos/${selected.id}/enviar-correo`, {
        destinatarios: dests,
        cc: ccs,
        asunto: emailForm.asunto,
        mensaje: emailForm.mensaje
      });
      setOpenEmail(false);
      setEmailForm({ destinatarios: "", cc: "", asunto: "", mensaje: "" });
      alert("Correo enviado exitosamente.");
    } catch (e) {
      setError(e?.response?.data?.error || e?.message || "Error enviando correo");
    } finally {
      setBusy(false);
    }
  };

  const computeChecklist = (caso, docs = []) => {
    const docTypes = new Set((docs || []).map((d) => d.tipo));
    const qtyFotos = caso?.fotos?.length || 0;

    const mk = (key, group) => {
      let isOk = docTypes.has(key);
      if (key === "FOTOS_VIDEOS" && qtyFotos >= 1) isOk = true;

      return {
        key,
        label: TipoDocumentoLabel[key] || key,
        ok: isOk,
        group,
      };
    };

    // 1) ASESOR: requisitos para pedir autorización a OPS
    const isTipoB = caso?.tipo === "POLIZA_PARTICULAR_B";

    const reqSolicitarOps = [];
    // VB es obligatorio siempre
    reqSolicitarOps.push({
      key: "VB",
      label: TipoDocumentoLabel["VB"] || "VB",
      ok: Boolean(caso?.vbPreFecha),
      group: "REQ_SOLICITAR_OPS",
    });

    // Emails son obligatorios para AMBOS (A y B)
    const emails = ["DENUNCIA_SINIESTRO_CORREO", "ASIGNACION_FORMAL_CORREO"];
    for (const t of emails) reqSolicitarOps.push(mk(t, "REQ_SOLICITAR_OPS"));

    // Documentos específicos para B
    if (isTipoB) {
      for (const t of PRE_REQ_DOCS_TIPO_B)
        reqSolicitarOps.push(mk(t, "REQ_SOLICITAR_OPS"));
    }

    const otrosDocs = ["POLIZA", ...(!isTipoB ? PRE_REQ_DOCS_TIPO_B : [])];

    const reqAutorizar = [];
    for (const t of OPS_REQ_PASO_SINIESTRO_DOCS)
      reqAutorizar.push(mk(t, "REQ_AUTORIZAR"));



    // 3) Otros / opcionales (solo para ordenar UI)

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
    <div className="min-h-screen bg-surface px-6 py-10 lg:px-12 font-sans">
      {/* Header Area */}
      <div className="mb-8 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner shadow-primary/20 shrink-0">
            <span className="material-symbols-outlined text-3xl font-light">assignment_late</span>
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-on-surface">Pre-Siniestros</h1>
            <p className="text-sm font-medium text-on-surface-variant/70 mt-0.5">
              Validación, denuncias y autorización a etapa de Siniestro.
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
          {isOps && (
            <button
              onClick={handleOpenCreate}
              disabled={busy}
              className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-on-primary shadow-lg shadow-primary/25 transition hover:bg-primary/95 disabled:opacity-50 cursor-pointer"
            >
              <span className="material-symbols-outlined text-xl">add_circle</span>
              Nuevo Pre-Siniestro
            </button>
          )}
        </div>
      </div>

      <div>
        {/* Success / Info toasts */}
        {createdCasoSuccess && (
          <div className="mb-6 flex flex-col gap-2 rounded-2xl border border-green-500/20 bg-green-500/10 p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3 text-green-700 dark:text-green-400 font-bold text-sm">
              <span className="material-symbols-outlined text-green-600 text-lg">check_circle</span>
              <span>¡Pre-Siniestro creado con éxito! (Folio {createdCasoSuccess.folio || createdCasoSuccess.data?.folio})</span>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              El caso ha sido registrado correctamente y se encuentra visible en el listado principal de <strong>Pre-Siniestros</strong>.
            </p>
            <button
              onClick={() => setCreatedCasoSuccess(null)}
              className="mt-2 self-start text-[11px] font-bold text-green-600 hover:text-green-700 underline"
            >
              Entendido
            </button>
          </div>
        )}

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 items-end">
              {/* Row 1, Col 1-2: Search */}
              <div className="sm:col-span-2 relative">
                <span className="text-[11px] font-bold text-on-surface-variant/70 tracking-wider mb-1.5 block">Búsqueda Inteligente</span>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant/60 font-light">search</span>
                  <input
                    type="text"
                    placeholder="Buscar por folio, cliente, RUT, dirección..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full bg-surface-container focus:bg-surface-container-high border border-outline-variant/10 focus:border-primary/40 focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-4 h-12 text-on-surface placeholder:text-on-surface-variant/40 transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>
              
              {/* Row 1, Col 3: Tipo */}
              <Select
                label="Tipo de Caso"
                value={tipoFilter}
                onChange={setTipoFilter}
                options={[
                  { value: "ALL", label: "Todos los Tipos" },
                  { value: "HIPOTECARIO_A", label: "Hipotecario (A)" },
                  { value: "POLIZA_PARTICULAR_B", label: "Póliza Particular (B)" },
                ]}
              />

              {/* Row 1, Col 4: Estado */}
              <Select
                label="Estado"
                value={estadoFilter}
                onChange={setEstadoFilter}
                options={[
                  { value: "ALL", label: "Todos los Estados" },
                  { value: "ABIERTO", label: "Abierto" },
                  { value: "EN_REVISION", label: "En revisión" },
                  { value: "PENDIENTE_AUTORIZACION", label: "Pendiente autorización" },
                  { value: "AUTORIZADO", label: "Autorizado" },
                  { value: "RECHAZADO", label: "Rechazado" },
                ]}
              />

              {/* Row 2, Col 1: Banderas */}
              <Select
                label="Bandera"
                value={flagFilter}
                onChange={setFlagFilter}
                options={[
                  { value: "ALL", label: "Todas las Banderas" },
                  { value: "VB_PENDIENTE", label: "VB pendiente" },
                  { value: "PEND_AUT", label: "Pendiente Ops" },
                  { value: "AUTORIZADO", label: "Autorizado" },
                  { value: "RECHAZADO", label: "Rechazado" },
                ]}
              />

              {/* Row 2, Col 2: Origen */}
              <Select
                label="Origen"
                value={origenFilter}
                onChange={setOrigenFilter}
                options={[
                  { value: "ALL", label: "Todos los Orígenes" },
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
                  className={cls(
                    "group relative flex w-full flex-col overflow-hidden rounded-[2.5rem] border border-outline-variant/80 bg-surface shadow-sm transition-all duration-500 hover:-translate-y-1 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/10 outline-none p-0 hover:cursor-pointer",
                    c.esCasoAsesur ? "border-l-4 border-l-primary bg-primary/[0.02]" : "border-l-4 border-l-amber-500 bg-amber-500/[0.02]"
                  )}
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
                          <p className="line-clamp-1">
                            {c.direccion}
                            {c.comuna && `, ${c.comuna}`}
                            {c.region && ` (${c.region})`}
                          </p>
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
                          <div className="line-clamp-1 text-[11px] font-bold text-on-surface-variant">
                            {c.direccion}
                            {c.comuna && `, ${c.comuna}`}
                            {c.region && ` (${c.region})`}
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

      {/* MODALES */}
      <Modal
        open={!!error}
        title=""
        maxWidth="max-w-md"
        onClose={() => setError(null)}
      >
        <div className="flex flex-col items-center text-center p-4 gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <span className="material-symbols-outlined text-4xl">warning</span>
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-black text-on-surface">Atención / No permitido</h3>
            <p className="text-sm font-semibold text-on-surface-variant leading-relaxed">
              {error}
            </p>
          </div>
          <Button 
            className="w-full mt-4 cursor-pointer font-bold uppercase tracking-wider h-11 rounded-2xl" 
            variant="secondary" 
            onClick={() => setError(null)}
          >
            Entendido
          </Button>
        </div>
      </Modal>

      <Modal
        open={openCreate}
        title="Nuevo Pre-Siniestro"
        maxWidth="max-w-lg"
        onClose={() => setOpenCreate(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenCreate(false)} disabled={createBusy}>
              Cancelar
            </Button>
            <Button onClick={createCaso} disabled={createBusy} loading={createBusy}>
              {createBusy ? "Creando..." : "Crear Caso"}
            </Button>
          </>
        }
      >
        <div className="grid gap-6 md:grid-cols-2">
          {createError && (
            <div className="md:col-span-2 p-4 rounded-xl bg-red-500/10 text-red-600 text-sm font-bold">
              {createError}
            </div>
          )}
          <div className="md:col-span-2">
            <Switch
              label="Caso ASESUR"
              description="Habilitar si el caso fue entregado por la empresa. Deshabilitar si es captación propia."
              checked={newCaso.esCasoAsesur}
              onChange={(v) => setNewCaso((p) => ({ ...p, esCasoAsesur: v }))}
            />
          </div>

          {/* Si NO es asesor, mostrar Compañía de Seguros y Nº de Siniestro */}
          {!isAsesor ? (
            <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Select
                  label="Compañía de Seguros *"
                  options={COMPANIAS_SEGURO}
                  value={COMPANIAS_BASICAS.includes(newCaso.companiaSeguro) ? newCaso.companiaSeguro : (newCaso.companiaSeguro ? "Otra" : "")}
                  onChange={(v) => {
                    if (v === "Otra") setNewCaso(p => ({ ...p, companiaSeguro: " " }));
                    else setNewCaso(p => ({ ...p, companiaSeguro: v }));
                  }}
                />
                {!COMPANIAS_BASICAS.includes(newCaso.companiaSeguro) && newCaso.companiaSeguro !== undefined && newCaso.companiaSeguro !== "" && (
                  <Input
                    placeholder="Escribe el nombre de la compañía"
                    value={newCaso.companiaSeguro.trim() === "" ? "" : newCaso.companiaSeguro}
                    onChange={(v) => setNewCaso(p => ({ ...p, companiaSeguro: v }))}
                  />
                )}
              </div>
              <Input
                label="Nº de Siniestro *"
                value={newCaso.numeroSiniestro}
                onChange={(v) => setNewCaso((p) => ({ ...p, numeroSiniestro: v }))}
                placeholder="Ej: 987654321"
              />
            </div>
          ) : (
            /* Si es asesor, mostrar campos de captación móvil */
            <>
              <div>
                <Select
                  label="Tipo de Siniestro *"
                  options={[
                    { value: "HIPOTECARIO_A", label: "Hipotecario" },
                    { value: "POLIZA_PARTICULAR_B", label: "Póliza Particular" },
                  ]}
                  value={newCaso.tipo}
                  onChange={(v) => setNewCaso((p) => ({ ...p, tipo: v }))}
                />
              </div>
              <Input
                label="Banco Acreedor"
                value={newCaso.banco}
                onChange={(v) => setNewCaso((p) => ({ ...p, banco: v }))}
                placeholder="Ej: Banco Estado, Santander..."
              />
              <Input
                label="Fecha de Ocurrencia"
                type="date"
                value={newCaso.fechaOcurrencia}
                onChange={(v) => setNewCaso((p) => ({ ...p, fechaOcurrencia: v }))}
              />
              <Input
                label="Antigüedad del Edificio (años)"
                type="number"
                value={newCaso.antiguedadEdificio}
                onChange={(v) => setNewCaso((p) => ({ ...p, antiguedadEdificio: v }))}
                placeholder="Ej: 5"
              />
              <Input
                label="Superficie Construida (m²)"
                type="number"
                value={newCaso.m2ViviendaTotal}
                onChange={(v) => setNewCaso((p) => ({ ...p, m2ViviendaTotal: v }))}
                placeholder="Ej: 75"
              />
              <Input
                label="Email Cliente"
                type="email"
                value={newCaso.emailCliente}
                onChange={(v) => setNewCaso((p) => ({ ...p, emailCliente: v }))}
                placeholder="cliente@correo.com"
              />
              <Input
                label="Teléfono Principal"
                value={newCaso.telefonoCliente1}
                onChange={(v) => setNewCaso((p) => ({ ...p, telefonoCliente1: v }))}
                placeholder="Ej: +56912345678"
              />
              <Input
                label="Documento C.I. (Número de Serie)"
                value={newCaso.numeroDocumentoCI}
                onChange={(v) => setNewCaso((p) => ({ ...p, numeroDocumentoCI: v }))}
                placeholder="Ej: 123456789"
              />
            </>
          )}

          <Input
            label="RUT Cliente *"
            value={newCaso.rutCliente}
            onChange={(v) => setNewCaso((p) => ({ ...p, rutCliente: formatRut(v) }))}
            placeholder="12.345.678-9"
          />
          <div className="md:col-span-2">
            <Input
              label="Nombre Cliente *"
              value={newCaso.nombreCliente}
              onChange={(v) => setNewCaso((p) => ({ ...p, nombreCliente: v }))}
              placeholder="Nombre completo"
            />
          </div>
          <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
            <Select
              label="Región *"
              options={comunasData.regions.map(r => ({ value: r.name, label: r.name }))}
              value={newCaso.region}
              onChange={(v) => setNewCaso(p => ({ ...p, region: v, comuna: "" }))}
            />
            <Select
              label="Comuna *"
              options={(comunasData.regions.find(r => r.name === newCaso.region)?.communes || []).map(c => ({ value: c.name, label: c.name }))}
              value={newCaso.comuna}
              onChange={(v) => setNewCaso(p => ({ ...p, comuna: v }))}
              disabled={!newCaso.region}
            />
          </div>
          <div className="md:col-span-2">
            <Input
              label="Dirección *"
              value={newCaso.direccion}
              onChange={(v) => setNewCaso((p) => ({ ...p, direccion: v }))}
              placeholder="Calle, número, depto..."
            />
          </div>

          {/* Selector de asesor: ASESOR se asigna solo, OPS/MASTER eligen */}
          <div className="md:col-span-2">
            {isAsesor ? (
              <div className="flex items-center gap-3 rounded-xl bg-primary/5 border border-primary/20 p-3">
                <span className="material-symbols-outlined text-primary text-lg">person_check</span>
                <p className="text-sm text-on-surface font-medium">
                  El caso se asignará automáticamente a <span className="font-black text-primary">{session?.user?.name || "usted"}</span>
                </p>
              </div>
            ) : (
              <div>
                <p className="mb-2 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">Asesor Asignado *</p>
                <select
                  value={newCaso.asesorId}
                  onChange={(e) => setNewCaso(p => ({ ...p, asesorId: e.target.value }))}
                  className="w-full rounded-xl bg-surface-container-highest border-0 px-4 py-3 text-sm text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Sin asignar (queda en Pre-Siniestro)</option>
                  {asesoresList.map(a => (
                    <option key={a.id} value={a.id}>{a.nombre} — {a.email}</option>
                  ))}
                </select>
                {newCaso.asesorId && (
                  <p className="mt-1 text-[11px] text-primary font-semibold">✓ Con asesor asignado, el caso pasará directo a Siniestro</p>
                )}
              </div>
            )}
          </div>

          {/* Carga de archivos por rol */}
          {isAsesor ? (
            /* Asesor: Cargar fotos por lugar */
            <div className="md:col-span-2 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-lg">photo_camera</span>
                <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Fotos del Siniestro por Lugar *</h3>
              </div>

              {/* Lista de partes de la casa */}
              <div className="divide-y divide-outline-variant/10">
                {[
                  { key: "FACHADA", label: "Fachada", icon: "home" },
                  { key: "LIVING_COMEDOR", label: "Living / Comedor", icon: "chair" },
                  { key: "COCINA", label: "Cocina", icon: "soup_kitchen" },
                  { key: "DORMITORIO_PRINCIPAL", label: "Dormitorio Principal", icon: "bed" },
                  { key: "DORMITORIO_SECUNDARIO", label: "Dormitorio Secundario", icon: "single_bed" },
                  { key: "BANO", label: "Baño", icon: "bathtub" },
                  { key: "TECHUMBRE", label: "Techumbre", icon: "roofing" },
                  { key: "PATIO", label: "Patio / Exterior", icon: "deck" },
                  { key: "OTRO", label: "Otros Daños / Evidencia", icon: "more_horiz" },
                ].map(({ key, label, icon }) => {
                  const files = newCaso.fotos[key] || [];
                  const hasFiles = files.length > 0;
                  return (
                    <div key={key} className="flex flex-col border-b border-outline-variant/10 last:border-b-0">
                      {/* Fila principal del sector */}
                      <label
                        className={cls(
                          "flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors hover:bg-surface-container/50",
                          hasFiles && "bg-green-500/[0.02]"
                        )}
                      >
                        {/* Ícono de sector */}
                        <span className={cls(
                          "material-symbols-outlined text-xl flex-shrink-0",
                          hasFiles ? "text-green-500" : "text-on-surface-variant/40"
                        )}>
                          {hasFiles ? "check_circle" : icon}
                        </span>

                        {/* Texto */}
                        <div className="flex-1 min-w-0">
                          <p className={cls(
                            "text-sm font-semibold truncate",
                            hasFiles ? "text-green-600" : "text-on-surface"
                          )}>
                            {label}
                          </p>
                          <p className="text-[11px] text-on-surface-variant/50 truncate mt-0.5">
                            {hasFiles
                              ? `${files.length} foto${files.length > 1 ? "s" : ""} seleccionada${files.length > 1 ? "s" : ""}`
                              : "Haz clic para seleccionar fotos de este sector"}
                          </p>
                        </div>

                        {/* Botón de selección */}
                        <span className="flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-surface-container text-on-surface-variant hover:bg-surface-container-high transition-colors">
                          Añadir Fotos
                        </span>

                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          className="sr-only"
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            const newItems = newFiles.map(file => ({
                              id: Math.random().toString(36).substr(2, 9),
                              file,
                              comment: ""
                            }));
                            setNewCaso(p => ({
                              ...p,
                              fotos: { ...p.fotos, [key]: [...(p.fotos[key] || []), ...newItems] }
                            }));
                          }}
                        />
                      </label>

                      {/* Lista de fotos seleccionadas con input de comentario */}
                      {hasFiles && (
                        <div className="bg-surface-container-lowest/30 px-5 pb-4 pt-1 space-y-3">
                          {files.map((item, idx) => (
                            <div key={item.id} className="flex items-start gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-3">
                              {/* Preview o ícono */}
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-surface-container-highest text-on-surface-variant/70 overflow-hidden">
                                <span className="material-symbols-outlined text-lg">image</span>
                              </div>

                              {/* Campos */}
                              <div className="flex-1 min-w-0 space-y-1">
                                <p className="text-[11px] font-bold text-on-surface-variant truncate">
                                  {item.file.name}
                                </p>
                                <input
                                  type="text"
                                  placeholder="Escribe un comentario para esta foto..."
                                  value={item.comment}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setNewCaso(p => {
                                      const updatedList = [...(p.fotos[key] || [])];
                                      updatedList[idx] = { ...updatedList[idx], comment: val };
                                      return {
                                        ...p,
                                        fotos: { ...p.fotos, [key]: updatedList }
                                      };
                                    });
                                  }}
                                  className="w-full rounded-lg bg-surface-container border border-outline-variant/10 px-3 py-1.5 text-xs text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-1 focus:ring-primary"
                                />
                              </div>

                              {/* Botón de eliminar foto */}
                              <button
                                type="button"
                                onClick={() => {
                                  setNewCaso(p => {
                                    const updatedList = (p.fotos[key] || []).filter(x => x.id !== item.id);
                                    return {
                                      ...p,
                                      fotos: { ...p.fotos, [key]: updatedList }
                                    };
                                  });
                                }}
                                className="flex-shrink-0 text-on-surface-variant hover:text-red-500 transition-colors p-1"
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* No Asesor: Cargar documentos tradicionales */
            <div className="md:col-span-2 rounded-2xl border border-outline-variant/10 bg-surface-container-lowest overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-2 px-5 py-4 border-b border-outline-variant/10">
                <span className="material-symbols-outlined text-primary text-lg">upload_file</span>
                <h3 className="text-sm font-black text-on-surface uppercase tracking-widest">Documentos del Caso</h3>
              </div>

              {/* Lista de documentos */}
              <div className="divide-y divide-outline-variant/10">
                {[
                  { key: "INSPECCION_ASESUR", icon: "find_in_page", label: "Informe de Inspección ASESUR", multiple: false, req: true },
                  { key: "FOTOS_VIDEOS", icon: "photo_library", label: "Fotos y Videos", multiple: true, req: true },
                  { key: "MANDATO_ASESORIA_NOTARIAL", icon: "gavel", label: "Mandato Asesoría Notarial", multiple: false, req: true },
                  { key: "CONTRATO_ASESORIA", icon: "description", label: "Contrato de Asesoría", multiple: false, req: true },
                  { key: "DENUNCIA_SINIESTRO_CORREO", icon: "mark_email_read", label: "Correo Denuncia Siniestro", multiple: false, req: true },
                  { key: "ASIGNACION_FORMAL_CORREO", icon: "forward_to_inbox", label: "Correo Asignación Formal Liq.", multiple: false, req: true },
                ].map(({ key, icon, label, multiple, req }) => {
                  const files = newCaso.archivos[key] || [];
                  const hasFiles = files.length > 0;
                  return (
                    <label
                      key={key}
                      className={cls(
                        "flex items-center gap-4 px-5 py-3.5 cursor-pointer transition-colors",
                        hasFiles
                          ? "bg-green-500/5 hover:bg-green-500/10"
                          : "hover:bg-surface-container"
                      )}
                    >
                      {/* Ícono estado */}
                      <span className={cls(
                        "material-symbols-outlined text-xl flex-shrink-0",
                        hasFiles ? "text-green-500" : "text-on-surface-variant/40"
                      )}>
                        {hasFiles ? "check_circle" : icon}
                      </span>

                      {/* Texto */}
                      <div className="flex-1 min-w-0">
                        <p className={cls(
                          "text-sm font-semibold truncate",
                          hasFiles ? "text-green-600" : "text-on-surface"
                        )}>
                          {label}
                          {req && <span className="ml-1 text-red-500">*</span>}
                        </p>
                        <p className="text-[11px] text-on-surface-variant/50 truncate mt-0.5">
                          {hasFiles
                            ? `${files.length} archivo${files.length > 1 ? "s" : ""} seleccionado${files.length > 1 ? "s" : ""}`
                            : multiple ? "Haz clic para seleccionar archivos" : "Haz clic para seleccionar archivo"}
                        </p>
                      </div>

                      {/* Botón visual */}
                      <span className={cls(
                        "flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg transition-colors",
                        hasFiles
                          ? "bg-green-500/10 text-green-600"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
                      )}>
                        {hasFiles ? "Cambiar" : "Subir"}
                      </span>

                      {/* Input oculto */}
                      <input
                        type="file"
                        multiple={multiple}
                        className="sr-only"
                        onChange={(e) => setNewCaso(p => ({
                          ...p,
                          archivos: { ...p.archivos, [key]: Array.from(e.target.files) }
                        }))}
                      />
                    </label>
                  );
                })}
              </div>
            </div>
          )}
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
        open={openAuth}
        title="Autorizar paso a Siniestro"
        onClose={() => setOpenAuth(false)}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpenAuth(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={autorizar} disabled={busy || !authData.companiaSeguro || !authData.numeroSiniestro}>
              <span className="material-symbols-outlined text-sm">bolt</span>
              Confirmar Autorización
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          <p className="text-sm font-medium text-on-surface-variant">
            Al autorizar el caso, este pasará a la etapa de Siniestro y se habilitará la gestión completa. Por favor confirma la Compañía de Seguros y el N° de Siniestro.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Select
                label="Compañía de Seguros *"
                options={COMPANIAS_SEGURO}
                value={COMPANIAS_BASICAS.includes(authData.companiaSeguro) ? authData.companiaSeguro : (authData.companiaSeguro ? "Otra" : "")}
                onChange={(v) => {
                  if (v === "Otra") setAuthData(p => ({ ...p, companiaSeguro: " " }));
                  else setAuthData(p => ({ ...p, companiaSeguro: v }));
                }}
              />
              {!COMPANIAS_BASICAS.includes(authData.companiaSeguro) && authData.companiaSeguro !== undefined && authData.companiaSeguro !== "" && (
                <Input
                  placeholder="Escribe el nombre de la compañía"
                  value={authData.companiaSeguro.trim() === "" ? "" : authData.companiaSeguro}
                  onChange={(v) => setAuthData(p => ({ ...p, companiaSeguro: v }))}
                />
              )}
            </div>
            <Input
              label="N° de Siniestro *"
              value={authData.numeroSiniestro}
              onChange={(v) => setAuthData(p => ({ ...p, numeroSiniestro: v }))}
            />
            <div className="md:col-span-2">
              <Select
                label="Asignar Inspector"
                value={authData.inspectorId}
                onChange={(v) => setAuthData(p => ({ ...p, inspectorId: v }))}
                options={[
                  { value: "", label: "Dejar en blanco (Mismo asesor asignado)" },
                  ...usuarios.filter(u => u.activo).map(u => ({
                    value: u.id,
                    label: `${u.nombre} - ${u.rol} (${u.email})`
                  }))
                ]}
              />
            </div>
          </div>
          {(!authData.companiaSeguro || !authData.numeroSiniestro) && (
            <div className="rounded-xl border border-error/20 bg-error/5 p-3 text-[12px] font-bold text-error">
              Ambos campos son obligatorios para autorizar.
            </div>
          )}
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
            label="Con Copia (CC - opcional)"
            value={emailForm.cc}
            onChange={(v) => setEmailForm((p) => ({ ...p, cc: v }))}
            placeholder="jefe@seguro.com"
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

      <Modal
        open={openEditCaptacion}
        title="Editar Datos del Caso"
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
          <div className="md:col-span-2 grid gap-6 md:grid-cols-2">
            <Select
              label="Región *"
              options={comunasData.regions.map(r => ({ value: r.name, label: r.name }))}
              value={editForm.region}
              onChange={(v) => setEditForm(p => ({ ...p, region: v, comuna: "" }))}
            />
            <Select
              label="Comuna *"
              options={(comunasData.regions.find(r => r.name === editForm.region)?.communes || []).map(c => ({ value: c.name, label: c.name }))}
              value={editForm.comuna}
              onChange={(v) => setEditForm(p => ({ ...p, comuna: v }))}
              disabled={!editForm.region}
            />
          </div>
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
            label="MTS2 Vivienda"
            type="number"
            step="0.1"
            value={editForm.m2ViviendaTotal}
            onChange={(v) => setEditForm((p) => ({ ...p, m2ViviendaTotal: v }))}
          />
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
          setError(null);
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
                  {selected.vbPreFecha && <Pill tone="green">VB OK</Pill>}
                </div>
              }
            >
              <div className="grid gap-6">
                <div className="flex flex-col gap-1">
                  <h4 className="text-2xl font-black">{selected.nombreCliente}</h4>
                  <p className="text-sm font-bold text-on-surface-variant/60">
                    {selected.rutCliente} · {selected.direccion}
                    {selected.comuna && `, ${selected.comuna}`}
                    {selected.region && ` (${selected.region})`}
                  </p>
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

                  <div className="group rounded-[1.5rem] border border-outline-variant/20 bg-surface-container-low p-5 transition hover:bg-surface-container-high">
                    <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/50">Origen del Caso</span>
                    <div className="mt-2 flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected.esCasoAsesur ? "bg-primary/10 text-primary" : "bg-amber-500/10 text-amber-600"}`}>
                        <span className="material-symbols-outlined text-xl">{selected.esCasoAsesur ? "business" : "person"}</span>
                      </div>
                      <div>
                        <div className="text-sm font-black font-black uppercase tracking-widest">{selected.esCasoAsesur ? "Asesur" : "Propio"}</div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60">
                          {selected.esCasoAsesur ? "Entregado por empresa" : "Traído por asesor"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {(selected.numeroDocumentoCI || selected.firmaNotarial || selected.fechaOcurrencia || selected.antiguedadEdificio || selected.m2ViviendaTotal || selected.banco || selected.emailCliente || selected.telefonoCliente1) && (
                  <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-5">
                    <div className="col-span-full text-[10px] font-black uppercase tracking-wider text-on-surface-variant/50 mb-1">Datos Adicionales y de Vivienda</div>
                    {selected.numeroDocumentoCI && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">N° Documento C.I.</div>
                        <div className="text-sm font-black">{selected.numeroDocumentoCI}</div>
                      </div>
                    )}
                    {selected.banco && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Banco Acreedor</div>
                        <div className="text-sm font-black">{selected.banco}</div>
                      </div>
                    )}
                    {selected.emailCliente && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Email Cliente</div>
                        <div className="text-sm font-black">{selected.emailCliente}</div>
                      </div>
                    )}
                    {selected.telefonoCliente1 && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Teléfono Cliente</div>
                        <div className="text-sm font-black">{selected.telefonoCliente1}</div>
                      </div>
                    )}
                    {selected.firmaNotarial && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Firma Notarial</div>
                        <div className="text-sm font-black">{selected.firmaNotarial}</div>
                      </div>
                    )}
                    {selected.fechaOcurrencia && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Fecha Ocurrencia</div>
                        <div className="text-sm font-black">{new Date(selected.fechaOcurrencia).toLocaleDateString("es-CL")}</div>
                      </div>
                    )}
                    {selected.antiguedadEdificio && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">Antigüedad Edificio</div>
                        <div className="text-sm font-black">{selected.antiguedadEdificio} años</div>
                      </div>
                    )}
                    {selected.m2ViviendaTotal && (
                      <div>
                        <div className="text-[10px] font-bold text-on-surface-variant/60 uppercase">MTS2 Vivienda</div>
                        <div className="text-sm font-black">{selected.m2ViviendaTotal} m²</div>
                      </div>
                    )}
                  </div>
                )}

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
                  className="flex-1 min-w-[180px] hover:cursor-pointer uppercase"
                  onClick={solicitarOps}
                  disabled={busy || !preReadyForRequestOps || selected?.estado === "PENDIENTE_AUTORIZACION"}
                >
                  <span className="material-symbols-outlined text-sm ">send</span>
                  {selected?.estado === "PENDIENTE_AUTORIZACION" ? "Escalado a Ops" : "Solicitar Autorización"}
                </Button>
                {isOps && (
                  <Button
                    className="flex-1 min-w-[180px]"
                    onClick={() => {
                      setAuthData({
                        inspectorId: selected.inspectorId || "",
                        numeroSiniestro: selected.numeroSiniestro || "",
                        companiaSeguro: selected.companiaSeguro || "",
                      });
                      setOpenAuth(true);
                    }}
                    disabled={busy || !opsReadyToAuthorize || selected?.estado !== "PENDIENTE_AUTORIZACION"}
                  >
                    <span className="material-symbols-outlined text-sm">bolt</span>
                    Autorizar Siniestro
                  </Button>
                )}
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
                {isOps && (
                  <Button variant="ghost" onClick={() => setOpenReject(true)} className="text-error hover:bg-error/10">
                    <span className="material-symbols-outlined text-sm">cancel</span>
                    Rechazar Caso
                  </Button>
                )}
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
                      key={fileInputKey}
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
                      <div className="flex items-center gap-2">
                        {canEditDocs(selected) && (
                          <button
                            onClick={() => setEditDocModal({ open: true, doc: d, newFile: null, newTitulo: d.titulo || "" })}
                            title="Reemplazar documento"
                            className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-amber-500/10 hover:text-amber-600"
                          >
                            <span className="material-symbols-outlined text-xl">swap_horiz</span>
                          </button>
                        )}
                        <a
                          href={fileUrl(d.urlArchivo)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex h-9 w-9 items-center justify-center rounded-full text-on-surface-variant transition hover:bg-primary/10 hover:text-primary"
                        >
                          <span className="material-symbols-outlined">visibility</span>
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Section>
          </div>
        )}
      </Drawer>

      {/* MODAL: Reemplazar Documento */}
      <Modal
        open={editDocModal.open}
        title="Reemplazar Documento"
        onClose={() => setEditDocModal({ open: false, doc: null, newFile: null, newTitulo: "", successMsg: null, errorMsg: null })}
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditDocModal({ open: false, doc: null, newFile: null, newTitulo: "", successMsg: null, errorMsg: null })} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={reemplazarDocPre} disabled={busy || !editDocModal.newFile}>
              <span className="material-symbols-outlined text-sm">swap_horiz</span>
              {busy ? "Subiendo..." : "Confirmar Reemplazo"}
            </Button>
          </>
        }
      >
        <div className="grid gap-5">
          {/* Documento actual */}
          <div className="rounded-2xl border border-outline-variant/20 bg-surface-container-low p-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50">Documento Actual</span>
            <div className="mt-2 flex items-center gap-3">
              <span className="material-symbols-outlined text-2xl text-primary/60">description</span>
              <div>
                <div className="text-sm font-black text-on-surface">
                  {TipoDocumentoLabel[editDocModal.doc?.tipo] || editDocModal.doc?.tipo}
                </div>
                <div className="text-[11px] font-bold text-on-surface-variant/60">
                  {editDocModal.doc?.titulo || "Sin nombre"}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-on-surface-variant/40">
            <div className="flex-1 border-t border-outline-variant/20"></div>
            <span className="material-symbols-outlined text-lg">arrow_downward</span>
            <div className="flex-1 border-t border-outline-variant/20"></div>
          </div>

          {/* Nuevo título (opcional) */}
          <Input
            label="Nuevo Título Descriptivo (opcional)"
            value={editDocModal.newTitulo}
            onChange={(v) => setEditDocModal((p) => ({ ...p, newTitulo: v }))}
            placeholder="Ej: Inspección v2, Mandato corregido..."
          />

          {/* Selector de nuevo archivo */}
          <div className="flex flex-col gap-2">
            <span className="ml-1 text-[11px] font-black uppercase tracking-wider text-on-surface-variant/70">
              Nuevo Archivo <span className="text-error">*</span>
            </span>
            <label className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 transition cursor-pointer
              ${editDocModal.newFile
                ? "border-amber-500/60 bg-amber-500/5"
                : "border-outline-variant/30 bg-surface-container-lowest hover:border-amber-500/40 hover:bg-amber-500/5"
              }`}>
              <input
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  // Capturar referencia al archivo INMEDIATAMENTE, fuera del setState callback
                  const file = e.target.files?.[0] ?? null;
                  setEditDocModal((p) => ({ ...p, newFile: file, errorMsg: null }));
                  // Limpiar el input para permitir re-seleccionar el mismo archivo
                  e.target.value = "";
                }}
              />
              <span className={`material-symbols-outlined text-4xl mb-2 ${editDocModal.newFile ? "text-amber-500" : "text-amber-500/40"}`}>
                upload_file
              </span>
              <p className={`text-sm font-bold text-center break-all px-2 ${editDocModal.newFile ? "text-on-surface" : "text-on-surface-variant/60"}`}>
                {editDocModal.newFile ? editDocModal.newFile.name : "Haz clic para seleccionar el nuevo archivo"}
              </p>
              {editDocModal.newFile && (
                <p className="text-[10px] font-bold text-amber-600 mt-1">
                  {(editDocModal.newFile.size / 1024).toFixed(1)} KB — listo para subir
                </p>
              )}
              {!editDocModal.newFile && (
                <p className="text-xs font-medium text-on-surface-variant/40 mt-1">PDF o Imagen (Máx 20MB)</p>
              )}
            </label>
          </div>

          {/* Feedback de error */}
          {editDocModal.errorMsg && (
            <div className="rounded-xl border border-error/30 bg-error/5 p-3 text-[12px] font-bold text-error flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">error</span>
              {editDocModal.errorMsg}
            </div>
          )}

          {/* Feedback de éxito */}
          {editDocModal.successMsg && (
            <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-3 text-[12px] font-bold text-tertiary flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">check_circle</span>
              {editDocModal.successMsg}
            </div>
          )}

          {/* Aviso auditoría */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] font-bold text-amber-700">
            ⚠️ El archivo anterior será eliminado y reemplazado. Quedará registro del cambio en la bitácora del caso.
          </div>
        </div>
      </Modal>
    </div >
  );
}
