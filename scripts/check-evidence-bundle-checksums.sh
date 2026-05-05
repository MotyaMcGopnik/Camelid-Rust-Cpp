#!/usr/bin/env bash
set -euo pipefail

root="${1:-qa/evidence-bundles}"

if [[ ! -d "$root" ]]; then
  printf 'evidence bundle root not found: %s\n' "$root" >&2
  exit 1
fi

found=0
while IFS= read -r -d '' sums; do
  found=1
  bundle_dir=$(dirname "$sums")
  first_path=$(awk 'NF >= 2 { print $2; exit }' "$sums")

  printf 'checking %s\n' "$sums"
  if [[ "$first_path" == qa/evidence-bundles/* || "$first_path" == "$root"/* ]]; then
    sha256sum -c "$sums" >/dev/null
  else
    (cd "$bundle_dir" && sha256sum -c SHA256SUMS >/dev/null)
  fi
done < <(find "$root" -name SHA256SUMS -print0 | sort -z)

if [[ "$found" -eq 0 ]]; then
  printf 'no SHA256SUMS files found under %s\n' "$root" >&2
  exit 1
fi
