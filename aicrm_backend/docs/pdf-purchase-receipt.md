# Recibo PDF de Compra (Mock Checkout)

## Estado
- Implementado y validado (2026-05-12).
- Pago sigue siendo mock.
- Orden, items y transaccion son reales en BD.
- Envio de adjunto por correo de confirmacion: **OK**.

## Objetivo
Generar un PDF real por compra aprobada (`checkout mock approved`) y adjuntarlo al correo de confirmacion SMTP.

## Arquitectura (hexagonal)
- Puerto dominio:
  - `PdfReceiptGeneratorPort`
- Adapter infraestructura:
  - `PdfkitReceiptGenerator`
- Orquestacion:
  - `TransactionalEmailService` solicita el PDF y lo adjunta si esta disponible.
- Envio:
  - `EmailSenderPort` soporta `attachments` opcionales.
  - `GmailSmtpEmailSender` envia `multipart/mixed`.

## Datos incluidos en el PDF
- empresa/tenant
- id de orden
- fecha de compra
- cliente (nombre/email/telefono si existe)
- items (producto, cantidad, precio unitario, subtotal)
- total y moneda
- estado de pago mock
- referencia de payment transaction
- nota legal visible:
  - `Este recibo corresponde a una compra simulada en entorno de prueba. No es una factura legal.`

## Resiliencia
- Si falla PDF:
  - log de error
  - correo se envia sin adjunto
  - no rollback de orden
- Si falla SMTP:
  - log de error
  - no rollback de orden
  - flujo de WhatsApp continua

## Multi-tenant
- El flujo recibe `companyId` y resuelve nombre de empresa por tenant.
- El contenido del recibo se construye con datos del tenant y de la orden del tenant.

## Limitaciones actuales
1. El layout visual del PDF es funcional, pero requiere mejora de diseño (tipografia, jerarquia visual, espaciado y branding).
2. No reemplaza facturacion legal/electronica.

## Pendiente priorizado
1. Mejorar diseño visual del PDF sin cambiar su naturaleza (recibo de prueba).
2. Agregar pruebas E2E del flujo `checkout approved -> email con adjunto PDF`.

## Referencias
- SMTP y resiliencia de correo: `docs/smtp-transactional-emails.md`
- Roadmap de checkout/pagos mock: `docs/checkout-payments-roadmap.md`
