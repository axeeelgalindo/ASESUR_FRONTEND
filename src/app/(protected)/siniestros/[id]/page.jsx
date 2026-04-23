"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import api, { apiGet, apiPost, apiPostForm, apiPatch, apiPutForm, apiDel, fileUrl } from "@/lib/api";

import { Pill } from "@/components/ui/Pill";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Section } from "@/components/ui/Section";
import { Modal } from "@/components/ui/Modal";
import { Tabs } from "@/components/ui/Tabs";

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
    ENVIO_INFORMACION_LIQUIDADOR: "Envío antecedentes liquidador (respaldo)",
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

const ParteCasaLabel = {
    FACHADA: "Fachada",
    LIVING_COMEDOR: "Living / Comedor",
    COCINA: "Cocina",
    DORMITORIO_PRINCIPAL: "Dormitorio Principal",
    DORMITORIO_SECUNDARIO: "Dormitorio Secundario",
    BANO: "Baño",
    PASILLO: "Pasillo",
    ESCALERA: "Escalera",
    TECHUMBRE: "Techumbre",
    TECHO: "Techo",
    PATIO: "Patio",
    GARAGE: "Garage",
    LOGGIA: "Loggia",
    OTRO: "Otro",
};

function cls(...s) {
    return s.filter(Boolean).join(" ");
}

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

