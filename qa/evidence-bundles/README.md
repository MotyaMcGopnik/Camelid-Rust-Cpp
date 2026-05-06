# Evidence bundles

This directory is for durable, reviewable evidence manifests and checksums.

## Reviewer shortcut

The support story is intentionally exact-row. `COMPATIBILITY.md` is the release contract, `STATUS.md` is the narrative evidence snapshot, and this directory is the public manifest/checksum map that keeps the claims auditable without exposing private raw artifact trees.

| Exact row | Public proof readers should start with | Current blocker, if any |
| --- | --- | --- |
| TinyLlama 1.1B Chat Q8_0 | `tinyllama-broader-template-context-perf-rss-20260505T044519Z-head-864e07b51f36/` plus the four-row API/WebUI and 512-context bundles. | None for the current supported gate; rerun on future support-contract changes. |
| Llama 3.2 1B Instruct Q8_0 | `full-support-normalized-wp1-20260505T032406Z-head-bcf9e647d6fd/`, `llama32-1b-context-1024-20260505T081001Z-head-156ded6fc76b/`, `llama32-1b-context-2048-rope-factors-20260506T0105Z-head-62f8cbc/`, and the shared 1B/3B template/perf bundles. | Broader/full support still needs model-native/larger context, arbitrary/Jinja template, production throughput, portability, and durable full-support normalization. |
| Llama 3.2 3B Instruct Q8_0 | `full-support-normalized-wp1-20260505T032406Z-head-bcf9e647d6fd/`, `llama32-3b-context-1024-20260505T094258Z-head-c14e5e7b5692/`, `llama32-3b-context-2048-20260505T105742Z-head-36ec8e492d65/`, the shared 1B/3B template/perf bundles, and `llama32-3b-parallel-q8-first-token-20260505T140400Z-head-ffc22b85214f/`. | Broader/full support still needs model-native/larger context, arbitrary/Jinja template, production throughput beyond the first-token direction probe, portability, and durable full-support normalization. |
| Llama 3 8B Instruct Q8_0 | `full-support-normalized-wp2-8b-watchdog-20260505T041404Z-head-83c21f0cbf5a/`, `8b-checkmark-current-main-20260505T084931Z-head-15bfc41d15d5/`, `llama3-8b-broader-50tok-20260505T005031Z-head-d13541ad8d7e/`, `four-row-context-512-20260505T051510Z-head-b403884/`, `llama3-8b-context-1024-20260506T144810Z-head-ae672d935a9d/`, `llama3-8b-context-2048-20260506T144037Z-head-ae672d935a9d/`, `llama3-8b-chat-template-shapes-20260505T003821Z-head-d13541ad8d7e/`, and the lazy-Q8 hot-path bundles. | 1024/2048 context are now bounded exact-row PASS bundles; the checked 1024/2048 packs remain bounded exact-row claims only. |

