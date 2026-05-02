#!/usr/bin/env bash
set -euo pipefail

HOST=${HOST:?set HOST to the validation machine hostname}
SSH_USER=${SSH_USER:-ubuntu}
KEY=${KEY:?set KEY to the local SSH private-key path}
PORT_BASE=${PORT_BASE:-$((18000 + ($$ % 1000)))}
API_BASE=${API_BASE:-http://127.0.0.1:$PORT_BASE}
FRONTEND_URL=${FRONTEND_URL:-http://127.0.0.1:$((PORT_BASE + 1))}
LLAMA_BASE=${LLAMA_BASE:-http://127.0.0.1:$((PORT_BASE + 2))}
STAMP=${STAMP:-$(date -u +%Y%m%dT%H%M%SZ)}
SSH_OPTS=(-o BatchMode=yes -o StrictHostKeyChecking=accept-new -o ConnectTimeout=15 -i "$KEY")

ssh "${SSH_OPTS[@]}" "${SSH_USER}@${HOST}" \
  "STAMP='$STAMP' API_BASE='$API_BASE' FRONTEND_URL='$FRONTEND_URL' LLAMA_BASE='$LLAMA_BASE' bash -s" <<'REMOTE'
set -euo pipefail

repo_candidates=("$HOME/work/Camelid" "$HOME/backend" "$HOME/Desktop/Code/backend")
repo=""
for candidate in "${repo_candidates[@]}"; do
  if [[ -f "$candidate/Cargo.toml" ]]; then
    repo="$candidate"
    break
  fi
done
if [[ -z "$repo" ]]; then
  match=$(find "$HOME" -maxdepth 4 -path '*/backend/Cargo.toml' 2>/dev/null | head -n 1 || true)
  if [[ -n "$match" ]]; then
    repo=$(dirname "$match")
  fi
fi
[[ -n "$repo" ]] || { echo "could not resolve backend repo on host" >&2; exit 1; }
cd "$repo"

resolve_model() {
  local filename=$1
  shift || true
  local search_roots=()
  if [[ -n "${CAMELID_MODEL_DIR:-}" ]]; then
    search_roots+=("$CAMELID_MODEL_DIR")
  fi
  search_roots+=("$HOME/models" "$HOME/.cache" "$HOME")
  for root in "${search_roots[@]}"; do
    [[ -d "$root" ]] || continue
    local hit
    hit=$(find "$root" -type f -name "$filename" 2>/dev/null | head -n 1 || true)
    if [[ -n "$hit" ]]; then
      printf '%s\n' "$hit"
      return 0
    fi
  done
  return 1
}

wait_for_url() {
  local url=$1
  local label=$2
  local tries=${3:-120}
  for _ in $(seq 1 "$tries"); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  echo "$label did not become reachable at $url" >&2
  return 1
}

LLAMA32_1B=$(resolve_model 'Llama-3.2-1B-Instruct-Q8_0.gguf') || { echo 'missing Llama-3.2-1B-Instruct-Q8_0.gguf on host' >&2; exit 1; }
LLAMA32_3B=$(resolve_model 'Llama-3.2-3B-Instruct-Q8_0.gguf') || { echo 'missing Llama-3.2-3B-Instruct-Q8_0.gguf on host' >&2; exit 1; }
LLAMA3_8B=$(resolve_model 'Meta-Llama-3-8B-Instruct-Q8_0.gguf') || { echo 'missing Meta-Llama-3-8B-Instruct-Q8_0.gguf on host' >&2; exit 1; }

ART_ROOT="target/model-promotion-host-$STAMP"
mkdir -p "$ART_ROOT"

BACKEND_BIN=${BACKEND_BIN:-}
if [[ -z "$BACKEND_BIN" ]]; then
  if [[ -x target/release/backendinference ]]; then
    BACKEND_BIN=target/release/backendinference
  elif [[ -x target/debug/backendinference ]]; then
    BACKEND_BIN=target/debug/backendinference
  else
    cargo build --release
    BACKEND_BIN=target/release/backendinference
  fi
fi

cleanup_pids=()
cleanup() {
  for pid in "${cleanup_pids[@]:-}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT

API_PORT=$(node -e "console.log(new URL(process.env.API_BASE).port || 80)")
FRONTEND_PORT=$(node -e "console.log(new URL(process.env.FRONTEND_URL).port || 80)")

"$BACKEND_BIN" serve --addr "127.0.0.1:$API_PORT" > "$ART_ROOT/backend.stdout.log" 2> "$ART_ROOT/backend.stderr.log" &
cleanup_pids+=("$!")
wait_for_url "$API_BASE/v1/health" backend 180

(
  cd frontend
  npx -y node@22 node_modules/vite/bin/vite.js build
  npx -y node@22 node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port "$FRONTEND_PORT"
) > "$ART_ROOT/frontend.stdout.log" 2> "$ART_ROOT/frontend.stderr.log" &
cleanup_pids+=("$!")
wait_for_url "$FRONTEND_URL/" frontend 120

if [[ -d target/parity-broad-20260502T033606Z ]]; then
  tar -C target -czf "$ART_ROOT/parity-broad-20260502T033606Z.tgz" parity-broad-20260502T033606Z
fi

node scripts/run-llama3-prompt-pack.mjs \
  --backend "$API_BASE" \
  --llama-url "$LLAMA_BASE" \
  --pack qa/prompt-packs/llama3-broader-repro-3prompt.json \
  --model "$LLAMA32_3B" \
  --model-id llama32-3b-q8 \
  --prefix llama32-3b \
  --out-dir "target/model-promotion-3b-broader-repro-$STAMP" \
  --start-llama-server \
  --require-prompt-match

node scripts/run-llama3-prompt-pack.mjs \
  --backend "$API_BASE" \
  --llama-url "$LLAMA_BASE" \
  --pack qa/prompt-packs/llama3-broader-repro-3prompt.json \
  --model "$LLAMA3_8B" \
  --model-id llama3-8b-q8 \
  --prefix llama3-8b \
  --out-dir "target/model-promotion-8b-broader-repro-$STAMP" \
  --start-llama-server \
  --require-prompt-match

node scripts/model-promotion-smoke-bundle.mjs \
  --api "$API_BASE" \
  --frontend "$FRONTEND_URL" \
  --model "$LLAMA32_1B" \
  --model-id llama32-1b-q8 \
  --message hello \
  --max-tokens 1 \
  --temperature 0 \
  --allow-guarded-chat \
  --expect-compatibility-row llama32_1b_instruct_q8_0 \
  --expect-compatibility-status evidence_only \
  --expect-contract-supported false \
  --expect-webui-chat guarded \
  --out-dir "target/model-promotion-1b-smoke-$STAMP"

node scripts/model-promotion-smoke-bundle.mjs \
  --api "$API_BASE" \
  --frontend "$FRONTEND_URL" \
  --model "$LLAMA32_3B" \
  --model-id llama32-3b-q8 \
  --message hello \
  --max-tokens 1 \
  --temperature 0 \
  --allow-guarded-chat \
  --expect-compatibility-row llama32_3b_instruct_q8_0 \
  --expect-compatibility-status acceptance_target_with_compact_parity_evidence \
  --expect-contract-supported false \
  --expect-webui-chat guarded \
  --out-dir "target/model-promotion-3b-smoke-$STAMP"

node scripts/model-promotion-smoke-bundle.mjs \
  --api "$API_BASE" \
  --frontend "$FRONTEND_URL" \
  --model "$LLAMA3_8B" \
  --model-id llama3-8b-q8 \
  --message hello \
  --max-tokens 1 \
  --temperature 0 \
  --allow-guarded-chat \
  --expect-compatibility-row llama3_8b_instruct_gguf \
  --expect-compatibility-status groundwork_backend_evidence_only \
  --expect-contract-supported false \
  --expect-webui-chat guarded \
  --out-dir "target/model-promotion-8b-smoke-$STAMP"

printf 'repo=%s\n' "$repo"
printf 'host_artifacts=%s\n' "$ART_ROOT"
printf 'imported_broad_pack=%s\n' "$ART_ROOT/parity-broad-20260502T033606Z.tgz"
printf '3b_broader_repro=%s\n' "target/model-promotion-3b-broader-repro-$STAMP/summary.json"
printf '8b_broader_repro=%s\n' "target/model-promotion-8b-broader-repro-$STAMP/summary.json"
printf '1b_smoke=%s\n' "target/model-promotion-1b-smoke-$STAMP/summary.json"
printf '3b_smoke=%s\n' "target/model-promotion-3b-smoke-$STAMP/summary.json"
printf '8b_smoke=%s\n' "target/model-promotion-8b-smoke-$STAMP/summary.json"
REMOTE
