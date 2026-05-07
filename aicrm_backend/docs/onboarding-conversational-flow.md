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

## Current Instabilities (Observed)
- Repeated question loops (example: repeated ID number request).
- Occasional mismatch between `onboardingStep` and asked question.
- AI replies may reflect stale or partial onboarding context.
- Missing fields can be recalculated inconsistently after partial updates.

## Probable Root Causes
1. `onboardingStep` not persisted atomically with profile update.
2. Context builder sending pre-update state to OpenAI.
3. Conversation state and customer profile out of sync in same turn.
4. Extractor returns partial data but step transition remains unchanged.
5. Missing field calculation and completion percentage drift.
6. Reused history includes prior onboarding questions without turn-level guard.
7. Prompt rules and backend state machine are not fully deterministic yet.

## Priority Fixes (Next Session)
1. Atomic update transaction: customer profile + conversation state.
2. Deterministic step transition table (`current_step + extracted_fields -> next_step`).
3. Post-update context build only (never pre-update).
4. Add `last_asked_field` and `last_answered_field` in conversation state context.
5. Prevent asking same field twice in consecutive turns unless validation fails.
6. Add onboarding validation errors with reason codes (`invalid_email`, etc.).
7. Add integration tests for:
   - new user path
   - existing user greeting path
   - incomplete profile continuation path
   - multi-field single message extraction path
