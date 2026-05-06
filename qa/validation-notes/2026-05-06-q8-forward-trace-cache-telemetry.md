# 2026-05-06 — Q8_0 forward-memory trace cache telemetry

Scope: diagnostic telemetry only. This does not promote 8B long-context support, does not change any compatibility row status, and does not widen API/docs support claims.

Change:

- `BACKENDINFERENCE_FORWARD_MEMORY_TRACE=1` stderr lines now include Q8_0 file-cache hit counts/bytes plus cache occupancy/capacity fields alongside existing Q8_0 read counts/bytes.
- Structured JSON timings already carried `cache_hit_bytes`; this makes long-running stderr traces self-contained when a diagnostic run times out before a full report is emitted.

Why:

- The 8B long-context lane is measuring whether lazy file-backed Q8_0 prefill is dominated by repeated Q8 payload streaming, and whether bounded cache probes actually serve meaningful bytes rather than merely recording occasional hits.
- The previous trace showed cumulative Q8 read bytes but did not expose cache-hit byte volume or live cache occupancy, making timeout-era artifacts harder to interpret.

Local gates:

- `./scripts/with-rustup-cargo.sh test -q`

Claim boundary: telemetry only. 8B 1024/2048 remain red/timeout-blocked diagnostic targets until fresh PASS artifacts exist.