export default function SiniestroDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { data: session } = useSession();
    const userRole = session?.user?.rol || null;
    const userId = session?.user?.id || session?.user?.sub || null;

    // Puede reemplazar documentos: ASESOR asignado, OPERACIONES, SUPERADMIN, GERENTE, MASTER
    const canEditDocs = (caso) => {
        if (["OPERACIONES", "SUPERADMIN", "GERENTE", "MASTER"].includes(userRole)) return true;
        if (userRole === "ASESOR" && caso?.asesorId === userId) return true;
        return false;
    };

    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    const [tab, setTab] = useState("antecedentes");

    // All forms
    const [docForm, setDocForm] = useState({ tipo: "OTRO", titulo: "", file: null });
    const [bitForm, setBitForm] = useState({ titulo: "", detalle: "" });
    const [newGestion, setNewGestion] = useState({ titulo: "", observaciones: "" });
    const [completeModal, setCompleteModal] = useState({
        open: false,
        gestion: null,
        tipoDoc: "",
        tituloDoc: "",
        fechaRecepcion: "",
        observaciones: "",
        file: null,
    });
    const [factForm, setFactForm] = useState({
        estadoFacturacion: "PENDIENTE",
        montoIndemnizacion: "",
        notasFacturacion: "",
    });
    const [nuevoPago, setNuevoPago] = useState({
        porcentajeCobro: "",
        montoHonorarios: "",
        estadoFacturacion: "PENDIENTE",
        fechaPago: "",
        fechaEnvioBoleta: "",
        notas: "",
        file: null,
    });
    const [editPago, setEditPago] = useState({}); // { id: { ...data } }
    const [confirmPago, setConfirmPago] = useState({}); // { id: { fechaPago: string } | null }
    const [emailForm, setEmailForm] = useState({ destinatarios: "", cc: "", asunto: "", mensaje: "" });
    const [openEmail, setOpenEmail] = useState(false);
    const [openWordModal, setOpenWordModal] = useState(false);
    const [openBudgetModal, setOpenBudgetModal] = useState(false);
    const [selectedFotosWord, setSelectedFotosWord] = useState([]);
    const [expandedGestion, setExpandedGestion] = useState(null);
    const [pagoErr, setPagoErr] = useState(null);
    const [pagoSuccess, setPagoSuccess] = useState(null);

    // ✅ Reemplazar documento existente
    const [editDocModal, setEditDocModal] = useState({
        open: false,
        doc: null,
        newFile: null,
        newTitulo: "",
        successMsg: null,
        errorMsg: null,
    });

    // ✅ Modo edición de datos generales
    const canEditInfo = ["OPERACIONES", "SUPERADMIN", "GERENTE", "MASTER", "ASESOR"].includes(userRole);
    const [infoEdit, setInfoEdit] = useState(false);
    const [infoSaved, setInfoSaved] = useState(null); // mensaje de éxito
    const [infoErr, setInfoErr] = useState(null);
    const [infoForm, setInfoForm] = useState({
        nombreCliente: "", rutCliente: "",
        direccion: "", comuna: "", ciudad: "",
        companiaSeguro: "", numeroSiniestro: "",
        nombreLiquidador: "", emailLiquidador: "", telefonoLiquidador: "",
        nombreAnalista: "", estado: "",
    });

    useEffect(() => {
        loadCaso();
    }, [id]);

    useEffect(() => {
        if (error) {
            const t = setTimeout(() => setError(null), 6000);
            return () => clearTimeout(t);
        }
    }, [error]);

    useEffect(() => {
        if (pagoErr || pagoSuccess) {
            const t = setTimeout(() => {
                setPagoErr(null);
                setPagoSuccess(null);
            }, 6000);
            return () => clearTimeout(t);
        }
    }, [pagoErr, pagoSuccess]);

    const loadCaso = async () => {
        try {
            setLoading(true);
            const full = await apiGet(`/siniestros/${id}`);
            setSelected(full);
            hydrateFactForm(full);
        } catch (e) {
            setError("Error cargando expediente.");
        } finally {
            setLoading(false);
        }
    };

    // Alias usado en todos los handlers de mutación
    const reloadSelected = loadCaso;

    const toDateInput = (d) => {
        if (!d) return "";
        const x = new Date(d);
        const yyyy = x.getFullYear();
        const mm = String(x.getMonth() + 1).padStart(2, "0");
        const dd = String(x.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
    };

    const hydrateFactForm = (full) => {
        setFactForm({
            estadoFacturacion: full.estadoFacturacion || "PENDIENTE",
            montoIndemnizacion: full.montoIndemnizacion == null ? "" : String(full.montoIndemnizacion),
            notasFacturacion: full.notasFacturacion || "",
        });
        // ✅ Sincronizar formulario de datos generales
        setInfoForm({
            nombreCliente: full.nombreCliente || "",
            rutCliente: full.rutCliente || "",
            direccion: full.direccion || "",
            comuna: full.comuna || "",
            ciudad: full.ciudad || "",
            companiaSeguro: full.companiaSeguro || "",
            numeroSiniestro: full.numeroSiniestro || "",
            nombreLiquidador: full.nombreLiquidador || "",
            emailLiquidador: full.emailLiquidador || "",
            telefonoLiquidador: full.telefonoLiquidador || "",
            nombreAnalista: full.nombreAnalista || "",
            estado: full.estado || "",
        });
    };

    // Actions
    const toggleFotoWord = (fid) => {
        setSelectedFotosWord((p) => (p.includes(fid) ? p.filter((x) => x !== fid) : [...p, fid]));
    };

    // ─── Gestiones: edición inline ────────────────────────────────────
    // editGestion: { [id]: { titulo, observaciones, fechaProgramada, file } | null }
    const [editGestion, setEditGestion] = useState({});
    const openEditGestion = (g) =>
        setEditGestion((p) => ({ ...p, [g.id]: { titulo: g.titulo || "", observaciones: g.observaciones || "", fechaProgramada: g.fechaProgramada ? g.fechaProgramada.slice(0, 10) : "", file: null } }));
    const closeEditGestion = (gid) => setEditGestion((p) => { const n = { ...p }; delete n[gid]; return n; });

    const saveGestion = async (gid) => {
        const form = editGestion[gid];
        if (!form) return;
        setBusy(true);
        try {
            if (form.file) {
                const fd = new FormData();
                fd.append("titulo", form.titulo);
                fd.append("observaciones", form.observaciones);
                if (form.fechaProgramada) fd.append("fechaProgramada", form.fechaProgramada);
                fd.append("archivo", form.file);
                await apiPatchForm(`/siniestros/${id}/gestiones/${gid}`, fd);
            } else {
                await apiPatch(`/siniestros/${id}/gestiones/${gid}`, {
                    titulo: form.titulo,
                    observaciones: form.observaciones,
                    fechaProgramada: form.fechaProgramada || null,
                });
            }
            await reloadSelected();
            closeEditGestion(gid);
        } catch { setError("Error actualizando gestión."); }
        finally { setBusy(false); }
    };

    // ─── Fotos: edición inline ────────────────────────────────────────
    // editFoto: { [id]: { titulo, parteCasa, file } | null }
    const [editFoto, setEditFoto] = useState({});
    const openEditFoto = (f) =>
        setEditFoto((p) => ({ ...p, [f.id]: { titulo: f.titulo || "", parteCasa: f.parteCasa || "OTRO", file: null } }));
    const closeEditFoto = (fid) => setEditFoto((p) => { const n = { ...p }; delete n[fid]; return n; });

    const saveFotoEdit = async (fid) => {
        const form = editFoto[fid];
        if (!form) return;
        setBusy(true);
        try {
            if (form.file) {
                const fd = new FormData();
                fd.append("titulo", form.titulo);
                fd.append("parteCasa", form.parteCasa);
                fd.append("archivo", form.file);
                await apiPatchForm(`/siniestros/${id}/fotos/${fid}`, fd);
            } else {
                await apiPatch(`/siniestros/${id}/fotos/${fid}`, {
                    titulo: form.titulo,
                    parteCasa: form.parteCasa,
                });
            }
            await reloadSelected();
            closeEditFoto(fid);
        } catch { setError("Error actualizando foto."); }
        finally { setBusy(false); }
    };

    const deleteFoto = async (fid) => {
        if (!window.confirm("¿Eliminar esta foto? Esta acción no se puede deshacer.")) return;
        setBusy(true);
        try {
            await apiDel(`/siniestros/${id}/fotos/${fid}`);
            await reloadSelected();
        } catch { setError("Error eliminando foto."); }
        finally { setBusy(false); }
    };

    // ─── Bitácora: edición inline ─────────────────────────────────────
    // editEvento: { [id]: { titulo, detalle } | null }
    const [editEvento, setEditEvento] = useState({});
    const openEditEvento = (ev) =>
        setEditEvento((p) => ({ ...p, [ev.id]: { titulo: ev.titulo || "", detalle: ev.detalle || "" } }));
    const closeEditEvento = (eid) => setEditEvento((p) => { const n = { ...p }; delete n[eid]; return n; });

    const saveEditEvento = async (eid) => {
        const form = editEvento[eid];
        if (!form) return;
        setBusy(true);
        try {
            await apiPatch(`/siniestros/${id}/bitacora/${eid}`, form);
            await reloadSelected();
            closeEditEvento(eid);
        } catch { setError("Error actualizando evento."); }
        finally { setBusy(false); }
    };


    // ✅ Guardar datos generales del siniestro
    const saveInfoForm = async () => {
        setInfoErr(null);
        setInfoSaved(null);
        setBusy(true);
        try {
            await apiPatch(`/siniestros/${id}/info`, infoForm);
            await reloadSelected();
            setInfoSaved("✅ Datos guardados correctamente.");
            setTimeout(() => { setInfoSaved(null); setInfoEdit(false); }, 1800);
        } catch (e) {
            setInfoErr(e?.response?.data?.error || e?.message || "Error guardando datos.");
        } finally {
            setBusy(false);
        }
    };

    const openGenerarWord = () => {
        setSelectedFotosWord(selected?.fotos?.map((f) => f.id) || []);
        setOpenWordModal(true);
    };

    const exportExcelCase = async () => {
        try {
            setBusy(true);
            setError(null);
            const res = await api.get(`/casos/exportar/excel?id=${id}`, {
                responseType: 'blob'
            });
            
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Siniestro_${selected.folio}_${new Date().toISOString().split('T')[0]}.xlsx`);
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

    const downloadWordSiniestro = async () => {
        if (selectedFotosWord.length === 0) {
            setError("Por favor, selecciona al menos una foto para incluir en el documento.");
            return;
        }
        try {
            setBusy(true);
            const data = await apiPost(`/casos/${id}/generar-documento-siniestro`, { fotosSeleccionadas: selectedFotosWord }, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `Siniestro_${selected.folio}.docx`;
            a.click();
        } catch (e) {
            setError("Error al generar Word.");
        } finally {
            setBusy(false);
            setOpenWordModal(false);
        }
    };

    const downloadBudgetDoc = async () => {
        try {
            setBusy(true);
            const data = await apiPost(`/casos/${id}/generar-documento-presupuesto`, { fotosSeleccionadas: selectedFotosWord }, { responseType: "blob" });
            const url = window.URL.createObjectURL(new Blob([data]));
            const a = document.createElement("a");
            a.href = url;
            a.download = `Presupuesto_${selected.folio}.docx`;
            a.click();
        } catch (e) {
            setError("Error al generar presupuesto.");
        } finally {
            setBusy(false);
            setOpenBudgetModal(false);
        }
    };

    const sendBudgetEmail = async () => {
        const dests = emailForm.destinatarios.split(",").map((d) => d.trim()).filter(Boolean);
        if (!dests.length || !emailForm.asunto) {
            setError("Debes ingresar al menos un destinatario y un asunto.");
            return;
        }
        try {
            setBusy(true);
            await apiPost(`/casos/${id}/enviar-presupuesto`, {
                fotosSeleccionadas: selectedFotosWord,
                destinatarios: dests,
                cc: emailForm.cc?.split(",").map((c) => c.trim()).filter(Boolean) || [],
                asunto: emailForm.asunto,
                mensaje: emailForm.mensaje,
            });
            setOpenBudgetModal(false);
            setInfoSaved("Email con presupuesto enviado exitosamente.");
        } catch (e) {
            setError("Error enviando mail.");
        } finally {
            setBusy(false);
        }
    };

    const sendEmailManual = async () => {
        if (!emailForm.destinatarios || !emailForm.asunto) {
            setError("Debes ingresar el destinatario y el asunto.");
            return;
        }
        try {
            setBusy(true);
            await apiPost(`/casos/${id}/enviar-correo`, {
                destinatarios: emailForm.destinatarios,
                asunto: emailForm.asunto,
                mensaje: emailForm.mensaje,
            });
            setOpenEmail(false);
            setInfoSaved("Email enviado exitosamente.");
        } catch (e) {
            setError("Error enviando correo.");
        } finally {
            setBusy(false);
        }
    };

    const addDocumento = async () => {
        if (!docForm.file) {
            setError("Por favor, selecciona un archivo.");
            return;
        }
        try {
            setBusy(true);
            const fd = new FormData();
            fd.append("tipo", docForm.tipo);
            fd.append("titulo", docForm.titulo);
            fd.append("file", docForm.file);
            await apiPostForm(`/siniestros/${id}/documentos`, fd);
            setDocForm({ tipo: "OTRO", titulo: "", file: null });
            await reloadSelected();
        } catch (e) {
            setError("Error subiendo documento.");
        } finally {
            setBusy(false);
        }
    };

    const reemplazarDocSin = async () => {
        if (!editDocModal.doc || !editDocModal.newFile) return;
        setEditDocModal((p) => ({ ...p, errorMsg: null, successMsg: null }));
        setBusy(true);
        try {
            const fd = new FormData();
            fd.append("file", editDocModal.newFile);
            if (editDocModal.newTitulo.trim()) fd.append("titulo", editDocModal.newTitulo.trim());
            await apiPutForm(`/siniestros/${id}/documentos/${editDocModal.doc.id}`, fd);
            await reloadSelected();
            setEditDocModal((p) => ({ ...p, successMsg: "✅ Documento reemplazado correctamente.", newFile: null }));
            setTimeout(() => setEditDocModal({ open: false, doc: null, newFile: null, newTitulo: "", successMsg: null, errorMsg: null }), 1500);
        } catch (e) {
            setEditDocModal((p) => ({ ...p, errorMsg: e?.response?.data?.error || e?.message || "Error reemplazando documento." }));
        } finally {
            setBusy(false);
        }
    };

    const addEvento = async () => {
        if (!bitForm.titulo) return;
        try {
            setBusy(true);
            await apiPost(`/siniestros/${id}/bitacora`, { titulo: bitForm.titulo, detalle: bitForm.detalle });
            setBitForm({ titulo: "", detalle: "" });
            await reloadSelected();
        } catch (e) {
            setError("Error en bitácora.");
        } finally {
            setBusy(false);
        }
    };

    const completarEvento = async (evId) => {
        try {
            setBusy(true);
            await apiPost(`/siniestros/${id}/bitacora/${evId}/completar`, {});
            await reloadSelected();
        } catch (e) {
            setError("Error.");
        } finally {
            setBusy(false);
        }
    };

    const crearGestionPers = async () => {
        if (!newGestion.titulo) return;
        try {
            setBusy(true);
            await apiPost(`/siniestros/${id}/gestiones/personalizada`, { titulo: newGestion.titulo, observaciones: newGestion.observaciones });
            setNewGestion({ titulo: "", observaciones: "" });
            await reloadSelected();
        } catch (e) {
            setError("Error.");
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
        try {
            setBusy(true);
            const fd = new FormData();
            fd.append("tipoDoc", completeModal.tipoDoc);
            fd.append("tituloDoc", completeModal.tituloDoc);
            fd.append("observaciones", completeModal.observaciones);
            if (completeModal.fechaRecepcion) fd.append("fechaRecepcion", completeModal.fechaRecepcion);
            if (completeModal.file) fd.append("file", completeModal.file);

            await apiPostForm(`/siniestros/${id}/gestiones/${completeModal.gestion.id}/completar`, fd);
            setCompleteModal({ open: false, gestion: null, file: null });
            await reloadSelected();
        } catch (e) {
            setError(e?.response?.data?.error || "Error completando gestión.");
        } finally {
            setBusy(false);
        }
    };

    const impugnar = async () => {
        try {
            setBusy(true);
            await apiPost(`/siniestros/${id}/impugnar`, { observaciones: "Impugnación iniciada." });
            await reloadSelected();
        } catch (e) {
            setError("Error.");
        } finally {
            setBusy(false);
        }
    };

    const saveFacturacion = async () => {
        try {
            setBusy(true);
            await apiPatch(`/siniestros/${id}/facturacion`, {
                ...factForm,
                montoIndemnizacion: factForm.montoIndemnizacion === "" ? null : Number(factForm.montoIndemnizacion),
            });
            await reloadSelected();
            setInfoSaved("Información general de facturación guardada correctamente.");
        } catch (e) {
            setError(e?.response?.data?.error || "Error guardando facturación.");
        } finally {
            setBusy(false);
        }
    };

    const addPagoCaso = async () => {
        setPagoErr(null);
        setPagoSuccess(null);

        if (!nuevoPago.porcentajeCobro || !nuevoPago.montoHonorarios) {
            setPagoErr("Debes ingresar el porcentaje y el monto del cobro.");
            return;
        }

        const pIntento = Number(nuevoPago.porcentajeCobro);
        if (pIntento < 0) {
            setPagoErr("El porcentaje no puede ser negativo.");
            return;
        }

        const currentTotal = selected?.pagos?.reduce((acc, p) => acc + (p.porcentajeCobro || 0), 0) || 0;
        if (currentTotal + pIntento > 100.01) {
            setPagoErr(`Error: No puedes exceder el 100% del cobro. Total actual: ${currentTotal}%, Intento: ${pIntento}%`);
            return;
        }
        try {
            setBusy(true);
            const fd = new FormData();
            fd.append("porcentajeCobro", nuevoPago.porcentajeCobro);
            fd.append("montoHonorarios", nuevoPago.montoHonorarios);
            fd.append("estadoFacturacion", nuevoPago.estadoFacturacion);
            if (nuevoPago.fechaPago) fd.append("fechaPago", nuevoPago.fechaPago);
            if (nuevoPago.fechaEnvioBoleta) fd.append("fechaEnvioBoleta", nuevoPago.fechaEnvioBoleta);
            if (nuevoPago.notas) fd.append("notas", nuevoPago.notas);
            if (nuevoPago.file) fd.append("file", nuevoPago.file);

            await apiPostForm(`/siniestros/${id}/pagos`, fd);
            
            // ✅ Limpiar el formulario inmediatamente tras el éxito del POST
            setNuevoPago({
                porcentajeCobro: "",
                montoHonorarios: "",
                estadoFacturacion: "PENDIENTE",
                fechaPago: "",
                fechaEnvioBoleta: "",
                notas: "",
                file: null,
            });

            // ✅ Recargar la vista (si falla aquí, el registro ya existe en el servidor)
            try {
                await reloadSelected();
                setPagoSuccess("¡Tramo de cobro registrado correctamente!");
            } catch (err) {
                console.error("Error recargando vista:", err);
                setError("Pago registrado, pero hubo un error al refrescar la lista. Por favor recarga (F5).");
            }
        } catch (e) {
            // ✅ Mostrar error detallado del backend si está disponible
            const detail = e.response?.data?.error || e.message || "Error desconocido";
            setPagoErr(`Error registrando el pago: ${detail}`);
        } finally {
            setBusy(false);
        }
    };

    const removePagoCaso = async (pagoId) => {
        if (!confirm("¿Eliminar este registro de pago?")) return;
        try {
            setBusy(true);
            await apiDelete(`/siniestros/${id}/pagos/${pagoId}`);
            await reloadSelected();
        } catch (e) {
            setError("Error eliminando pago.");
        } finally {
            setBusy(false);
        }
    };

    const updatePagoStatus = async (pagoId, newStatus, customData = {}) => {
        try {
            setBusy(true);
            const data = { estadoFacturacion: newStatus, ...customData };
            if (newStatus === "PAGADO" && !data.fechaPago) {
                data.fechaPago = new Date().toISOString().slice(0, 10);
            }
            await apiPatch(`/siniestros/${id}/pagos/${pagoId}`, data);
            await reloadSelected();
        } catch (e) {
            const detail = e.response?.data?.error || e.message || "Error desconocido";
            setError(`Error actualizando estado del pago: ${detail}`);
        } finally {
            setBusy(false);
        }
    };

    const saveEdicionPago = async (pagoId) => {
        try {
            setBusy(true);
            const data = editPago[pagoId];
            
            // Validar límites si el porcentaje cambió
            if (data.porcentajeCobro !== undefined) {
                const nuevoP = Number(data.porcentajeCobro);
                if (nuevoP < 0) {
                    setError("El porcentaje no puede ser negativo.");
                    return;
                }
                
                const otrosTotal = selected?.pagos?.filter(p => p.id !== pagoId)
                                            .reduce((acc, p) => acc + (p.porcentajeCobro || 0), 0) || 0;
                
                if (otrosTotal + nuevoP > 100.01) {
                    setError(`No se puede actualizar: La suma total excedería el 100% (Quedaría en ${otrosTotal + nuevoP}%).`);
                    return;
                }
            }

            const fd = new FormData();
            Object.keys(data).forEach(key => {
                if (data[key] !== undefined && data[key] !== null) {
                    fd.append(key, data[key]);
                }
            });

            await apiPatchForm(`/siniestros/${id}/pagos/${pagoId}`, fd);
            setEditPago(p => {
                const copy = { ...p };
                delete copy[pagoId];
                return copy;
            });
            await reloadSelected();
        } catch (e) {
            const detail = e.response?.data?.error || e.message || "Error desconocido";
            setError(`Error guardando cambios del pago: ${detail}`);
        } finally {
            setBusy(false);
        }
    };

    const emitirBoleta = async (pagoId, referenciaBoleta = "") => {
        if (!confirm("¿Confirmas la emisión de la boleta para este tramo de pago?")) return;
        try {
            setBusy(true);
            await apiPatch(`/siniestros/${id}/pagos/${pagoId}/boleta`, { referenciaBoleta });
            await reloadSelected();
        } catch (e) {
            const detail = e.response?.data?.error || e.message || "Error desconocido";
            setError(`Error emitiendo boleta: ${detail}`);
        } finally {
            setBusy(false);
        }
    };

    const marcarPagado = async () => {
        setFactForm((p) => ({ ...p, estadoFacturacion: "PAGADO" }));
        setTimeout(saveFacturacion, 100);
    };

    const marcarEnviado = async () => {
        setFactForm((p) => ({ ...p, estadoFacturacion: "ENVIADO_CLIENTE", fechaEnvioCliente: new Date().toISOString().slice(0, 10) }));
        setTimeout(saveFacturacion, 100);
    };

    const uploadFactDoc = async (tipo) => {
        if (!docForm.file) {
            setError("Por favor, selecciona el archivo de respaldo.");
            return;
        }
        try {
            setBusy(true);
            const fd = new FormData();
            fd.append("tipo", tipo);
            fd.append("titulo", docForm.titulo || TipoDocumentoLabel[tipo]);
            fd.append("file", docForm.file);
            await apiPostForm(`/siniestros/${id}/documentos`, fd);
            setDocForm({ tipo: "OTRO", titulo: "", file: null });
            await reloadSelected();
        } catch (e) {
            setError("Error subiendo comprobante.");
        } finally {
            setBusy(false);
        }
    };

    const isCerradoSelected = selected?.etapa === "CERRADO" || selected?.estado === "CERRADO";

    if (loading)
        return (
            <div className="flex h-screen items-center justify-center bg-surface">
                <div className="flex flex-col items-center gap-4">
                    <span className="material-symbols-outlined text-6xl animate-pulse text-primary">cloud_sync</span>
                    <p className="font-black uppercase tracking-widest text-on-surface-variant/40 animate-pulse">Cargando Expediente...</p>
                </div>
            </div>
        );

    if (!selected) return null;

    return (
        <div className="min-h-screen bg-surface px-4 pb-20 pt-6 text-on-surface transition-colors duration-500 md:px-8 relative">
            {/* Global Error Toast */}
            {error && (
                <div className="fixed top-6 right-6 z-[200] animate-in slide-in-from-right fade-in duration-300">
                    <div className="flex items-center gap-3 rounded-[20px] border border-error/20 bg-surface p-4 shadow-2xl relative pr-12 min-w-[320px] max-w-[400px]">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-error/10 text-error">
                            <span className="material-symbols-outlined text-2xl">error</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-black text-on-surface">Error</span>
                            <span className="text-xs font-bold text-on-surface-variant max-w-[280px] break-words">{error}</span>
                        </div>
                        <button onClick={() => setError(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant/40 hover:bg-surface-container hover:text-on-surface transition">
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Header / Breadcrumb */}
            <div className="mb-6 flex items-center justify-between">
                <button onClick={() => router.push("/siniestros")} className="group flex items-center gap-2 text-on-surface-variant hover:text-primary transition-colors">
                    <span className="material-symbols-outlined transition-transform group-hover:-translate-x-1">arrow_back</span>
                    <span className="text-sm font-black uppercase tracking-tighter">Volver al Panel</span>
                </button>

                <Pill tone={isCerradoSelected ? "gray" : "green"}>
                    {isCerradoSelected ? "Finalizado" : "En Liquidación"}
                </Pill>
            </div>

            <div className="flex flex-col gap-6">
                {/* Banner de Estado */}
                <div className={cls(
                    "flex items-center gap-5 rounded-[2rem] border p-6 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 duration-700 shadow-sm",
                    isCerradoSelected ? "border-primary/20 bg-primary/5 shadow-primary/5" : "border-outline-variant/10 bg-surface-container-low/40 shadow-surface-container-highest/20"
                )}>
                    <div className={cls(
                        "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-transform duration-500 shadow-sm",
                        isCerradoSelected ? "bg-primary text-on-primary" : "bg-surface-container-highest text-primary"
                    )}>
                        <span className="material-symbols-outlined text-3xl">
                            {isCerradoSelected ? "verified_user" : "pending_actions"}
                        </span>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black tracking-tighter text-on-surface">
                                SIN-{String(selected.folio).padStart(6, "0")}
                            </h1>
                            <Pill tone="purple">{TipoCasoLabel[selected.tipo]}</Pill>
                        </div>
                        <p className="text-sm font-bold text-on-surface-variant/70">
                            {isCerradoSelected
                                ? `Expediente cerrado el ${fmtDate(selected.actualizadoEn)}`
                                : "Gestionando hitos de liquidación y seguimiento."}
                        </p>
                    </div>
                </div>

                {/* Sección de Información & Tabs */}
                <div className="grid gap-6 lg:grid-cols-12">
                    {/* Bloque Izquierdo: Resumen & Tabs */}
                    <div className="lg:col-span-12 space-y-6">
                        <Section
                            title="Información del Siniestro"
                            desc="Resumen de asegurado y liquidación"
                            right={
                                <div className="flex flex-wrap justify-end gap-3">
                                    {canEditInfo && !infoEdit && (
                                        <Button variant="secondary" onClick={() => setInfoEdit(true)} className="h-9 px-4 text-xs border-primary/20 text-primary hover:bg-primary/5">
                                            <span className="material-symbols-outlined text-base leading-none">edit</span>
                                            Editar Información
                                        </Button>
                                    )}
                                    {infoEdit && (
                                        <>
                                            <Button variant="secondary" onClick={() => { setInfoEdit(false); setInfoErr(null); setInfoSaved(null); hydrateFactForm(selected); }} disabled={busy} className="h-9 px-4 text-xs">
                                                Cancelar
                                            </Button>
                                            <Button onClick={saveInfoForm} disabled={busy} className="h-9 px-4 text-xs">
                                                <span className="material-symbols-outlined text-base leading-none">save</span>
                                                {busy ? "Guardando..." : "Guardar Cambios"}
                                            </Button>
                                        </>
                                    )}
                                    {!infoEdit && (
                                        <>
                                            <Button variant="secondary" onClick={openGenerarWord} className="h-9 px-4 border-outline-variant/30 text-xs shadow-sm">
                                                <span className="material-symbols-outlined text-base leading-none">description</span>
                                                Generar Ficha
                                            </Button>
                                            <Button variant="secondary" onClick={exportExcelCase} disabled={busy} className="h-9 px-4 border-outline-variant/30 text-xs shadow-sm">
                                                <span className="material-symbols-outlined text-base leading-none">download</span>
                                                Exportar Excel
                                            </Button>
                                            <Button
                                                variant="secondary"
                                                onClick={() => {
                                                    setEmailForm({
                                                        destinatarios: selected?.emailLiquidador || "",
                                                        cc: "",
                                                        asunto: `Presupuesto y Evidencia - Folio SIN-${String(selected?.folio).padStart(6, "0")}`,
                                                        mensaje: `Buen día,\n\nSe adjunta el presupuesto y la evidencia fotográfica correspondiente al siniestro SIN-${String(selected?.folio).padStart(6, "0")}.\n\nSaludos.`
                                                    });
                                                    setSelectedFotosWord(selected?.fotos?.map(f => f.id) || []);
                                                    setOpenBudgetModal(true);
                                                }}
                                                disabled={!selected?.documentos?.some(d => d.tipo === "PRESUPUESTO_EXCEL")}
                                                className="h-9 px-4 border-outline-variant/30 text-xs shadow-sm"
                                            >
                                                <span className="material-symbols-outlined text-base leading-none">analytics</span>
                                                Presupuesto
                                            </Button>
                                        </>
                                    )}
                                </div>
                            }
                        >
                            <div className="grid gap-6">
                                {/* Feedback en modo edición */}
                                {infoEdit && infoErr && (
                                    <div className="rounded-xl border border-error/30 bg-error/5 p-3 text-[12px] font-bold text-error flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">error</span>{infoErr}
                                    </div>
                                )}
                                {infoEdit && infoSaved && (
                                    <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-3 text-[12px] font-bold text-tertiary flex items-center gap-2">
                                        <span className="material-symbols-outlined text-lg">check_circle</span>{infoSaved}
                                    </div>
                                )}

                                {/* Asegurado y Ubicación */}
                                {infoEdit ? (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 grid gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Asegurado</span>
                                            <Input label="Nombre Completo" value={infoForm.nombreCliente} onChange={v => setInfoForm(p => ({ ...p, nombreCliente: v }))} />
                                            <Input label="RUT" value={infoForm.rutCliente} onChange={v => setInfoForm(p => ({ ...p, rutCliente: v }))} />
                                        </div>
                                        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 grid gap-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Ubicación</span>
                                            <Input label="Dirección" value={infoForm.direccion} onChange={v => setInfoForm(p => ({ ...p, direccion: v }))} />
                                            <div className="grid grid-cols-2 gap-3">
                                                <Input label="Comuna" value={infoForm.comuna} onChange={v => setInfoForm(p => ({ ...p, comuna: v }))} />
                                                <Input label="Ciudad" value={infoForm.ciudad} onChange={v => setInfoForm(p => ({ ...p, ciudad: v }))} />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="flex flex-col gap-1.5 rounded-2xl bg-surface-container-lowest/50 p-5 border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container-lowest">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Asegurado</span>
                                            <div className="space-y-0.5">
                                                <p className="text-xl font-black text-on-surface">{selected.nombreCliente}</p>
                                                <p className="text-xs font-bold text-on-surface-variant/60">{selected.rutCliente}</p>
                                                <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-wider">
                                                    <span className="material-symbols-outlined text-[14px]">{selected.esCasoAsesur ? "business" : "person"}</span>
                                                    {selected.esCasoAsesur ? "Origen: Asesur" : "Origen: Propio"}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1.5 rounded-2xl bg-surface-container-lowest/50 p-5 border border-outline-variant/10 shadow-sm transition-all hover:bg-surface-container-lowest">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Ubicación</span>
                                            <div className="space-y-0.5">
                                                <p className="text-base font-black text-on-surface leading-tight">{selected.direccion}</p>
                                                <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-wider">{selected.comuna}, {selected.ciudad}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Compañía / N° Siniestro / Liquidador / Estado */}
                                {infoEdit ? (
                                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        <span className="sm:col-span-2 text-[10px] font-black uppercase tracking-widest text-primary/60">Datos del Seguro y Liquidación</span>
                                        <Input label="Compañía Seguro" value={infoForm.companiaSeguro} onChange={v => setInfoForm(p => ({ ...p, companiaSeguro: v }))} />
                                        <Input label="N° Siniestro Aseguradora" value={infoForm.numeroSiniestro} onChange={v => setInfoForm(p => ({ ...p, numeroSiniestro: v }))} />
                                        <Input label="Nombre Liquidador" value={infoForm.nombreLiquidador} onChange={v => setInfoForm(p => ({ ...p, nombreLiquidador: v }))} />
                                        <Input label="Email Liquidador" type="email" value={infoForm.emailLiquidador} onChange={v => setInfoForm(p => ({ ...p, emailLiquidador: v }))} />
                                        <Input label="Teléfono Liquidador" value={infoForm.telefonoLiquidador} onChange={v => setInfoForm(p => ({ ...p, telefonoLiquidador: v }))} />
                                        <Input label="Nombre Analista" value={infoForm.nombreAnalista} onChange={v => setInfoForm(p => ({ ...p, nombreAnalista: v }))} />
                                        <div className="sm:col-span-2">
                                            <Select
                                                label="Estado General"
                                                value={infoForm.estado}
                                                onChange={v => setInfoForm(p => ({ ...p, estado: v }))}
                                                options={Object.keys(EstadoSiniestroLabel).map(k => ({ value: k, label: EstadoSiniestroLabel[k] }))}
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-3">Compañía</label>
                                            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface/80 border border-outline-variant/5">{selected.companiaSeguro || "—"}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-3">N° Siniestro</label>
                                            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface/80 border border-outline-variant/5">{selected.numeroSiniestro || "—"}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-3">Liquidador</label>
                                            <div className="rounded-xl bg-surface-container-low px-3 py-2 text-sm font-bold text-on-surface/80 border border-outline-variant/5">{selected.nombreLiquidador || "—"}</div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 ml-3">Estado General</label>
                                            <div className="flex h-9 text-xs items-center rounded-xl bg-primary/5 px-3 font-black text-primary border border-primary/10">
                                                {EstadoSiniestroLabel[selected.estado] || selected.estado}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="mt-2 overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low/30 p-1.5 shadow-inner backdrop-blur-md">
                                    <Tabs
                                        tab={tab}
                                        setTab={setTab}
                                        items={[
                                            { key: "antecedentes", label: "Bitácora (Gestiones)" },
                                            { key: "fotos", label: `Registro Visual (${selected.fotos?.length || 0})` },
                                            { key: "bitacora", label: `Anotaciones (${selected.bitacora?.length || 0})` },
                                            { key: "docs", label: `Expediente Documental (${selected.documentos?.length || 0})` },
                                            { key: "facturacion", label: "Gestión Administrativa" },
                                        ]}
                                    />
                                </div>
                            </div>
                        </Section>


                        {/* Contenido Dinámico de Tabs */}
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                            {tab === "antecedentes" && (
                                <Section
                                    title="Bitácora (Flujo de Gestiones)"
                                    desc="Seguimiento de hitos y ejecución"
                                    right={
                                        <Button variant="secondary" onClick={impugnar} disabled={busy} className="h-10 border-error/20 text-error hover:bg-error/5 text-xs">
                                            <span className="material-symbols-outlined text-lg">warning</span>
                                            Impugnar Informe
                                        </Button>
                                    }
                                >
                                    <div className="overflow-x-auto rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest/50 shadow-sm mb-6">
                                        <table className="w-full text-left text-sm whitespace-nowrap">
                                            <thead className="bg-surface-container-low/50 text-on-surface-variant font-black uppercase tracking-wider text-[10px] border-b border-outline-variant/10">
                                                <tr>
                                                    <th className="px-6 py-4">Gestión / Acción</th>
                                                    <th className="px-6 py-4">Estado</th>
                                                    <th className="px-6 py-4">Programado</th>
                                                    <th className="px-6 py-4">Finalizado</th>
                                                    <th className="px-6 py-4 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-outline-variant/5 text-on-surface/90">
                                                {selected.gestiones?.map((g) => {
                                                    const tone = g.estado === "COMPLETADA" ? "green" : g.estado === "BLOQUEADA" ? "red" : g.estado === "EN_PROGRESO" ? "amber" : "gray";
                                                    const icon = { INSPECCION: "hail", PRESUPUESTO: "request_quote", ENVIO_INFORMACION: "send", APROBADA: "check_circle", FACTURACION: "payments" }[g.tipo] || "assignment";
                                                    const editing = !!editGestion[g.id];
                                                    const ef = editGestion[g.id] || {};
                                                    const isExpanded = expandedGestion === g.id;

                                                    return (
                                                        <React.Fragment key={g.id}>
                                                            <tr 
                                                                className={cls(
                                                                    "transition-colors hover:bg-surface-container-low/40 cursor-pointer group",
                                                                    isExpanded || editing ? "bg-primary/5" : ""
                                                                )}
                                                                onClick={() => {
                                                                    if (editing) return;
                                                                    setExpandedGestion(isExpanded ? null : g.id);
                                                                }}
                                                            >
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={cls(
                                                                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors shadow-inner",
                                                                            g.estado === "COMPLETADA" ? "bg-tertiary/10 text-tertiary" : "bg-surface-container-high text-on-surface-variant/40"
                                                                        )}>
                                                                            <span className="material-symbols-outlined text-lg">{icon}</span>
                                                                        </div>
                                                                        <div className="space-y-0.5 max-w-[300px]">
                                                                            <p className="text-sm font-black tracking-tight text-on-surface truncate">
                                                                                {TipoGestionLabel[g.tipo] || g.tipo}
                                                                            </p>
                                                                            {g.titulo && g.titulo !== TipoGestionLabel[g.tipo] && (
                                                                                <p className="text-[10px] font-bold text-on-surface-variant/60 truncate">{g.titulo}</p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <Pill tone={tone} className="text-[10px]">{EstadoGestionLabel[g.estado]}</Pill>
                                                                </td>
                                                                <td className="px-6 py-4 text-[11px] font-bold font-mono tracking-tight">
                                                                    {fmtDate(g.fechaProgramada) || "—"}
                                                                </td>
                                                                <td className="px-6 py-4 text-[11px] font-bold font-mono tracking-tight">
                                                                    {g.fechaTermino ? fmtDate(g.fechaTermino) : "—"}
                                                                </td>
                                                                <td className="px-6 py-4">
                                                                    <div className="flex items-center justify-center gap-2" onClick={e => e.stopPropagation()}>
                                                                        {!editing && (
                                                                            <button
                                                                                onClick={() => openEditGestion(g)}
                                                                                title="Editar gestión"
                                                                                className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary transition hover:bg-primary/15"
                                                                            >
                                                                                <span className="material-symbols-outlined text-sm">edit</span>
                                                                            </button>
                                                                        )}
                                                                        <Button
                                                                            onClick={() => openCompletarGestion(g)}
                                                                            disabled={busy || g.estado === "COMPLETADA" || g.estado === "BLOQUEADA" || editing}
                                                                            className="h-8 px-3 text-[10px]"
                                                                        >
                                                                            Hacer Gestión
                                                                        </Button>
                                                                        <button onClick={() => {
                                                                            if (editing) return;
                                                                            setExpandedGestion(isExpanded ? null : g.id);
                                                                        }} className="flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant/50 hover:bg-surface-container-high transition">
                                                                            <span className="material-symbols-outlined text-sm transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                                                                                expand_more
                                                                            </span>
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>

                                                            {/* Fila expandida de detalles / edición */}
                                                            {(isExpanded || editing) && (
                                                                <tr className={cls("border-b border-outline-variant/10", isExpanded || editing ? "bg-primary/5" : "")}>
                                                                    <td colSpan={5} className="p-0">
                                                                        <div className="px-8 pb-6 pt-2 animate-in slide-in-from-top-2 fade-in duration-300">
                                                                            {editing ? (
                                                                                <div className="rounded-2xl border border-primary/15 bg-surface p-5 shadow-sm space-y-4 max-w-4xl">
                                                                                    <h5 className="text-xs font-black uppercase tracking-widest text-primary/60 mb-2">Editando Gestión</h5>
                                                                                    <div className="grid grid-cols-2 gap-4">
                                                                                        <Input label="Título / Nota interna" value={ef.titulo} onChange={v => setEditGestion(p => ({ ...p, [g.id]: { ...p[g.id], titulo: v } }))} />
                                                                                        <Input label="Fecha Programada" type="date" value={ef.fechaProgramada} onChange={v => setEditGestion(p => ({ ...p, [g.id]: { ...p[g.id], fechaProgramada: v } }))} />
                                                                                    </div>
                                                                                    <Textarea label="Observaciones" value={ef.observaciones} onChange={v => setEditGestion(p => ({ ...p, [g.id]: { ...p[g.id], observaciones: v } }))} />
                                                                                    
                                                                                    <div className="space-y-1.5">
                                                                                        <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/60">
                                                                                            {g.documentoRelacionado ? "Reemplazar documento" : "Adjuntar documento (opcional)"}
                                                                                        </span>
                                                                                        {g.documentoRelacionado && !ef.file && (
                                                                                            <div className="flex items-center gap-3 rounded-xl border border-primary/10 bg-primary/5 px-4 py-2.5">
                                                                                                <span className="material-symbols-outlined text-primary text-lg">draft</span>
                                                                                                <span className="flex-1 text-xs font-bold text-on-surface/70 truncate">{g.documentoRelacionado.titulo || "Documento actual"}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        <label className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition ${
                                                                                            ef.file ? "border-primary/50 bg-primary/5" : "border-outline-variant/30 hover:border-primary/30 hover:bg-primary/5"
                                                                                        }`}>
                                                                                            <input type="file" accept="application/pdf,.xlsx,.xls,.doc,.docx,image/*" className="hidden" onChange={e => {
                                                                                                const file = e.target.files?.[0] || null;
                                                                                                setEditGestion(p => ({ ...p, [g.id]: { ...p[g.id], file } }));
                                                                                            }} />
                                                                                            {ef.file ? (
                                                                                                <div className="flex items-center gap-2 text-primary text-xs font-black"><span className="material-symbols-outlined text-base">check_circle</span>{ef.file.name}</div>
                                                                                            ) : (
                                                                                                <div className="flex items-center gap-2 text-on-surface-variant/40"><span className="material-symbols-outlined text-xl">upload_file</span><span className="text-[11px] font-black uppercase tracking-wider">{g.documentoRelacionado ? "Clic para reemplazar" : "Clic para agregar"}</span></div>
                                                                                            )}
                                                                                        </label>
                                                                                        {ef.file && (
                                                                                            <button onClick={() => setEditGestion(p => ({ ...p, [g.id]: { ...p[g.id], file: null } }))} className="text-[10px] font-black text-error/60 xl mt-1 transition uppercase tracking-wider hover:text-error">✕ Quitar archivo</button>
                                                                                        )}
                                                                                    </div>

                                                                                    <div className="flex justify-end gap-3 pt-2">
                                                                                        <Button variant="secondary" onClick={() => closeEditGestion(g.id)} disabled={busy} className="h-9 px-4 text-xs">Cancelar</Button>
                                                                                        <Button onClick={() => saveGestion(g.id)} disabled={busy} className="h-9 px-5 text-xs"><span className="material-symbols-outlined text-sm">save</span>{busy ? "Guardando..." : "Guardar"}</Button>
                                                                                    </div>
                                                                                </div>
                                                                            ) : (
                                                                                <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low/30 p-5 shadow-inner max-w-4xl">
                                                                                    <div className="grid gap-4 md:grid-cols-2">
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/40">Iniciado En</span>
                                                                                            <span className="text-xs font-bold text-on-surface">{fmt(g.creadoEn)}</span>
                                                                                        </div>
                                                                                        <div className="flex flex-col gap-1">
                                                                                            <span className="text-[10px] font-black uppercase tracking-wider text-on-surface-variant/40">Observaciones</span>
                                                                                            <span className="text-xs font-bold text-on-surface-variant/80 italic">{g.observaciones || "Sin observaciones registradas."}</span>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-high/10 p-6 backdrop-blur-sm">
                                        <div className="mb-6 flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                <span className="material-symbols-outlined text-xl">add_circle</span>
                                            </div>
                                            <h4 className="text-base font-black tracking-tight text-on-surface uppercase">Nueva Gestión Especial</h4>
                                        </div>
                                        <div className="grid gap-4 lg:grid-cols-12 items-end">
                                            <div className="lg:col-span-4">
                                                <Input label="Título" value={newGestion.titulo} onChange={(v) => setNewGestion((p) => ({ ...p, titulo: v }))} placeholder="Ej: Visita adicional..." />
                                            </div>
                                            <div className="lg:col-span-6">
                                                <Input label="Notas" value={newGestion.observaciones} onChange={(v) => setNewGestion((p) => ({ ...p, observaciones: v }))} placeholder="Detalles de la gestión..." />
                                            </div>
                                            <div className="lg:col-span-2">
                                                <Button onClick={crearGestionPers} disabled={busy || !newGestion.titulo} className="w-full h-[52px]">Programar</Button>
                                            </div>
                                        </div>
                                    </div>
                                </Section>
                            )}

                            {tab === "bitacora" && (
                                <Section title="Bitácora de Eventos" desc="Historial de seguimiento">
                                    <div className="mb-8 rounded-3xl border border-outline-variant/10 bg-surface-container-high/10 p-6">
                                        <h4 className="mb-4 text-xs font-black uppercase tracking-widest text-primary/60">Registrar Evento</h4>
                                        <div className="grid gap-4 lg:grid-cols-2">
                                            <Input label="Título" value={bitForm.titulo} onChange={(v) => setBitForm((p) => ({ ...p, titulo: v }))} />
                                            <div className="flex items-end pb-1.5">
                                                <Button onClick={addEvento} className="w-full h-12">Guardar Nota</Button>
                                            </div>
                                            <div className="lg:col-span-2">
                                                <Textarea label="Detalle" value={bitForm.detalle} onChange={(v) => setBitForm((p) => ({ ...p, detalle: v }))} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="relative border-l-2 border-outline-variant/30 ml-4 pl-8 space-y-8">
                                        {selected.bitacora?.map(ev => {
                                            const editing = !!editEvento[ev.id];
                                            const ef = editEvento[ev.id] || {};
                                            return (
                                                <div key={ev.id} className="relative group">
                                                    <div className={cls("absolute -left-[41px] top-1 h-5 w-5 rounded-full border-4 border-surface shadow-sm transition-colors", ev.completado ? "bg-primary" : "bg-amber-400")}></div>
                                                    <div className={cls("rounded-2xl border p-6 shadow-sm transition-all", editing ? "border-primary/30 bg-primary/5" : "border-outline-variant/10 bg-surface-container-lowest/50")}>
                                                        {editing ? (
                                                            <div className="space-y-3">
                                                                <Input
                                                                    label="Título del evento"
                                                                    value={ef.titulo}
                                                                    onChange={v => setEditEvento(p => ({ ...p, [ev.id]: { ...p[ev.id], titulo: v } }))}
                                                                />
                                                                <Textarea
                                                                    label="Detalle"
                                                                    value={ef.detalle}
                                                                    onChange={v => setEditEvento(p => ({ ...p, [ev.id]: { ...p[ev.id], detalle: v } }))}
                                                                />
                                                                <div className="flex justify-end gap-3 pt-1">
                                                                    <Button variant="secondary" onClick={() => closeEditEvento(ev.id)} disabled={busy} className="h-9 px-4 text-xs">
                                                                        Cancelar
                                                                    </Button>
                                                                    <Button onClick={() => saveEditEvento(ev.id)} disabled={busy} className="h-9 px-5 text-xs">
                                                                        <span className="material-symbols-outlined text-sm">save</span>
                                                                        {busy ? "Guardando..." : "Guardar"}
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <div className="flex flex-col gap-3 sm:flex-row sm:items-start justify-between">
                                                                    <div className="space-y-1">
                                                                        <h5 className="text-base font-black text-on-surface uppercase">{ev.titulo}</h5>
                                                                        <p className="text-[10px] font-bold text-on-surface-variant/40 uppercase tracking-widest">{fmt(ev.creadoEn)}</p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 shrink-0">
                                                                        <button
                                                                            onClick={() => openEditEvento(ev)}
                                                                            title="Editar evento"
                                                                            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/20 bg-primary/5 text-primary opacity-0 group-hover:opacity-100 transition hover:bg-primary/15"
                                                                        >
                                                                            <span className="material-symbols-outlined text-base">edit</span>
                                                                        </button>
                                                                        <Pill tone={ev.completado ? "green" : "amber"}>{ev.completado ? "Resuelto" : "Pendiente"}</Pill>
                                                                    </div>
                                                                </div>
                                                                {ev.detalle && <p className="mt-4 rounded-xl bg-primary/5 p-4 text-sm font-bold text-on-surface-variant/80 italic leading-relaxed">"{ev.detalle}"</p>}
                                                                {!ev.completado && <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={() => completarEvento(ev.id)} className="h-9 px-4 text-xs">Cerrar Evento</Button></div>}
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Section>
                            )}

                            {tab === "fotos" && (
                                <Section title="Galería del Caso" desc="Evidencias capturadas en terreno">
                                    {!selected.fotos?.length && (
                                        <p className="text-center text-sm font-bold text-on-surface-variant/40 py-12">Sin fotos registradas.</p>
                                    )}
                                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                                        {selected.fotos?.map(f => {
                                            const editing = !!editFoto[f.id];
                                            const ef = editFoto[f.id] || {};
                                            return (
                                                <div key={f.id} className={cls(
                                                    "group relative overflow-hidden rounded-[2.5rem] border shadow-lg transition-all",
                                                    editing ? "border-primary/40 aspect-auto p-5 bg-surface-container-lowest" : "aspect-[4/3] border-outline-variant/10"
                                                )}>
                                                    {editing ? (
                                                        /* ── Modo edición foto ── */
                                                        <div className="space-y-3">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                {/* Preview: nueva o actual */}
                                                                <div className="relative h-20 w-20 rounded-2xl overflow-hidden border-2 border-outline-variant/20 shrink-0">
                                                                    <img
                                                                        src={ef.file ? URL.createObjectURL(ef.file) : fileUrl(f.urlArchivo)}
                                                                        className="h-full w-full object-cover"
                                                                    />
                                                                    {ef.file && (
                                                                        <div className="absolute inset-0 flex items-center justify-center bg-primary/50">
                                                                            <span className="material-symbols-outlined text-white text-base">swap_horiz</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className="text-xs font-black uppercase tracking-widest text-primary/60">Editando foto</p>
                                                                    <p className="text-sm font-bold text-on-surface truncate">{f.titulo || "Sin título"}</p>
                                                                    {ef.file && (
                                                                        <p className="text-[10px] font-bold text-primary mt-0.5 truncate">↳ {ef.file.name}</p>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <Input
                                                                label="Título"
                                                                value={ef.titulo}
                                                                onChange={v => setEditFoto(p => ({ ...p, [f.id]: { ...p[f.id], titulo: v } }))}
                                                            />
                                                            <Select
                                                                label="Sección de la casa"
                                                                value={ef.parteCasa}
                                                                onChange={v => setEditFoto(p => ({ ...p, [f.id]: { ...p[f.id], parteCasa: v } }))}
                                                                options={Object.keys(ParteCasaLabel).map(k => ({ value: k, label: ParteCasaLabel[k] }))}
                                                            />

                                                            {/* Zone reemplazo imagen */}
                                                            <div className="space-y-1.5">
                                                                <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/60">
                                                                    Reemplazar imagen (opcional)
                                                                </span>
                                                                <label className={`flex items-center justify-center gap-3 rounded-xl border-2 border-dashed px-4 py-3 cursor-pointer transition ${
                                                                    ef.file ? "border-primary/50 bg-primary/5" : "border-outline-variant/30 hover:border-primary/30 hover:bg-primary/5"
                                                                }`}>
                                                                    <input
                                                                        type="file"
                                                                        accept="image/*"
                                                                        className="hidden"
                                                                        onChange={e => {
                                                                            const file = e.target.files?.[0] || null;
                                                                            setEditFoto(p => ({ ...p, [f.id]: { ...p[f.id], file } }));
                                                                        }}
                                                                    />
                                                                    <span className="material-symbols-outlined text-xl text-on-surface-variant/50">add_photo_alternate</span>
                                                                    <span className="text-xs font-black uppercase tracking-wider text-on-surface-variant/50">
                                                                        {ef.file ? "Cambiar selección" : "Seleccionar imagen"}
                                                                    </span>
                                                                </label>
                                                                {ef.file && (
                                                                    <button
                                                                        onClick={() => setEditFoto(p => ({ ...p, [f.id]: { ...p[f.id], file: null } }))}
                                                                        className="text-[10px] font-black text-error/60 hover:text-error transition uppercase tracking-wider"
                                                                    >
                                                                        ✕ Quitar nueva imagen
                                                                    </button>
                                                                )}
                                                            </div>

                                                            <div className="flex justify-end gap-3 pt-2">
                                                                <Button variant="secondary" onClick={() => closeEditFoto(f.id)} disabled={busy} className="h-9 px-4 text-xs">
                                                                    Cancelar
                                                                </Button>
                                                                <Button onClick={() => saveFotoEdit(f.id)} disabled={busy} className="h-9 px-5 text-xs">
                                                                    <span className="material-symbols-outlined text-sm">save</span>
                                                                    {busy ? "Guardando..." : "Guardar"}
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        /* ── Vista normal foto ── */
                                                        <>
                                                            <img src={fileUrl(f.urlArchivo)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">{ParteCasaLabel[f.parteCasa] || f.parteCasa}</p>
                                                                <h6 className="text-white font-black truncate">{f.titulo || "Sin título"}</h6>
                                                                <div className="mt-4 flex items-center gap-2">
                                                                    <a href={fileUrl(f.urlArchivo)} target="_blank" className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-primary hover:text-on-primary">
                                                                        <span className="material-symbols-outlined text-xl">zoom_in</span>
                                                                    </a>
                                                                    {canEditDocs(selected) && (
                                                                        <>
                                                                            <button
                                                                                onClick={() => openEditFoto(f)}
                                                                                title="Editar foto"
                                                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-primary hover:text-on-primary"
                                                                            >
                                                                                <span className="material-symbols-outlined text-xl">edit</span>
                                                                            </button>
                                                                            <button
                                                                                onClick={() => deleteFoto(f.id)}
                                                                                title="Eliminar foto"
                                                                                disabled={busy}
                                                                                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md transition-all hover:bg-error hover:text-on-error"
                                                                            >
                                                                                <span className="material-symbols-outlined text-xl">delete</span>
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Section>
                            )}

                            {tab === "docs" && (
                                <Section title="Documentación de Respaldo" desc="Archivos del expediente">
                                    <div className="mb-10 rounded-[2.5rem] border border-outline-variant/10 bg-surface-container-high/10 p-10">
                                        <Select label="Tipo" value={docForm.tipo} onChange={v => setDocForm(p => ({ ...p, tipo: v }))} options={Object.keys(TipoDocumentoLabel).map(k => ({ value: k, label: TipoDocumentoLabel[k] }))} />
                                        <div className="mt-6 grid gap-6 md:grid-cols-2">
                                            <Input label="Nombre Personalizado" value={docForm.titulo} onChange={v => setDocForm(p => ({ ...p, titulo: v }))} />
                                            <div className="relative rounded-2xl border-2 border-dashed border-outline-variant/30 p-4 h-[52px] flex items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer">
                                                <input type="file" onChange={e => setDocForm(p => ({ ...p, file: e.target.files[0] }))} className="absolute inset-0 opacity-0 cursor-pointer" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">{docForm.file ? docForm.file.name : "Seleccionar Archivo"}</span>
                                            </div>
                                        </div>
                                        <Button onClick={addDocumento} className="mt-8 w-full h-14">Subir Documento</Button>
                                    </div>
                                    <div className="grid gap-4">
                                        {selected.documentos?.map(d => (
                                            <div key={d.id} className="flex items-center gap-6 rounded-[2rem] border border-outline-variant/10 bg-surface-container-lowest/50 p-6 transition-all hover:border-primary/20 hover:shadow-lg">
                                                <div className="h-14 w-14 shrink-0 rounded-2xl bg-surface-container-high flex items-center justify-center text-primary shadow-inner">
                                                    <span className="material-symbols-outlined text-3xl">draft</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-lg font-black text-on-surface truncate">{TipoDocumentoLabel[d.tipo]}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{d.titulo || "Documento"}</p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {canEditDocs(selected) && (
                                                        <button
                                                            onClick={() => setEditDocModal({ open: true, doc: d, newFile: null, newTitulo: d.titulo || "" })}
                                                            title="Reemplazar documento"
                                                            className="flex h-11 w-11 items-center justify-center rounded-full border border-amber-500/20 bg-amber-500/5 text-amber-600 transition hover:bg-amber-500/20"
                                                        >
                                                            <span className="material-symbols-outlined text-xl">swap_horiz</span>
                                                        </button>
                                                    )}
                                                    <Button variant="secondary" onClick={() => window.open(fileUrl(d.urlArchivo))} className="h-11 w-11 rounded-full p-0">
                                                        <span className="material-symbols-outlined">download</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </Section>
                            )}

                            {tab === "facturacion" && (() => {
                                let informeFinalDate = null;
                                if (selected?.gestiones) {
                                    const inf = selected.gestiones.find(g => g.tipo === "INFORME_FINAL" && g.estado === "COMPLETADA");
                                    if (inf) informeFinalDate = new Date(inf.fechaTermino || inf.actualizadoEn);
                                }
                                let daysPassed = 0;
                                let isDelayed = false;
                                let showTimer = false;
                                
                                // Timer general si no se ha cerrado la facturación total
                                if (informeFinalDate && factForm.estadoFacturacion !== "ENVIADO_CLIENTE" && factForm.estadoFacturacion !== "PAGADO") {
                                    showTimer = true;
                                    daysPassed = Math.floor((new Date() - informeFinalDate) / (1000 * 60 * 60 * 24));
                                    isDelayed = daysPassed > 5;
                                }

                                return (
                                    <div className="space-y-10">
                                        <Section title="Estructura de Cobro" desc="Definición de indemnización y estados globales">
                                            {showTimer && (
                                                <div className={`mb-6 rounded-2xl border p-4 flex items-center gap-4 shadow-lg ${isDelayed ? "border-error/30 bg-error/10 text-error" : "border-primary/20 bg-primary/5 text-primary"}`}>
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20">
                                                        <span className="material-symbols-outlined text-2xl">{isDelayed ? "warning" : "schedule"}</span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-black uppercase tracking-widest">{isDelayed ? "Alerta de Facturación" : "Plazo de Cobro Activo"}</span>
                                                        <span className="text-xs font-bold opacity-80 mt-1">Han pasado {daysPassed} días desde el Informe Final.</span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="rounded-[3rem] border border-outline-variant/10 bg-surface-container-high/10 p-10">
                                                <div className="grid gap-8">
                                                    <div className="grid gap-6 sm:grid-cols-2">
                                                        <Input label="Indemnización Total del Siniestro (CLP)" type="number" 
                                                            value={factForm.montoIndemnizacion} 
                                                            onChange={(v) => setFactForm(prev => ({...prev, montoIndemnizacion: v}))} 
                                                        />
                                                        <Select label="Estado Global de Facturación" value={factForm.estadoFacturacion} onChange={v => setFactForm(p => ({ ...p, estadoFacturacion: v }))} options={Object.keys(EstadoFacturacionLabel).map(k => ({ value: k, label: EstadoFacturacionLabel[k] }))} />
                                                    </div>
                                                    <Textarea label="Notas Administrativas Generales" value={factForm.notasFacturacion} onChange={v => setFactForm(p => ({ ...p, notasFacturacion: v }))} />
                                                    <div className="flex justify-end gap-3 border-t border-outline-variant/10 pt-8">
                                                        <Button variant="secondary" onClick={marcarPagado}>Marcar Todo como Pagado</Button>
                                                        <Button onClick={saveFacturacion} className="px-12">Guardar Definición General</Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Section>

                                        <Section title="Registro de Pagos y Boletas" desc="Gestión de cobros parciales por hitos">
                                            {/* Formulario Nuevo Pago */}
                                            <div className="mb-8 rounded-[2.5rem] border border-primary/20 bg-primary/5 p-10">
                                                <h4 className="text-sm font-black uppercase tracking-widest text-primary mb-6">Registrar Nuevo Cobro</h4>
                                                
                                                {/* Mensajes de Feedback Localizado */}
                                                {(pagoErr || pagoSuccess) && (
                                                    <div className={cls(
                                                        "mb-8 p-6 rounded-3xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300",
                                                        pagoErr ? "bg-error/10 border border-error/20 text-error" : "bg-primary/10 border border-primary/20 text-primary"
                                                    )}>
                                                        <span className="material-symbols-outlined mt-0.5">
                                                            {pagoErr ? "error" : "check_circle"}
                                                        </span>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-black uppercase tracking-widest leading-none">
                                                                {pagoErr ? "Error en Registro" : "Acción Exitosa"}
                                                            </span>
                                                            <span className="text-sm font-bold opacity-90">{pagoErr || pagoSuccess}</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => { setPagoErr(null); setPagoSuccess(null); }}
                                                            className="ml-auto opacity-50 hover:opacity-100 transition-opacity"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">close</span>
                                                        </button>
                                                    </div>
                                                )}

                                                <div className="grid gap-6">
                                                    <div className="grid gap-6 sm:grid-cols-3">
                                                        <Input label="% de Cobro" type="number" value={nuevoPago.porcentajeCobro} 
                                                            onChange={(v) => {
                                                                setPagoErr(null); // Limpiar error al tipear
                                                                let p = Number(v);
                                                                if (p > 100) p = 100;
                                                                const m = Number(factForm.montoIndemnizacion);
                                                                const calc = (m && p) ? Math.trunc(m * (p / 100)) : "";
                                                                setNuevoPago(prev => ({...prev, porcentajeCobro: v, montoHonorarios: String(calc)}));
                                                            }} 
                                                        />
                                                        <Input label="Monto Honorarios (Calculado)" type="number" value={nuevoPago.montoHonorarios} 
                                                            onChange={(v) => setNuevoPago(prev => ({...prev, montoHonorarios: v}))} 
                                                        />
                                                        <Select 
                                                            label="Estado de Boleta" 
                                                            value={nuevoPago.estadoFacturacion} 
                                                            onChange={v => {
                                                                const today = new Date().toISOString().slice(0, 10);
                                                                setNuevoPago(p => ({ 
                                                                    ...p, 
                                                                    estadoFacturacion: v,
                                                                    fechaPago: v === 'PAGADO' ? (p.fechaPago || today) : '',
                                                                    fechaEnvioBoleta: (v === 'ENVIADO_CLIENTE' || v === 'PAGADO') ? (p.fechaEnvioBoleta || today) : ''
                                                                }));
                                                            }} 
                                                            options={Object.keys(EstadoFacturacionLabel).map(k => ({ value: k, label: EstadoFacturacionLabel[k] }))} 
                                                        />
                                                    </div>
                                                    
                                                    {nuevoPago.estadoFacturacion !== 'PENDIENTE' && (
                                                        <div className="grid gap-6 sm:grid-cols-2 animate-in fade-in slide-in-from-top-1">
                                                            {nuevoPago.estadoFacturacion === 'PAGADO' && (
                                                                <Input label="Fecha Pago" type="date" value={nuevoPago.fechaPago} onChange={v => setNuevoPago(p => ({ ...p, fechaPago: v }))} />
                                                            )}
                                                            <Input label="Fecha Envío al Cliente" type="date" value={nuevoPago.fechaEnvioBoleta} onChange={v => setNuevoPago(p => ({ ...p, fechaEnvioBoleta: v }))} />
                                                        </div>
                                                    )}
                                                    <Input label="Nota del pago (Hito)" value={nuevoPago.notas} onChange={v => setNuevoPago(p => ({ ...p, notas: v }))} placeholder="Ej: Pago hito 1..." />
                                                    
                                                    <div className="space-y-1.5">
                                                        <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/60">Comprobante de pago (Opcional)</span>
                                                        <label className={cls(
                                                            "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition",
                                                            nuevoPago.file ? "border-primary/50 bg-primary/5" : "border-outline-variant/30 hover:border-primary/30 hover:bg-primary/5"
                                                        )}>
                                                            <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setNuevoPago(p => ({ ...p, file: e.target.files?.[0] || null }))} />
                                                            {nuevoPago.file ? (
                                                                <div className="flex items-center gap-2 text-primary text-xs font-black">
                                                                    <span className="material-symbols-outlined text-base">check_circle</span>
                                                                    {nuevoPago.file.name}
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 text-on-surface-variant/40">
                                                                    <span className="material-symbols-outlined text-xl">upload_file</span>
                                                                    <span className="text-[11px] font-black uppercase tracking-wider">Clic para adjuntar</span>
                                                                </div>
                                                            )}
                                                        </label>
                                                    </div>

                                                    <Button onClick={addPagoCaso} disabled={busy} className="w-full h-14">Agregar Tramo de Pago</Button>
                                                </div>
                                            </div>

                                            {/* Listado de Pagos */}
                                            <div className="grid gap-4">
                                                {selected?.pagos?.length > 0 && (
                                                    <div className="flex justify-between items-center px-8 py-4 bg-surface-container-low rounded-2xl border border-outline-variant/10">
                                                        <span className="text-xs font-black uppercase tracking-widest opacity-60">Total Facturado</span>
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-48 h-2 bg-outline-variant/20 rounded-full overflow-hidden">
                                                                <div 
                                                                    className={cls("h-full transition-all", (selected?.pagos?.reduce((acc, p) => acc + (p.porcentajeCobro || 0), 0) || 0) > 100 ? "bg-error" : "bg-primary")} 
                                                                    style={{ width: `${Math.min(100, selected?.pagos?.reduce((acc, p) => acc + (p.porcentajeCobro || 0), 0) || 0)}%` }}
                                                                />
                                                            </div>
                                                            <span className={cls("text-sm font-black", (selected?.pagos?.reduce((acc, p) => acc + (p.porcentajeCobro || 0), 0) || 0) > 100 ? "text-error" : "text-primary")}>
                                                                {selected?.pagos?.reduce((acc, p) => acc + (p.porcentajeCobro || 0), 0) || 0}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {!selected?.pagos?.length && (
                                                    <p className="text-center text-sm font-bold opacity-30 py-10">No hay pagos registrados aún.</p>
                                                )}
                                                {selected?.pagos?.map((p, idx) => {
                                                    const editing = !!editPago[p.id];
                                                    const ep = editPago[p.id] || {};

                                                    // Calcular mora: más de 5 días en ENVIADO_CLIENTE sin pago
                                                    const fechaEnvio = p.fechaEnvioCliente || p.fechaEnvioBoleta;
                                                    const enMora = p.estadoFacturacion === "ENVIADO_CLIENTE" && fechaEnvio &&
                                                        (new Date() - new Date(fechaEnvio)) / (1000 * 60 * 60 * 24) > 5;

                                                    // Sin boleta: ya pagado pero sin boleta emitida
                                                    const sinBoleta = p.estadoFacturacion === "PAGADO" && !p.boletaEmitida;

                                                    return (
                                                        <div key={p.id} className={cls(
                                                            "flex flex-col gap-6 rounded-[2.5rem] border p-8 transition-all",
                                                            enMora ? "border-error/30 bg-error/5" :
                                                            editing ? "border-primary/40 bg-surface-container-lowest shadow-xl" : "border-outline-variant/10 bg-surface-container-lowest/50 hover:shadow-lg"
                                                        )}>
                                                            <div className="flex gap-6">
                                                                <div className={cls(
                                                                    "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-primary",
                                                                    enMora ? "bg-error/10 text-error" : "bg-primary/10"
                                                                )}>
                                                                    <span className="font-black text-xl">{idx + 1}</span>
                                                                </div>
                                                                
                                                                {editing ? (
                                                                    /* MODO EDICIÓN */
                                                                    <div className="flex-1 space-y-6">
                                                                        <div className="grid gap-6 sm:grid-cols-3">
                                                                            <Input label="% de Cobro" type="number" value={ep.porcentajeCobro} 
                                                                                onChange={v => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], porcentajeCobro: v, montoHonorarios: String(Math.trunc(Number(factForm.montoIndemnizacion) * (Number(v)/100)))}}))} 
                                                                            />
                                                                            <Input label="Monto Honorarios" type="number" value={ep.montoHonorarios} 
                                                                                onChange={v => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], montoHonorarios: v}}))} 
                                                                            />
                                                                            <Select label="Estado" value={ep.estadoFacturacion} onChange={v => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], estadoFacturacion: v}}))} options={Object.keys(EstadoFacturacionLabel).map(k => ({ value: k, label: EstadoFacturacionLabel[k] }))} />
                                                                        </div>
                                                                        <div className="grid gap-6 sm:grid-cols-2">
                                                                            <Input label="Fecha Pago" type="date" value={toDateInput(ep.fechaPago)} onChange={v => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], fechaPago: v}}))} />
                                                                            <Input label="Fecha Envío al Cliente" type="date" value={toDateInput(ep.fechaEnvioCliente || ep.fechaEnvioBoleta)} onChange={v => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], fechaEnvioCliente: v}}))} />
                                                                        </div>
                                                                        
                                                                        <div className="space-y-1.5">
                                                                            <span className="text-[11px] font-black uppercase tracking-wider text-on-surface-variant/60">
                                                                                {p.urlComprobante ? "Reemplazar Comprobante" : "Adjuntar Comprobante"}
                                                                            </span>
                                                                            <label className={cls(
                                                                                "flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-4 cursor-pointer transition",
                                                                                ep.file ? "border-primary/50 bg-primary/5" : "border-outline-variant/30 hover:border-primary/30 hover:bg-primary/5"
                                                                            )}>
                                                                                <input type="file" accept="application/pdf,image/*" className="hidden" onChange={e => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], file: e.target.files?.[0] || null}}))} />
                                                                                {ep.file ? (
                                                                                    <div className="flex items-center gap-2 text-primary text-xs font-black">
                                                                                        <span className="material-symbols-outlined text-base">check_circle</span>
                                                                                        {ep.file.name}
                                                                                    </div>
                                                                                ) : (
                                                                                    <div className="flex items-center gap-2 text-on-surface-variant/40">
                                                                                        <span className="material-symbols-outlined text-xl">upload_file</span>
                                                                                        <span className="text-[11px] font-black uppercase tracking-wider">
                                                                                            {p.urlComprobante ? "Clic para cambiar archivo" : "Clic para adjuntar"}
                                                                                        </span>
                                                                                    </div>
                                                                                )}
                                                                            </label>
                                                                            {ep.file && (
                                                                                <button onClick={() => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], file: null}}))} className="text-[10px] font-black text-error/60 mt-1 uppercase tracking-wider hover:text-error">✕ Quitar selección</button>
                                                                            )}
                                                                        </div>

                                                                        <Input label="Notas" value={ep.notas} onChange={v => setEditPago(prev => ({...prev, [p.id]: {...prev[p.id], notas: v}}))} />
                                                                        
                                                                        <div className="flex justify-end gap-2">
                                                                            <Button variant="secondary" onClick={() => setEditPago(prev => {
                                                                                const copy = {...prev};
                                                                                delete copy[p.id];
                                                                                return copy;
                                                                            })}>Cancelar</Button>
                                                                            <Button onClick={() => saveEdicionPago(p.id)}>Guardar Cambios</Button>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    /* MODO VISTA */
                                                                    <div className="flex-1 flex flex-col gap-6">
                                                                        <div className="flex items-start gap-6">
                                                                            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-6">
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Tramo / %</span>
                                                                                    <span className="text-lg font-black">{p.porcentajeCobro}%</span>
                                                                                </div>
                                                                                <div className="flex flex-col">
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Honorarios</span>
                                                                                    <span className="text-lg font-black text-primary">${p.montoHonorarios?.toLocaleString("es-CL")}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Estado</span>
                                                                                    <div className="flex flex-col gap-1">
                                                                                        <span className={cls("text-sm font-bold",
                                                                                            p.estadoFacturacion === 'PAGADO' ? 'text-primary' :
                                                                                            p.estadoFacturacion === 'ENVIADO_CLIENTE' ? 'text-amber-500' : 'text-on-surface-variant'
                                                                                        )}>
                                                                                            {EstadoFacturacionLabel[p.estadoFacturacion] || '—'}
                                                                                        </span>
                                                                                        {/* Alerta de mora: +5 días en ENVIADO_CLIENTE sin pago */}
                                                                                        {enMora && (
                                                                                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-error">
                                                                                                <span className="material-symbols-outlined text-sm">warning</span>
                                                                                                Mora
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Boleta</span>
                                                                                    {p.boletaEmitida ? (
                                                                                        <div className="flex flex-col">
                                                                                            <span className="text-xs font-bold text-primary flex items-center gap-1">
                                                                                                <span className="material-symbols-outlined text-sm">receipt_long</span>
                                                                                                Emitida
                                                                                            </span>
                                                                                            {p.fechaEmisionBoleta && (
                                                                                                <span className="text-[10px] opacity-50">{new Date(p.fechaEmisionBoleta).toLocaleDateString()}</span>
                                                                                            )}
                                                                                            {p.referenciaBoleta && (
                                                                                                <span className="text-[10px] opacity-60">Ref: {p.referenciaBoleta}</span>
                                                                                            )}
                                                                                        </div>
                                                                                    ) : (
                                                                                        <span className={cls("text-xs font-bold", sinBoleta ? "text-amber-500" : "opacity-40")}>
                                                                                            {sinBoleta ? "⚠ Sin emitir" : "—"}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Comprobante</span>
                                                                                    {p.urlComprobante ? (
                                                                                        <a href={fileUrl(p.urlComprobante)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-black text-primary hover:underline">
                                                                                            <span className="material-symbols-outlined text-sm">attachment</span>
                                                                                            Ver archivo
                                                                                        </a>
                                                                                    ) : (
                                                                                        <span className="text-xs font-bold opacity-30">—</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                            
                                                                            <div className="flex items-center gap-2">
                                                                                {/* Botón "Emitir Boleta" solo si está PAGADO y sin boleta */}
                                                                                {sinBoleta && (
                                                                                    <button 
                                                                                        onClick={() => emitirBoleta(p.id)}
                                                                                        title="Emitir boleta para este tramo"
                                                                                        className="h-10 px-3 flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white transition-all shadow-sm text-xs font-black"
                                                                                    >
                                                                                        <span className="material-symbols-outlined text-sm">receipt_long</span>
                                                                                        Emitir Boleta
                                                                                    </button>
                                                                                )}
                                                                                {p.estadoFacturacion !== 'PAGADO' && (
                                                                                    <button 
                                                                                        onClick={() => {
                                                                                            if (p.estadoFacturacion === 'PENDIENTE') {
                                                                                                updatePagoStatus(p.id, 'ENVIADO_CLIENTE');
                                                                                            } else {
                                                                                                setConfirmPago(prev => ({...prev, [p.id]: { fechaPago: new Date().toISOString().slice(0, 10) }}));
                                                                                            }
                                                                                        }}
                                                                                        title={p.estadoFacturacion === 'PENDIENTE' ? "Marcar como enviado al cliente" : "Marcar como pagado"}
                                                                                        className={cls(
                                                                                            "h-10 w-10 flex items-center justify-center rounded-full transition-all shadow-sm",
                                                                                            confirmPago[p.id] ? "bg-primary text-on-primary ring-4 ring-primary/20" : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                                                                                        )}
                                                                                    >
                                                                                        <span className="material-symbols-outlined">
                                                                                            {confirmPago[p.id] ? 'calendar_month' : (p.estadoFacturacion === 'PENDIENTE' ? 'outgoing_mail' : 'check_circle')}
                                                                                        </span>
                                                                                    </button>
                                                                                )}
                                                                                <button 
                                                                                    onClick={() => setEditPago(prev => ({...prev, [p.id]: {...p}}))}
                                                                                    title="Editar registro"
                                                                                    className="h-10 w-10 flex items-center justify-center rounded-full bg-surface-container-high text-on-surface hover:bg-primary/10 hover:text-primary transition-all"
                                                                                >
                                                                                    <span className="material-symbols-outlined text-xl">edit</span>
                                                                                </button>
                                                                                <button 
                                                                                    onClick={() => removePagoCaso(p.id)} 
                                                                                    title="Eliminar"
                                                                                    className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-error/10 text-error transition-colors"
                                                                                >
                                                                                    <span className="material-symbols-outlined">delete</span>
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {confirmPago[p.id] && (
                                                                            <div className="flex flex-col gap-4 p-6 rounded-3xl bg-primary/5 border border-primary/20 animate-in fade-in slide-in-from-top-2">
                                                                                <div className="flex flex-col gap-1">
                                                                                    <span className="text-xs font-black uppercase text-primary">Confirmar Fecha de Pago</span>
                                                                                    <span className="text-[10px] opacity-60">Indica la fecha real en que el cliente realizó este pago para tus registros administrativos.</span>
                                                                                </div>
                                                                                <div className="flex items-center gap-4">
                                                                                    <input 
                                                                                        type="date" 
                                                                                        className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                                                                                        value={confirmPago[p.id].fechaPago}
                                                                                        onChange={e => setConfirmPago(prev => ({...prev, [p.id]: { fechaPago: e.target.value }}))}
                                                                                    />
                                                                                    <div className="flex gap-2">
                                                                                        <button 
                                                                                            onClick={() => {
                                                                                                updatePagoStatus(p.id, 'PAGADO', { fechaPago: confirmPago[p.id].fechaPago });
                                                                                                setConfirmPago(prev => { const n = {...prev}; delete n[p.id]; return n; });
                                                                                            }}
                                                                                            className="px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-black shadow-sm hover:shadow-md transition-all flex items-center gap-2"
                                                                                        >
                                                                                            <span className="material-symbols-outlined text-sm">check</span>
                                                                                            Confirmar Pago
                                                                                        </button>
                                                                                        <button 
                                                                                            onClick={() => setConfirmPago(prev => { const n = {...prev}; delete n[p.id]; return n; })}
                                                                                            className="px-4 py-2 bg-surface-container-high text-on-surface rounded-xl text-xs font-black hover:bg-surface-container-highest transition-all"
                                                                                        >
                                                                                            Cancelar
                                                                                        </button>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {!editing && p.notas && (
                                                                <div className="mt-2 text-xs font-bold text-on-surface-variant/60 italic pl-20">
                                                                    ↳ "{p.notas}"
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </Section>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modales */}
            {completeModal.open && (
                <Modal open={completeModal.open} onClose={() => setCompleteModal(p => ({ ...p, open: false }))} title="Completar Gestión" footer={<Button onClick={completarGestion}>Finalizar Hito</Button>}>
                    <div className="space-y-6">
                        <Select label="Documento a Adjuntar" value={completeModal.tipoDoc} onChange={v => setCompleteModal(p => ({ ...p, tipoDoc: v }))} options={Object.keys(TipoDocumentoLabel).map(k => ({ value: k, label: TipoDocumentoLabel[k] }))} />
                        <Input label="Nombre del Archivo" value={completeModal.tituloDoc} onChange={v => setCompleteModal(p => ({ ...p, tituloDoc: v }))} />
                        {completeModal.gestion?.tipo === "INSPECCION" && <Input label="Fecha Real Inspección" type="date" value={completeModal.fechaRecepcion} onChange={v => setCompleteModal(p => ({ ...p, fechaRecepcion: v }))} />}
                        <Textarea label="Observaciones Finales" value={completeModal.observaciones} onChange={v => setCompleteModal(p => ({ ...p, observaciones: v }))} />
                        <div className="relative rounded-2xl border-2 border-dashed border-outline-variant/30 p-8 flex flex-col items-center justify-center hover:bg-primary/5 transition-colors cursor-pointer">
                            <input type="file" onChange={e => setCompleteModal(p => ({ ...p, file: e.target.files[0] }))} className="absolute inset-0 opacity-0 cursor-pointer" />
                            <span className="material-symbols-outlined text-4xl mb-2 text-primary/40">cloud_upload</span>
                            <span className="text-xs font-black uppercase tracking-widest">{completeModal.file ? completeModal.file.name : "Subir Archivo de Respaldo"}</span>
                        </div>
                    </div>
                </Modal>
            )}

            {openWordModal && (
                <Modal open={openWordModal} onClose={() => setOpenWordModal(false)} title="Generar Documento Word" footer={<Button onClick={downloadWordSiniestro}>Descargar Documento</Button>}>
                    <div className="grid grid-cols-3 gap-4">
                        {selected.fotos?.map(f => (
                            <label key={f.id} className={cls("aspect-square rounded-2xl border-4 overflow-hidden relative cursor-pointer transition-all", selectedFotosWord.includes(f.id) ? "border-primary shadow-lg shadow-primary/20 scale-95" : "border-outline-variant/20")}>
                                <input type="checkbox" className="hidden" checked={selectedFotosWord.includes(f.id)} onChange={() => toggleFotoWord(f.id)} />
                                <img src={fileUrl(f.urlArchivo)} className="h-full w-full object-cover" />
                                {selectedFotosWord.includes(f.id) && <div className="absolute inset-0 bg-primary/20 flex items-center justify-center text-white"><span className="material-symbols-outlined text-4xl font-bold">check_circle</span></div>}
                            </label>
                        ))}
                    </div>
                </Modal>
            )}

            {openBudgetModal && (
                <Modal open={openBudgetModal} onClose={() => setOpenBudgetModal(false)} title="Enviar Presupuesto" footer={<Button onClick={sendBudgetEmail}>Enviar por Correo</Button>}>
                    <div className="space-y-6">
                        <Input label="Destinatarios (separados por coma)" value={emailForm.destinatarios} onChange={v => setEmailForm(p => ({ ...p, destinatarios: v }))} />
                        <Input label="Asunto" value={emailForm.asunto} onChange={v => setEmailForm(p => ({ ...p, asunto: v }))} />
                        <Textarea label="Mensaje" value={emailForm.mensaje} onChange={v => setEmailForm(p => ({ ...p, mensaje: v }))} />
                        <div className="grid grid-cols-4 gap-2">
                            {selected.fotos?.map(f => (
                                <div key={f.id} onClick={() => toggleFotoWord(f.id)} className={cls("aspect-square rounded-lg border-2 overflow-hidden relative cursor-pointer", selectedFotosWord.includes(f.id) ? "border-primary" : "border-outline-variant/10")}>
                                    <img src={fileUrl(f.urlArchivo)} className="h-full w-full object-cover" />
                                </div>
                            ))}
                        </div>
                    </div>
                </Modal>
            )}

            {/* MODAL: Reemplazar Documento */}
            {editDocModal.open && (
                <Modal
                    open={editDocModal.open}
                    title="Reemplazar Documento"
                    onClose={() => setEditDocModal({ open: false, doc: null, newFile: null, newTitulo: "", successMsg: null, errorMsg: null })}
                    footer={
                        <>
                            <Button variant="secondary" onClick={() => setEditDocModal({ open: false, doc: null, newFile: null, newTitulo: "", successMsg: null, errorMsg: null })} disabled={busy}>
                                Cancelar
                            </Button>
                            <Button onClick={reemplazarDocSin} disabled={busy || !editDocModal.newFile}>
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

                        {/* Nuevo título opcional */}
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
                            <label className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 transition cursor-pointer ${editDocModal.newFile
                                    ? "border-amber-500/60 bg-amber-500/5"
                                    : "border-outline-variant/30 bg-surface-container-lowest hover:border-amber-500/40 hover:bg-amber-500/5"
                                }`}>
                                <input
                                    type="file"
                                    accept="application/pdf,image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0] ?? null;
                                        setEditDocModal((p) => ({ ...p, newFile: file, errorMsg: null }));
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

                        {/* Feedback error */}
                        {editDocModal.errorMsg && (
                            <div className="rounded-xl border border-error/30 bg-error/5 p-3 text-[12px] font-bold text-error flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">error</span>
                                {editDocModal.errorMsg}
                            </div>
                        )}

                        {/* Feedback éxito */}
                        {editDocModal.successMsg && (
                            <div className="rounded-xl border border-tertiary/30 bg-tertiary/5 p-3 text-[12px] font-bold text-tertiary flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">check_circle</span>
                                {editDocModal.successMsg}
                            </div>
                        )}

                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] font-bold text-amber-700">
                            ⚠️ El archivo anterior será eliminado y reemplazado. Quedará registro del cambio en la bitácora del caso.
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}
