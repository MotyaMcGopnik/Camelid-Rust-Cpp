# Gemma 4 26B A4B QAT Q4_0 — row recon (planned lane, no claims)

> [!NOTE]
> This document is a design or recon note, not the public support ledger. For
> current support truth and release status, use
> [`COMPATIBILITY.md`](../../COMPATIBILITY.md) and [`STATUS.md`](../../STATUS.md).
> The 26B A4B row remains **blocked / fail-closed** until every gap below has
> committed evidence. Nothing here is a support claim.

## Why this row re-opened

The committed 26B blocker was recorded against the Q8_0 row (26.9 GB — exceeds
the 2×16 GB distributed envelope). The official QAT release changes the memory
math: `google/gemma-4-26B-A4B-it-qat-q4_0-gguf` → `gemma-4-26B_q4_0-it.gguf`
is **14,439,361,440 bytes (13.4 GiB)** — ~6.7 GiB per node on the proven
two-Mac distributed layer-sharding lane. Memory stops being the blocker; the
engine gaps below become the real work. Per exact-row doctrine this is a NEW
row with a fresh evidence chain; it inherits nothing from any Q8_0 row.

Local copies (T7): `/Volumes/Untitled/models/gemma-4-26B_q4_0-it.gguf` and the
dense de-risk row `/Volumes/Untitled/models/gemma-4-E4B_q4_0-it.gguf`
(5,154,939,136 bytes, from `google/gemma-4-E4B-it-qat-q4_0-gguf`).

## GGUF facts (read with `camelid inspect`, v3, 658 tensors, 46 metadata keys)

Geometry (all parsed by the existing `gemma4` metadata path):

| Field | Value |
| --- | --- |
| Layers | 30, sliding pattern 5:1 (`sliding_window_pattern` bool array), window **1024** |
| Hidden | 2816, heads 16, per-layer `head_count_kv` array: 8 sliding / 2 global |
| head_dim | 256 sliding / 512 global (`key_length(_swa)`, `value_length(_swa)`), rope dims match |
| RoPE | dual-θ 1e6 / 1e4 (same as E-series); `rope_freqs.weight` [256] present |
| PLE | **none** (`embedding_length_per_layer_input = 0`) |
| Shared KV | **none** (`shared_kv_layers = 0`) |
| Softcap | final_logit_softcapping 30 |
| MoE | `expert_count` **128**, `expert_used_count` **8**, `expert_feed_forward_length` **704** |
| Dense FFN | `feed_forward_length` **2112** (per-layer dense branch alongside the experts) |
| Context | 262144; vocab 262144 (`tokenizer.ggml.model = gemma4` SPM) |
| Tokenizer deltas vs E-series | `eos_token_id = 1`, `add_bos_token = False` — VERIFY at runtime; E-series rows use EOS/EOT 106 and add BOS |
| size_label | 128x2.6B |

Per-layer tensor map (layer 0; same shape every layer):

- Attention: `attn_q [2816,4096]`, `attn_k [2816,2048]`, `attn_v [2816,2048]`,
  `attn_output [4096,2816]`, QK norms [256] — standard gemma4, V present on
  all layers (no 12B-style V-less rows in this file).
- Dense FFN branch: `ffn_gate/ffn_up [2816,2112]`, `ffn_down [2112,2816]`.
- MoE branch: router `ffn_gate_inp [2816,128]` (**F32**) + `ffn_gate_inp.scale`
  [2816] (F32); experts `ffn_gate_up_exps [2816,1408,128]` (fused gate+up,
  3D, 128 experts) and `ffn_down_exps [704,2816,128]` + per-expert
  `ffn_down_exps.scale [128]` (F32).
- Norms: `attn_norm`, `post_attention_norm`, `ffn_norm`, `post_ffw_norm`,
  **plus `pre_ffw_norm_2` / `post_ffw_norm_1` / `post_ffw_norm_2`** — three
  extra norms consistent with a dual-FFN (dense + routed) sub-block whose
  exact composition order must come from the reference implementation, not
  guesses.
- `layer_output_scale [1]` per layer (12B-style unconditional output scale).
- Head: `output_norm`, tied `token_embd` (no `output.weight`).

Quantization split (histogram): **265 × Q4_0** (all attention/dense-FFN/expert
matrices), **1 × Q6_K** (`token_embd`, 605.6 MB), **392 × F32** (norms, router,
scales, rope factors).

## Engine gaps (the honest work list)

1. **Q4_0 lane** — Camelid is Q8_0-only end-to-end (34-byte wire blocks, Q8×Q8
   sdot CPU path, GPU wire-Q8 GEMV). Q4_0 needs: 18-byte block wire structs,
   CPU dot (llama.cpp pattern: Q8-quantized activations × dequantized nibbles),
   a GPU GEMV variant, loader gates for mixed per-tensor types. De-risk on the
   dense E4B QAT row first — it isolates "Q4_0 kernels" from "MoE" so the two
   unknowns are proven sequentially.
2. **Q6_K head** — the tied output projection over the 262K vocab runs in
   Q6_K (K-quant superblocks, 210 B / 256 weights). Bit-parity against the
   reference requires mirroring its q6_K dot exactly; dequant-to-Q8 at load
   would diverge numerically. Third kernel family; scope it as its own step.
3. **MoE forward** — router → top-8 of 128 → fused gate+up expert GEMV →
   GeGLU → down expert GEMV → combine, PLUS the dense FFN branch and the
   `pre_ffw_norm_2`/`post_ffw_norm_1`/`post_ffw_norm_2` composition. The
   `.scale` companion tensors' application points are undocumented; derive the
   exact dataflow from the reference source before writing any kernel, the
   same way 12B Unified semantics were derived.
4. **Comparator** — verify the pinned llama.cpp 5d56eff actually runs this
   row; if not, this row pins its own newer comparator build (the
   comparator-per-row pattern 12B already established), captured with the
   recorded plain-path flags.
5. **Distributed split** — no shared KV, so any split works; ~halving 30
   layers gives ~6.7 GiB/node. Single-node 16 GB stays memory-bound (12B at
   12.7 GB already was). The MTP `gemma-4-26B-A4B-it-assistant` row stays
   fail-closed (unchanged).

## Sequencing (after the current E2B/E4B promotion + 12B serve lane closes)

1. Reference-source recon of the dual-FFN/MoE block + `.scale` semantics.
2. Q4_0 kernels proven bit-exact on `gemma-4-E4B_q4_0-it.gguf` (dense, known
   architecture, CPU then GPU).
3. Q6_K head kernel, proven on the same dense row.
4. MoE CPU forward vs oracle at single positions, then greedy parity packs.
5. Two-Mac distributed run; GPU residency decision comes after CPU parity.

Performance note (motivation, not a claim): ~4B active parameters/token means
decode reads ~2–3 GB/token instead of the full file — on the ~120 GB/s wall
this row's ceiling is well above the 12B dense pair's 6.2–6.75 tok/s.
