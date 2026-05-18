# PROGRESS - AI CRM Backend

Fecha de actualizacion: 2026-05-12

## Actualizacion 2026-05-17 - Relacion producto -> proveedor (fase 1)

### Implementado
- Relacion de datos:
  - `products.supplier_id` nullable.
  - `ManyToOne` `Product -> Supplier`.
  - `OneToMany` `Supplier -> Products`.
- Migracion nueva:
  - `1710000000017-AddProductSupplierRelation`.
  - agrega `supplier_id` nullable en `products`.
  - agrega FK `products.supplier_id -> suppliers.id` con:
    - `ON DELETE SET NULL`
    - `ON UPDATE CASCADE`
- Productos:
  - `CreateProductDto` y `UpdateProductDto` ahora soportan `supplierId` opcional/null.
  - create/update validan que `supplierId` exista y pertenezca al mismo `companyId`.
  - permite productos sin proveedor.
  - permite quitar proveedor enviando `supplierId: null`.
- Suppliers:
  - endpoint nuevo `GET /api/v1/suppliers/:id/products`.
  - valida ownership por tenant y devuelve lista (vacía si no hay productos).
- Respuesta de productos:
  - incluye `supplierId` y `supplier` minimo (`id`, `name`, `isActive`) cuando aplica.

### Alcance controlado
- Sin cambios en WhatsApp/Bot, IA providers, checkout, PDF/correos u OAuth.
- Sin relacion muchos-a-muchos (`product_suppliers` no aplica en esta regla).

### Validacion adicional 2026-05-17 (tests backend)
- Se agrego cobertura especifica de relacion producto-proveedor:
  - create product con `supplierId` valido del mismo tenant.
  - rechazo de `supplierId` inexistente.
  - rechazo de `supplierId` de otro tenant.
  - create product sin `supplierId`.
  - update product con `supplierId: null` para quitar proveedor.
  - consulta de productos por proveedor aislada por tenant.
- Spec agregado:
  - `src/application/use-cases/product-supplier-relation.use-case.spec.ts`.

## Actualizacion 2026-05-17 - Suppliers backend fase 1

### Implementado
- Nuevo modulo backend `suppliers` (fase inicial) respetando arquitectura hexagonal y multi-tenant.
- Dominio:
  - entidad `Supplier`.
  - puerto `SupplierRepository`.
- Infraestructura:
  - entidad ORM `SupplierOrmEntity`.
  - repositorio TypeORM `SupplierTypeormRepository`.
  - migracion `1710000000016-AddSuppliers` para tabla `suppliers`.
- Application use cases:
  - `CreateSupplierUseCase`
  - `GetSuppliersByCompanyUseCase`
  - `GetSupplierByIdUseCase`
  - `UpdateSupplierUseCase`
  - `UpdateSupplierStatusUseCase`
- Interfaces HTTP:
  - DTOs:
    - `CreateSupplierDto`
    - `UpdateSupplierDto`
    - `UpdateSupplierStatusDto`
  - Controller:
    - `GET /api/v1/suppliers`
    - `POST /api/v1/suppliers`
    - `GET /api/v1/suppliers/:id`
    - `PATCH /api/v1/suppliers/:id`
    - `PATCH /api/v1/suppliers/:id/status`
- Registro en `AppModule`:
  - entidad TypeORM,
  - controller,
  - use cases,
  - binding de puerto `SupplierRepository -> SupplierTypeormRepository`.

### Reglas de seguridad aplicadas
- Todos los endpoints con `JwtAuthGuard`.
- `companyId` se toma unicamente desde `CurrentUser` (JWT), no desde body.
- Consultas y actualizaciones restringidas por `id + companyId` para evitar acceso cross-tenant.

### Fuera de alcance en esta fase
- Sin frontend de proveedores.
- Sin relacion `product_suppliers`.
- Sin cambios en WhatsApp, checkout, providers IA o refactor general.

## Actualizacion 2026-05-15 - Firma webhook Meta WhatsApp (dynamic-first)

### Implementado
- Validacion de firma `X-Hub-Signature-256` para:
  - `POST /api/v1/webhooks/whatsapp`.
- Orden de ejecucion:
  1. validar firma,
  2. solo si es valida, ejecutar `HandleWhatsappWebhookUseCase`.
- Estrategia aplicada:
  - dynamic-first por `phone_number_id` -> `company_whatsapp_apps` -> `company_whatsapp_credentials` -> `app_secret`.
  - fallback global opcional a `META_APP_SECRET` solo si `WHATSAPP_WEBHOOK_ALLOW_GLOBAL_SECRET_FALLBACK=true`.
