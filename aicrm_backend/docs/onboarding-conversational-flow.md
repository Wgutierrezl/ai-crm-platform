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

## Estado de validacion de correo onboarding (2026-05-12)
- Implementacion: activa en backend.
- Prueba manual integrada: **OK**.
  - onboarding completado,
  - correo HTML de bienvenida recibido correctamente.
- Si SMTP falla:
  - se registra error,
  - no se rompe onboarding ni canal WhatsApp.

## Estado actual relevante para OAuth Customers
- `external_identities` hoy representa identidad de canal (`companyId + channel + externalUserId/wa_id`) y vincula a `customerId`.
- `conversation_states` conserva `registration_step` y `context_json` para continuidad del onboarding.
- `HandleWhatsappWebhookUseCase` ya soporta interacciones WhatsApp (`list_reply`, `button_reply`) y fallback a texto si falla payload interactivo.
- `HandleInboundChannelMessageUseCase` ya maneja ruteo deterministico + onboarding manual como flujo principal.

## Google OAuth para Customers (fase futura, no implementada)
- Objetivo: opcion adicional de onboarding, sin reemplazar flujo manual.
- Recomendacion arquitectonica:
  - mantener `external_identities` para identidad de canal,
  - no mezclar OAuth customer en `oauth_identities` de users,
  - crear identidad OAuth dedicada de customer + sesion temporal de link OAuth WhatsApp.

Referencia detallada:
- `docs/google-oauth-whatsapp-customers-roadmap.md`
