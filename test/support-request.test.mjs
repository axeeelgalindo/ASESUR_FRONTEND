import test from "node:test";
import assert from "node:assert/strict";
import { createSupportHandler } from "../src/lib/supportRequest.mjs";

const input = {
  name: "Persona de prueba", email: "prueba@example.com", topic: "Error de la aplicación",
  platform: "iPhone / iPad", message: "Al abrir el listado aparece un error y no puedo continuar.",
  consent: true, website: "", requestId: "c160a996-fddc-44f8-88ec-976c6be4d051",
};
const request = (data = input, headers = {}) => new Request("https://erp.asesur.cl/api/soporte", {
  method: "POST", headers: { "Content-Type": "application/json", Origin: "https://erp.asesur.cl", ...headers }, body: JSON.stringify(data),
});

test("envía desde sistema, solo al destino fijo, con respuesta al solicitante e idempotencia", async () => {
  let sent;
  const handler = createSupportHandler({ env: { RESEND_API_KEY: "fake-test-key" }, send: async (url, options) => {
    sent = { url, ...options, body: JSON.parse(options.body) };
    return Response.json({ id: "fake-message-id" });
  } });
  const response = await handler(request({ ...input, to: "intruso@example.com", from: "intruso@example.com" }));
  assert.equal(response.status, 200);
  assert.equal(sent.url, "https://api.resend.com/emails");
  assert.equal(sent.body.from, "Soporte Asesur APP <sistema@asesur.cl>");
  assert.deepEqual(sent.body.to, ["galindo.del.axel@gmail.com"]);
  assert.equal(sent.body.reply_to, input.email);
  assert.match(sent.body.text, /no puedo continuar/);
  assert.equal(sent.headers["Idempotency-Key"], `asesur-support-${input.requestId}`);
});

test("rechaza datos inválidos y falta de consentimiento sin contactar al proveedor", async () => {
  let calls = 0;
  const send = async () => { calls++; throw new Error("no debe llamarse"); };
  for (const change of [{ email: "incorrecto" }, { email: "user@example.com\r\nBcc: other@example.com" }, { consent: false }, { message: "Corto" }, { platform: "inventada" }, { requestId: "bad" }]) {
    const handler = createSupportHandler({ env: { RESEND_API_KEY: "fake" }, send });
    assert.equal((await handler(request({ ...input, ...change }))).status, 400);
  }
  assert.equal(calls, 0);
});

test("sin credenciales no afirma que envió la consulta", async () => {
  const response = await createSupportHandler({ env: {} })(request());
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.ok, undefined);
  assert.match(body.message, /No pudimos enviar/);
});

test("rechazo, respuesta inválida o fallo de red del proveedor no producen falso éxito", async () => {
  for (const send of [async () => Response.json({ message: "private-provider-error" }, { status: 403 }), async () => Response.json({}), async () => { throw new Error("private-key-details"); }]) {
    const response = await createSupportHandler({ env: { RESEND_API_KEY: "fake" }, send })(request());
    assert.equal(response.status, 502);
    const text = await response.text();
    assert.doesNotMatch(text, /private/);
    assert.doesNotMatch(text, /"ok":true/);
  }
});

test("limita intentos y permite nuevamente después de la ventana", async () => {
  let time = 1000;
  const handler = createSupportHandler({ env: {}, now: () => time });
  for (let i = 0; i < 5; i++) assert.equal((await handler(request())).status, 503);
  const response = await handler(request());
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("Retry-After"), "900");
  time += 900_001;
  assert.equal((await handler(request())).status, 503);
});

test("honeypot no envía correos", async () => {
  let calls = 0;
  const handler = createSupportHandler({ env: { RESEND_API_KEY: "fake" }, send: async () => { calls++; } });
  assert.equal((await handler(request({ ...input, website: "spam.example" }))).status, 200);
  assert.equal(calls, 0);
});

test("permite el dominio público cuando Next está detrás de un proxy interno", async () => {
  const handler = createSupportHandler({ env: {} });
  const response = await handler(new Request("http://localhost:3000/api/soporte", {
    method: "POST", headers: { "Content-Type": "application/json", Origin: "https://erp.asesur.cl" }, body: JSON.stringify(input),
  }));
  assert.equal(response.status, 503); // Llega a la configuración de correo, no rechaza el origen legítimo.
});

test("rechaza otro origen, JSON malformado, formato incorrecto y cuerpos grandes", async () => {
  const handler = createSupportHandler({ env: {} });
  assert.equal((await handler(request(input, { Origin: "https://otro.example" }))).status, 403);
  assert.equal((await handler(request(input, { "Content-Type": "text/plain" }))).status, 415);
  assert.equal((await handler(new Request("https://erp.asesur.cl/api/soporte", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{" }))).status, 400);
  assert.equal((await handler(request({ ...input, message: "á".repeat(17000) }))).status, 413);
});