- Endurecimiento tecnico:
  - uso de `rawBody` real (Nest `rawBody: true`),
  - parse estricto de header `sha256=<hex>`,
  - comparacion segura con `timingSafeEqual` y validacion de longitudes,
  - rechazo temprano en falta de header/rawBody/app/credencial/secreto/firma invalida.

### Configuracion agregada/ajustada
- `WHATSAPP_WEBHOOK_VALIDATE_SIGNATURE`:
  - recomendado `false` en local/dev,
  - recomendado `true` en staging/prod.
- `WHATSAPP_WEBHOOK_ALLOW_GLOBAL_SECRET_FALLBACK`:
  - default `false`,
  - habilitar solo como puente temporal de configuracion.
- `META_APP_SECRET`:
  - usado unicamente cuando fallback global esta habilitado explicitamente.

### No incluido en esta fase
- No migraciones.
- No cifrado de secretos en BD (queda como hardening posterior).
- No cambios en `GET /api/v1/webhooks/whatsapp`.

## Actualizacion 2026-05-14 - Cierre de sesion (documentacion consolidada)

- Nota consolidada de sesion:
  - `docs/session-2026-05-14-delivery-notes.md`
- Incluye:
  - alcance Docker/backend/frontend implementado,
  - mejora de ordenes dashboard/detail,
  - incidente tecnico por lint global con `--fix`,
  - workflow Git por feature branches + PR a `master`,
  - pendientes de fases siguientes.

## Actualizacion 2026-05-14 - Dockerizacion backend + frontend

### Implementado
- Dockerizacion inicial completa sin tocar logica de negocio:
  - `aicrm_backend/Dockerfile` (build + runtime produccion).
  - `aicrm_frontend/Dockerfile` (Vite dev server en contenedor).
  - `docker-compose.yml` en raiz con servicios:
    - `backend` (puerto `3000`)
    - `frontend` (puerto `5173`)
- Soporte para DB local fuera de Docker:
  - backend en compose usa `DB_HOST=host.docker.internal`.
  - `extra_hosts` agregado para compatibilidad de resolucion.
- Ignorados Docker agregados:
  - `aicrm_backend/.dockerignore`
  - `aicrm_frontend/.dockerignore`
- Documentacion de uso:
  - `docs/dockerization-setup.md`
- Variables de ejemplo actualizadas para contexto Docker:
  - `aicrm_backend/.env.example`
  - `aicrm_frontend/.env.example`

### Alcance controlado
- No se dockerizo MySQL.
- No se ejecutaron migraciones.
- No se modificaron flujos de OAuth, WhatsApp, SMTP, PDF, checkout, carrito ni IA.

## Completado

### OAuth Google Users/Frontend (Fase 1)
- Flujo completo operativo:
  - `GET /api/v1/auth/google/start`
  - `GET /api/v1/auth/google/callback`
  - `POST /api/v1/auth/google/exchange`
  - `POST /api/v1/auth/google/complete-registration`
- Soporte de estados:
  - `authenticated`
  - `registration_required`
- Persistencia temporal de registro:
  - `oauth_registration_sessions` (TTL, one-time, `consumed_at`).
- Seguridad:
  - `email_verified` obligatorio
  - no JWT en URL
  - no `access_token`/`refresh_token` persistidos
- Correcciones:
  - fix doble exchange frontend (StrictMode/re-render)
  - guard anti-duplicado
  - limpieza de URL
  - payload exchange compatible (`authCode`/`code`)
  - logs con `traceId`
- Regla de datos corregida:
  - NO usar `identificationType=GOOGLE`
  - NO usar `identificationNumber=GOOGLE-*`
  - identificacion real se captura en complete-registration.

### OAuth Google Customers/WhatsApp (Fase 2)
- Implementado como acelerador de onboarding (no reemplaza manual).
- Tablas dedicadas:
  - `customer_oauth_link_sessions`
  - `customer_oauth_identities`
- Endpoints:
  - `POST /api/v1/customers/oauth/google/start`
  - `GET /api/v1/customers/oauth/google/callback`
- Separacion de callbacks aplicada:
  - users: `/api/v1/auth/google/callback`
  - customers: `/api/v1/customers/oauth/google/callback`
- Variables callback separadas:
  - `GOOGLE_OAUTH_USERS_CALLBACK_URL`
  - `GOOGLE_OAUTH_CUSTOMERS_WHATSAPP_CALLBACK_URL`
  - fallbacks legacy mantenidos.
- Estado post-callback corregido:
  - customer `COMPLETED` cuando Google aporta nombre + email verificado
  - no repreguntar email en WhatsApp.

### Onboarding conversacional
- Onboarding manual estable.
- Onboarding Google customers integrado.
- Correo bienvenida unificado (manual + google_oauth) con deduplicacion:
  - `customer.metadata.welcomeEmailSentAt`.

