# Products Conversational Tools

## Scope Delivered
- Conversational product tools integrated into assistant runtime.
- All product queries are tenant-scoped by `companyId`.
- No order creation in this phase.

## Tools Implemented
- `CRM_GET_PRODUCTS`
  - General active catalog by company.
- `CRM_SEARCH_PRODUCTS`
  - Text search by name/description/brand.
- `CRM_GET_PRODUCT_BY_NAME`
  - Approximate product name matching.
- `CRM_FILTER_PRODUCTS_BY_PRICE`
  - Price filters (`minPrice`, `maxPrice`).
- `CRM_GET_PRODUCT_STOCK`
  - Availability / stock lookup.

## Security and Tenant Isolation
- Every query uses `context.companyId`.
- Repository layer filters by `companyId` in all methods.
- Cross-company product leakage is prevented by design.

## Intent Mapping
- "qué productos tienen", "catálogo" -> `CRM_GET_PRODUCTS`
- "tienen laptops", "muéstrame celulares" -> `CRM_SEARCH_PRODUCTS`
- "tienen iPhone 15" -> `CRM_GET_PRODUCT_BY_NAME`
- "menores a 500000", "baratos" -> `CRM_FILTER_PRODUCTS_BY_PRICE`
- "hay stock", "cuántas unidades quedan" -> `CRM_GET_PRODUCT_STOCK`

## Deferred
- `product_categories` table.
- `suppliers` table.
- Order creation from chat (intentionally disabled in this phase).

## Validation Status
- Backend implementation completed.
- Full conversational validation is partially pending due to OpenAI API quota limits (`429`).
- Priority test sequence once quota is available:
  1. general catalog query,
  2. text search by category/brand,
  3. approximate name search,
  4. price-range filtering,
  5. stock availability responses.

## Next Backend Steps
1. Execute full E2E conversational tests once provider quota is available.
2. Validate strict tenant isolation in every scenario (`companyId` scoped queries only).
3. Add robust fallback responses when AI provider fails during product intents.
4. Keep order creation disabled until dedicated order phase is enabled.

## Estado actualizado (2026-05-08)

### Fase 2 de catalogo (completada)
- Categorias implementadas en backend.
- Relacion `products.category_id` activa.
- Tools de categorias implementadas:
  - `CRM_GET_CATEGORIES`
  - `CRM_SEARCH_CATEGORIES`
  - `CRM_GET_PRODUCTS_BY_CATEGORY`
  - `CRM_GET_CATEGORY_BY_NAME`
- Tools de productos extendidas:
  - `CRM_SEARCH_PRODUCTS_BY_CATEGORY_OR_TEXT`
  - `CRM_GET_PRODUCTS_BY_CATEGORY_AND_PRICE`
- Regla de seguridad conversacional vigente:
  - solo categorias activas,
  - solo productos activos,
  - exclusion de productos en categorias inactivas.

### Capacidades conversacionales actuales
- Resolucion de categoria por intencion (incluyendo sinonimos basicos).
- Filtro categoria + precio en flujo IA.
- Listas interactivas iniciales para categorias y productos.
- Fallback a texto si Meta rechaza lista interactiva.

### Pendiente prioritario (siguiente fase)
- UX avanzada de catalogo en WhatsApp:
  - paginacion,
  - navegacion conversacional,
  - seleccion y detalle de producto,
  - estado de navegacion temporal por conversacion.

## Estado consolidado (2026-05-09)

### Catalogo conversacional - lo que ya funciona
- Solo se muestran categorias activas y productos activos.
- Soporte de listas interactivas para categorias y productos.
- Seleccion de categoria con `category:<id>` resuelta por backend.
- Seleccion de producto con `product:<id>` resuelta de forma deterministica por backend.
- Visualizacion individual del producto seleccionado (sin mezclar catalogo general).
- Integracion de imagen de producto mediante `imageUrl` (Cloudinary) con fallback de texto.
- Filtrado multi-tenant por `companyId` en todo el flujo.
- Fallback a texto cuando falla envio de lista interactiva en Meta.

