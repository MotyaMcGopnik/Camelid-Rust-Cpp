# 2026-05-06 — Q8_0 forward-memory trace cache telemetry

Scope: diagnostic telemetry only. This does not promote 8B long-context support, does not change any compatibility row status, and does not widen API/docs support claims.

Change:

- `BACKENDINFERENCE_FORWARD_MEMORY_TRACE=1` stderr lines now include Q8_0 file-cache hit counts/bytes plus cache occupancy/capacity fields alongside existing Q8_0 read counts/bytes.
- Structured JSON timings already carried `cache_hit_bytes`; this makes long-running stderr traces self-contained when a diagnostic run times out before a full report is emitted.
- The file-backed Q8_0 row-reader now decodes weight-block scales once per loaded chunk for single-row matmuls too, instead of decoding the same fp16 scale inside each dot-product loop. The multi-row prefill path already used this pattern; this extends the same low-risk hot-path cleanup to single-token/file-backed projections.

Why:

- The 8B long-context lane is measuring whether lazy file-backed Q8_0 prefill is dominated by repeated Q8 payload streaming, and whether bounded cache probes actually serve meaningful bytes rather than merely recording occasional hits.
- The previous trace showed cumulative Q8 read bytes but did not expose cache-hit byte volume or live cache occupancy, making timeout-era artifacts harder to interpret.
- Single-token logits/layer projections are not the 1024/2048 red-box root cause, but scale decode reuse removes avoidable scalar work from the same Q8 file-backed reader without changing read volume, tensor layout, or support status.

Local gates:

- `./scripts/with-rustup-cargo.sh fmt --all -- --check`
- `./scripts/with-rustup-cargo.sh test -q q8_0_file_backed --lib`

Claim boundary: diagnostic/performance-only. 8B 1024/2048 remain red/timeout-blocked diagnostic targets until fresh PASS artifacts exist.
