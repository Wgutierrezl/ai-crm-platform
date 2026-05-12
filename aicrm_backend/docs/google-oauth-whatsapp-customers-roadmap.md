# Google OAuth WhatsApp Customers - Fase 2

Fecha: 2026-05-12
Alcance: analisis + implementacion backend inicial (sin frontend).

## Estado de implementacion (backend)

- Implementado:
  - migracion `1710000000015-AddCustomerOauthForWhatsapp.ts`.
  - entidades/puertos/repositorios:
    - `customer_oauth_link_sessions`
    - `customer_oauth_identities`
  - use cases:
    - `StartCustomerGoogleOAuthUseCase`
    - `HandleCustomerGoogleOAuthCallbackUseCase`
  - controller:
    - `POST /api/v1/customers/oauth/google/start`
    - `GET /api/v1/customers/oauth/google/callback`
  - integracion onboarding WhatsApp:
    - opcion interactiva `Continuar con Google`,
    - fallback a link por texto,
    - onboarding manual conservado.
- No implementado aun:
  - frontend adicional (no requerido en esta fase).
  - pruebas e2e de extremo a extremo con webhook real de Meta.

## Ajustes de regresion (2026-05-12)

- Checkout mock conversacional restaurado:
  - si `cart:checkout_mock` llega con `conversation_state` nulo, backend ahora crea estado y persiste `checkoutState=CHECKOUT_WAITING_CONFIRMATION`.
  - `si confirmar` vuelve a ejecutar `ConfirmCartCheckoutUseCase` cuando hay estado pendiente.
- Cierre onboarding por Google OAuth:
  - con nombre + email verificado, customer queda en `onboardingCompleted=true`, `onboardingStep=COMPLETED`, `profileCompletionPercentage=100`.
  - `conversation_states.registration_step=COMPLETED`.
- Correo de bienvenida unificado:
  - manual y google oauth usan el mismo envio.
  - deduplicacion por `customer.metadata.welcomeEmailSentAt`.
  - logs:
    - `[OnboardingEmail] sent source=manual|google_oauth`
    - `[OnboardingEmail] skipped already_sent`
    - `[OnboardingEmail] failed but flow continues`

## Separacion de callbacks OAuth (critico)

- Users/frontend:
  - `GET /api/v1/auth/google/callback`
  - `AuthController` + `HandleGoogleCallbackUseCase`
  - resultado: `auth_code` para exchange y JWT frontend.
- Customers/WhatsApp:
  - `GET /api/v1/customers/oauth/google/callback`
  - `CustomersOAuthController` + `HandleCustomerGoogleOAuthCallbackUseCase`
  - resultado: vinculo customer + continuidad onboarding.
  - no JWT, no exchange auth_code, no dashboard CRM.

Variables de entorno para evitar mezcla:
- `GOOGLE_OAUTH_USERS_CALLBACK_URL` (preferida users).
- `GOOGLE_OAUTH_CALLBACK_URL` (legacy users fallback).
- `GOOGLE_OAUTH_CUSTOMERS_WHATSAPP_CALLBACK_URL` (preferida customers).
- `GOOGLE_CUSTOMER_OAUTH_CALLBACK_URL` (legacy customers fallback).

Redirect URI requerido en Google Cloud Console (OAuth client):
- `https://earphone-remember-dentist.ngrok-free.dev/api/v1/customers/oauth/google/callback`

## Decision de tools/intenciones (2026-05-12)

- Decision:
  - usar `routing deterministico` como estrategia primaria para intenciones criticas OAuth Google en WhatsApp.
  - no crear por ahora tool IA `ASSISTANT_START_CUSTOMER_GOOGLE_OAUTH`.
- Motivo:
  - evita que la IA invente links,
  - garantiza que el link OAuth siempre se genere desde backend (`StartCustomerGoogleOAuthUseCase`),
  - reduce riesgo de ambiguedad en pasos de onboarding.
- Alias soportados por routing deterministico:
  - `registrame con google`
  - `registrame por google`
  - `registro con google`
  - `continuar con google`
  - `usar google`
  - `usar mi cuenta de google`
  - `vincular google`
  - `login con google`
  - `iniciar con google`
