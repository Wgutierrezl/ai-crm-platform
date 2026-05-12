# PROGRESS - AI CRM Backend

Fecha de actualizacion: 2026-05-12

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
