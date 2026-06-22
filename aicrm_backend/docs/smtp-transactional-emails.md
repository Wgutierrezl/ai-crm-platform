# SMTP Gmail - Correos Transaccionales HTML

## Estado implementado y validado (2026-05-12)
- Envio transaccional HTML activo por arquitectura hexagonal:
  - Puerto: `EmailSenderPort`
  - Adapter: `GmailSmtpEmailSender`
  - Servicio: `TransactionalEmailService`
- Pruebas funcionales validadas:
  - correo HTML de confirmacion de compra: **OK**,
  - correo HTML de bienvenida onboarding/registro: **OK**.
- Incidencia operativa previa resuelta:
  - causa inicial: configuracion incorrecta en `.env`,
  - estado final: envio SMTP estable tras correccion.

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
  - logo corporativo por tenant (si existe)
  - para compra: items, cantidades, subtotales y total.

## Politica de resiliencia
- Si falla carga de logo:
  - se usa fallback visual con nombre de empresa
  - no se bloquea el envio del correo
- Si SMTP falla:
  - se registra log de error,
  - NO se revierte onboarding ni orden,
  - NO se rompe flujo de WhatsApp.

## Adjuntos PDF (estado actual)
- Confirmacion de compra envia adjunto PDF real de recibo cuando se genera correctamente.
- `EmailSenderPort` soporta `attachments` opcionales.
- `GmailSmtpEmailSender` soporta `multipart/mixed` + adjuntos base64.
- Si falla generacion de PDF:
  - se registra log,
  - se envia correo sin adjunto,
  - no se revierte orden.

## Limitaciones y siguientes pasos
1. No hay outbox/queue de reintentos asincronos todavia.
2. Validacion de email es de formato (no verifica inbox real).
3. Mejorar tracking de entregabilidad (bounce/reject) en fase posterior.

## Referencias
- Detalle de recibo PDF: `docs/pdf-purchase-receipt.md`
- Estado checkout/pagos mock: `docs/checkout-payments-roadmap.md`
