# Camelid Compatibility Matrix

Last updated: 2026-05-01

`COMPATIBILITY.md` is Camelid's release contract. It defines what Camelid may describe as supported in the README, frontend readiness copy, release notes, and `/api/capabilities` without overstating the validated envelope. If another document or UI sounds broader, this file wins.

Use this document to answer one release question: **may Camelid honestly say this exact lane is supported yet?** If a claim cannot be mapped to a specific row here, it should not appear in product copy, UI language, API readiness text, or release messaging.

Practical reading rule: if a statement cannot be reduced to an exact row in this file, Camelid should not publish that statement as product truth.

## Release-language definitions

Treat the labels below as release language, not implementation optimism:

- **Supported** means the exact model family, tokenizer path, quantization, API surface, and evidence bundle are in place.
- **Evidence only** means the row has useful artifacts, but those artifacts do not promote neighboring rows.
- **Acceptance target** means Camelid has chosen the next exact lane to prove, not that runtime support already exists.
- **Groundwork only** means implementation or validation pieces exist, but the product must still say `not supported` until the blocking runtime and evidence work are complete.

## Executive release posture

Camelid's public support language is intentionally narrow, evidence-bound, and easy to audit. For an executive read, the current answer is short:

- **Supported generation gate:** TinyLlama 1.1B Chat Q8_0 is the only supported generation lane today. Camelid matches known-good llama-server behavior across the five-prompt, 50-token TinyLlama audit, including prompt token IDs, generated token arrays, and generated text.
- **Evidence-only lane:** Llama 3.2 1B Instruct Q8_0 has one compact-header `hello` prompt that matches llama.cpp for five deterministic generated tokens. That is useful evidence, not broader Llama 3 support.
- **Acceptance target:** Llama 3.2 3B Instruct Q8_0 is the exact next WebUI real-chat target. The exact tracked GGUF is present locally, `/api/models/load` succeeds with low backend RSS after streaming metadata parsing, and the latest file-backed lazy-Q8 retry produced one healthy Ubuntu backend-only first-token success. This is first-token evidence only: no support, parity, short-generation, or WebUI claim should be inferred until repeated bounded success and exact-row promotion evidence exist.
- **Groundwork-only lane:** Llama 3 8B Instruct Q8_0 has metadata/config/tokenizer/template evidence, independent tokenizer reference fixtures, a materialization-budget guard, lazy/file-backed Q8 execution work, and one healthy Ubuntu backend-only first-token artifact on the exact tracked Q8_0 GGUF. It still remains below supported generation until the row has repeat bounded success plus prompt-token, short-generation, parity, API, and readiness evidence.
- **Explicit non-claim:** no Llama 3-family row is a supported generation lane today.

Nothing adjacent inherits support. Support does not spread across nearby sizes, neighboring quantizations, matching tokenizers, or partial runtime seams.

## Governing rules

Two rules keep this matrix honest across docs, API signals, and UI copy:

- **Support rule:** nothing adjacent inherits support across model size, quantization, tokenizer lane, API surface, or frontend state.
- **Credit rule:** visible llama.cpp / ggml acknowledgement and the MIT notice remain part of parity-backed release claims.

README, `STATUS.md`, `/api/capabilities`, and frontend readiness copy should continue to mirror this exact ledger. `/api/capabilities` exposes the same compatibility rows as `model_compatibility`; read each row literally. Metadata parsing does not imply tokenizer parity, tokenizer parity does not imply generation, tensor loading does not imply safe execution, and one supported row must never lend support to adjacent model sizes or quantizations.

In plain terms: TinyLlama Q8_0 is the live supported gate; Llama 3.2 1B is a narrow evidence row; Llama 3.2 3B is the chosen next acceptance target and now has one backend-only first-token success; and Llama 3 8B is still groundwork only in release terms, but now also has one backend-only first-token artifact of its own.

## Current release ledger

The table below is the authoritative row-by-row support ledger reflected in `/api/capabilities`.