- Comportamiento por estado:
  - `new/incomplete`: genera link OAuth real y lo envia por WhatsApp.
  - `registered`: no reinicia onboarding; responde que el registro ya esta completo.

## Diagnóstico

### Qué se puede reutilizar del OAuth users
- `GoogleOidcProviderPort` + `GoogleOidcAdapter`:
  - ya resuelven `authorization_url` y `exchange code -> OIDC profile`.
- Patrón de seguridad one-time:
  - `state` con TTL y consumo unico.
  - `auth_code`/token temporal para no exponer JWT en URL.
- Enrutamiento backend actual para WhatsApp:
  - `HandleWhatsappWebhookUseCase` como adapter de canal.
  - `HandleInboundChannelMessageUseCase` como orquestador de negocio.
- Persistencia conversacional actual:
  - `external_identities` para identidad de canal (`company + channel + wa_id`).
  - `conversation_states` para continuidad de onboarding.

### Qué NO se debe reutilizar directamente
- `oauth_identities`:
  - hoy esta acoplada a `users` (`user_id` FK).
  - no modela `customers`.
- `oauth_registration_sessions`:
  - hoy representa pendiente de alta de `users` (frontend interno).
  - no guarda contexto de canal/cliente/conversacion requerido en WhatsApp.
- `AuthController` de users:
  - mezcla semantica de autenticacion interna (JWT interno) con onboarding de customers.

### Riesgos de mezclar users/customers
- Riesgo de ownership ambiguo:
  - una identidad Google podria terminar enlazada a `user` y `customer` sin controles claros.
- Riesgo de takeover:
  - si se reutiliza mal `state/token`, un callback podria vincularse a otro customer.
- Deuda de dominio:
  - mezclar bounded context de usuarios internos con clientes finales rompe claridad hexagonal.

## Recomendación de BD

## Comparativo

### Reutilizar `oauth_registration_sessions` para customers
- Ventaja:
  - evita tabla nueva en el corto plazo.
- Desventajas (criticas):
  - no tiene `companyId/customerId/conversationId/wa_id/channel`.
  - semantica actual es `users` interno, no `customers` canal.
  - dificulta validacion fuerte de callback contra contexto iniciador.
  - incrementa riesgo de mezcla indebida entre dominios.
- Veredicto:
  - no recomendado.

### Crear `customer_oauth_link_sessions`
- Ventajas:
  - modelo dedicado al flujo WhatsApp customer.
  - permite one-time + TTL + binding estricto a contexto conversacional.
  - mejor trazabilidad de estado (`pending`, `consumed`, `cancelled`, `failed`).
- Desventaja:
  - nueva migracion y repositorio.
- Veredicto:
  - recomendado.

### Reutilizar `oauth_identities` para customers
- Ventaja:
  - aparente simplificacion de esquema.
- Desventajas (criticas):
  - FK actual es `user_id`.
  - rompe frontera de dominio users vs customers.
  - reglas unicas actuales no garantizan aislamiento multi-tenant customer.
- Veredicto:
  - no recomendado.

### Crear `customer_oauth_identities`
- Ventajas:
  - separacion correcta de identidad OAuth customer.
  - facilita reglas de unicidad por tenant.
  - evita contaminar login interno.
- Desventaja:
  - nueva migracion y puertos.
- Veredicto:
  - recomendado.

## Recomendación clara
- Mantener:
  - `oauth_registration_sessions` y `oauth_identities` solo para `users`.
- Crear:
  - `customer_oauth_link_sessions` (temporal, one-time, TTL, contexto WhatsApp).
  - `customer_oauth_identities` (persistente, vinculacion OAuth customer).
- No mezclar:
  - `external_identities` (identidad de canal) con identidad OAuth.

## Flujo recomendado

1. Customer escribe por WhatsApp.
2. `HandleInboundChannelMessageUseCase` detecta onboarding nuevo/incompleto.
3. Bot ofrece dos caminos:
   - registro manual (actual),
   - `Continuar con Google` (nuevo opcional).
