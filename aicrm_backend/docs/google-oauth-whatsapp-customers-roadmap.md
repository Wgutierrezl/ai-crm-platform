# Google OAuth WhatsApp Customers - Fase 2

Fecha de actualizacion: 2026-05-12
Alcance: customers por WhatsApp (no users/frontend).

## Estado actual
- Implementado en backend como opcion adicional de onboarding.
- Onboarding manual se mantiene como camino principal.
- Sin JWT para customers.
- Sin exchange frontend de `auth_code`.

## Arquitectura (separacion de bounded contexts)
No se reutiliza para customers:
- `oauth_registration_sessions` (users)
- `oauth_identities` (users)

Tablas dedicadas customers:
- `customer_oauth_link_sessions` (temporal/state/TTL/one-time)
- `customer_oauth_identities` (vinculo OAuth customer)

Razon:
- users internos != customers WhatsApp
- evita contaminacion de dominio y takeover cruzado.

## Endpoints customers OAuth
- `POST /api/v1/customers/oauth/google/start`
- `GET /api/v1/customers/oauth/google/callback`

## Flujo customers OAuth
1. Customer en onboarding elige "Continuar con Google".
2. Backend crea `customer_oauth_link_session` (`pending`, TTL, state token).
3. Backend genera authorization URL Google.
4. WhatsApp envia boton URL (fallback texto si Meta falla).
5. Google vuelve a callback customers.
6. Backend valida state/sesion/email_verified.
7. Backend upsert `customer_oauth_identities`.
8. Backend actualiza customer con datos Google.
9. Backend completa onboarding basico si ya tiene nombre+email.
10. Bot continua flujo normal de WhatsApp.

## Cierre de onboarding post Google (corregido)
Al callback exitoso:
- `customer.email = google.email`
- `customer.fullName/name = google.name`
- `customer.metadata.googleLinkedAt`
- `customer.metadata.googlePictureUrl`
- `customer.onboardingCompleted = true` (si nombre+email)
- `customer.onboardingStep = COMPLETED`
- `customer.profileCompletionPercentage = 100`
- `conversation_states.registration_step = COMPLETED`

Documento/identificacion sigue opcional para onboarding basico customers.

## Separacion de callbacks (critico)
Problema encontrado:
- riesgo de mezclar callback users y customers.

Solucion aplicada:
- users: `/api/v1/auth/google/callback`
- customers: `/api/v1/customers/oauth/google/callback`

Variables env:
- `GOOGLE_OAUTH_USERS_CALLBACK_URL` (preferida users)
- `GOOGLE_OAUTH_CALLBACK_URL` (legacy users fallback)
- `GOOGLE_OAUTH_CUSTOMERS_WHATSAPP_CALLBACK_URL` (preferida customers)
- `GOOGLE_CUSTOMER_OAUTH_CALLBACK_URL` (legacy customers fallback)

Redirect URI que debe existir en Google Cloud Console:
- `https://earphone-remember-dentist.ngrok-free.dev/api/v1/customers/oauth/google/callback`

## UX WhatsApp OAuth
Objetivo UX actual:
- no enviar URL gigante como mensaje principal.
- enviar boton URL.

Boton URL:
- body: `Completa tu registro mas rapido con Google.`
- button text: `Usar Google` (<=20 chars por limite Meta)
- url: authorizationUrl

Fallback:
- si falla boton URL, enviar texto con link.

## Troubleshooting
### Google OAuth
1. `redirect_uri_mismatch`
- callback no registrado en Google Cloud Console.
- mismatch entre env y callback real.

2. callback mezclado users/customers
- revisar prioridad de variables callback por flujo.

3. state expirado/reusado
- revisar TTL y `consumed_at` en `customer_oauth_link_sessions`.

4. onboarding quedaba en `WAITING_EMAIL`
- corregido: cierre a `COMPLETED` cuando Google aporta nombre+email verificado.

### WhatsApp/Meta
1. error de boton URL por longitud
- `display_text` maximo 20 chars.
- corregido a `Usar Google`.

2. envio de link como texto
- ahora se prioriza boton URL y texto solo como fallback.

### Checkout regression relacionada
- se detecto regresion donde OAuth no era la causa directa, pero coincidio en timeline:
  - `cart:checkout_mock` podia no persistir `checkoutState` si faltaba `conversation_state`.
- corregido creando estado cuando no existe.

## Correo de bienvenida (manual + google_oauth)
- ambos caminos disparan mismo servicio de welcome email.
- deduplicacion:
  - `customer.metadata.welcomeEmailSentAt`
- logs:
  - `[OnboardingEmail] sent source=manual`
  - `[OnboardingEmail] sent source=google_oauth`
  - `[OnboardingEmail] skipped already_sent`
  - `[OnboardingEmail] failed but flow continues`

## Pending Improvements
1. Mejorar HTML del callback customers (exito/fallo) con branding.
2. Mejorar UX "volver a WhatsApp" tras callback.
3. Mejorar copy conversacional de onboarding acelerado.
4. Endurecer pruebas E2E webhook+OAuth real.
5. Auditoria adicional de eventos OAuth por tenant.

## Nota de estado documental
Este documento consolida implementacion real de Fase 2.
Se considera referencia actual; entradas antiguas de analisis puro quedan como legacy historico.
