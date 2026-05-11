# WhatsApp Mock Checkout Flow

## Documento fuente
- Este documento es la referencia principal del flujo mock de checkout por WhatsApp.
- Complementa a `docs/checkout-payments-roadmap.md` (roadmap y evolucion).

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
