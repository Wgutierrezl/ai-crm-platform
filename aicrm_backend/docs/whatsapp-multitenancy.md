# WhatsApp Resolution Model

## Principle
- End user on WhatsApp does not need Meta credentials.
- Meta credentials belong to backend integration config (`company_whatsapp_credentials`).

## Product Decision (Current Stage)
- Short term: operate as a global conversational bot/channel to speed onboarding iteration.
- Mid term: keep architecture ready for strict multi-tenant routing.
- Current codebase includes tenant-aware pieces (`company_id`) that should be aligned with global-mode strategy in next iteration.

## Resolution Flow
1. Webhook arrives with `phone_number_id`.
2. Resolve WhatsApp app in `company_whatsapp_apps` by `phone_number_id`.
3. Resolve operational company context:
   - strict mode: `company_whatsapp_apps.company_id`
   - temporary global mode: runtime-configured default company context
4. Resolve active credentials by `whatsapp_app_id`.
5. Resolve/create external customer by `wa_id` or phone.
6. Continue conversational lifecycle.

## Current Risks
- Legacy records without `company_id` can break strict tenant resolution.
- If global mode and strict mode coexist without a clear flag, behavior may diverge by environment.

## Recommended Alignment Task (Next Session)
- Add explicit config flag: `WHATSAPP_ROUTING_MODE=strict|global`.
- Centralize resolution strategy in one application service.
- Keep same downstream contract (`companyId`, `customerId`, `conversationId`) for onboarding and AI.
