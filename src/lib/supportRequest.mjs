import { createHash } from "node:crypto";
import { SUPPORT_EMAIL, SUPPORT_PLATFORMS, SUPPORT_TOPICS } from "./supportConfig.mjs";

const MAX_BYTES = 16_384;
const WINDOW_MS = 15 * 60 * 1000;
const EMAIL = /^[^\s@<>\r\n]+@[^\s@<>\r\n]+\.[^\s@<>\r\n]+$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const unavailable = "No pudimos enviar tu solicitud. Tus datos siguen en el formulario. Inténtalo más tarde o escríbenos al correo de soporte.";

const json = (body, status = 200, headers = {}) => Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

async function readBody(request) {
  const reader = request.body?.getReader();
  if (!reader) throw new Error("empty");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) {
        await reader.cancel();
        throw new Error("large");
      }
      chunks.push(Buffer.from(value));
    }
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } finally {
    reader.releaseLock();
  }
}

// Límite por instancia; complementar con protección del proveedor de alojamiento.
// Se conservan hashes y contadores temporales, nunca el contenido del formulario.
export function createSupportHandler({ env = process.env, send = fetch, now = Date.now } = {}) {
  const attempts = new Map();

  return async function POST(request) {
    const origin = request.headers.get("origin");
    // Next puede recibir una URL interna detrás del proxy de producción.
    const allowedOrigins = [new URL(request.url).origin, "https://erp.asesur.cl"];
    if (origin && !allowedOrigins.includes(origin)) return json({ message: "Solicitud no permitida." }, 403);
    if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
      return json({ message: "Formato de solicitud no válido." }, 415);
    }

    const timestamp = now();
    for (const [key, entry] of attempts) if (entry.expires <= timestamp) attempts.delete(key);
    const address = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const key = createHash("sha256").update(address).digest("hex");
    const entry = attempts.get(key) || { count: 0, expires: timestamp + WINDOW_MS };
    if (entry.count >= 5 || (attempts.size >= 2000 && !attempts.has(key))) {
      return json({ message: "Has realizado varios intentos. Espera unos minutos o utiliza el correo de soporte." }, 429, { "Retry-After": String(Math.max(1, Math.ceil((entry.expires - timestamp) / 1000))) });
    }
    entry.count += 1;
    attempts.set(key, entry);

    let data;
    try {
      data = await readBody(request);
    } catch (error) {
      return json({ message: error.message === "large" ? "La solicitud es demasiado extensa." : "Revisa los datos del formulario." }, error.message === "large" ? 413 : 400);
    }
    if (!data || typeof data !== "object" || Array.isArray(data)) return json({ message: "Revisa los datos del formulario." }, 400);
    if (typeof data.website === "string" && data.website.trim()) return json({ ok: true });

    const name = typeof data.name === "string" ? data.name.trim() : "";
    const email = typeof data.email === "string" ? data.email.trim() : "";
    const message = typeof data.message === "string" ? data.message.trim() : "";
    if (name.length < 2 || name.length > 100 || /[\r\n]/.test(name) || email.length > 254 || !EMAIL.test(email)
      || message.length < 20 || message.length > 4000 || !SUPPORT_TOPICS.includes(data.topic)
      || !SUPPORT_PLATFORMS.includes(data.platform) || data.consent !== true || !UUID.test(data.requestId || "")) {
      return json({ message: "Completa tu nombre, un correo válido, el motivo, la plataforma y una descripción de entre 20 y 4000 caracteres. Confirma que leíste la política de privacidad." }, 400);
    }

    if (!env.RESEND_API_KEY) return json({ message: unavailable }, 503);

    try {
      const response = await send("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
          "Idempotency-Key": `asesur-support-${data.requestId}`,
        },
        body: JSON.stringify({
          from: "Soporte Asesur APP <sistema@asesur.cl>",
          to: [SUPPORT_EMAIL],
          reply_to: email,
          subject: `[Soporte Asesur APP] ${data.topic}`,
          text: ["Nueva solicitud de soporte de Asesur APP", "", `Nombre: ${name}`, `Correo de respuesta: ${email}`, `Motivo: ${data.topic}`, `Plataforma: ${data.platform}`, "", "Descripción:", message, "", "El remitente confirmó la lectura de la política de privacidad.", `Referencia: ${data.requestId}`].join("\n"),
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) return json({ message: unavailable }, 502);
      const result = await response.json();
      if (!result?.id) return json({ message: unavailable }, 502);
      return json({ ok: true });
    } catch {
      // No registrar mensajes, direcciones ni respuestas del proveedor.
      return json({ message: unavailable }, 502);
    }
  };
}