| Target | Family | Quant | Status | Validated now | Missing gates | Promotion blocker |
| --- | --- | --- | --- | --- | --- | --- |
| TinyLlama 1.1B Chat Q8_0 | LLaMA/SPM decoder | Q8_0 | Supported current gate | Metadata, tokenizer, tensors, generation, parity, performance envelope, and frontend readiness are all validated for the five-prompt, 50-token gate. | No missing release gates for the current supported claim. | Preserve the existing gate and avoid regressions while expanding adjacent rows separately. |
| Llama 3.2 1B Instruct Q8_0 | LLaMA decoder + Llama 3 BPE | Q8_0 | Evidence only / not a supported gate | Metadata is validated, the compact `hello` tokenizer path is validated, tensors load, and one prompt matches llama.cpp for five deterministic generated tokens `[9906,0,2650,649,358]` / `"Hello! How can I"`. | Repeat bounded generation, broader prompt coverage, stronger memory/performance evidence, API readiness, and frontend readiness. | This row has useful narrow parity evidence, but not enough exact-row evidence to promote it beyond evidence-only. |
| Llama 3.2 3B Instruct Q8_0 | LLaMA decoder + Llama 3 BPE | Q8_0 | Acceptance target / first-token evidence only | The exact tracked GGUF is present, metadata/API load is validated, the file-backed lazy-Q8 seam is partially wired, and one Ubuntu backend-only `/v1/completions` probe returned one token for `hello`. | Prompt-token parity, second bounded first-token success, short-generation parity, API smoke, WebUI readiness, and stronger memory follow-up evidence. | Support remains frozen until Camelid has repeat bounded success plus exact-row prompt-token/parity/short-generation/API/WebUI evidence. |
| Llama 3 8B Instruct Q8_0 | LLaMA decoder + Llama 3 BPE | Q8_0 | Groundwork only / first-token evidence only | Metadata/config/template handling is fixture-guarded, tokenizer reference parity is guarded, lazy/file-backed Q8 execution reached one bounded Ubuntu backend-only first-token artifact for `hello`, and one bounded memory trace exists. | Second bounded first-token success, prompt-token parity, short-generation evidence, API readiness, frontend readiness, and a clearly passed memory gate for the exact acceptance criteria. | This row now has real runtime evidence, but only as a single backend-only first-token artifact; it is not yet validated like the TinyLlama support row. |
| LLaMA/SPM Q4_0/Q5_0 | LLaMA/SPM decoder | Q4_0/Q5_0 | Planned Phase 10 | Descriptor parsing is guarded and unsupported behavior is typed. | Real dequant/matmul support, runtime generation, parity, memory/performance evidence, API readiness, and frontend readiness. | CPU f32 loading still rejects these rows until actual quant runtime support exists. |
| LLaMA/SPM Q4_K_M/Q5_K_M | LLaMA/SPM decoder | Q4_K_M/Q5_K_M | Planned Phase 10 | Initial planning boundary only. | Loader, matmul, runtime generation, parity, memory/performance evidence, API readiness, and frontend readiness. | Start only after simpler Q4_0/Q5_0 rows have concrete artifact-backed support work. |
| Mistral GGUF | Mistral | Not selected | Planned model family | No validated release evidence yet. | Concrete target selection, tokenizer/chat-template fixtures, tensor/runtime path, generation, parity, memory/performance, API readiness, and frontend readiness. | No exact row has been selected or validated yet, so Camelid must not imply support. |

## Status-promotion checklist

Before any Phase 9-15 row moves from planned or blocked to supported, require all of the following for that exact target, quantization, API lane, and context bucket:

- A typed capability or unsupported-state change in `/api/capabilities` and matching documentation here.
- A reproducible command or test plus artifact path in `STATUS.md`.
- Independent reference or parity evidence whenever the claim is about tokenizer IDs, generated tokens/text, sampling, or context behavior.
- Memory/performance evidence that clearly distinguishes retained quantized weights, avoided `f32` materialization, bounded activation/output buffers, and any optimized-kernel determinism guardrail.

For **Llama 3.2 3B** specifically, tracked local model presence and one backend-only first-token success are now satisfied. The next promotable evidence is a second bounded success, prompt-token and first-token parity with process/VM samples, short deterministic generation, API smoke, and WebUI smoke before any support promotion.

For **Llama 3 8B** specifically, the next promotable evidence is not another tokenizer freshness pass or standalone `bench-q8-blocks` report. Camelid now has one bounded first-token artifact for the exact row. The next promotable evidence is a second bounded success plus short-generation, prompt-token/parity, API, frontend-readiness, and memory follow-up artifacts for that same row.

## Quantization formats

| Format | Status | Evidence / next action |
| --- | --- | --- |
| F32 | Supported reference path | CPU tensor path and fixture tests. |
| F16 | Supported reference path | Decoded into CPU tensor path with tests. |
| BF16 | Supported reference path | Decoded into CPU tensor path with tests. |
| Q8_0 | Supported current gate | TinyLlama Q8_0 parity gate; Q8 optimized block-dot remains guarded/opt-in unless parity evidence says otherwise. |
| Q4_0 / Q5_0 | Planned | Phase 10 legacy smaller-quant lane. |
| Q4_K_M / Q5_K_M | Planned | Phase 10 K-quant lane after simpler quant validation. |
| IQ / other GGUF quants | Future | Not implied support. |

