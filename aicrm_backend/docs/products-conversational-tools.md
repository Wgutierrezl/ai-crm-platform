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
