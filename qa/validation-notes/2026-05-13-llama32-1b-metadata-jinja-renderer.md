# 2026-05-13 — Llama 3.2 1B metadata Jinja renderer slice

Scope: exact Llama 3.2 Instruct metadata-template renderer path used by the Llama 3.2 1B Instruct Q8_0 lane. This is code/test evidence only until a fresh canonical Ubuntu runtime artifact is captured with the current source head.

Changes validated locally:

- Replaced the previous hand-written Llama 3 metadata-template subset with a real Jinja-compatible renderer backed by `minijinja` when `CAMELID_METADATA_CHAT_TEMPLATE=metadata` is enabled.
- The renderer passes `messages`, `bos_token`, `eos_token`, `eot_token`, `eom_token`, `unk_token`, and `add_generation_prompt=true` into the metadata template.
- BOS de-duplication is handled by checking whether the rendered template already begins with the tokenizer BOS text before tokenizer-level special-token insertion.
- Unsupported/error branches are reported through a `raise_exception(...)` helper and fail back to the existing safe renderer path rather than silently claiming support for the failed template branch.

Unit coverage added/updated:

- user-only metadata template rendering without duplicate BOS
- system+user metadata template shape
- multi-turn system/user/assistant/user rendering
- assistant-final history with `add_generation_prompt=true`
- templates that intentionally omit `bos_token`
- simple loop-based Jinja execution
- explicit unsupported `raise_exception(...)` branch handling
- existing compact/TinyLlama/Mistral renderer tests now hold the shared environment lock so metadata opt-in tests cannot race them

Validation run:

- `cargo fmt --check`
- `cargo test -q --all-targets --all-features`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo doc --no-deps --all-features`
- Targeted Node harness self-test: `scripts/test-chat-parity-harness.mjs` passed as part of the local script sweep.

Known blockers / not promoted yet:

- Canonical Ubuntu runtime validation was attempted on the approved validation host, but the host currently has `rustc 1.75.0` / `cargo 1.75.0`; the current `Cargo.lock` requires a newer Cargo lockfile reader, so the remote build failed before tests could run.
- The local `scripts/test-readme-screenshot.mjs` guard is failing on the current README screenshot-caption contract and is unrelated to this Jinja renderer change.
- This slice does not promote arbitrary-template, broad Llama-family, production-throughput, or portability support. A current-source Ubuntu runtime bundle for the exact Llama 3.2 1B Q8_0 row is still required before changing public support wording beyond the guarded metadata-template path.
