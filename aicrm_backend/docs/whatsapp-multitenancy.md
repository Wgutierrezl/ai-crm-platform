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

## Signature Validation (`X-Hub-Signature-256`) - Implemented 2026-05-15
- `POST /api/v1/webhooks/whatsapp` validates signature before business processing.
- Strategy: dynamic-first per app/tenant:
  - extract minimal `phone_number_id` from parsed webhook payload,
  - resolve app in `company_whatsapp_apps`,
  - resolve active credentials in `company_whatsapp_credentials`,
  - use `app_secret` from DB as primary secret.
- HMAC validation:
  - uses raw request body (`rawBody`) + `sha256` HMAC,
  - requires header format `sha256=<64-hex>`,
  - compares with `timingSafeEqual` after length checks.
- Fail-closed behavior when signature validation is enabled:
  - rejects missing/invalid header,
  - rejects missing raw body,
  - rejects missing app, credentials, or secret.

## Config Flags
- `WHATSAPP_WEBHOOK_VALIDATE_SIGNATURE=false|true`
  - `false`: bypass validation (recommended only local/dev).
  - `true`: enforces signature validation.
- `WHATSAPP_WEBHOOK_ALLOW_GLOBAL_SECRET_FALLBACK=false|true`
  - enables fallback to `META_APP_SECRET` only if explicitly true.
  - fallback is logged as warning; never silent.
- `META_APP_SECRET=...`
  - used only when fallback flag is enabled and per-app secret is missing.

## Notes
- `GET /api/v1/webhooks/whatsapp` verification flow remains unchanged.
- No secrets/tokens/signatures/payloads completos are logged.

## Current Risks
- Legacy records without `company_id` can break strict tenant resolution.
- If global mode and strict mode coexist without a clear flag, behavior may diverge by environment.

## Recommended Alignment Task (Next Session)
- Add explicit config flag: `WHATSAPP_ROUTING_MODE=strict|global`.
- Centralize resolution strategy in one application service.
- Keep same downstream contract (`companyId`, `customerId`, `conversationId`) for onboarding and AI.
