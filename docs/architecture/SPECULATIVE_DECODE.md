# Lossless Greedy Speculative Decoding

Default-off serving optimization (`camelid serve --spec-decode …`). It makes **no support
claim**: enabling it promotes no lane, changes no release-ledger row, and byte-parity for a
lane is asserted only by evidence (tests and parity receipts), never by resemblance.

## What it is

Decode is memory-bandwidth bound: every sequential token costs a full pass over the weights.
Speculation drafts k candidate tokens cheaply, then verifies them in **one batched forward**
through the target model (`LlamaInferenceSession::forward_greedy_verify_chunk`, which returns
the greedy argmax at every position of the batch). Accepted tokens are exactly the target's
own greedy choices; rejected drafts are discarded by KV rollback
(`rollback_to_position` — the KV cache is position-major, so rollback is a cursor reset) and
are never observable in any output.

Two drafters (`src/inference/speculative.rs`):

| Mode | Flag | Drafts come from | Cost of drafting |
|---|---|---|---|
| `ngram` | `--spec-decode ngram` | The most recent earlier occurrence of the current token suffix (prompt lookup) | ~zero |
| `draft` | `--spec-decode draft --spec-draft-model <gguf>` | A smaller model with the **identical token mapping** (enforced fail-closed at load) running greedy ahead | one small-model forward per drafted token |

`--spec-draft-tokens` overrides the per-round draft window (default 8 for ngram, 5 for
draft). Speculation engages only for plain greedy requests (temperature 0, no per-step
logit/dense diagnostics, non-streaming); everything else takes the unchanged vanilla path.

## The losslessness invariant, and its proof

Every emitted token is the target model's own greedy argmax given the accepted prefix, so
speculative output must be byte-identical to vanilla greedy decode. Evidence (2026-06-05,
M4 16GB, commit of this doc):

- **Unit equivalence** (`api::tests`): ngram speculation and self-drafting model speculation
  both reproduce vanilla greedy token-for-token on synthetic weights, with multi-token
  acceptance exercised; KV rollback provably restores exact decode state.
- **Real-model byte-parity**: Llama 3.2 1B Q8_0, 63-token greedy generation — spec-on vs
  spec-off `generated_token_ids` identical. Llama 3.2 3B with a 1B draft model, 21 tokens —
  identical, with 19/19 drafted tokens accepted in 4 verify rounds (100% acceptance).
- **Receipts**: a parity receipt emitted from a speculation-enabled server fully verified —
  `camelid verify-receipt` replays the request through the vanilla path in-process AND
  re-runs llama.cpp on the same GGUF, and both matched byte-for-byte
  (`first_divergent_token_index=-1`, `RECEIPT VERIFIED`). Receipts are the standing way to
  prove, per request, that speculation changed nothing.

Numerics caveat, stated honestly: byte-parity relies on the batched verify forward and the
sequential decode forward agreeing at every argmax. That holds in all evidence above but is
an empirical property of the kernels, not a theorem — which is exactly why the receipt
machinery, not this document, is the proof of any particular run.

## Measured performance envelope (why it is default-off)

Same host, Llama 3.2 1B Q8_0, 63-token greedy completion, ngram mode:

| Configuration | tok/s |
|---|---:|
| Vanilla, default stack (Metal resident decode) | 67.2 |
| Vanilla, CPU decode | 44.5 |
| Speculative ngram (k=8) | 4.2 |
| Speculative ngram (k=2) | 6.7 |

Speculation is currently **slower**, and the blocker is precisely scoped: the batched verify
runs through the chunked-prefill layer path, whose linear projections stream Q8 weights
through the file reader at ~1.1 GB/s effective **per call** (fine when amortized over a
300-token prefill — measured 292 tok/s at M=310 — fatal when amortized over a 3–9 token
verify batch). The single-token decode path instead reads resident packed Q8 at memory
bandwidth (~22 ms per 1B forward). `CAMELID_RETAIN_Q8_0_BLOCKS` does not change this: the
chunk-path linears do not consult retained blocks.

The acceptance machinery itself is already profitable in shape: the 3B draft run needed 4
target weight passes for 21 tokens (vs 21 sequential passes). If the verify batch read
resident packed weights at the decode path's effective bandwidth, those numbers imply a
multiple-fold decode speedup at high acceptance.

## Path to a retained slice

1. Route the verify-chunk linear projections through backend-owned packed Q8 runtime storage
   (the existing Q8 projection route resolver direction) so a small-M batch costs one
   memory-speed weight pass, or
2. a Metal batched-verify kernel (multi-token forward with per-position logits and
   GPU-side KV rollback).

Until one of those lands with retain-bar evidence (same-host A/B, byte-parity receipts), the
flag stays default-off and no performance claim is made.

## Support boundary

Enabling speculation never changes which rows are supported. A speculative generation on an
unsupported lane is still unsupported; a verified receipt from a speculative run proves that
one request only, exactly as receipts always do ([`RECEIPTS.md`](../../RECEIPTS.md)).