### WhatsApp UX
- Intencion OAuth por routing deterministico.
- Boton URL para OAuth customers (con fallback texto si falla Meta).
- Ajuste de texto de boton por limite Meta <=20 chars (`Usar Google`).

### Checkout mock / carrito
- Flujo restaurado tras regresion:
  1. `cart:checkout_mock` inicia checkout
  2. persiste `checkoutState=CHECKOUT_WAITING_CONFIRMATION`
  3. `si confirmar` ejecuta `ConfirmCartCheckoutUseCase`
  4. crea `orders`, `order_items`, `payment_transactions`
  5. genera PDF
  6. envia correo
- Correccion clave:
  - si no existe `conversation_state`, se crea al iniciar checkout para no perder `checkoutState`.

### SMTP Gmail + PDF
- Correo onboarding: OK.
- Correo checkout: OK.
- PDF adjunto en checkout mock aprobado: OK.
- Resiliencia:
  - falla SMTP/PDF no revierte orden ni rompe flujo WhatsApp.

### SQL limpieza dev
- Script consolidado:
  - `docs/sql-oauth-google-users-dev-cleanup.sql`
- Cobertura:
  - limpieza selectiva OAuth users dev
  - diagnosticos de inconsistencias
  - orden de borrado por FK
  - validaciones post-limpieza.

## Troubleshooting consolidado

### OAuth / Google
1. `redirect_uri_mismatch`
- causa: callback no registrado o callback mezclado users/customers.
- accion: registrar URI exacto y separar env por flujo.

2. `401` por reuso `auth_code`
- causa: doble exchange frontend.
- accion: guard anti-duplicado + URL cleanup.

3. Registro incompleto
- causa: alta directa sin completar datos negocio.
- accion: `registration_required` + `complete-registration`.

4. Customers quedaban en `WAITING_EMAIL`
- causa: cierre de onboarding no forzado tras callback exitoso.
- accion: marcar `COMPLETED` cuando nombre+email verificado.

5. Problemas ngrok/callback
- causa: cambios de dominio no reflejados en env/consola Google.
- accion: sincronizar env + redirect URIs autorizados.

### WhatsApp / Meta
1. Boton URL rechazado por longitud
- error: `display_text ... at most 20`.
- accion: reducir a `Usar Google`.

2. URL gigante enviada como texto
- accion: priorizar boton URL y fallback texto solo en error.

### Checkout
1. `si confirmar` no ejecutaba checkout
- causa raiz: `checkoutState` no persistia cuando `conversation_state` era nulo.
- accion: crear estado y guardar `CHECKOUT_WAITING_CONFIRMATION`.

## En progreso
1. UX/UI del bot conversacional.
2. HTML callback customers con mejor branding.
3. Plantillas visuales de PDF.
4. Plantillas de correo y copy conversacional.
5. Mejora de experiencia carrito/checkout en WhatsApp.

## Actualizacion 2026-05-14 - Enriquecimiento de consulta de ordenes para frontend

### Causa raiz
- `GET /orders` devolvia datos planos (solo orden base), insuficientes para panel/detalle.
- Frontend dependia de fallbacks para cliente/items/pago.

### Ajuste aplicado
- `GetOrdersByCompanyUseCase` ahora devuelve payload enriquecido por orden con:
  - customer (nombre/email/telefono),
  - items con detalle de producto,
  - payment transaction mas reciente por `orderId`.
- No se altero flujo de checkout ni creacion de ordenes/transacciones.
- No se ejecutaron migraciones ni cambios de esquema.

## Proximos pasos
1. Google Drive (fase futura).
2. Tools IA avanzadas y continuidad multi-provider.
3. Checkout real con pasarela de pagos real.
4. Branding empresarial dinamico en correos/PDF/callbacks.
5. Frontend chat en tiempo real.
6. Panel conversacional CRM.

## Documentos vigentes (fuente de verdad)
- OAuth users: `docs/google-oauth-users-frontend.md`
- OAuth customers: `docs/google-oauth-whatsapp-customers-roadmap.md`
- Onboarding: `docs/onboarding-conversational-flow.md`
- Checkout mock: `docs/whatsapp-mock-checkout-flow.md`
- SMTP: `docs/smtp-transactional-emails.md`
- PDF: `docs/pdf-purchase-receipt.md`
- SQL limpieza dev: `docs/sql-oauth-google-users-dev-cleanup.sql`

## Notas de consolidacion / legacy
- Entradas historicas antiguas de este archivo se consideran bitacora legacy.
- Para estado operativo actual, usar este resumen + docs vigentes listados arriba.
