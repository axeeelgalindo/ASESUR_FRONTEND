"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { SUPPORT_EMAIL, SUPPORT_PLATFORMS, SUPPORT_TOPICS } from "@/lib/supportConfig.mjs";
import styles from "./soporte.module.css";

export default function SupportForm() {
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [messageLength, setMessageLength] = useState(0);
  const requestId = useRef(null);
  const submitting = useRef(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (submitting.current) return;
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    submitting.current = true;
    setStatus("sending");
    setError("");
    try {
      const fields = new FormData(form);
      requestId.current ||= crypto.randomUUID();
      const response = await fetch("/api/soporte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fields.get("name"), email: fields.get("email"), topic: fields.get("topic"),
          platform: fields.get("platform"), message: fields.get("message"), website: fields.get("website"),
          consent: fields.get("consent") === "on", requestId: requestId.current,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok) throw new Error(result.message || "No pudimos enviar tu solicitud. Inténtalo más tarde o utiliza el correo de soporte.");
      form.reset();
      requestId.current = null;
      setMessageLength(0);
      setStatus("sent");
    } catch (err) {
      setError(err instanceof TypeError ? "No pudimos conectar. Revisa tu conexión y vuelve a intentarlo; tus datos siguen en el formulario." : err.message);
      setStatus("error");
    } finally {
      submitting.current = false;
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} onChange={() => {
      requestId.current = null;
      if (status !== "sending") { setStatus("idle"); setError(""); }
    }}>
      <fieldset disabled={status === "sending"} className={styles.fields}>
        <div className={styles.row}>
          <div className={styles.field}><label htmlFor="support-name">Tu nombre <span aria-hidden="true">*</span></label><input id="support-name" name="name" autoComplete="name" required minLength={2} maxLength={100} placeholder="Nombre y apellido" /></div>
          <div className={styles.field}><label htmlFor="support-email">Correo electrónico <span aria-hidden="true">*</span></label><input id="support-email" name="email" type="email" autoComplete="email" required maxLength={254} placeholder="tu@correo.com" /></div>
        </div>
        <div className={styles.row}>
          <div className={styles.field}><label htmlFor="support-topic">Motivo de contacto <span aria-hidden="true">*</span></label><select id="support-topic" name="topic" required defaultValue=""><option value="" disabled>Selecciona un motivo</option>{SUPPORT_TOPICS.map(topic => <option key={topic}>{topic}</option>)}</select></div>
          <div className={styles.field}><label htmlFor="support-platform">¿Dónde ocurre? <span aria-hidden="true">*</span></label><select id="support-platform" name="platform" required defaultValue=""><option value="" disabled>Selecciona una plataforma</option>{SUPPORT_PLATFORMS.map(platform => <option key={platform}>{platform}</option>)}</select></div>
        </div>
        <div className={styles.field}><label htmlFor="support-message">¿Cómo podemos ayudarte? <span aria-hidden="true">*</span></label><textarea id="support-message" name="message" required minLength={20} maxLength={4000} rows={6} placeholder="Describe lo que ocurrió y qué estabas intentando hacer…" aria-describedby="support-message-help" onChange={event => setMessageLength(event.target.value.length)} /><div className={styles.hint} id="support-message-help"><span>Mínimo 20 caracteres. No incluyas información sensible.</span><span>{messageLength}/4000</span></div></div>
        <div className={styles.honeypot} aria-hidden="true"><label htmlFor="support-website">Sitio web</label><input id="support-website" name="website" tabIndex={-1} autoComplete="off" /></div>
        <label className={styles.consent}><input name="consent" type="checkbox" required /><span>He leído la <Link href="/politica-de-privacidad" target="_blank" rel="noopener noreferrer">política de privacidad</Link> y autorizo el uso de estos datos para atender mi consulta.</span></label>
        <button className={styles.submit} type="submit">{status === "sending" ? "Enviando consulta…" : "Enviar consulta"}<span aria-hidden="true">↗</span></button>
      </fieldset>
      <div aria-live="polite" aria-atomic="true">
        {status === "sent" && <div className={styles.success} role="status"><strong>Tu consulta fue enviada.</strong><span>Te responderemos al correo que indicaste.</span></div>}
        {status === "error" && <div className={styles.error} role="alert">{error} <a href={`mailto:${SUPPORT_EMAIL}`}>Escribir por correo</a></div>}
      </div>
      <p className={styles.formNote}>Los campos con * son obligatorios. No solicitamos contraseñas ni códigos de verificación.</p>
    </form>
  );
}
