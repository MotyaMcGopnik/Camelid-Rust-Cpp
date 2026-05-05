# Llama 3.2 1B/3B metadata-template subset runtime guard — 2026-05-05

Scope: code/runtime sub-box only for the exact Llama 3.2 1B and 3B Instruct Q8_0 rows. This is not a broad arbitrary/Jinja template-support promotion.

What changed:

- Added guarded chat prompt tokenization metadata via `BACKENDINFERENCE_METADATA_CHAT_TEMPLATE=metadata`.
- The default Llama 3 path stays on the compact renderer used by the passing exact-row evidence.
- The opt-in metadata subset recognizes Llama 3 instruct templates that include `bos_token`, emits the BOS control token from metadata text, disables tokenizer-level added BOS to avoid duplication, and trims message content when the template advertises `| trim` / `.strip()`.
- Unsupported/missing-BOS templates fall back to the existing compact renderer.

Green row+box:

- Llama 3.2 1B/3B — guarded metadata-template subset renderer code/runtime sub-box is green by unit coverage and clippy/test gates.

Validation run locally:

- `cargo fmt --all -- --check`
- `cargo clippy --all-targets --all-features -- -D warnings`
- `cargo test -q`

Remaining blocker:

- Full arbitrary/Jinja chat-template acceptance still needs real-row Ubuntu parity artifacts beyond the compact pack and this guarded metadata subset before the public support boundary can widen.
