#!/usr/bin/env bash
set -euo pipefail

# Public-repo privacy guard: keep private operator paths, key paths, host commands,
# and validation-host details out of tracked files.
patterns=(
  '/Users''/'
  '/home/ubuntu/work''/Camelid'
  'Documents''/cert'
  'ssh ''-i'
  'ubuntu@''[0-9]'
  '54[.]218[.]217[.]232'
  '[.]pem([^A-Za-z0-9_]|$)'
)

status=0
for pattern in "${patterns[@]}"; do
  matches=$(git grep -n -I -E "$pattern" -- \
    ':!.git' \
    ':!target' \
    ':!frontend/dist' \
    ':!frontend/node_modules' || true)
  if [[ -n "$matches" ]]; then
    printf 'public scrub guard failed for pattern: %s\n%s\n' "$pattern" "$matches" >&2
    status=1
  fi
done

exit "$status"
