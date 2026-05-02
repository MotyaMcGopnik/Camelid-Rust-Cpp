# Model promotion artifact gaps

Source of truth: `MODEL_PROMOTION_PUNCHLIST.md` and `MODEL_PROMOTION_CHECKLIST.md`.

## Host handling

- Model-promotion artifact production runs on a private validation host. Do not commit hostnames, user home paths, key paths, or full SSH commands; pass them through local environment variables when running the harness.

## 1B exact gap

Present locally:
- `target/autonomous-small-model-parity-20260429T134615Z-head-9049492/llama32-1b-q8-chat-parity-5tok.json`
- `target/qa-small-model-parity-20260429T1338Z-head-35bfd58/llama32-1b-q8-chat-parity-5tok.json`
- `target/parity-50tok-20260502T031820Z/llama32-1b-50tok/report.json`

Still missing for honest promotion:
- canonical 5-prompt broader bundle from `target/parity-broad-20260502T033606Z/` is referenced by `STATUS.md` but absent locally
- exact-row API smoke bundle at `target/model-promotion-1b-smoke-<stamp>/summary.json`
- exact-row WebUI smoke bundle at `target/model-promotion-1b-smoke-<stamp>/frontend.summary.json`
- bounded perf note artifact such as `target/model-promotion-1b-perf-note-<stamp>.md`

## 3B exact gap

Present locally:
- `target/ubuntu-llama32-3b-q8-first-token-20260501T210715Z/summary.md`
- `target/ubuntu-llama32-3b-q8-first-token-20260501T210715Z/load-response.json`
- `target/ubuntu-llama32-3b-q8-first-token-20260501T210715Z/completion-response.json`
- `qa/prompt-packs/llama3-broader-repro-3prompt.json`

Still missing for honest promotion:
- `target/parity-broad-20260502T033606Z/llama32-3b-p1/report.json`
- `target/parity-broad-20260502T033606Z/llama32-3b-p2/report.json`
- `target/parity-broad-20260502T033606Z/llama32-3b-p3/report.json`
- exact-row API smoke bundle at `target/model-promotion-3b-smoke-<stamp>/summary.json`
- exact-row WebUI smoke bundle at `target/model-promotion-3b-smoke-<stamp>/frontend.summary.json`
- bounded perf note artifact such as `target/model-promotion-3b-perf-note-<stamp>.md`

Prepared rerun command:
- `bash qa/model-promotion-ubuntu-rerun.sh`

## 8B exact gap

Present locally:
- `target/ubuntu-llama3-8b-q8-current-head-20260502T000207Z/validation-summary.json`
- `target/ubuntu-llama3-8b-q8-current-head-20260502T000207Z/first-token.completion-summary.json`
- `target/ubuntu-llama3-8b-q8-current-head-20260502T000207Z/short-5tok.completion-summary.json`
- `qa/prompt-packs/llama3-broader-repro-3prompt.json`

Still missing for honest promotion:
- broader-pack summary at `target/model-promotion-8b-broader-repro-<stamp>/summary.json`
- exact-row API smoke bundle at `target/model-promotion-8b-smoke-<stamp>/summary.json`
- exact-row WebUI smoke bundle at `target/model-promotion-8b-smoke-<stamp>/frontend.summary.json`
- portability note artifact such as `target/model-promotion-8b-portability-<stamp>.md`

Prepared rerun command:
- `bash qa/model-promotion-ubuntu-rerun.sh`
