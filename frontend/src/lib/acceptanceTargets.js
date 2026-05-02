export const LLAMA32_3B_ACCEPTANCE_TARGET = {
  id: 'llama-3.2-3b-instruct-q8',
  name: 'Llama 3.2 3B Instruct Q8_0',
  model_path: '$CAMELID_MODEL_DIR/Llama-3.2-3B-Instruct-Q8_0.gguf',
  runtime_model_name: 'llama-3.2-3b-instruct-q8',
  source: 'bartowski/Llama-3.2-3B-Instruct-GGUF/Llama-3.2-3B-Instruct-Q8_0.gguf',
  provider_kind: 'local',
  status: 'registered',
  engine: 'backendinference',
  quant: 'Q8_0',
  size_gb: '3.19',
  loaded_now: false,
  generation_ready: false,
  backendinference: {
    active: false,
    loaded_now: false,
    generation_ready: false,
    tokenizer_status: null,
    tokenizer_model: null,
    tensor_ready: false,
    config_ready: false,
  },
}

export const LLAMA32_3B_ACCEPTANCE_SUMMARY = 'This exact 3B row is the current acceptance target. The exact-row backend record already includes /api/models/load success plus Ubuntu compact-header hello prompt-token, deterministic 1-token, 5-token, and bounded 50-token parity against llama.cpp, but broader prompt/chat-template coverage, exact-row API smoke, WebUI smoke, and stronger memory/perf follow-up are still missing, so any WebUI chat must stay guarded and labeled as evaluation rather than supported release chat.'

export const LLAMA32_3B_ACCEPTANCE_AVAILABILITY = 'This browser/runtime list does not currently show the exact 3B row. That does not erase the existing backend evidence for the row, and it must not be turned into a green frontend state or neighboring-row support claim.'

export const LLAMA32_3B_ACCEPTANCE_GATING_NOTE = 'Frontend chat can enter guarded evaluation only after Camelid reports loaded_now=true and generation_ready=true for this exact GGUF plus an exact tracked Llama compatibility row; supported release chat still requires /api/capabilities to promote the same 3B Q8_0 row from acceptance target to a supported compatibility row.'