4. Si elige Google:
   - backend crea `customer_oauth_link_session` con:
     - `company_id`
     - `customer_id`
     - `conversation_id`
     - `channel=whatsapp`
     - `external_user_id=wa_id`
     - `state_token` (unico)
     - `expires_at`
     - `consumed_at=null`
     - `status=pending`
   - backend construye URL Google con `state` ligado a esa sesion.
5. Bot envia boton/link OAuth.
6. Customer consiente o cancela en Google.
7. Callback customer OAuth:
   - valida `state` y sesion (`pending`, no expirada, no consumida).
   - valida contexto:
     - company/customer/conversation/wa_id coincide con inicio.
   - exchange code -> profile:
     - `sub`, `email`, `email_verified`, `name`, `picture`.
8. Si `email_verified=false`:
   - no vincular.
   - marcar sesion `failed`/`consumed` segun politica.
   - responder fallback manual.
9. Si valido:
   - upsert en `customer_oauth_identities`.
   - actualizar `customers` con datos disponibles:
     - `email` (si no existe o si politica permite actualizar)
     - `fullName/name`
     - `metadata` (e.g. `googlePictureUrl`).
   - actualizar `conversation_states` para continuar onboarding.
   - marcar sesion `consumed` + `consumed_at`.
10. Bot retoma onboarding manual solo con campos faltantes.

## Endpoints propuestos

Recomendacion de rutas separadas de `auth/users`:

- `POST /api/v1/customers/oauth/google/start`
  - Uso:
    - invocado por application flow cuando customer elige Google.
  - Input sugerido:
    - `companyId`
    - `customerId`
    - `conversationId`
    - `channel` (`whatsapp`)
    - `externalUserId` (`wa_id`)
  - Output:
    - `authorizationUrl`
    - `expiresAt`

- `GET /api/v1/customers/oauth/google/callback`
  - Query:
    - `code`
    - `state`
  - Comportamiento:
    - valida sesion/contexto.
    - vincula perfil OAuth al customer.
    - responde HTML/redirect neutro para confirmar exito/fallo.
    - no emite JWT interno de `users`.

- Opcional operativo:
  - `GET /api/v1/customers/oauth/google/result?token=...`
  - para polling del frontend de apoyo (si se crea UI complementaria), no requerido para fase basica WhatsApp.

## Cambios por capa

### Domain
- Nuevas entidades:
  - `CustomerOauthIdentity`
  - `CustomerOauthLinkSession`
- Nuevos puertos:
  - `CustomerOauthIdentityRepository`
  - `CustomerOauthLinkSessionRepository`

### Application
- Nuevos use cases:
  - `StartCustomerGoogleOAuthUseCase`
  - `HandleCustomerGoogleOAuthCallbackUseCase`
  - `ResumeCustomerOnboardingAfterGoogleUseCase` (o integrado en callback use case)
- Cambios en `HandleInboundChannelMessageUseCase`:
  - detectar intent/boton `onboarding_google_start`.
  - mantener fallback manual.

### Infrastructure
- Nuevas entidades ORM + repositorios TypeORM:
  - `customer_oauth_identities`
  - `customer_oauth_link_sessions`
- Reutilizar `GoogleOidcAdapter` actual.

### Interfaces/HTTP
- Nuevo controller dedicado:
  - `CustomerOAuthController` (o `CustomersOAuthController`).
- Rutas separadas de `AuthController` de users.

### WhatsApp adapter
- Sin logica de negocio nueva en adapter.
- Solo transportar:
  - boton/list reply,
  - fallback texto con link,
  - webhook events ya existentes.

## Migraciones sugeridas

### 1) `customer_oauth_link_sessions`
Campos sugeridos:
- `id` (uuid)
- `company_id` (fk -> companies)
- `customer_id` (fk -> customers)
- `conversation_id` (fk -> conversations)
- `channel` varchar(30) (`whatsapp`)
- `external_user_id` varchar(120) (`wa_id`)
- `provider` varchar(30) (`google`)
- `state_token` varchar(191) unique
- `status` varchar(20) default `pending`
- `expires_at` datetime
- `consumed_at` datetime null
- `result_status` varchar(30) null (`success|cancelled|failed|expired`)
- `created_at`, `updated_at`

