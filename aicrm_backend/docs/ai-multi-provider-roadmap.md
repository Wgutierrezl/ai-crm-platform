# AI Multi-Provider Roadmap

## Why this roadmap exists
- OpenAI API quota (`429`) affected runtime testing continuity.
- Need to reduce single-provider dependency and improve resilience.

## Operational Clarification
- ChatGPT Plus does not include backend API credits.
- Backend provider billing is independent and managed in `platform.openai.com`.

## Target Providers
- OpenAI
- Groq
- OpenRouter
- Anthropic
- Gemini
- Local/self-hosted providers (future optional)

## Proposed Architecture (Documentation-only)
- `domain/ports/ai-provider.port.ts`
- `infrastructure/ai/providers/`
  - `openai/`
  - `groq/`
  - `openrouter/`
  - `anthropic/`
  - `gemini/`
- Application orchestration candidates:
  - `AIProviderFactory`
  - `AIProviderResolver`
  - `AIOrchestrator`

## Selection Strategy
- Primary provider by environment/channel/tenant.
- Fallback provider when primary fails (timeout, rate-limit, quota).
- Keep existing `AIService` contract stable for upper layers.

## Immediate Next Steps
1. Define provider-agnostic request/response contract.
2. Introduce provider resolver config (`primary`, `fallback`, `policy`).
3. Implement OpenAI + Groq first for pragmatic rollout.
4. Add structured observability per provider (latency/cost/errors).

## Session Close Notes
- Trigger for this roadmap: OpenAI API quota limitation (`429 insufficient_quota`).
- This issue is operational (provider billing/quota), not a core architecture defect.
- Recommended execution order:
  1. stabilize frontend conversations with real backend data,
  2. implement provider abstraction,
  3. enable fallback providers for uninterrupted conversational testing.
