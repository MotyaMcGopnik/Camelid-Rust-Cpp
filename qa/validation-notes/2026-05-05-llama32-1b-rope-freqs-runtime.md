# Llama 3.2 1B long-context RoPE frequency runtime slice — 2026-05-05

Scope: code/runtime investigation slice for the exact Llama 3.2 1B Instruct Q8_0 2048-context first-token divergence. This does not promote a fresh 2048 parity pass by itself.

Finding: the stored Llama 3.2 1B Q8_0 evidence bundle includes a GGUF `rope_freqs.weight` tensor with 32 F32 frequencies for the 64-dimension RoPE path, while the runtime previously derived frequencies only from `llama.rope.freq_base`/metadata. At ~1910 prompt tokens this can preserve tokenizer parity while rotating Q/K with the wrong long-context frequencies before the first generated token.

Runtime change: bind/load optional `rope_freqs.weight`, validate its `[rope_dim / 2]` shape and finite positive frequencies, prefer it over derived metadata frequencies during Q/K RoPE, and expose the frequency source in dense RoPE diagnostics. Metadata-based llama3 scaling remains covered as fallback for GGUFs that carry scaling keys instead of a frequency tensor.

Gates:
- `./scripts/with-rustup-cargo.sh fmt --all -- --check`
- `./scripts/with-rustup-cargo.sh clippy --all-targets --all-features -- -D warnings`
- `./scripts/with-rustup-cargo.sh test --all-targets --all-features`

Targeted coverage:
- `inference::tests::apply_rope_prefers_gguf_rope_frequency_tensor`
- `inference::tests::apply_rope_uses_llama3_frequency_scaling_metadata`
- `accepts_llama3_style_gqa_metadata_and_rope_theta`