Indices:
- unique `(state_token)`
- index `(company_id, customer_id, status)`
- index `(expires_at)`

### 2) `customer_oauth_identities`
Campos sugeridos:
- `id` (uuid)
- `company_id` (fk -> companies)
- `customer_id` (fk -> customers)
- `provider` varchar(30)
- `provider_user_id` varchar(191)
- `email` varchar(255) null
- `email_verified` tinyint
- `display_name` varchar(255) null
- `picture_url` varchar(500) null
- `linked_at` datetime
- `created_at`, `updated_at`

Indices:
- unique `(company_id, provider, provider_user_id)`
- unique `(company_id, provider, customer_id)`
- index `(customer_id)`

## Seguridad

- `state` one-time y TTL corto.
- Consumo atomico de sesion (`pending -> consumed`).
- Validar `email_verified=true`.
- No guardar `access_token` ni `refresh_token`.
- No loguear tokens completos ni PII sensible.
- Validar binding estricto:
  - `companyId/customerId/conversationId/wa_id/channel`.
- Evitar reuse:
  - state reutilizado -> rechazo.
- Manejar cancelacion/fallo:
  - marcar `result_status`.
  - fallback manual obligatorio.
- No afectar OAuth de `users` ni login email/password.

## UX WhatsApp (botón y fallback)

- Mensaje sugerido:
  - "Puedes seguir registro manual o continuar con Google para completar más rápido."
- Accion primaria:
  - boton interactivo `Continuar con Google`.
- Accion secundaria:
  - `Seguir manual`.
- Si falla payload interactivo:
  - enviar texto con URL segura firmada + expiracion.
- Mensaje post-callback:
  - exito: "Listo, vinculamos tu Google. Continuemos con los datos faltantes."
  - fallo/cancel: "No se completó Google. Puedes continuar manualmente."

## Cómo continuar onboarding después de Google

- No reiniciar onboarding.
- Recalcular `missingFields` con base en `customers` actualizado.
- Mantener `conversation_states` y avanzar solo pasos pendientes.
- Ejemplo:
  - si Google aporta email y nombre, saltar `WAITING_NAME`/`WAITING_EMAIL` y continuar en documento/direccion.

## Testing sugerido

Unitarios/E2E:
- customer nuevo inicia Google OAuth.
- callback valido vincula customer correcto.
- state expirado.
- state reutilizado.
- email no verificado.
- usuario cancela Google.
- fallback manual funciona.
- no afecta OAuth users/frontend.
- no afecta login email/password.
- callback con state de otra conversacion/company -> rechazo.
- callback con wa_id distinto al iniciador -> rechazo.

## Respuestas directas a preguntas clave

1. `oauth_registration_sessions` para customers:
- No recomendable; orientada a `users`.

2. `oauth_identities` reutilizable:
- No; crear `customer_oauth_identities`.

3. Tabla nueva `customer_oauth_link_sessions`:
- Si, recomendada y necesaria.

4. Guardado temporal de contexto:
- en `customer_oauth_link_sessions` con campos de contexto completos.

5. Mezcla external vs oauth:
- evitarla; mantener `external_identities` solo canal.

6. Endpoint nuevo:
- prefijo `customers/oauth/google/*` separado de `auth/users`.

7. Botón WhatsApp:
- usar interactive reply; adapter actual ya soporta interactive list/button payload inbound.

8. Fallback botón:
- texto corto + link seguro con expiracion.

9. Continuar onboarding faltantes:
- recalcular `missingFields` y avanzar `conversation_states`.

10. Migraciones:
- `customer_oauth_link_sessions` y `customer_oauth_identities`.

## Decisión recomendada

- Reutilizar:
  - Google adapter + patron one-time state.
- Crear nuevo:
  - sesiones de link customer,
  - identidades OAuth customer.
- Mantener separado:
  - users OAuth interno vs customers OAuth WhatsApp.
- Implementar en fases:
  1. migraciones + puertos/entidades,
  2. start/callback customers oauth,
  3. UX WhatsApp + fallback,
  4. reanudacion onboarding faltantes,
  5. tests de seguridad e integracion.
