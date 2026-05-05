# Four-row API + frontend smoke — 2026-05-04

Public, sanitized summary for the reopened Ubuntu validation lane on a clean public checkout at `cb8943d7d33391403cfe7cf358c4f8ea4e9babea`.

Result: TinyLlama 1.1B Chat Q8_0, Llama 3.2 1B Instruct Q8_0, Llama 3.2 3B Instruct Q8_0, and Llama 3 8B Instruct Q8_0 all passed the exact-row API + frontend smoke slice recorded in `manifest.json`.

Covered in this bundle:

- release build
- frontend install/build/model-state smoke
- `/v1/health` before and after model load
- `/api/models/load`
- `/api/models/current`
- `/v1/models`
- `/api/capabilities`
- `/v1/completions`
- `/v1/chat/completions`
- frontend smoke contract checks

Boundary: this is freshness evidence for the four exact supported/smoke-supported rows only. It does not promote broad Llama-family support, neighboring rows, other quantizations, longer contexts, full parity, or performance portability. The first 8B 512-context pass is recorded separately at `../llama3-8b-context-512-20260504T234625Z-head-58acf592345c/`.
