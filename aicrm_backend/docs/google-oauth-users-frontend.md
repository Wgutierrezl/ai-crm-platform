# Google OAuth Users/Frontend (Fase 1)

Fecha de actualizacion: 2026-05-12
Alcance: usuarios internos (`users`) del frontend CRM.

## Estado actual
- Implementado y operativo end-to-end.
- Login email/password se mantiene activo.
- OAuth Google es metodo adicional (no reemplazo).

## Flujo funcional
1. `GET /api/v1/auth/google/start` inicia OAuth users.
2. Google redirige a `GET /api/v1/auth/google/callback`.
3. Backend valida `state` y perfil OIDC (`openid email profile`).
4. Backend emite `auth_code` temporal one-time (no JWT en URL).
5. Frontend llama `POST /api/v1/auth/google/exchange`.
6. Respuesta posible:
   - `status=authenticated` -> JWT final.
   - `status=registration_required` -> `registrationToken`.
7. Si `registration_required`, frontend abre pantalla dedicada:
   - `/auth/google/complete-registration`.
8. Frontend llama `POST /api/v1/auth/google/complete-registration`.
9. Backend crea `company + user admin + oauth_identity` y emite JWT final.

## Complete Registration (Google)
Formulario OAuth dedicado (no registro normal):
- `companyName`
- `identificationType` (`CC` | `NIT`)
- `identificationNumber`

No pide:
- email editable
- password
- fullName obligatorio

## Persistencia
- `oauth_registration_sessions`:
  - temporal
  - TTL
  - one-time
  - `consumed_at`
- `oauth_identities`:
  - vinculo OAuth de users
  - `provider_user_id` (Google `sub`) se guarda aqui
  - no se guardan `access_token`/`refresh_token`

## Reglas de identificacion corregidas
Ya no se permite en registro final de users OAuth:
- `identificationType=GOOGLE`
- `identificationNumber=GOOGLE-*`

Regla actual:
- identificacion real solo `CC`/`NIT`
- numero real ingresado en complete-registration
- Google `sub` solo en `oauth_identities.provider_user_id`

## Bug relevante corregido (frontend)
Problema:
- doble exchange por React StrictMode/re-render
- reuso de `auth_code` -> 401

Correccion aplicada:
- guard anti-doble exchange
- limpieza de URL (`code`) tras exchange
- payload exchange compatible (`authCode`/`code`)
- logs con `traceId`

## Separacion de callbacks (critico)
- Users/frontend: `/api/v1/auth/google/callback`
- Customers/WhatsApp: `/api/v1/customers/oauth/google/callback`

Variables env (users):
- `GOOGLE_OAUTH_USERS_CALLBACK_URL` (preferida)
- `GOOGLE_OAUTH_CALLBACK_URL` (legacy fallback)

Variables env (customers):
- `GOOGLE_OAUTH_CUSTOMERS_WHATSAPP_CALLBACK_URL` (preferida)
- `GOOGLE_CUSTOMER_OAUTH_CALLBACK_URL` (legacy fallback)

## Seguridad
- `state`/`auth_code`/`registrationToken` con TTL y one-time use.
- `email_verified=true` obligatorio.
- JWT nunca en query string.
- no loguear tokens completos.
- no guardar tokens Google de acceso/refresh.

## Troubleshooting rapido
1. `401` en exchange:
- suele ser code ya consumido (doble intento frontend).

2. Login directo inesperado a dashboard:
- revisar existencia previa en `oauth_identities` / `users`.

3. Datos legacy `GOOGLE-*` en users:
- son de pruebas antiguas/dev; limpiar manualmente en local/test.
