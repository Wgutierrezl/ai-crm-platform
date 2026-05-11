# Onboarding Conversational Flow

## Scope Implemented
- WhatsApp onboarding progressive flow.
- Identity resolution first.
- External identity + customer + conversation reuse.
- Conversation state persistence.
- AI context enrichment with onboarding metadata.

## Expected Lifecycle
1. Resolve identity first (`ASSISTANT_RESOLVE_USER_IDENTITY`).
2. Load customer + conversation + onboarding state.
3. Branch:
   - `registered`: skip onboarding, greet with customer name, continue assistant flow.
   - `new_user`: start onboarding from first required field.
   - `profile_incomplete` / `onboarding_pending`: continue from `onboardingStep`.
4. Persist user message + bot message.
5. Update customer profile and onboarding state consistently.

## Tools Available
- `ASSISTANT_RESOLVE_USER_IDENTITY`
- `ASSISTANT_START_ONBOARDING`
- `ASSISTANT_COLLECT_PROFILE_DATA`
- `ASSISTANT_REGISTER_USER`
- `ASSISTANT_GET_USER_PROFILE`
- `ASSISTANT_UPDATE_USER_PROFILE`

## Prompt/Context Contract for AI
- `customer_exists`
- `customer_name`
- `onboarding_completed`
- `onboarding_step`
- `missing_fields`
- `customer_profile`
- `conversation_state`
- `available_tools`
- `current_channel`

## What Works
- Identity resolution before AI decision path.
- Existing users can skip full onboarding path.
- External identity and customer reuse are active.
- Profile extraction captures multiple fields in one message.
- Correo de bienvenida HTML al completar onboarding (si email valido).

## Welcome Email Trigger
- Se dispara cuando `ASSISTANT_COLLECT_PROFILE_DATA` retorna `completed=true`.
- Condiciones:
  - customer con email valido por formato,
  - configuracion SMTP disponible.
- Si SMTP falla:
  - se registra error,
  - no se rompe el flujo de onboarding/WhatsApp.

## Estado de validacion de correo onboarding (2026-05-11)
- Implementacion: lista en backend.
- Prueba manual pendiente:
  - completar onboarding real de usuario nuevo con email valido,
  - confirmar recepcion de correo de bienvenida.
- Nota:
  - en la sesion actual se valido en productivo local el correo de compra,
  - el correo onboarding queda en cola de validacion funcional manual.

## Current Instabilities (Observed)
- Resueltas en esta iteracion para flujo NAME -> EMAIL -> DOCUMENT.
- Antes ocurria repeticion de cédula por transicion no deterministica.

## Probable Root Causes
1. `onboardingStep` no deterministico (dependia de extraccion libre y missingFields).
2. Validacion de cédula no separaba "inválido" vs "omitir".
3. Paso siguiente no era una tabla de transicion explicita.

## Fixed State Machine
- `WAITING_NAME`
- `WAITING_EMAIL`
- `WAITING_DOCUMENT`
- `COMPLETED`

Reglas:
1. El backend decide el paso siguiente (no OpenAI).
2. Solo valida el dato esperado del paso actual.
3. Si dato valido:
   - persiste customer,
   - persiste conversation_state,
   - avanza al siguiente paso.
4. Si dato invalido:
   - no avanza,
   - responde mensaje de correccion.
5. Si paso `WAITING_DOCUMENT` y usuario responde:
   - `omitir|saltar|prefiero no|después|no` => onboarding completo.

## Priority Fixes (Next Session)
1. Atomic update transaction: customer profile + conversation state.
2. Add integration tests for:
   - new user path
   - existing user greeting path
   - incomplete profile continuation path
   - document skip path (`omitir`)
