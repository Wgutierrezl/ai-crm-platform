# Google OAuth Users + WhatsApp Customers Roadmap (Analisis Tecnico)

Fecha: 2026-05-12

## A. Diagnostico actual

### Que ya existe
- OAuth Google para `users` frontend:
  - `GET /auth/google/start`
  - `GET /auth/google/callback`
  - `POST /auth/google/exchange`
- Seguridad base vigente:
  - `state` temporal one-time con TTL (`OauthTempStorePort` + adapter en memoria).
  - `auth_code` temporal one-time para no exponer JWT en URL.
- Persistencia OAuth actual:
  - `oauth_identities` (FK a `users`).
- Onboarding WhatsApp vigente:
  - `HandleWhatsappWebhookUseCase` como adapter de canal.
  - `HandleInboundChannelMessageUseCase` como orquestador de negocio.
  - `external_identities` para identidad de canal (`wa_id`/phone -> customer).
  - `conversation_states` para estado de onboarding y contexto.

### Problema actual
En `HandleGoogleCallbackUseCase`, si Google trae un usuario nuevo y `email_verified=true`:
- se crea inmediatamente `company + user admin + oauth_identity`,
- con datos tecnicos de identificacion (`GOOGLE`),
- y luego se emite auth code para JWT.

Resultado: alta empresarial incompleta para CRM.

### Modulos reutilizables
- `GoogleOidcProviderPort` y `GoogleOidcAdapter`.
- `OauthTempStorePort` como patron para tokens temporales one-time.
- `HandleInboundChannelMessageUseCase` + `conversation_states` para continuar onboarding sin romper flujo.
- `external_identities` para amarrar contexto WhatsApp (`companyId + channel + wa_id`).

## B. Propuesta para OAuth Google Users/Frontend

### Flujo recomendado
1. `GET /auth/google/start`: igual (genera state).
2. `GET /auth/google/callback`:
   - valida state,
   - obtiene perfil OIDC,
   - valida `email_verified=true`.
3. Si identidad Google ya existe:
   - emite `auth_code` de autenticacion normal.
4. Si usuario nuevo:
   - no crea user/company aun,
   - crea sesion temporal de registro,
   - emite `auth_code` orientado a `registration_required`.
5. `POST /auth/google/exchange`:
   - si auth completo: devuelve JWT.
   - si pendiente: devuelve `registration_required` + `registrationToken`.
6. `POST /auth/google/complete-registration`:
   - consume `registrationToken` one-time,
   - crea `company + user admin + oauth_identity` en transaccion,
   - emite JWT final.

### Cambios backend
- Ajustar `HandleGoogleCallbackUseCase` para no autocrear usuario final en nuevos.
- Extender payload temporal OAuth para soportar estado `pending_registration`.
- Nuevo use case `CompleteGoogleRegistrationUseCase`.
- Nuevo endpoint `POST /auth/google/complete-registration`.

### Cambios frontend
- Manejar `status` de `exchange`:
  - `authenticated` -> login normal.
  - `registration_required` -> pantalla de completar registro.
- Form obligatorio:
  - `companyName`,
  - `identificationType` (`CC`/`NIT`),
  - `identificationNumber`.

### Cambios de BD
Recomendado: nueva tabla `oauth_registration_sessions`.
Campos sugeridos:
- `id`
- `provider` (`google`)
- `provider_user_id`
- `email`
- `email_verified`
- `full_name`
- `picture_url`
- `state`
- `expires_at`
- `consumed_at`
- `created_at`

### Endpoints sugeridos
- Mantener:
  - `GET /auth/google/start`
  - `GET /auth/google/callback`
  - `POST /auth/google/exchange`
- Nuevo:
  - `POST /auth/google/complete-registration`

### Estado `registration_required`
Contrato sugerido:
- `POST /auth/google/exchange` (nuevo user)
  - `{ status: "registration_required", registrationToken, email, fullName, expiresAt }`

## C. Propuesta para OAuth Google Customers/WhatsApp

### Viabilidad
Viable con arquitectura actual sin romper hexagonal:
- WhatsApp sigue adapter.
- OAuth sigue integracion desacoplada.
- Estado de onboarding permanece en `application`.

### Flujo recomendado
1. Customer escribe por WhatsApp (nuevo/incompleto).
2. Bot ofrece:
   - "Registrar manualmente"
   - "Continuar con Google"
3. Si elige Google:
   - backend genera `customer_oauth_link_session` (TTL + one-time).
   - backend responde mensaje con link seguro OAuth.
4. Google callback:
   - valida state y sesion,
   - valida `email_verified=true`,
   - vincula identidad Google al `customer` correcto,
   - actualiza `customer` (nombre/email/foto metadata) sin perder `companyId/conversationId/wa_id`.
5. Bot notifica por WhatsApp y continua onboarding solo con campos faltantes.

### Cambios backend
- Nuevo endpoint de inicio link OAuth customer (invocado por flujo conversacional interno).
- Nuevo callback OAuth customer (separado del callback users).
- Nuevo use case para vincular perfil Google a customer con guardas de tenancy.
- Hook en `HandleInboundChannelMessageUseCase` para intent/boton `onboarding_google_start`.

### Cambios WhatsApp UX
- Mensaje corto inicial.
- Opcion interactiva primaria para Google.
- Fallback a texto con link si falla interactivo.
- Mensaje post-callback:
  - exito: "Listo, vinculamos tu Google. Continuemos con..."
  - cancel/fallo: "No se completo Google. Puedes seguir manualmente."