Current public evidence map:
- `four-row-public-20260503T024327Z/` preserves the sanitized carry-forward smoke boundary.
- `four-row-perf-portability-public-20260503T025639Z/` preserves the compact perf/portability envelope.
- `four-row-current-head-20260503T061958Z-head-34b954498a03/` preserves the normalized current-head rerun scaffold and blocker notes.
- `four-row-api-only-20260504T230722Z-head-13a465608fbf/` is the reopened-lane API-only freshness slice with manifest and checksums.
- `four-row-api-webui-20260505T003100Z-head-b403884/` is the reopened-lane API + frontend smoke freshness slice for all four exact rows, with manifest and checksums.
- `full-support-normalized-wp1-20260505T032406Z-head-bcf9e647d6fd/` is the current-head normalized TinyLlama/1B/3B API/WebUI smoke bundle from the reopened Ubuntu lane; it preserves manifest/checksum-verifiable evidence without broadening beyond exact-row smoke support.
- `tinyllama-broader-template-context-perf-rss-20260505T044519Z-head-864e07b51f36/` closes the exact TinyLlama Q8_0 current-head broader five-prompt parity, marker chat-template-shapes parity, bounded 512-context parity, and perf/RSS durable-normalization slice; scope is exact-row only.
- `four-row-context-512-20260505T051510Z-head-b403884/` closes only the first bounded 512-context pack for the four exact supported Q8_0 rows; it does not promote larger context buckets or broad family support.
- `llama32-1b-context-1024-20260505T081001Z-head-156ded6fc76b/` closes only the second bounded 1024-context pack for the exact Llama 3.2 1B Instruct Q8_0 row.
- `llama32-1b-context-2048-rope-factors-20260506T0105Z-head-62f8cbc/` closes only the third bounded 2048-context pack for the exact Llama 3.2 1B Instruct Q8_0 row after the RoPE frequency-factor fix.
- `llama32-3b-context-1024-20260505T094258Z-head-c14e5e7b5692/` closes only the second bounded 1024-context pack for the exact Llama 3.2 3B Instruct Q8_0 row.
- `llama32-3b-context-2048-20260505T105742Z-head-36ec8e492d65/` closes only the third bounded 2048-context pack for the exact Llama 3.2 3B Instruct Q8_0 row; it does not promote neighboring rows, model-native context, or broad/full support.
- `llama32-1b-3b-chat-template-shapes-20260505T060036Z-head-e9f28572e090/` closes only the bounded compact chat-template-shapes pack for the exact Llama 3.2 1B/3B Instruct Q8_0 rows.
- `llama32-1b-3b-unique-chat-perf-rss-20260505T061644Z-head-e9f28572e090/` closes only the bounded unique-chat memory/perf envelope for the exact Llama 3.2 1B/3B Instruct Q8_0 rows.
- `llama32-3b-parallel-q8-first-token-20260505T140400Z-head-ffc22b85214f/` closes only the exact Llama 3.2 3B opt-in parallel Q8 first-token runtime direction sub-box; it is not production-throughput or portability support.
- `llama3-8b-broader-50tok-20260505T005031Z-head-d13541ad8d7e/` closes only the bounded 8B broader three-prompt 50-token pack.
- `llama3-8b-context-512-20260504T234625Z-head-58acf592345c/` closes only the first bounded 8B 512-context pack.
- `llama3-8b-context-1024-20260506T144810Z-head-ae672d935a9d/` and `llama3-8b-context-2048-20260506T144037Z-head-ae672d935a9d/` close only the second bounded 1024-context and third bounded 2048-context packs for the exact Llama 3 8B Instruct Q8_0 row from current public `main`; it does not promote model-native/larger context, production throughput, portability, arbitrary templates, or broad 8B/Llama support.
- `llama3-8b-chat-template-shapes-20260505T003821Z-head-d13541ad8d7e/` closes only the bounded 8B compact chat-template-shapes pack.
- `llama3-8b-api-webui-rss-clean-20260505T015843Z-head-aee469b9c13a/` is the clean-main exact 8B API/WebUI/RSS timing smoke for completion diagnostics; it does not widen support beyond the exact-row smoke envelope.
- `8b-checkmark-current-head-20260505T052647Z-head-864e07b51f36/` is the earlier public-main exact 8B API/WebUI/RSS checkmark refresh. It preserves `supported_exact_row_smoke` only and does not widen broader/full support.
- `8b-checkmark-current-main-20260505T084931Z-head-15bfc41d15d5/` is the latest public-main exact 8B API/WebUI/RSS checkmark refresh after the 1B 1024-context evidence landed. It preserves `supported_exact_row_smoke` only and does not widen broader/full support.
- `llama3-8b-lazy-q8-hotpath-20260505T021411Z-head-723a665/` is the exact 8B retained-block lazy-Q8 hot-path cost probe; it is measurement evidence only, not a broader support/performance-portability promotion.
- `llama3-8b-lazy-q8-hotpath-helper-validated-20260505T0350Z-head-e22307f2f90b/` validates the reusable helper on clean public `main` and repeats the exact 8B retained-block Q8 measurements; it is still measurement evidence only.

Reproducibility helpers:
- `bash scripts/check-evidence-bundle-checksums.sh` verifies every committed `SHA256SUMS` under this directory, including older bundles that use bundle-local paths and newer bundles that use repo-relative paths.
- `node scripts/bench-q8-hotpath-bundle.mjs --model <model.gguf>` regenerates a sanitized retained-block Q8 hot-path bundle with per-tensor JSON, `manifest.json`, and `SHA256SUMS`. Use it for measurement staging only; pair results with production API/WebUI timing/RSS before making portability or throughput claims.

Rules:
- Commit only sanitized durable bundle content here.
- Keep raw/private staging copies out of git; they may contain private hostnames, home paths, or other operator-only details.
- Public bundles may point at `target/...` artifact roots, but they must not pretend those private raw trees are fetchable from GitHub.
- In committed manifests/checksums, prefer public-safe `qa/evidence-bundles/*-public-...` bundle paths over ignored raw bundle roots.
- Before citing or refreshing a durable bundle, run `node scripts/audit-evidence-bundle-privacy.mjs --root qa/evidence-bundles --out target/evidence-bundle-privacy-audit.json` and fix any findings.
