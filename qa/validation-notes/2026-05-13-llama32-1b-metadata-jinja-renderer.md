# 2026-05-13 — Llama 3.2 1B metadata Jinja renderer slice

Scope: exact Llama 3.2 1B Instruct Q8_0 metadata-template renderer path for the recognized Llama 3 instruct chat-template shape. This is row-template renderer/API-contract evidence only; it does not promote broad arbitrary-template execution, neighboring rows, production throughput, portability, or model-native/larger context beyond checked packs.

Changes validated:

- Replaced the previous hand-written Llama 3 metadata-template subset with a real Jinja-compatible renderer backed by `minijinja` when `CAMELID_METADATA_CHAT_TEMPLATE=metadata` is enabled.
- Added a model-aware chat prompt path so the active exact Llama 3.2 1B Instruct Q8_0 row can use the metadata-Jinja renderer without the env opt-in when the tokenizer contains the recognized Llama 3 instruct template shape.
- Preserved fail-closed/default behavior: the shared `render_chat_prompt_for_tokenization(...)` helper and non-exact model IDs still use the compact renderer unless the metadata env opt-in is set.
- The renderer passes `messages`, `bos_token`, `eos_token`, `eot_token`, `eom_token`, `unk_token`, and `add_generation_prompt=true` into the metadata template.
- BOS de-duplication is handled by checking whether the rendered template already begins with the tokenizer BOS text before tokenizer-level special-token insertion.
- Unsupported/error branches are reported through a `raise_exception(...)` helper; the production chat-preparation path now returns an `unsupported_chat_template` error when the exact supported 1B metadata-Jinja renderer fails instead of silently falling back to the compact renderer.

Unit/API contract coverage:

- Exact 1B row metadata-Jinja rendering without env opt-in: system+user, user-only, multi-turn system/user/assistant/user, and assistant-final/continuation edge cases.
- Non-exact Llama 3.2 3B and non-Q8 1B model IDs preserve compact rendering without env opt-in.
- Existing metadata-Jinja opt-in tests cover user-only, system+user, multi-turn, assistant-final, templates that omit `bos_token`, simple loop-based Jinja execution, explicit unsupported `raise_exception(...)` branch handling, and exact-row required-renderer failure without silent fallback.
- `/api/capabilities` now reports `chat_template_renderer: "metadata_jinja_supported_for_exact_row"` for `llama32_1b_instruct_q8_0` only, while the blocker text keeps broad arbitrary-template/full-support gaps open.

Validation artifacts:

- Local artifact: `target/cron-95495a91-20260513T2149Z-jinja-required-error-head-1ae5e9a17aaf/`
- Local passes recorded there: `cargo fmt --check`; `cargo test metadata_jinja_renderer --lib -- --nocapture`; `cargo test`; `cargo test output_projection_q8_0_descriptor_shape_uses_storage_token_rows --lib -- --nocapture`.
- Earlier clean Ubuntu validation copied clean source head `1ae5e9a17aaf` plus the Jinja/API-contract patch to `/home/ubuntu/work/camelid-jinja-supported-1b-20260513T2240Z-head-1ae5e9a17aaf` and passed focused renderer/API-contract gates plus `cargo test -q --lib` under rustc/cargo 1.87.0; this follow-up required-renderer-error slice was validated locally because it is a prompt-construction/API error-path change, not a model-runtime parity change.
- Canonical Ubuntu host readiness was checked for this slice; `/` is currently 100% used with about 905 MiB free and the default `/usr/bin/cargo`/`rustc` is 1.75.0, so no fresh remote build/test was attempted. Readiness details are recorded in the local artifact as `ubuntu-host-readiness.log`.

Known blockers / not promoted:

- No new 4096/8192 model-runtime parity bundle was captured in this slice; the row continues to rely on the existing checked 4096 and 8192 compact-template context bundles cited in `STATUS.md`/`COMPATIBILITY.md`.
- This slice does not promote arbitrary-template, broad Llama-family, neighboring-row, production-throughput, portability, or full-support claims.
