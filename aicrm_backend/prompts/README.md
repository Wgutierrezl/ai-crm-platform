# Prompt Management

Capas de resolución recomendadas (de menor a mayor prioridad):

1. `base/system.md`
2. `channels/<channel>/system.md`
3. `assistants/<assistant>/system.md`
4. `tenants/<tenantId>/overrides.md`

Reglas:
- Mantener prompts en texto plano versionable.
- Inyectar contexto dinámico (customer, tools habilitadas, estado conversacional) desde `application`.
- Registrar en logs/mensajes la versión de prompt aplicada.
- `OpenAIService` carga en runtime:
  - `base/system.md`
  - `channels/whatsapp/system.md`
  - `assistants/sales/system.md`
  - `partials/policies/no-hallucination.md`
  - `partials/style/concise-whatsapp.md`
  - `partials/tools/onboarding-tools.md`
  - `partials/tools/products-tools.md`

## Prompt Coverage in This Session
- Onboarding tone and progressive collection rules were strengthened.
- Runtime prompt now includes stricter decision constraints:
  - do not infer user existence,
  - do not restart onboarding for completed profiles,
  - continue from provided step/context only.
- State transitions are backend-owned (not model-owned):
  - WAITING_NAME -> WAITING_EMAIL -> WAITING_DOCUMENT -> COMPLETED.

## Known Prompt Gaps
- Prompt quality depends on state freshness from backend.
- If backend sends stale `missing_fields` or `onboarding_step`, model can still produce repetitive prompts.
- Next session should bind prompt behavior to deterministic step machine output.
- End-to-end prompt validation is currently constrained by OpenAI API quota (`429`).

## Next Validation Pass
- Resume prompt-intent testing for product tools after provider quota/fallback is available.
- Verify:
  - intent-to-tool mapping reliability,
  - short WhatsApp-friendly responses,
  - no fabricated product/price/stock outputs.