### Tablas/migraciones sugeridas
1. `customer_oauth_identities`
- `id`
- `company_id`
- `customer_id`
- `provider`
- `provider_user_id`
- `email`
- `email_verified`
- `display_name`
- `picture_url`
- `linked_at`
- `created_at`
- `updated_at`

Indices unicos sugeridos:
- `(company_id, provider, provider_user_id)`
- `(company_id, provider, customer_id)`

2. `customer_oauth_link_sessions`
- `id`
- `company_id`
- `customer_id`
- `conversation_id`
- `channel` (`whatsapp`)
- `external_user_id` (`wa_id`)
- `state_token`
- `expires_at`
- `consumed_at`
- `result_status`
- `created_at`

### Como continuar onboarding tras Google
- Recalcular `missing_fields` con datos nuevos.
- Mantener y actualizar `conversation_states.registration_step`.
- Continuar solo preguntas faltantes (documento, ciudad, direccion, etc.).
- Mantener fallback manual siempre disponible.

## D. Recomendacion arquitectonica

### Que reutilizar
- `GoogleOidcProviderPort` y adapter actual.
- Patron de tokens one-time del store temporal (concepto; no necesariamente in-memory para produccion).
- `external_identities` y `conversation_states` en WhatsApp onboarding.

### Que separar
- `oauth_identities` (users internos) separado de OAuth customer.
- identidad de canal (`external_identities`) separada de identidad OAuth (`customer_oauth_identities`).
- sesiones OAuth users separadas de sesiones OAuth customers WhatsApp.

### Que NO mezclar
- No reutilizar `oauth_identities` para customer:
  - hoy tiene FK a `users`.
  - mezclaria bounded contexts internos vs clientes finales.
- No convertir `external_identities` en tabla polivalente OAuth:
  - romperia semantica actual de identidad de canal.

### Riesgos si se reutiliza mal `oauth_identities`
- Ambigedad de ownership (`userId` vs `customerId`).
- Mayor riesgo de account takeover cruzado.
- Reglas de unicidad no compatibles con multi-tenant customer.
- Complejidad y deuda en consultas/autorizacion.

## E. Roadmap por fases

### Fase 1: Completar registro Google frontend para Users
- Agregar `registration_required`.
- Crear `oauth_registration_sessions`.
- Nuevo endpoint `complete-registration`.
- Frontend obligatorio de completar datos empresariales.

### Fase 2: DiseÃ±ar tablas/sesiones OAuth para Customers WhatsApp
- Crear `customer_oauth_identities`.
- Crear `customer_oauth_link_sessions`.
- Definir reglas de unicidad y TTL/consumo.

### Fase 3: Implementar link/boton WhatsApp "Continuar con Google"
- Intent deterministico en onboarding.
- Mensajes interactivos + fallback texto/link.

### Fase 4: Vincular Google profile con Customer y continuar onboarding
- Callback customer OAuth.
- Update de customer + conversation state.
- Reanudacion de preguntas faltantes.

### Fase 5: Tests unitarios/e2e
- Cobertura de seguridad, expiracion, vinculos y fallback manual.

## F. Testing sugerido

### Users/frontend
- user nuevo con Google requiere completar registro.
- user existente con Google hace login directo.
- auth_code one-time (doble consumo falla).
- state expirado (callback rechazado).

### Customers/WhatsApp
- customer WhatsApp inicia OAuth.
- customer completa Google OAuth.
- customer cancela Google OAuth.
- customer vuelve a onboarding manual.
- intento de reutilizar link expirado.
- intento de vincular Google a customer incorrecto.
- intento de callback con state de otra conversacion/company.

## Seguridad
- No exponer JWT en URL.
- `state` temporal con TTL y one-time use.
- Validar `email_verified`.
- No guardar `access_token` ni `refresh_token`.
- No loguear tokens ni datos sensibles completos.
- Validar que callback corresponda al contexto iniciador (company/customer/conversation/wa_id).
- Expiracion y consumo atomico de links OAuth.
- Fallback robusto al onboarding manual.

## Decisiones pendientes
- Definir si el store temporal pasa de in-memory a persistente para OAuth users tambien.
- Definir URL exactas frontend para estados:
  - success-authenticated
  - success-registration-required
  - failure/cancel.
- Definir politicas de relink Google para customer existente.

## Decision recomendada
- Que haria primero:
  - implementar Fase 1 (`registration_required` para users frontend) porque corrige deuda actual de negocio sin tocar WhatsApp.
- Que tablas crearia o reutilizaria:
  - crear `oauth_registration_sessions` (users pendientes),
  - crear `customer_oauth_identities` y `customer_oauth_link_sessions` (WhatsApp customers),
  - reutilizar `external_identities` y `conversation_states` sin cambiar su semantica.
- Que endpoints propongo:
  - users:
    - `GET /auth/google/start`
    - `GET /auth/google/callback`
    - `POST /auth/google/exchange`
    - `POST /auth/google/complete-registration`
  - customers whatsapp:
    - `POST /auth/customers/google/start` (interno o invocado por use case)
    - `GET /auth/customers/google/callback`
- Que queda pendiente para implementacion:
  - migraciones,
  - nuevos puertos/repositorios,
  - wiring en `AppModule`,
  - UX frontend de completar registro,
  - UX WhatsApp boton/link + fallback,
  - baterias unitarias e2e.