## Model families

| Family | Status | Evidence / next action |
| --- | --- | --- |
| LLaMA/SPM decoder | Supported current gate | TinyLlama Q8_0 path; broader LLaMA-family validation planned. |
| Larger LLaMA-family instruct models | Planned | Phase 11 active expansion target after the TinyLlama gate; Llama 3-style GQA/RoPE-theta config and Llama 3 `gpt2`/`llama-bpe` tokenizer/template fixtures are guarded, but real tensor-load/generation/parity/performance evidence is still required. |
| LLaMA decoder + Llama 3 BPE | Planned / narrow small-model parity evidence | The concrete Llama 3 8B Instruct Q8_0 artifact's tokenizer metadata, merges, special IDs, and instruct template are fixture guarded, with independent llama.cpp `llama-tokenize --ids` reference IDs for the current prompts; the separate Llama 3.2 1B Instruct Q8_0 artifact has a one-prompt/5-token compact-header parity pass against llama.cpp; and the exact Llama 3.2 3B Instruct Q8_0 WebUI target now has a local exact artifact, low-RSS metadata/API-load success, and one backend-only first-token artifact. Broader Llama 3 support, full chat-template behavior, repeat bounded generation, parity, frontend readiness, and performance remain unsupported until separately scoped. |
| Mistral-family GGUF | Planned | Evaluate after LLaMA-family evidence is stable. |
| Qwen / Gemma / Phi / Falcon / Mamba / others | Future | Track explicitly; do not claim until scoped, implemented, and audited. |

## Tokenizer and chat templates

| Surface | Status | Evidence / next action |
| --- | --- | --- |
| LLaMA/SPM tokenizer | Supported current gate | Includes whitespace, multiline, special/control-token, and EOS behavior from the current TinyLlama gate. |
| LLaMA marker chat template | Supported current gate | Current TinyLlama chat template path. |
| Llama 3 GPT-2/BPE `llama-bpe` tokenizer | Planned / reference parity guarded | Parses GGUF tokens, token types, merges, BOS/EOS, inferred EOT, and byte-unicode BPE encode/decode for the Llama 3 path; local metadata/tokenizer smokes validated Camelid artifact IDs for `hello`, ` hello`, `\n\n`, the rendered header prompt, `The quick brown fox jumps over the lazy dog.`, and `<|begin_of_text|>hello how's it going?`. Checked-in llama.cpp `llama-tokenize --ids` reference fixtures now assert the current prompt IDs, so this is tokenizer parity evidence only and not generation support. |
| Llama 3 instruct chat template | Planned / fixture guarded | Renders `<|start_header_id|>{role}<|end_header_id|>\n\n{trimmed content}<|eot_id|>` and appends the assistant header generation prompt with parse-special tokenization. |
| Other tokenizer families | Planned/future | Add detection, fixtures, known-good token-ID audits, and honest unsupported errors. |

## Context length

| Context bucket | Status | Evidence / next action |
| --- | --- | --- |
| Short prompt / 50-token audit | Supported current gate | Current TinyLlama Q8_0 gate. |
| 512 tokens | Planned | Phase 13 audit bucket. |
| 1k / 2k tokens | Planned | Phase 13 progressive audit buckets. |
| Model-native context | Future | Validate only where memory/performance permits. |

## API and provider surface

| Feature | Status | Evidence / next action |
| --- | --- | --- |
| `/v1/chat/completions` | Supported current gate | Non-streaming local generation for loaded supported dense GGUF models. |
| SSE streaming | Supported current gate | OpenAI-compatible token stream path exists for supported dense models. |
| `/v1/models`, `/api/models/load`, `/api/models/current` | Supported current gate | Local GGUF load/list/readiness path used by the frontend. |
| `/api/capabilities` | Supported current gate | Exposes explicit support contract, supported/planned quants, model families, and API features. |
| Multi-choice generation | Unsupported | Keep typed unsupported until implemented/tested. |
| Rich OpenAI-compatible logprobs | Partial/planned | Diagnostic logit surfaces exist; complete API parity remains Phase 14 work. |
| Local OpenAI-compatible provider registration | Open integration verification | Verify registration/use by the target local client surface before calling integration complete. |

## Phase 9-15 next actions and owners

