# Llama 3.2 3B Instruct Q8_0 Parity Acceptance

Last updated: 2026-05-02

> [!NOTE]
> This QA checklist is an acceptance document for one exact model row. It does not change the
> public support contract by itself. For current support truth, use [`COMPATIBILITY.md`](COMPATIBILITY.md)
> and [`STATUS.md`](STATUS.md).

QA checklist for the exact Llama 3.2 3B WebUI real-chat acceptance gate.

## Exact target artifact

- **Source repo:** `bartowski/Llama-3.2-3B-Instruct-GGUF`
- **Required filename:** `Llama-3.2-3B-Instruct-Q8_0.gguf`
- **Expected local path:** `$CAMELID_MODEL_DIR/Llama-3.2-3B-Instruct-Q8_0.gguf`
- **Resolve URL:** `https://huggingface.co/bartowski/Llama-3.2-3B-Instruct-GGUF/resolve/main/Llama-3.2-3B-Instruct-Q8_0.gguf`
- **Expected size from earlier HEAD check:** `3,421,899,296 bytes` (`3.187 GiB`)
- **Earlier HEAD ETag/Xet hash:** `291ce1d4ca0fcef86407b7c6531bf85a1c348c65d5d3c69c57c98fec6483bb1f`

Current state: the exact GGUF is now present at the expected model-dir path, Camelid metadata/API
load evidence exists, the Ubuntu compact-header `hello` harness has prompt-token parity plus
deterministic 1-token, 5-token, and bounded 50-token generation parity, and the broader
three-prompt 50-token pack now matches llama.cpp. The blocker has moved from parity to longer
context, stronger performance/portability, and broader chat-template acceptance.

## Current blocker summary

- `/api/models/load` succeeds for the exact 3B target.
- The latest file-backed lazy-Q8 recovery materially reduced the earlier eager dense-load spike.
- The Ubuntu compact-header `hello` harness now matches llama.cpp for prompt tokens plus deterministic 1-token, 5-token, and bounded 50-token generation.
- The former broader JSON-shaped prompt blocker is resolved by the post-Q8-dot clean rerun at `target/camelid-llama32-3b-broad-50-after-q8dot-clean-20260502T233427Z/pack/summary.json`: `hello`, alpacas, and `answer with valid JSON for {"ok":true,"value":2}` all match llama.cpp for prompt tokens, generated token IDs, and generated text.
- Therefore the row is no longer parity-blocked for the current three-prompt 50-token pack; remaining expansion gates are longer context, stronger performance/portability, and broader chat-template evidence.

## Disk and memory expectations

- Keep the artifact in the configured `$CAMELID_MODEL_DIR` location.
- Use bounded runs with process-memory sampling before any WebUI promotion.
- Do not infer safety from the 1B or 8B rows.

## Acceptance checklist

Do not mark the 3B row green until all applicable items have artifact paths.

1. **Model presence** — exact filename exists at the expected model-dir path; record size and hash.
2. **Readiness/inspect** — `scripts/small-model-readiness.mjs` or equivalent reports the row and
   records the exact blocker or safe candidate state.
3. **Rendered prompt** — capture the compact Llama 3 prompt Camelid currently renders.
4. **Reference token IDs** — use llama.cpp `llama-tokenize --ids` against the exact 3B GGUF.
5. **Camelid prompt-token parity** — run `scripts/chat-parity-llama3.mjs --require-prompt-match`.
6. **First generated token parity** — run deterministic greedy `--max-tokens 1 --require-generated-match`.
7. **Short greedy output parity** — run deterministic greedy `--max-tokens 5 --require-generated-match`.
8. **API load/chat smoke** — capture `/v1/health`, `/api/models/current`, `/api/models/tokenizer`,
   `/v1/chat/completions`, and process-memory samples.
9. **WebUI smoke** — only after API parity is green, capture real chat evidence plus memory samples.
10. **Regression preservation** — keep TinyLlama Q8_0 and Llama 3.2 1B evidence green.

## Current status

Status: **accepted exact-row parity/API/WebUI smoke with broader three-prompt parity evidence**

The exact 3B artifact now exists, and the Ubuntu compact-header `hello` harness matches llama.cpp
for prompt tokens plus deterministic 1-token, 5-token, and bounded 50-token generation. The former
JSON-shaped broader prompt blocker is now fixed: `target/camelid-regression-q8dot-20260502T232633Z/llama32-3b-compact/summary.json` passes the compact pack, and `target/camelid-llama32-3b-broad-50-after-q8dot-clean-20260502T233427Z/pack/summary.json` passes the broader three-prompt 50-token pack with prompt tokens, generated token IDs, and generated text all matching llama.cpp. The current work is to preserve that evidence and expand only after longer-context, performance/portability, and broader chat-template gates land.
