# Validation Matrix

Last updated: 2026-05-05

Run the smallest meaningful validation lane for your change. If a change affects support language, readiness behavior, or exact-row claims, update docs and evidence references together.

| Change type | Minimum expected checks | Extra checks when relevant | Notes |
| --- | --- | --- | --- |
| Docs-only | `git diff --check`<br>`bash scripts/check-public-scrub.sh` | n/a | Keep support language synchronized with `README.md`, `COMPATIBILITY.md`, `STATUS.md`, and UI copy when claims change. |
| Frontend-only copy/layout | `cd frontend && npm ci && npm run build` | `npm run smoke` or `npm run smoke:tiny` when chat/model-load/readiness surfaces change | Do not loosen readiness gates or support wording without matching evidence/docs updates. |
| Backend-only non-inference changes | `cargo fmt --all -- --check`<br>`cargo clippy --all-targets --all-features -- -D warnings`<br>`cargo test --all-targets --all-features`<br>`cargo doc --no-deps --all-features`<br>`bash scripts/check-public-scrub.sh` | frontend build if API shape or delivery may be affected | Good default lane for parser, API, CLI, and non-runtime refactors. |
| Inference/tokenizer/runtime changes | Standard backend gate above | targeted parity, readiness, or smoke artifacts for the affected exact row(s) | Do not broaden support from seam evidence alone. |
| Frontend + backend readiness/chat-path changes | Standard backend gate + `cd frontend && npm ci && npm run build` | frontend smoke against the affected exact row(s) | Required when `/v1/health`, `/api/capabilities`, model loading, or WebUI chat gating changes. |
| Support-contract / compatibility-row changes | Validation appropriate to the underlying code/docs change | fresh evidence bundles and synchronized updates to public sources of truth | A support claim is a release decision, not a wording tweak. |
| QA / evidence-publication changes | Validate the producing scripts or manifests you changed | scrub/publication checks and updated artifact references | Keep public bundle paths, manifests, and summaries internally consistent. |

## Public vs maintainer-only validation

Public contributor expectations stop at local reproducible checks plus public artifact references.

The following may still be maintainer-only workflows rather than baseline contributor requirements:

- promotion-grade reruns on the approved Ubuntu validation lane
- SSH-backed remote execution
- private operator recovery/debug procedures

Public docs may reference those workflows at a high level, but should not depend on unpublished infrastructure details.

## When in doubt

- choose the smallest lane that could realistically catch your change
- if a claim gets stronger, the evidence must get stronger too
- if code, docs, frontend copy, and compatibility rows disagree, the task is not finished
