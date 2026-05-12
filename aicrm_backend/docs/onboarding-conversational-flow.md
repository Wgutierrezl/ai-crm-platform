# Onboarding Conversational Flow

Fecha de actualizacion: 2026-05-12

## Estado vigente
- Resolucion de identidad antes de IA.
- Reuso de `external_identities`, `customers`, `conversations`.
- Persistencia de `conversation_states`.
- Onboarding manual + onboarding acelerado por Google OAuth customers.

## Maquina de estado (alto nivel)
- `WAITING_NAME`
- `WAITING_EMAIL`
- `WAITING_DOCUMENT` (opcional)
- `COMPLETED`

## Flujo manual
1. Resolver identidad.
2. Si incompleto, continuar paso pendiente.
3. Persistir cambios en customer + conversation state.
4. Al completar, enviar welcome email (si aplica).

## Flujo Google OAuth customers
1. Customer solicita Google en WhatsApp.
2. Backend genera link OAuth con state/TTL one-time.
3. Callback valida y vincula perfil Google.
4. Si nombre+email verificado, marca onboarding basico completo:
   - `customer.onboardingCompleted=true`
   - `customer.onboardingStep=COMPLETED`
   - `profileCompletionPercentage=100`
   - `conversation_states.registration_step=COMPLETED`
5. En siguientes mensajes, entra a flujo normal del bot (no vuelve a pedir email).

## Contextos separados (importante)
- Onboarding context:
  - `conversation_states.registration_step`, `missingFields`.
- OAuth context:
  - `customer_oauth_link_sessions`, `customer_oauth_identities`.
- Cart/Checkout context:
  - `conversation_states.context.checkoutState`.

No deben pisarse entre si.

## Correo de bienvenida
Servicio unificado para manual + Google OAuth.

Reglas:
- Manual completado -> `source=manual`.
- Google OAuth completado -> `source=google_oauth`.
- Deduplicacion por `customer.metadata.welcomeEmailSentAt`.
- Falla SMTP no rompe onboarding ni WhatsApp.

Logs esperados:
- `[OnboardingEmail] sent source=manual`
- `[OnboardingEmail] sent source=google_oauth`
- `[OnboardingEmail] skipped already_sent`
- `[OnboardingEmail] failed but flow continues`

## Troubleshooting
1. Repeticion de email tras OAuth:
- revisar que customer y state queden en `COMPLETED` en callback.

2. Onboarding reiniciado en usuario ya registrado:
- revisar resolucion de identidad y estado normalizado.

3. Correo duplicado:
- revisar `welcomeEmailSentAt` en metadata.

4. Correo no enviado:
- revisar SMTP env + formato email customer.

## Relacion con otros docs
- OAuth users: `docs/google-oauth-users-frontend.md`
- OAuth customers: `docs/google-oauth-whatsapp-customers-roadmap.md`
- Checkout mock: `docs/whatsapp-mock-checkout-flow.md`
- SMTP: `docs/smtp-transactional-emails.md`
