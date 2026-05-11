# SMTP Gmail - Correos Transaccionales HTML

## Estado implementado (2026-05-11)
- Se agrego envio de correos transaccionales HTML desacoplado por puerto hexagonal:
  - Puerto: `EmailSenderPort`
  - Adapter: `GmailSmtpEmailSender`
  - Servicio de negocio: `TransactionalEmailService`

## Estado de pruebas en sesion actual
- Correo de confirmacion de compra: **probado OK**.
- Correo de bienvenida onboarding: **pendiente de prueba manual integrada**.
- Incidencia operativa detectada y resuelta:
  - causa inicial de error SMTP: copia/configuracion incorrecta de variables en `.env`.
  - estado posterior: envio correcto tras corregir `.env`.

## Variables de entorno
Configurar en `.env`:

- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=...`
- `SMTP_PASS=...`
- `SMTP_FROM=...`

Estas variables ya fueron agregadas en `.env.example`.

## Gmail App Password (requerido)
Para Gmail/Google Workspace no usar password normal de cuenta.

1. Activar verificacion en dos pasos de Google.
2. Crear un `App Password` para SMTP.
3. Usar:
   - `SMTP_USER`: correo completo (`usuario@gmail.com` o cuenta Workspace)
   - `SMTP_PASS`: App Password de 16 caracteres

## Eventos que disparan correo
1. **Bienvenida / registro completado**
- Trigger: cuando onboarding pasa a `COMPLETED`.
- Condicion: customer con email valido.

2. **Confirmacion de compra**
- Trigger: checkout mock `approved` despues de:
  - crear `Order`
  - crear `OrderItems`
  - registrar `PaymentTransaction`
- Condicion: customer con email valido.

## Plantillas HTML
- Responsive.
- Estilo profesional (header con gradiente, resumen claro).
- Personalizacion por:
  - nombre del cliente
  - nombre de empresa
  - para compra: items, cantidades, subtotales y total.

## Politica de resiliencia
- Si SMTP falla:
  - se registra log de error,
  - NO se revierte onboarding ni orden,
  - NO se rompe flujo de WhatsApp.

## Limitaciones actuales
- No hay PDF adjunto en esta fase.
- No hay cola/reintentos asincronos (job queue) todavia.
- Validacion de email es de formato (no verifica existencia real del inbox).

## Pendiente futuro
- Recibo PDF real integrado como adjunto en confirmacion de compra.
- Outbox/queue para reintentos robustos.
- Evaluar OAuth Google para reducir errores de email en onboarding (fase futura).

## Update 2026-05-11 - Adjuntos PDF en confirmacion de compra
- Se extiende `EmailSenderPort` con `attachments` opcionales.
- `GmailSmtpEmailSender` ahora soporta `multipart/mixed` + adjuntos base64.
- Se mantiene compatibilidad completa:
  - welcome onboarding sin adjuntos,
  - confirmacion de compra con adjunto PDF cuando se genera correctamente.
- Resiliencia:
  - si falla generacion de PDF, se loguea error y se envia correo sin adjunto.
  - si falla SMTP, no revierte orden ni rompe flujo WhatsApp.
