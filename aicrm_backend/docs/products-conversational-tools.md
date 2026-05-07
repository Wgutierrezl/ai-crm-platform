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
