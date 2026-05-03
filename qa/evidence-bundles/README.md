# Evidence bundles

This directory is for durable, reviewable evidence manifests and checksums.

Rules:
- Commit only sanitized durable bundle content here.
- Keep raw/private staging copies out of git; they may contain private hostnames, home paths, or other operator-only details.
- Public bundles may point at `target/...` artifact roots, but they must not pretend those private raw trees are fetchable from GitHub.
- In committed manifests/checksums, prefer public-safe `qa/evidence-bundles/*-public-...` bundle paths over ignored raw bundle roots.
- Before citing or refreshing a durable bundle, run `node scripts/audit-evidence-bundle-privacy.mjs --root qa/evidence-bundles --out target/evidence-bundle-privacy-audit.json` and fix any findings.
