# Soporte de Asesur APP

Página pública: `/soporte`. Endpoint: `POST /api/soporte`, ejecutado en el servidor Next.js. No requiere sesión y no modifica la API ni la app móvil.

## Activar el correo

Configurar `RESEND_API_KEY` como secreto **del servidor del frontend** en su alojamiento y en `.env.local` para desarrollo. Usar una clave autorizada para enviar desde el dominio verificado `asesur.cl`. Nunca utilizar el prefijo `NEXT_PUBLIC_` ni incorporar la clave al repositorio. El backend ya utiliza Resend, pero sus variables no se heredan automáticamente en el frontend.

- Remitente fijo: `Soporte Asesur APP <sistema@asesur.cl>`.
- Destinatario fijo: `galindo.del.axel@gmail.com`.
- Reply-To: correo indicado por quien solicita ayuda.
- No se envía confirmación automática al correo introducido por el visitante.
- Solo se muestra éxito cuando Resend acepta el mensaje y devuelve un identificador; eso no certifica entrega en la bandeja del destinatario.
- Si falta la configuración o falla el proveedor, se muestra el error sin borrar el formulario y se ofrece el contacto directo por correo.

Después de desplegar, verificar sin sesión `https://erp.asesur.cl/soporte` y realizar una solicitud autorizada con datos ficticios. Comprobar recepción, remitente y dirección de respuesta antes de utilizar esa URL en App Store Connect. No se han enviado correos reales durante las pruebas automatizadas.

## Protección y datos

Validación de campos y consentimiento, cuerpo limitado a 16 KiB, honeypot, rechazo de origen distinto e idempotencia en Resend para reintentos del mismo formulario. Límite básico de cinco intentos cada quince minutos por IP y por instancia. En despliegues con varias instancias o funciones serverless, complementar con rate limiting/WAF del alojamiento: este contador en memoria no es un límite global persistente. La cabecera de IP debe ser sobrescrita por el proxy confiable del alojamiento.

No hay adjuntos ni almacenamiento de consultas en una base de datos. Las consultas se envían a Resend y al correo de soporte; la conservación de esos mensajes debe gestionarse en los servicios correspondientes. El endpoint no registra el contenido ni las respuestas sensibles del proveedor.

## Comprobaciones locales

```sh
node --test test/support-request.test.mjs
npm run build
```
