# Session Technical State - 2026-05-07

## Goal of this Document
Provide a practical handoff to resume development without context loss.

## Delivered in this Session
1. Conversational onboarding foundations.
2. Identity resolution-first pipeline.
3. Prompt and context improvements for WhatsApp assistant behavior.
4. Customer profile expansion for progressive onboarding.
5. Cascade-delete setup for test data cleanup.

## Architectural Direction Confirmed
- Hexagonal boundaries preserved:
  - `interfaces`: channel adapter/webhook
  - `application`: orchestration and state decisions
  - `domain`: entities + ports
  - `infrastructure`: db adapters + OpenAI adapter
- Conversational state machine belongs to `application`.
- Model behavior must consume backend-resolved state, not infer identity.

## Current Working Capabilities
- Resolve identity by channel/external id/phone.
- Reuse known customer and conversation.
- Branch between onboarding path and normal assistant path.
- Persist inbound/outbound messages and onboarding metadata.

## Current Known Defects
- Repeated onboarding questions in specific turns.
- Partial mismatch between `onboardingStep` and actual next asked field.
- Potential stale context sent to AI when updates and context build are not tightly ordered.

## Root-Cause Hypotheses to Validate
1. State update order issue (profile then state vs state then profile).
2. Missing transactional boundary across customer/state/message writes.
3. Context builder runs before final state transition commit.
4. Missing turn-level guard for already asked fields.

## Next Session Action Plan (Strict Priority)
1. Implement deterministic onboarding transition map.
2. Add atomic write unit for profile + state + message side effects.
3. Add `last_asked_field` and `last_answered_field` in conversation state context.
4. Build AI context only from post-commit state snapshot.
5. Add tests for:
   - existing user greeting,
   - incomplete profile continuation,
   - multi-field extraction in single message,
   - no repeated question when field already captured.
