# Validation note — local-only validation lane paused

Date: 2026-05-12

Tim has paused the Ubuntu validation lane for Camelid promotion-grade runtime evidence. Until Tim explicitly reactivates that lane:

- do not SSH into a validation host or substitute another remote validation box;
- treat promotion-grade runtime reruns as blocked, not as locally reproducible on a Mac by default;
- generate full-support scaffolds with the default `blocked_by_operator_shutdown` status, or pass `--validation-host-status blocked_by_operator_shutdown` explicitly;
- keep local work to docs, frontend/readiness logic, evidence normalization, privacy scrub, lightweight guardrails, and code changes that have local tests;
- keep support language exact-row only and fail closed unless docs, API/frontend surfaces, and row-specific passing artifacts all agree.

This note does not change any existing support row. It only updates the execution posture: historical Ubuntu evidence remains historical evidence for the exact row, source head, context bucket, and prompt pack it names; a paused validation lane is not new evidence and cannot promote neighboring rows, broader families, larger contexts, production throughput, portability, or arbitrary-template behavior.

When Tim explicitly reopens the lane, regenerate affected scaffolds with `--validation-host-status available`, run only on a Tim-authorized validation/runtime lane, and publish only scrubbed manifests/checksums whose exact rows passed their tracks.
