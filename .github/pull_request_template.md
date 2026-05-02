## Summary

Describe the change in 2-4 bullets.

## Why this change exists

Explain the user-visible or engineering reason for the change.

## Validation

- [ ] `git diff --check`
- [ ] `cargo fmt --all -- --check`
- [ ] `cargo test --all-targets --all-features`
- [ ] `cd frontend && npm run build`
- [ ] Other evidence attached below

## Public-repo privacy check

- [ ] No private hostnames, SSH commands, user home paths, key paths, or local validation details are included
- [ ] `bash scripts/check-public-scrub.sh`

## Support-contract check

- [ ] This PR does not overclaim support
- [ ] TinyLlama Q8_0 remains the only supported generation gate unless exact new evidence is included
- [ ] Any 1B / 3B / 8B wording stays aligned with `COMPATIBILITY.md`, `STATUS.md`, and `/api/capabilities`

## Evidence / artifacts

Link logs, screenshots, parity outputs, or notes here.

## Docs impact

List any README / compatibility / status / roadmap updates included in this PR.
