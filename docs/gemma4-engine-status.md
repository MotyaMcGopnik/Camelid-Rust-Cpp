# Gemma 4 in Camelid — engine status

**Status (correctness milestone): Gemma 4 runs correctly inside Camelid's
from-scratch engine and produces output token-identical to llama.cpp.** It is not
yet served through the HTTP API or wired into the UI, and it is not yet fast — a
serve integration and load-time optimization are the next steps. Performance work
comes after correctness; do not describe the current speed as "fast."

## What works

- **Architecture support.** `general.architecture = "gemma4"` is recognized; the
  config, the `gemma4` SentencePiece tokenizer, and the full weight binding
  (per-layer-type attention, QK-norm, the five Gemma norms, Per-Layer-Embeddings)
  all load and validate against a real GGUF.
- **Forward pass + generation.** A from-scratch forward pass (`src/gemma4_runtime.rs`)
  with embedding scale, per-layer-type attention (head_dim 256 sliding / 512
  global), QK-norm before RoPE, weightless v-norm, dual-θ RoPE, sliding-window
  masking, GeGLU, cross-layer KV sharing, the 7-step PLE injection, per-layer
  output scale, tied logits, and final soft-cap.
- **Validated bit-against-llama.cpp** at three levels: a single forward
  (`tests/gemma4_forward.rs` asserts argmax 9079), full teacher-forced
  continuation (every position matches), and real autoregressive greedy decode
  via the CLI (token IDs identical — see proof below).
- **In-engine runtime + CLI.** `Gemma4Runtime::load()` + `generate_greedy()`,
  driven by `camelid gemma4-generate`. Incremental KV cache (O(n) decode).

## What does NOT work yet

- **Not served through the API / UI.** No `/v1/chat/completions` or `/v1/health`
  path for Gemma 4 yet. (Serve wiring is the next task, behind a flag, without
  touching the existing Llama/3B path.)
- **Slow one-time load (~238s).** Weights are eagerly decoded into Q8 block
  structs. The engine's mmap / instant-start lane should replace this — but only
  after the serve path passes.
- **Generation is ~1–2 tok/s** — a functional milestone, not a performance one.
- **Only E4B (Q8_0) exercised.** The dense (12B/31B) and MoE (26B-A4B) variants
  share the code but are untested; Camelid is Q8_0-only (no K-quants).
- **RAM:** Gemma 4 (~8GB) and the 3B backend (~3.4GB) together thrash a 17GB box.
  Run one model at a time.

## Proof artifact

| Field | Value |
|---|---|
| Model file | `/Volumes/Untitled/models/gemma-4-E4B-it-Q8_0.gguf` |
| Size | 8,192,951,456 bytes (7.6 GiB) |
| sha256 (first 1 GiB) | `0ddf918f3ec40d2bac8fd2e7e463253195993e6c7c08980b3164866a57908f3a` |
| GGUF arch | `gemma4`, 42 layers, hidden 2560, heads 8, kv_heads 2, head_dim 256/512, ffn 10240, ctx 131072, vocab 262144 |
| GGUF specials | sliding_window 512, final_logit_softcapping 30, rope θ 1e6/1e4, num_kv_shared_layers 18, tokenizer `gemma4` (SPM) |
| Command | `camelid gemma4-generate <gguf> --prompt "The capital of France is" --max-tokens 12` |
| Prompt | `The capital of France is` |
| Prompt token IDs | `[2, 818, 5279, 529, 7001, 563]` (matches llama.cpp `/tokenize`) |
| **llama.cpp greedy IDs** | `[9079, 236761, 108, 1018, 14977, 53121, 2900, 563, 506, 5279, 529, 7001]` |
| **Camelid greedy IDs** | `[9079, 236761, 108, 1018, 14977, 53121, 2900, 563, 506, 5279, 529, 7001]` — **identical** |
| Decoded text | `The capital of France is Paris.\n\n**Question:** What is the capital of France` |
| Load time | ~237.8 s (one-time) |
| Generation speed | ~1.16 tok/s @ 12 tokens (~2.26 tok/s @ 20) |

The oracle was captured with `llama-server` (llama.cpp b9430) on the same GGUF,
greedy (`temperature 0, top_k 1`). The two engines never run simultaneously (RAM).

## How to reproduce

```sh
# 1. Camelid greedy (this engine):
CARGO_TARGET_DIR=/Volumes/Untitled/cargo-targets/Camelid-push \
  cargo run --release --bin camelid -- gemma4-generate \
  /Volumes/Untitled/models/gemma-4-E4B-it-Q8_0.gguf \
  --prompt "The capital of France is" --max-tokens 12
# prints: token_ids + decoded text + load/gen timing

# 2. Bit-against-llama.cpp parity tests (forward + multi-token, gated on the gguf):
CARGO_TARGET_DIR=/Volumes/Untitled/cargo-targets/Camelid-push \
  CAMELID_GEMMA4_GGUF=/Volumes/Untitled/models/gemma-4-E4B-it-Q8_0.gguf \
  cargo test --release --test gemma4_forward -- --nocapture

# 3. llama.cpp oracle (stop any Camelid backend first — RAM):
llama-server -m /Volumes/Untitled/models/gemma-4-E4B-it-Q8_0.gguf -ngl 99 -c 512 &
curl -s localhost:8080/completion -d \
  '{"prompt":"The capital of France is","n_predict":12,"temperature":0,"top_k":1}'
```

## Where the code lives

- `src/model.rs` — `gemma4` arch recognition, `Gemma4Metadata`, `Gemma4Binding`.
- `src/inference/gemma4.rs` — forward-pass primitives (embed scale, GeGLU, softcap).
- `src/gemma4_runtime.rs` — the runtime (load + incremental decode + generate).
- `src/main.rs` — `gemma4-generate` CLI subcommand.
- `tests/gemma4_forward.rs` — the bit-against-llama.cpp parity tests.