### Carrito virtual - estado implementado (Fase A/B)
- Persistencia en base de datos:
  - `cart_sessions`
  - `cart_items`
- Expiracion de sesion a 3 dias (`expires_at`).
- Snapshots por item:
  - `productNameSnapshot`
  - `unitPriceSnapshot`
  - `imageUrlSnapshot`
  - `currencySnapshot`
- Tools implementadas:
  - `CART_GET_ACTIVE_SESSION`
  - `CART_ADD_ITEM`
  - `CART_VIEW`
  - `CART_UPDATE_ITEM_QUANTITY`
  - `CART_REMOVE_ITEM`
  - `CART_CLEAR`
  - `CART_EXPIRE_OLD_SESSIONS`
- Validaciones activas:
  - producto activo
  - categoria activa (si aplica)
  - stock suficiente
- Integracion WhatsApp basica:
  - desde detalle de producto se habilita agregar al carrito
  - soporte por seleccion interactiva y fallback texto

### Problemas UX/UI y de flujo conversacional pendientes

#### 1) Categoria con un solo producto
- Problema:
  - cuando la categoria tiene un solo producto, la experiencia puede caer a texto directo y perder consistencia de interfaz.
- Mejora pendiente:
  - mantener UX consistente con lista/card y navegacion uniforme aunque haya un solo resultado.

#### 2) Acciones mezcladas en seleccion de producto
- Problema:
  - en el detalle de producto pueden aparecer acciones globales no ideales para ese contexto.
- Mejora pendiente:
  - mostrar solo acciones contextuales del producto actual:
    - agregar al carrito
    - ver descripcion/caracteristicas
    - elegir cantidad
    - ver mas productos
    - cambiar categoria
    - cancelar
  - evitar acciones globales prematuras (ej. limpiar carrito) en ese punto.

#### 3) Reconocimiento de intencion "agregar este producto"
- Problema:
  - frases naturales como "agrega este producto" no siempre se resuelven con el item correcto si falta contexto conversacional fuerte.
- Mejora pendiente:
  - reforzar memoria del producto seleccionado y matching contextual implicito.
  - confirmar agregado y cantidad de forma mas natural.

#### 4) Carrito aun muy orientado a texto
- Problema:
  - aunque funcional, el carrito depende bastante de fallback textual.
- Mejora pendiente:
  - evolucionar a experiencia interactiva completa:
    - lista de items
    - total parcial
    - acciones de cantidad/remocion/limpieza
    - seguir comprando / volver a catalogo
    - checkout mock en siguiente fase

### Siguientes fases prioritarias recomendadas
1. Refinar UX conversacional de productos.
2. Refinar UX conversacional del carrito.
3. Mantener consistencia de listas interactivas aun con 1 resultado.
4. Mejorar manejo contextual de producto seleccionado.
5. Mejorar reconocimiento implicito de "agregar al carrito".
6. Implementar navegacion conversacional persistente (volver/cambiar categoria/ver mas).
7. Implementar carrito interactivo completo.
8. Implementar checkout mock.
9. Generar orden desde carrito en flujo controlado.
10. Endurecer pruebas unitarias/E2E del flujo conversacional.

### Testing recomendado (pendiente)
- seleccion de producto unico
- seleccion de producto en categorias multiples
- agregar producto implicito por contexto
- agregar producto por `cart_add:*`
- aumentar/reducir cantidad
- limpiar carrito
- expiracion de carrito
- checkout mock (fase siguiente)
- persistencia conversacional de contexto
- idempotencia de eventos WhatsApp/interacciones repetidas

## Roadmap siguiente fase
- Checkout mock, orden mock, pagos futuros y facturacion: ver `docs/checkout-payments-roadmap.md`.
- Este documento mantiene foco en tools/UX de catalogo y carrito conversacional.
