# Checkout Mock, Pagos y UX Conversacional - Roadmap Tecnico

## Estado de partida (2026-05-09)
- Catalogo conversacional activo por tenant (`companyId`).
- Carrito persistente activo (`cart_sessions`, `cart_items`).
- Seleccion de categoria/producto y acciones de carrito con listas interactivas.
- Contexto temporal conversacional desacoplado de persistencia real.

## 1) Progreso implementado hoy (resumen)

### Eliminacion de hardcodeos productivos
- Resolucion dinamica de categorias desde BD por tenant.
- Eliminacion de branding hardcodeado del asistente.
- Configuracion de bienvenida/contexto IA por empresa.

### Contexto conversacional
- Uso de `lastSelectedProductId` y `lastSelectedCategoryId` con limpieza controlada.
- Carrito persiste en BD y no depende del contexto temporal.

### UX conversacional
- Flujos interactivos de catalogo/producto/carrito con fallback seguro.
- Cumplimiento de limite Meta (max 10 rows por interactive list).

### Observabilidad
- Logs de trazabilidad para:
  - `CategoryResolver`
  - `InboundRouter`
  - `ConversationContext`
  - `CompanyAssistantConfig`
  - `CartUX` / `ProductUX`
  - `WhatsAppSender`

## 2) Problemas reales encontrados y solucionados

1. Limite de Meta (10 rows)
- Sintoma: error `(#131009)`.
- Solucion: listas de carrito desacopladas (overview + gestion por item) y defensa de limite.

2. Contexto contaminado por ultimo producto
- Sintoma: acciones/producto previo aparecia en flujos de categoria/carrito.
- Solucion: limpieza selectiva de contexto de producto antes de flujos deterministas.

3. Categorias hardcodeadas
- Sintoma: necesidad de tocar codigo para nuevas categorias.
- Solucion: matching dinamico por categorias activas tenant-scoped.

4. Dependencia excesiva de IA para intents simples
- Sintoma: respuestas inconsistentes para catalogo/carrito.
- Solucion: routing deterministico previo a IA para intents generales.

5. Fallback IA (429/proveedor)
- Sintoma: degradacion de conversacion por cuota.
- Solucion aplicada en sesiones previas: arquitectura multi-provider + fallback operativo.

6. Producto unico mostrando solo acciones
- Sintoma: detalle incompleto en algunas rutas.
- Solucion: envio de detalle completo antes de acciones.

7. Carrito enviando primer producto visualmente
- Sintoma: ruido UX en `ver carrito`.
- Solucion: carrito ahora envia solo resumen + gestion interactiva.

8. Resolucion parcial de categorias
- Sintoma: matching incompleto para texto libre.
- Solucion: normalizacion + matching dinamico por nombre/slug/alias derivado.

## 3) Checkout mock / orden mock (implementado)
## Estado actualizado (2026-05-10)
- `ConfirmCartCheckoutUseCase` implementado.
- `MockPaymentProvider` implementado con escenarios:
  - `approved`
  - `rejected`
  - `pending`
  - `error`
- Tabla nueva `payment_transactions` implementada via migracion:
  - `1710000000011-AddPaymentTransactions`
- Integracion en WhatsApp:
  - trigger deterministico por texto para checkout.
  - confirmacion final por texto antes de crear orden.
  - cancelacion de checkout manteniendo carrito.

### Seguridad de datos
- No se guardan datos sensibles de tarjeta.
- Solo se persisten metadatos mock seguros (`method_type`, `last4`, `brand`, `provider`).

## Flujo implementado
1. Usuario agrega productos al carrito.
2. Usuario solicita confirmar compra.
3. Backend abre `checkout_mock`.
4. Confirmacion de datos clave (cliente, items, total, direccion opcional).
5. Generacion de `order` y `order_items` (mock).
6. Persistencia y cierre de estado de checkout.
7. Generacion de factura mock (estructura inicial).
8. Confirmacion final por WhatsApp.

## Estados usados actualmente
- Conversacion (`conversation_states.context.checkoutState`):
  - `CHECKOUT_WAITING_CONFIRMATION`
  - `CHECKOUT_COMPLETED`
  - `CHECKOUT_FAILED`
- Carrito (`cart_sessions.status`):
  - `active`
  - `checked_out`
  - `expired`
  - `abandoned`

## Validaciones aplicadas antes de crear orden
- carrito activo
- carrito no vacio
- producto activo
- categoria activa
- stock suficiente

## Tablas involucradas
- `cart_sessions`
- `cart_items`
- `orders`
- `order_items`

## Relacion esperada
`cart -> checkout -> order -> invoice`

## 4) Integracion futura de pasarela de pagos (roadmap)
- No implementado en esta fase (solo mock).

## Providers posibles
- Stripe
- MercadoPago
- Wompi
- PayU

## Capacidades objetivo
- checkout links
- recepcion de webhooks
- estados de pago
- transacciones e intentos
- pagos pendientes/aprobados/rechazados

## Multi-tenant de pagos
Cada empresa debe poder configurar:
- API keys
- public keys
- webhook secret
- provider activo
- configuracion fiscal

## Tabla sugerida (futura)
`company_payment_configs`
- `company_id`
- `provider`
- `public_key`
- `secret_key`
- `webhook_secret`
- `environment`
- `enabled`
- `metadata_json`

## Cumplimiento y seguridad
- No guardar tarjetas.
- No almacenar CVV.
- Cumplir PCI delegando datos sensibles al provider.
- Guardar solo referencias/token/payment intent cuando aplique.

## Tabla implementada en fase mock
`payment_transactions`
- `id`
- `company_id`
- `customer_id`
- `order_id` (nullable)
- `provider`
- `status`
- `amount`
- `currency`
- `mock_reference`
- `method_type`
- `last4`
- `brand`
- `metadata_json`
- `created_at`
- `updated_at`

Migracion:
- `1710000000011-AddPaymentTransactions`

## 5) Facturacion electronica futura
- Factura mock inicial.
- PDF futuro.
- Numeracion y consecutivos.
- Subtotal/impuestos/descuentos/totales.
- Integracion futura DIAN/servicio fiscal.
- Envio por email/WhatsApp.

## 6) Testing (estado actual y pendientes)

## Unit tests implementados
- `MockPaymentProvider` (approved/rejected/pending/error).
- `ConfirmCartCheckoutUseCase` (positivos y negativos base).
- Handler WhatsApp para checkout mock (inicio/confirmacion/cancelacion/no interferencia base).

## Pendiente de validacion
- rerun completo de tests antes de merge.
- pruebas manuales reales por WhatsApp.
- validar anti-duplicado de ordenes ante mensajes repetidos.
- validar escenarios de cancelacion y errores de negocio en ambiente integrado.

## E2E tests pendientes
- `WhatsApp -> carrito -> checkout -> orden mock`

## 7) Mejoras futuras UX conversacional
- respuestas mas naturales/humanas
- botones mas contextuales
- templates WhatsApp
- onboarding conversacional refinado
- recomendaciones IA
- upselling/cross-selling
- catalogo visual enriquecido
- paginacion avanzada
- soporte multimedia
- respuestas localizadas por tenant

## 8) Principios de arquitectura a mantener
- arquitectura hexagonal
- desacople de adapters externos
- multi-tenant por `companyId`
- providers IA desacoplados
- datos comerciales desde BD
- evitar hardcodeos productivos
- separar logica deterministica de IA
- WhatsApp como adapter
- tools como capa de negocio
