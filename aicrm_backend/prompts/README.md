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

## Prompt Coverage in This Session
- Onboarding tone and progressive collection rules were strengthened.
- Runtime prompt now includes stricter decision constraints:
  - do not infer user existence,
  - do not restart onboarding for completed profiles,
  - continue from provided step/context only.

## Known Prompt Gaps
- Prompt quality depends on state freshness from backend.
- If backend sends stale `missing_fields` or `onboarding_step`, model can still produce repetitive prompts.
- Next session should bind prompt behavior to deterministic step machine output.