- **Phase 9 — Support contract / Docs + Backend + QA + Frontend:** keep this matrix and `/api/capabilities` in lockstep; add typed unsupported coverage whenever a planned lane is visible to users; keep UI compatibility hints exact-row and quant-aware so saved paths, catalog entries, or same-family model names cannot inherit support without a matching row and `generation_ready=true`.
- **Phase 10 — Quantization / Backend + QA:** select one real Q4_0 or Q5_0 LLaMA/SPM GGUF target first; add loader/dequant tests, matmul parity evidence, and a real-model smoke before changing status from planned.
- **Phase 11 — Llama 3 / Backend + QA:** keep Llama 3 below support until each concrete target has the right artifact-backed evidence. For Llama 3.2 3B Q8_0, exact GGUF presence plus one bounded backend-only first-token artifact are now satisfied; the next requirement is bounded prompt-token/first-token/5-token/API/WebUI acceptance evidence from `QA_LLAMA32_3B_Q8_ACCEPTANCE.md` without borrowing from the 1B or 8B rows. For Llama 3 8B, one bounded backend-only first-token artifact now exists, but the exact next Backend/Performance action is still to turn the lazy/file-backed Q8 path into repeat bounded success plus short-generation/parity/API/readiness evidence, preserving the serial/block-aligned determinism guardrails until optimized kernels have separate zero-delta evidence.
- **Phase 12 — Tokenizers/templates / Backend + Docs:** Llama 3 `gpt2`/`llama-bpe` now has fixture-guarded Camelid token-ID/chat-template coverage plus independent llama.cpp reference IDs for the current prompts; require the same dual evidence before calling future tokenizer/template lanes parity-backed. Tokenizer parity alone is not generation readiness, and repeated green-light revalidations should be recorded as freshness evidence rather than status expansion.
- **Phase 13 — Context/KV / QA + Backend:** audit 512, 1k, and 2k context buckets after lazy 8B execution and a bounded first-token retry are artifact-backed; publish per-target tested context limits here and in readiness/API copy.
- **Phase 14 — API/sampling / Backend + QA:** leave multi-choice, `best_of`, and rich logprobs typed-unsupported until implemented with deterministic greedy and then seeded sampling coverage; frontend/API copy should keep those controls guarded or disabled.
- **Phase 15 — Performance/packaging / Performance + Docs:** keep the 8B-class materialization budget guard documented as the safe default and the Q8_0 block-only/serial row-dot/all-row-dot path framed as groundwork; carry deterministic-parallelism metadata (`serial_only_q8_0_block_rows`, no default parallel Q8 kernel, future serial-vs-parallel fail threshold `1e-7`) with memory evidence so optimized kernels require their own parity guardrails; re-baseline after lazy/on-demand execution and correctness milestones; document portable commands only after they are validated outside Tim-specific local paths.

Current evidence handoff: Llama 3 8B now has one bounded backend-only first-token artifact, but it is still blocked in release terms. The next status-changing evidence must be a second bounded success plus short-generation, prompt-token/parity, API, frontend-readiness, and follow-up memory artifacts for the exact same row. Current `bench-q8-blocks` memory fields and representative attention Q/K/V/output, FFN, and output-projection shape evidence should travel with that handoff: retained Q8 payload, avoided `f32` materialization, bounded dot input, and optional all-row output vector distinguish safe lazy-execution scratch/output buffers from unsafe eager `f32` weight decoding. The deterministic-parallelism metadata should travel too: current Q8 block rows are serial-only, no parallel Q8 kernel is enabled by default, and any future serial-vs-parallel comparison must target zero delta with a `1e-7` fail threshold before it can affect support claims. The independent reference token dumps for the existing Llama 3 fixture prompts are complete for tokenizer parity evidence, but they do not unlock broader 8B generation support by themselves.

Docs/frontend/API wording rule: Llama 3 rows may say metadata/config/tokenizer/template/Q8-block groundwork is present, and where true they may also cite a single backend-only first-token artifact, but they must remain blocked for supported generation, parity, performance, frontend readiness, and portable packaging until the required repeat bounded evidence exists. TinyLlama Q8_0 is still the only supported current generation gate. Frontend cards should match compatibility rows by exact family + quant where possible, call out quant mismatches instead of falling back to same-family support, and reserve green/readiness styling for runtime `loaded_now=true` plus `generation_ready=true`.

## How to keep this matrix honest

- Update this file whenever a support claim changes.
- Keep `/api/capabilities` aligned with this file.
- Add artifacts and commands to `STATUS.md` when a new row moves from planned/future to supported.
- Prefer narrower truthful support over broad implied compatibility.
