# WhatsApp Mock Checkout Flow

## Documento fuente
- Este documento se mantiene como checklist operativo de validacion en canal.
- Fuente funcional/roadmap principal:
  - `docs/checkout-payments-roadmap.md`
  - `docs/smtp-transactional-emails.md`
  - `docs/pdf-purchase-receipt.md`

## Estado implementado
- Inicio deterministico de checkout desde texto:
  - `confirmar compra`
  - `finalizar compra`
  - `comprar carrito`
  - `pagar pedido`
  - `simular pago`
  - `checkout`
  - `pagar`
- Inicio tambien desde seleccion interactiva existente `cart:checkout_mock`.
- Confirmacion final por texto: `si confirmar` o `sí confirmar`.
- Cancelacion por texto: `cancelar` (solo cuando hay checkout activo en contexto).

## Estados conversacionales usados
Se guardan en `conversation_states.context.checkoutState`:
- `CHECKOUT_WAITING_CONFIRMATION`
- `CHECKOUT_COMPLETED`
- `CHECKOUT_FAILED`

## Idempotencia fuerte implementada (2026-05-11)
- Inbound WhatsApp:
  - `messages` ahora tiene indice unico:
    - `UQ_messages_company_channel_message_notnull (companyId, source_channel, channel_message_id)`.
  - Se mantiene compatible con mensajes internos:
    - `channel_message_id` puede ser `NULL` y no bloquea inserts internos.
- Checkout confirm:
  - Se agrega `idempotencyKey` por confirmacion de mensaje:
    - formato actual: `whatsapp:<channel>:<channelMessageId>`.
  - Reintento del mismo mensaje no crea orden duplicada.
- Concurrencia carrito:
  - `cart_sessions.status` ahora usa transicion atomica:
    - `active -> checkout_pending -> checked_out|active`.
  - Si otro proceso intenta confirmar al mismo tiempo, no crea segunda orden.
- Transacciones mock:
  - `payment_transactions` ahora guarda:
    - `cart_session_id`
    - `idempotency_key`
  - Constraint unico:
    - `UQ_payment_transactions_company_idempotency (company_id, idempotency_key)`.

## Flujo
1. Usuario navega catalogo y agrega productos.
2. Usuario pide checkout.
3. Bot responde resumen:
   - productos
   - cantidades
   - subtotal/total
   - moneda
4. Bot solicita confirmacion final.
5. Usuario confirma.
6. Backend simula pago mock.
7. Si pago `approved`:
   - crea `orders`
   - crea `order_items`
   - crea `payment_transactions`
   - limpia `cart_items`
   - marca `cart_sessions.status = checked_out`
8. Si pago `rejected|pending|error`:
   - no crea orden
   - mantiene carrito activo
   - guarda transaccion mock
   - responde para reintentar

## Validacion de sesion actual (2026-05-11)
- El flujo fue probado en WhatsApp.
- Confirmado:
  - `checkout_confirm` detectado,
  - orden creada,
  - items creados,
  - `payment_transactions` registrada,
  - respuesta enviada al usuario.
- Correo:
  - confirmacion de compra por SMTP Gmail probada en OK tras corregir `.env`.

## Actualizacion de validaciones (2026-05-12)
- Correo de bienvenida onboarding: **OK**.
- Recibo PDF adjunto en confirmacion de compra: **OK**.
- Pago se mantiene mock; orden/trazabilidad siguen reales.

## Incidencia de limpieza de datos de prueba
- Al borrar customers de prueba con historial de checkout, se observo:
  - `Error Code: 1451 ... FK_payment_transactions_order ...`
- Requiere:
  - revisar politica de FK para testing vs produccion,
  - definir estrategia de limpieza segura en dev/test.

## Limites del mock
- No hay pasarela real.
- No se cobra dinero real.
- No se emiten webhooks de terceros.
- El handler de WhatsApp no llama Meta real en pruebas unitarias.

## Politica de datos sensibles
- No se guarda PAN.
- No se guarda CVV.
- No se guarda expiracion de tarjeta.
- Solo metadatos mock seguros (`method_type`, `last4`, `brand`, `provider`).

## Pendiente para pasarela real
- Configuracion multi-tenant por proveedor (`api keys`, `webhook secret`, ambiente).
- Webhooks de conciliacion.
- Estados asincronos de autorizacion/captura/reembolso.
- Idempotencia de pagos por `provider_reference` y `checkout_intent_id`.

## Como probar duplicados (checklist rapido)
1. Enviar confirmacion `si confirmar` con un `channel_message_id` dado.
2. Reenviar el mismo evento webhook con el mismo `channel_message_id`.
3. Verificar:
   - no se crea segunda orden,
   - no se crean `order_items` duplicados,
   - no se crea segunda `payment_transaction` con misma `idempotency_key`.
4. Enviar una nueva confirmacion con `channel_message_id` diferente:
   - debe comportarse como intento nuevo (si el carrito sigue `active`).

## Pendientes de validacion de la fase mock
1. Probar manualmente el flujo completo real desde WhatsApp.
2. Volver a correr tests unitarios antes de merge.
3. Verificar/aplicar migracion de `payment_transactions` en entorno local si falta aplicar.
4. Validar no duplicacion de ordenes ante mensajes repetidos.
5. Validar cancelacion de checkout en conversacion real.
6. Validar escenarios negativos integrados:
   - carrito vacio
   - producto inactivo
   - categoria inactiva
   - stock insuficiente
