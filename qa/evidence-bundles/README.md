# Evidence bundles

This directory is for durable, reviewable evidence manifests and checksums.

Rules:
- Commit only sanitized `*-public-*` bundles here.
- Keep raw/private staging copies out of git; they may contain private hostnames, home paths, or other operator-only details.
- Public bundles may point at `target/...` artifact roots, but they must not pretend those private raw trees are fetchable from GitHub.
