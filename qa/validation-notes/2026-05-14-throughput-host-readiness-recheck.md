# 2026-05-14 — Throughput host readiness recheck

Scope: follow-up hygiene for the same-host throughput harness on current `main`.

## Host readiness

A live disk-readiness check against the canonical Ubuntu validation host could not complete because SSH to port 22 timed out before any remote command ran. Therefore this recheck cannot claim that the host is unblocked on disk.

The last local ignored throughput blocker artifact found during this pass recorded the previous exact blocker as a full root filesystem during a current-head release build attempt (`No space left on device` while writing a Rust release artifact). That ignored local artifact was removed after inspection so it would not remain as silent local WIP; the committed support path continues to rely only on tracked notes and evidence.

## Harness state

The throughput harness is tracked at `scripts/bench-llama3-same-host.mjs`, with non-network plan/help coverage at `scripts/test-bench-llama3-same-host.mjs` and the support boundary documented in `BENCHMARKS.md` plus `qa/validation-notes/2026-05-14-throughput-harness-cleanup.md`.

The harness is a bounded exact-row timing tool only. It does not promote production-throughput, Llama 3.2 1B, Mixtral, neighboring-row, portability, or broad-family support without separate row-specific evidence captured under those exact conditions.

## Exact blocker for measurement

Blocked before measurement: canonical Ubuntu validation host SSH timed out, so no live `df` proof, build, or same-host benchmark run was possible in this pass.
