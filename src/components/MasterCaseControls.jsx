"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiDel, apiPatch, apiPutForm, fileUrl } from "@/lib/api";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const actionClass = "inline-flex items-center gap-2 rounded-xl border border-outline-variant/30 px-3 py-2 text-sm font-semibold hover:bg-surface-container-high disabled:opacity-50";

export default function MasterCaseControls({ caso, user, onChange, onDeleted }) {
  const router = useRouter();
  const [action, setAction] = useState(null);
  const [folio, setFolio] = useState("");
  const [titulo, setTitulo] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user?.rol !== "MASTER" || !caso?.id) return null;
  const open = (next) => { setAction(next); setError(""); setFolio(""); setFile(null); setTitulo(next.doc?.titulo || ""); };
  const run = async () => {
    setBusy(true); setError("");
    try {
      const base = `/casos/${caso.id}`;
      if (action.type === "case") {
        await apiDel(base, { data: { folio } });
        setAction(null);
        if (onDeleted) await onDeleted();
        else router.push("/siniestros");
      } else {
        if (action.type === "delete") await apiDel(`${base}/documentos/${action.doc.id}`);
        if (action.type === "edit") {
          if (file) { const form = new FormData(); form.append("titulo", titulo); form.append("file", file); await apiPutForm(`${base}/documentos/${action.doc.id}`, form); }
          else await apiPatch(`${base}/documentos/${action.doc.id}`, { titulo });
        }
        if (action.type === "state") await apiPatch(`${base}/gestiones/${action.gestion.id}/estado`, { estado: action.estado });
        await onChange?.();
        setAction(null);
      }
    } catch (e) { setError(e.response?.data?.error || "No se pudo guardar el cambio"); }
    finally { setBusy(false); }
  };
  const icon = (name) => <span aria-hidden="true" className="material-symbols-outlined text-lg">{name}</span>;
  return <section className="my-5 rounded-2xl border border-primary/20 bg-surface-container-low p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="font-bold">Administración del caso · MASTER</h3>
      <button className={`${actionClass} text-red-600`} onClick={() => open({ type: "case" })}>{icon("delete_forever")}Borrar caso</button>
    </div>
    <details className="mt-3">
      <summary className="cursor-pointer font-semibold">Modificar documentos y estados de gestiones</summary>
      <div className="mt-4 grid gap-3">
        {(caso.gestiones || []).map(g => <div key={g.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
          <div><p className="font-semibold">{g.titulo || g.tipo}</p><p className="text-sm">{g.estado === "COMPLETADA" ? "Completada" : g.estado === "BLOQUEADA" ? "Bloqueada" : "Faltante"}</p></div>
          <div className="flex flex-wrap gap-2">
            <button className={actionClass} onClick={() => open({ type: "state", gestion: g, estado: "PENDIENTE" })}>{icon("pending_actions")}Marcar faltante</button>
            <button className={actionClass} onClick={() => open({ type: "state", gestion: g, estado: "COMPLETADA" })}>{icon("task_alt")}Marcar completada</button>
          </div>
        </div>)}
        {(caso.documentos || []).map(doc => <div key={doc.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/20 pb-3">
          <a href={fileUrl(doc.urlArchivo)} target="_blank" rel="noopener noreferrer" className="text-primary underline">{doc.titulo || doc.tipo}</a>
          <div className="flex gap-2">
            <button className={actionClass} onClick={() => open({ type: "edit", doc })}>{icon("edit_document")}Editar archivo</button>
            <button className={`${actionClass} text-red-600`} onClick={() => open({ type: "delete", doc })}>{icon("delete")}Borrar</button>
          </div>
        </div>)}
      </div>
    </details>
    {action && <Modal open onClose={() => !busy && setAction(null)} title={action.type === "case" ? "Borrar caso definitivamente" : action.type === "delete" ? "Borrar documento" : action.type === "edit" ? "Editar documento" : "Cambiar estado de la gestión"} footer={<><Button variant="secondary" disabled={busy} onClick={() => setAction(null)}>Cancelar</Button><Button disabled={busy || (action.type === "case" && folio !== String(caso.folio))} onClick={run}>{busy ? "Guardando…" : "Confirmar"}</Button></>}>
      <p className="mb-4">Caso #{caso.folio} · {caso.nombreCliente}</p>
      {action.type === "case" && <><p className="mb-3">Se eliminará el caso y su expediente: documentos, fotos, gestiones, bitácora y pagos. Esta acción no se puede deshacer. Escribe el folio {caso.folio} para confirmar.</p><input aria-label="Folio de confirmación" className="w-full rounded-xl border p-3" value={folio} onChange={e => setFolio(e.target.value)} /></>}
      {action.type === "delete" && <p>Se quitará «{action.doc.titulo || action.doc.tipo}» del expediente. Si es el último documento de su gestión, quedará como faltante y podrás cargarlo de nuevo.</p>}
      {action.type === "state" && <p>«{action.gestion.titulo || action.gestion.tipo}» quedará {action.estado === "COMPLETADA" ? "completada por ajuste manual, incluso si no tiene un archivo adjunto" : "faltante para permitir una nueva carga"}. El cambio quedará registrado en la auditoría.</p>}
      {action.type === "edit" && <div className="grid gap-4"><label>Título<input className="mt-1 w-full rounded-xl border p-3" maxLength={500} value={titulo} onChange={e => setTitulo(e.target.value)} /></label><label className={`${actionClass} cursor-pointer`}>{icon("upload_file")}{file ? file.name : "Seleccionar archivo de reemplazo (opcional)"}<input type="file" className="sr-only" onChange={e => setFile(e.target.files?.[0] || null)} /></label><p className="text-sm">Puedes cambiar el título, reemplazar el archivo o ambas cosas.</p></div>}
      {error && <p role="alert" className="mt-4 text-red-600">{error}</p>}
    </Modal>}
  </section>;
}
