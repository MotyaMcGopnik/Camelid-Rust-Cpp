# 2026-05-13 — Frontend exact-row streaming guards

Scope: frontend support-contract and streaming-state guardrail documentation only. This note records validation for the current frontend integration smoke at source head `caf6f07`; it does not add model parity, API readiness, RSS/timing, context, portability, production-throughput, or support-promotion evidence for any row.

Current-head evidence checked before this note:
- `main` at `caf6f07` (`test(frontend): guard active streaming send state`), extending the earlier `096c5f4` exact-row streaming guard pass.
- Existing public evidence checks passed before editing: `bash scripts/check-public-scrub.sh` and `node scripts/check-public-evidence-claims.mjs`.
- Untracked local-only evidence bundle directories were present in the working tree and were not cited here.

Frontend guardrails covered by the integration smoke:
- Active streaming assistant rows expose an active streaming state, busy semantics, and an incomplete-code warning for open streaming fences.
- Active sends with already-visible streamed assistant content keep exactly one active assistant row and the live generation badge instead of showing the pre-token pending loader.
- Pre-token assistant rows remain visibly active while the backend is generating, without rendering a duplicate pending loader during an active send.
- Completed replies with unclosed fenced code render as safe completed code cards, not as still-generating output.
- The API contract view turns green only when runtime readiness and the selected exact supported compatibility row match.
- Broad family/quant lists and planned exact rows stay informational; they do not unlock selected-row chat or become support evidence.

Validation run on this checkout:
- `cd frontend && npm run smoke:integration` — PASS
- `cd frontend && npm run smoke:streaming` — PASS

Claim boundary:
- This is frontend/UI reliability evidence for exact-row gating and streaming presentation.
- It does not widen Llama, Mistral, Mixtral, Qwen, Gemma, or arbitrary-GGUF support.
- It does not supersede row-specific parity/API/WebUI/RSS evidence requirements in `COMPATIBILITY.md`.
